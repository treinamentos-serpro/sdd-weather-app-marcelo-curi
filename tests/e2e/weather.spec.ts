import { expect, test, type Page } from '@playwright/test';

const city = {
  id: 2267057,
  name: 'Lisboa',
  latitude: 38.7167,
  longitude: -9.1333,
  country: 'Portugal',
  timezone: 'Europe/Lisbon',
};

const duplicateCities = [city, { ...city, id: 999, latitude: 38.8 }];

function createForecast(sourceValidAt = '2026-03-08T12:00'): Record<string, unknown> {
  return {
    timezone: 'Europe/Lisbon',
    utc_offset_seconds: 0,
    current_units: {
      temperature_2m: '°C',
      weather_code: 'wmo code',
      wind_speed_10m: 'km/h',
      wind_direction_10m: '°',
    },
    daily_units: {
      temperature_2m_mean: '°C',
      temperature_2m_min: '°C',
      temperature_2m_max: '°C',
      weather_code: 'wmo code',
      precipitation_probability_max: '%',
      wind_speed_10m_max: 'km/h',
      wind_direction_10m_dominant: '°',
    },
    current: {
      time: sourceValidAt,
      temperature_2m: 20,
      weather_code: 1,
      wind_speed_10m: 10,
      wind_direction_10m: 90,
    },
    daily: {
      time: ['2026-03-08', '2026-03-09', '2026-03-10', '2026-03-11', '2026-03-12'],
      temperature_2m_mean: [20, 20, 20, 20, 20],
      temperature_2m_min: [15, 15, 15, 15, 15],
      temperature_2m_max: [23, 23, 23, 23, 23],
      weather_code: [1, 1, 1, 1, 1],
      precipitation_probability_max: [10, 10, 10, 10, 10],
      wind_speed_10m_max: [10, 10, 10, 10, 10],
      wind_direction_10m_dominant: [90, 90, 90, 90, 90],
    },
  };
}

async function blockExternalRequests(page: Page) {
  const openMeteoRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.hostname.endsWith('open-meteo.com')) {
      openMeteoRequests.push(url.href);
    }
  });
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname.endsWith('open-meteo.com')) {
      await route.abort();
      return;
    }
    if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
      await route.abort();
      return;
    }
    await route.continue();
  });
  return openMeteoRequests;
}

async function routeSearch(page: Page, duplicate = false) {
  await page.route('https://geocoding-api.open-meteo.com/**', async (route) => {
    const query = new URL(route.request().url()).searchParams.get('name');
    const results = query === 'NoSuchCity' ? [] : duplicate ? duplicateCities : [city];
    await route.fulfill({ json: { results } });
  });
}

test('rejects invalid input without a request and distinguishes an empty search', async ({
  page,
}) => {
  const requests = await blockExternalRequests(page);
  await routeSearch(page);
  await page.goto('/');

  const search = page.getByRole('searchbox', { name: 'Buscar cidade' });
  await search.fill('Lisboa-1');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByText('Use somente letras e espaços no nome da cidade.')).toBeVisible();
  expect(requests).toHaveLength(0);

  await search.fill('NoSuchCity');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByRole('status')).toHaveText('Cidade inexistente');
  expect(page.getByRole('alert')).toHaveCount(0);
  expect(requests).toHaveLength(1);
});

test('requires refinement for duplicate locations and does not request a forecast', async ({
  page,
}) => {
  const requests = await blockExternalRequests(page);
  await routeSearch(page, true);
  await page.route('https://api.open-meteo.com/**', (route) =>
    route.fulfill({ json: createForecast() }),
  );
  await page.goto('/');

  await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill('Lisboa');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByRole('status')).toContainText('Refine a busca');
  await expect(page.getByRole('button', { name: 'Lisboa (Portugal)' })).toHaveCount(0);
  expect(requests).toHaveLength(1);
});

test('shows five days on mobile, changes units without requests, and preserves old data on refresh failure', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.clock.install({ time: new Date('2026-03-08T12:05:00Z') });
  const requests = await blockExternalRequests(page);
  await routeSearch(page);
  let forecastRequests = 0;
  await page.route('https://api.open-meteo.com/**', async (route) => {
    forecastRequests += 1;
    if (forecastRequests === 1) {
      await route.fulfill({ json: createForecast() });
      return;
    }
    await route.fulfill({ status: 503, body: 'provider unavailable' });
  });
  await page.goto('/');

  await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill('Lisboa');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.getByRole('button', { name: 'Lisboa (Portugal)' }).click();
  const current = page.getByRole('region', { name: 'Condições atuais de Lisboa' });
  await expect(current).toContainText('20°C');
  await expect(page.getByRole('article')).toHaveCount(5);
  expect(forecastRequests).toBe(1);

  await page.getByRole('radio', { name: 'Fahrenheit (°F)' }).check();
  await expect(current).toContainText('68°F');
  await expect(page.getByRole('article').first()).toContainText('68°F');
  expect(forecastRequests).toBe(1);

  await page.getByRole('button', { name: 'Atualizar' }).click();
  await expect(page.getByRole('alert')).toContainText('resposta inválida');
  await expect(page.getByRole('alert')).toContainText('Lisboa');
  await expect(page.getByRole('alert')).toContainText('08/03/2026');
  await expect(current).toContainText('68°F');
  expect(forecastRequests).toBe(2);
  expect(requests).toHaveLength(3);

  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);

  await page.reload();
  await expect(page.getByRole('radio', { name: 'Celsius (°C)' })).toBeChecked();
});

test('times out without retrying and exposes stale data after a manual retry', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-03-08T12:05:00Z') });
  const requests = await blockExternalRequests(page);
  await routeSearch(page);
  let forecastRequests = 0;
  await page.route('https://api.open-meteo.com/**', async (route) => {
    forecastRequests += 1;
    if (forecastRequests === 1) {
      await new Promise(() => {});
      return;
    }
    await route.fulfill({ json: createForecast('2026-03-06T12:00') });
  });
  await page.goto('/');

  await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill('Lisboa');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.getByRole('button', { name: 'Lisboa (Portugal)' }).click();
  await expect(page.getByRole('status')).toHaveText('Carregando dados meteorológicos...');
  await page.clock.fastForward(10_000);
  await expect(page.getByRole('alert')).toContainText('demorou mais que o esperado');
  expect(forecastRequests).toBe(1);
  expect(requests).toHaveLength(2);

  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('region', { name: 'Condições atuais de Lisboa' })).toContainText(
    'Dados meteorológicos desatualizados.',
  );
  expect(forecastRequests).toBe(2);
  expect(requests).toHaveLength(3);
});

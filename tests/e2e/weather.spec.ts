import { expect, type Page, test } from '@playwright/test';

const city = {
  id: 2267057,
  name: 'Lisboa',
  latitude: 38.7167,
  longitude: -9.1333,
  country: 'Portugal',
  timezone: 'Europe/Lisbon',
};

const duplicateCities = [city, { ...city, id: 999, latitude: 38.8 }];

function createForecast(sourceValidAt = '2026-03-08T12:00') {
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
  await expect(page.getByRole('status')).toHaveText('Nenhuma cidade encontrada');
  await expect(page.getByRole('alert')).toHaveCount(0);
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
  await expect(page.getByRole('article', { name: 'Previsão para 2026-03-08' })).toContainText(
    '68°F',
  );
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
      // Simula ausência de resposta; o timeout do service cancela a requisição.
      return;
    }
    await route.fulfill({ json: createForecast('2026-03-06T12:00') });
  });
  await page.goto('/');

  await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill('Lisboa');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.getByRole('button', { name: 'Lisboa (Portugal)' }).click();
  await expect(page.getByRole('status')).toHaveText('Carregando dados meteorológicos...');
  await expect.poll(() => forecastRequests).toBe(1);
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

for (const viewport of [null, { width: 375, height: 812 }]) {
  test(`searches and converts zero Celsius ${viewport ? 'at 375x812' : 'on the default viewport'}`, async ({
    page,
  }) => {
    if (viewport) await page.setViewportSize(viewport);
    await page.clock.install({ time: new Date('2026-03-08T12:05:00Z') });
    const requests = await blockExternalRequests(page);
    await routeSearch(page);
    const forecast = createForecast();
    forecast.current.temperature_2m = 0;
    await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({ json: forecast }));
    await page.goto('/');
    await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill('Lisboa');
    await page.getByRole('button', { name: 'Buscar' }).click();
    await page.getByRole('button', { name: 'Lisboa (Portugal)' }).click();
    const current = page.getByRole('region', { name: 'Condições atuais de Lisboa' });
    await expect(current.getByRole('heading', { name: 'Lisboa' })).toBeVisible();
    await expect(current.getByText('0°C', { exact: true })).toBeVisible();
    const daily = page.getByRole('region', { name: 'Previsão de 5 dias' });
    await expect(daily).toBeVisible();
    await expect(daily.getByRole('article')).toHaveCount(5);
    await expect(daily.getByRole('heading', { name: 'Hoje 08/03' })).toBeVisible();
    await page.getByRole('radio', { name: 'Fahrenheit (°F)' }).check();
    await expect(current.getByText('32°F', { exact: true })).toBeVisible();
    await page.getByRole('radio', { name: 'Celsius (°C)' }).check();
    await expect(current.getByText('0°C', { exact: true })).toBeVisible();
    expect(requests).toHaveLength(2);
  });
}

test('shows the empty state when geocoding returns no results property', async ({ page }) => {
  const requests = await blockExternalRequests(page);
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: {} }),
  );
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill('NoSuchCity');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByRole('status')).toHaveText('Nenhuma cidade encontrada');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Previsão de 5 dias' })).toHaveCount(0);
  expect(requests).toHaveLength(1);
});

test('rejects empty, whitespace-only, and special-character searches without network requests', async ({
  page,
}) => {
  const requests = await blockExternalRequests(page);
  await page.goto('/');

  const search = page.getByRole('searchbox', { name: 'Buscar cidade' });
  const submit = page.getByRole('button', { name: 'Buscar' });

  await submit.click();
  await expect(search).toHaveAccessibleDescription('Informe o nome da cidade.');
  await search.fill('   ');
  await submit.click();
  await expect(search).toHaveAccessibleDescription('Informe o nome da cidade.');
  await search.fill("O'Fallon");
  await submit.click();
  await expect(search).toHaveAccessibleDescription(
    'Use somente letras e espaços no nome da cidade.',
  );
  expect(requests).toHaveLength(0);
});

test('keeps five forecast dates and renders missing provider fields without invalid values', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-03-08T12:05:00Z') });
  await blockExternalRequests(page);
  await routeSearch(page);
  await page.route('https://api.open-meteo.com/**', (route) =>
    route.fulfill({
      json: {
        ...createForecast(),
        current: {
          time: null,
          temperature_2m: 20,
          weather_code: 1,
          wind_speed_10m: null,
          wind_direction_10m: null,
        },
        daily: { time: ['2026-03-08'] },
      },
    }),
  );
  await page.goto('/');

  await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill('Lisboa');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.getByRole('button', { name: 'Lisboa (Portugal)' }).click();

  const current = page.getByRole('region', { name: 'Condições atuais de Lisboa' });
  const forecast = page.getByRole('region', { name: 'Previsão de 5 dias' });
  await expect(current).toContainText('Algumas condições não estão disponíveis');
  await expect(forecast.getByRole('article')).toHaveCount(5);
  await expect(forecast.getByRole('heading', { name: 'Hoje 08/03' })).toBeVisible();
  await expect(forecast.getByRole('heading', { name: 'Amanhã 09/03' })).toBeVisible();
  await expect(page.getByText(/NaN|undefined|null/)).toHaveCount(0);
});

for (const failure of ['http', 'network', 'partial'] as const) {
  test(`shows an explicit weather error for ${failure} failure and allows a manual retry`, async ({
    page,
  }) => {
    await page.clock.install({ time: new Date('2026-03-08T12:05:00Z') });
    await blockExternalRequests(page);
    await routeSearch(page);
    let attempts = 0;
    await page.route('https://api.open-meteo.com/**', async (route) => {
      attempts += 1;
      if (attempts > 1) {
        await route.fulfill({ json: createForecast() });
      } else if (failure === 'network') {
        await route.abort('failed');
      } else if (failure === 'http') {
        await route.fulfill({ status: 503, json: {} });
      } else {
        const { daily: _daily, ...partial } = createForecast();
        await route.fulfill({ json: partial });
      }
    });
    await page.goto('/');
    await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill('Lisboa');
    await page.getByRole('button', { name: 'Buscar' }).click();
    await page.getByRole('button', { name: 'Lisboa (Portugal)' }).click();
    await expect(page.getByRole('alert')).toContainText(
      failure === 'network' ? 'Não foi possível conectar' : 'resposta inválida',
    );
    await expect(page.getByRole('region', { name: 'Condições atuais de Lisboa' })).toHaveCount(0);
    expect(attempts).toBe(1);
    await page.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(page.getByRole('region', { name: 'Condições atuais de Lisboa' })).toContainText(
      '20°C',
    );
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(attempts).toBe(2);
  });
}

import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

const city = {
  id: 2267057,
  name: 'Lisboa',
  latitude: 38.7167,
  longitude: -9.1333,
  country: 'Portugal',
  timezone: 'Europe/Lisbon',
};

const forecast = {
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
    time: '2026-03-08T12:00',
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

async function blockExternalRequests(page: Page) {
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
}

async function expectNoSeriousA11yViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(
    violations.filter(
      (violation) => violation.impact === 'critical' || violation.impact === 'serious',
    ),
  ).toEqual([]);
}

test('has no critical or serious accessibility violations in key states', async ({ page }) => {
  test.setTimeout(60_000);
  await page.clock.install({ time: new Date('2026-03-08T12:05:00Z') });
  await blockExternalRequests(page);
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: { results: [city] } }),
  );
  let forecastRequests = 0;
  await page.route('https://api.open-meteo.com/**', async (route) => {
    forecastRequests += 1;
    if (forecastRequests === 1) {
      // Simula ausência de resposta; o timeout do service cancela a requisição.
      return;
    }
    await route.fulfill({ json: forecast });
  });
  await page.goto('/');

  await expectNoSeriousA11yViolations(page);

  await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill('Lisboa');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByRole('button', { name: 'Lisboa (Portugal)' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Resultados da busca' })).toBeFocused();
  await expectNoSeriousA11yViolations(page);

  await page.getByRole('button', { name: 'Lisboa (Portugal)' }).click();
  await expect(page.getByText('Carregando dados meteorológicos...')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Informações meteorológicas' })).toHaveAttribute(
    'aria-busy',
    'true',
  );
  await expect.poll(() => forecastRequests).toBe(1);
  await expectNoSeriousA11yViolations(page);

  await page.clock.fastForward(10_000);
  await expect(page.getByRole('alert')).toBeVisible();
  await expectNoSeriousA11yViolations(page);

  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('region', { name: 'Condições atuais de Lisboa' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Informações meteorológicas' })).toHaveAttribute(
    'aria-busy',
    'false',
  );
  await expectNoSeriousA11yViolations(page);
});

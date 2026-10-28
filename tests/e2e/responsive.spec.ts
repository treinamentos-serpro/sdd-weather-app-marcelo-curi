import { expect, test } from '@playwright/test';

const city = {
  id: 1,
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
    precipitation_probability_max: [0, 0, 0, 0, 0],
    wind_speed_10m_max: [10, 10, 10, 10, 10],
    wind_direction_10m_dominant: [90, 90, 90, 90, 90],
  },
};

const viewports = [
  { width: 320, height: 800 },
  { width: 768, height: 900 },
  { width: 1280, height: 900 },
  { width: 1920, height: 1080 },
];

for (const viewport of viewports) {
  test(`keeps the weather flow usable at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.clock.install({ time: new Date('2026-03-08T12:05:00Z') });
    await page.route('**/*', async (route) => {
      const requestUrl = new URL(route.request().url());
      if (requestUrl.hostname.endsWith('open-meteo.com')) {
        await route.abort();
        return;
      }
      await route.continue();
    });
    await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
      route.fulfill({ json: { results: [city] } }),
    );
    await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({ json: forecast }));
    await page.goto('/');

    await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill('Lisboa');
    await page.getByRole('button', { name: 'Buscar' }).click();
    await page.getByRole('button', { name: 'Lisboa (Portugal)' }).click();
    await expect(page.getByRole('region', { name: 'Condições atuais de Lisboa' })).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(5);

    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);

    const searchBox = await page.getByRole('searchbox', { name: 'Buscar cidade' }).boundingBox();
    const weatherPanel = await page
      .getByRole('region', { name: 'Condições atuais de Lisboa' })
      .boundingBox();
    const forecastCards = await page.getByRole('article').all();
    expect(searchBox).not.toBeNull();
    expect(weatherPanel).not.toBeNull();
    expect(searchBox!.x).toBeGreaterThanOrEqual(0);
    expect(searchBox!.x + searchBox!.width).toBeLessThanOrEqual(viewport.width);
    expect(weatherPanel!.x + weatherPanel!.width).toBeLessThanOrEqual(viewport.width);

    const searchSection = await page.getByRole('region', { name: 'Busca de cidade' }).boundingBox();
    const weatherSection = await page
      .getByRole('region', { name: 'Informações meteorológicas' })
      .boundingBox();
    expect(searchSection).not.toBeNull();
    expect(weatherSection).not.toBeNull();
    expect(searchSection!.y + searchSection!.height).toBeLessThanOrEqual(weatherSection!.y);

    for (const card of forecastCards) {
      const box = await card.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
    }
  });
}

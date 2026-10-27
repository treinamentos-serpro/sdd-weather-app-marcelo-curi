import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchForecastResponse } from '../../src/services/weatherService';
import type { City } from '../../src/types/weather';

const city: City = {
  id: 1,
  name: 'Lisboa',
  latitude: 38.7167,
  longitude: -9.1333,
  timezone: 'Europe/Lisbon',
};

const response = {
  timezone: 'Europe/Lisbon',
  utc_offset_seconds: 3600,
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
  current: {},
  daily: {},
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchForecastResponse', () => {
  it('requests approved fields and units from the HTTPS forecast endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(response)));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchForecastResponse(city)).resolves.toMatchObject({
      timezone: 'Europe/Lisbon',
      utc_offset_seconds: 3600,
    });

    const [requestedUrl] = fetchMock.mock.calls[0] as [URL];
    expect(requestedUrl.protocol).toBe('https:');
    expect(requestedUrl.hostname).toBe('api.open-meteo.com');
    expect(requestedUrl.searchParams.get('latitude')).toBe(String(city.latitude));
    expect(requestedUrl.searchParams.get('longitude')).toBe(String(city.longitude));
    expect(requestedUrl.searchParams.get('current')).toBe(
      'temperature_2m,weather_code,wind_speed_10m,wind_direction_10m',
    );
    expect(requestedUrl.searchParams.get('daily')).toBe(
      'temperature_2m_mean,temperature_2m_min,temperature_2m_max,weather_code,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant',
    );
    expect(requestedUrl.searchParams.get('temperature_unit')).toBe('celsius');
    expect(requestedUrl.searchParams.get('wind_speed_unit')).toBe('kmh');
    expect(requestedUrl.searchParams.get('forecast_days')).toBe('5');
    expect(requestedUrl.searchParams.get('timezone')).toBe('auto');
  });

  it('rejects forecast data whose declared temperature unit is incompatible', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ...response, current_units: { ...response.current_units, temperature_2m: '°F' } })),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchForecastResponse(city)).rejects.toMatchObject({ category: 'provider' });
  });
});

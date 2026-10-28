import { afterEach, describe, expect, it, vi } from 'vitest';
import { getWeather } from '../../src/services/weatherService';
import type { City } from '../../src/types/weather';

const city: City = {
  id: 1,
  name: 'Los Angeles',
  latitude: 34.05,
  longitude: -118.24,
  timezone: 'America/Los_Angeles',
};

const units = {
  temperature_2m: '°C',
  weather_code: 'wmo code',
  wind_speed_10m: 'km/h',
  wind_direction_10m: '°',
};

const dailyUnits = {
  temperature_2m_mean: '°C',
  temperature_2m_min: '°C',
  temperature_2m_max: '°C',
  weather_code: 'wmo code',
  precipitation_probability_max: '%',
  wind_speed_10m_max: 'km/h',
  wind_direction_10m_dominant: '°',
};

const validForecast = {
  timezone: 'America/Los_Angeles',
  utc_offset_seconds: -7 * 60 * 60,
  current_units: units,
  daily_units: dailyUnits,
  current: {
    time: '2026-03-08T05:00',
    temperature_2m: 15,
    weather_code: 2,
    wind_speed_10m: 10,
    wind_direction_10m: 270,
  },
  daily: {
    time: ['2026-03-08', '2026-03-09', '2026-03-10', '2026-03-11', '2026-03-12'],
    temperature_2m_mean: [12, 13, 14, 15, 16],
    temperature_2m_min: [8, 9, 10, 11, 12],
    temperature_2m_max: [18, 19, 20, 21, 22],
    weather_code: [1, 2, 3, 45, 61],
    precipitation_probability_max: [0, 10, 20, 30, 40],
    wind_speed_10m_max: [5, 6, 7, 8, 9],
    wind_direction_10m_dominant: [0, 45, 90, 180, 270],
  },
};

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('getWeather', () => {
  it('maps a complete forecast into five locally dated days and an ISO snapshot', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-08T12:05:00Z'));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(validForecast))));

    await expect(getWeather(city)).resolves.toEqual({
      city,
      current: {
        temperatureC: 15,
        conditionCode: 2,
        dailyMinimumC: 8,
        dailyMaximumC: 18,
        precipitationProbabilityPercent: 0,
        windSpeedKmh: 10,
        windDirectionDegrees: 270,
      },
      days: [
        {
          date: '2026-03-08',
          meanTemperatureC: 12,
          minimumC: 8,
          maximumC: 18,
          conditionCode: 1,
          precipitationProbabilityPercent: 0,
          windSpeedKmh: 5,
          windDirectionDegrees: 0,
        },
        ...validForecast.daily.time.slice(1).map((date, offset) => ({
          date,
          meanTemperatureC: validForecast.daily.temperature_2m_mean[offset + 1],
          minimumC: validForecast.daily.temperature_2m_min[offset + 1],
          maximumC: validForecast.daily.temperature_2m_max[offset + 1],
          conditionCode: validForecast.daily.weather_code[offset + 1],
          precipitationProbabilityPercent:
            validForecast.daily.precipitation_probability_max[offset + 1],
          windSpeedKmh: validForecast.daily.wind_speed_10m_max[offset + 1],
          windDirectionDegrees: validForecast.daily.wind_direction_10m_dominant[offset + 1],
        })),
      ],
      fetchedAt: '2026-03-08T12:05:00.000Z',
      sourceValidAt: '2026-03-08T12:00:00.000Z',
    });
  });

  it('keeps five days with null values when daily series are missing', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-08T12:05:00Z'));
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...validForecast, daily: {} }))),
    );

    await expect(getWeather(city)).resolves.toMatchObject({
      days: [
        { date: '2026-03-08', meanTemperatureC: null, minimumC: null, maximumC: null },
        { date: '2026-03-09', meanTemperatureC: null, minimumC: null, maximumC: null },
        { date: '2026-03-10', meanTemperatureC: null, minimumC: null, maximumC: null },
        { date: '2026-03-11', meanTemperatureC: null, minimumC: null, maximumC: null },
        { date: '2026-03-12', meanTemperatureC: null, minimumC: null, maximumC: null },
      ],
      current: { temperatureC: 15, conditionCode: 2 },
    });
  });

  it('treats missing minimum or condition data as unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ...validForecast,
            current: { ...validForecast.current, weather_code: null },
          }),
        ),
      ),
    );

    await expect(getWeather(city)).rejects.toMatchObject({ category: 'unavailable' });
  });
});

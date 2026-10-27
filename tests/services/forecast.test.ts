import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getWeather } from '../../src/services/weatherService';
import type { City } from '../../src/types/weather';

const city: City = {
  id: 2267057,
  name: 'Lisboa',
  latitude: 38.7167,
  longitude: -9.1333,
  country: 'Portugal',
  timezone: 'Europe/Lisbon',
};

const currentUnits = {
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
  timezone: 'Europe/Lisbon',
  utc_offset_seconds: 0,
  current_units: currentUnits,
  daily_units: dailyUnits,
  current: {
    time: '2026-03-08T12:00',
    temperature_2m: 19.4,
    weather_code: 2,
    wind_speed_10m: 12.1,
    wind_direction_10m: 270,
  },
  daily: {
    time: ['2026-03-08', '2026-03-09', '2026-03-10', '2026-03-11', '2026-03-12'],
    temperature_2m_mean: [18.2, 17.6, null, 19.1, 18.8],
    temperature_2m_min: [14, 13.2, 12.8, 15.1, 14.7],
    temperature_2m_max: [22.1, 21.3, 20.5, 23, 22.4],
    weather_code: [2, 3, 61, 1, 2],
    precipitation_probability_max: [10, 20, 70, null, 15],
    wind_speed_10m_max: [18, 21.4, 25.2, 17.1, 16.3],
    wind_direction_10m_dominant: [270, 315, 0, 45, 90],
  },
};

let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

beforeEach(() => {
  fetchMock = vi.fn<typeof fetch>();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('getWeather', () => {
  it('requests the correct forecast parameters and maps an exact deterministic snapshot', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-08T12:05:00Z'));
    fetchMock.mockResolvedValue(new Response(JSON.stringify(validForecast)));

    await expect(getWeather(city)).resolves.toEqual({
      city,
      current: {
        temperatureC: 19.4,
        conditionCode: 2,
        dailyMinimumC: 14,
        dailyMaximumC: 22.1,
        precipitationProbabilityPercent: 10,
        windSpeedKmh: 12.1,
        windDirectionDegrees: 270,
      },
      days: [
        {
          date: '2026-03-08',
          meanTemperatureC: 18.2,
          minimumC: 14,
          maximumC: 22.1,
          conditionCode: 2,
          precipitationProbabilityPercent: 10,
          windSpeedKmh: 18,
          windDirectionDegrees: 270,
        },
        {
          date: '2026-03-09',
          meanTemperatureC: 17.6,
          minimumC: 13.2,
          maximumC: 21.3,
          conditionCode: 3,
          precipitationProbabilityPercent: 20,
          windSpeedKmh: 21.4,
          windDirectionDegrees: 315,
        },
        {
          date: '2026-03-10',
          meanTemperatureC: null,
          minimumC: 12.8,
          maximumC: 20.5,
          conditionCode: 61,
          precipitationProbabilityPercent: 70,
          windSpeedKmh: 25.2,
          windDirectionDegrees: 0,
        },
        {
          date: '2026-03-11',
          meanTemperatureC: 19.1,
          minimumC: 15.1,
          maximumC: 23,
          conditionCode: 1,
          precipitationProbabilityPercent: null,
          windSpeedKmh: 17.1,
          windDirectionDegrees: 45,
        },
        {
          date: '2026-03-12',
          meanTemperatureC: 18.8,
          minimumC: 14.7,
          maximumC: 22.4,
          conditionCode: 2,
          precipitationProbabilityPercent: 15,
          windSpeedKmh: 16.3,
          windDirectionDegrees: 90,
        },
      ],
      fetchedAt: '2026-03-08T12:05:00.000Z',
      sourceValidAt: '2026-03-08T12:00:00.000Z',
    });

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.protocol).toBe('https:');
    expect(url.hostname).toBe('api.open-meteo.com');
    expect(url.searchParams.get('latitude')).toBe(String(city.latitude));
    expect(url.searchParams.get('longitude')).toBe(String(city.longitude));
    expect(url.searchParams.get('current')).toBe(
      'temperature_2m,weather_code,wind_speed_10m,wind_direction_10m',
    );
    expect(url.searchParams.get('daily')).toBe(
      'temperature_2m_mean,temperature_2m_min,temperature_2m_max,weather_code,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant',
    );
    expect(url.searchParams.get('temperature_unit')).toBe('celsius');
    expect(url.searchParams.get('wind_speed_unit')).toBe('kmh');
    expect(url.searchParams.get('timezone')).toBe('auto');
    expect(url.searchParams.get('forecast_days')).toBe('5');
  });

  it('maps short and mismatched daily arrays by exact date without dropping forecast days', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-08T12:05:00Z'));
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          ...validForecast,
          daily: {
            time: ['2026-03-09'],
            temperature_2m_mean: [10],
            temperature_2m_min: [8],
            temperature_2m_max: [12],
          },
        }),
      ),
    );

    const snapshot = await getWeather(city);
    expect(snapshot.days).toEqual([
      {
        date: '2026-03-08',
        meanTemperatureC: null,
        minimumC: null,
        maximumC: null,
        conditionCode: null,
        precipitationProbabilityPercent: null,
        windSpeedKmh: null,
        windDirectionDegrees: null,
      },
      {
        date: '2026-03-09',
        meanTemperatureC: 10,
        minimumC: 8,
        maximumC: 12,
        conditionCode: null,
        precipitationProbabilityPercent: null,
        windSpeedKmh: null,
        windDirectionDegrees: null,
      },
      ...['2026-03-10', '2026-03-11', '2026-03-12'].map((date) => ({
        date,
        meanTemperatureC: null,
        minimumC: null,
        maximumC: null,
        conditionCode: null,
        precipitationProbabilityPercent: null,
        windSpeedKmh: null,
        windDirectionDegrees: null,
      })),
    ]);
  });

  it('keeps the weather available when optional current and daily fields are missing', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          ...validForecast,
          current: {
            time: null,
            temperature_2m: 19,
            weather_code: 0,
            wind_speed_10m: null,
            wind_direction_10m: null,
          },
          daily: null,
        }),
      ),
    );

    const snapshot = await getWeather(city);
    expect(snapshot.current.temperatureC).toBe(19);
    expect(snapshot.current.conditionCode).toBe(0);
    expect(snapshot.current.windSpeedKmh).toBeNull();
    expect(snapshot.days).toHaveLength(5);
    expect(snapshot.days.every((day) => day.meanTemperatureC === null)).toBe(true);
    expect(snapshot.sourceValidAt).toBeNull();
  });

  it.each([
    'temperature_2m',
    'weather_code',
  ] as const)('reports unavailable when required current field %s is absent', async (field) => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          ...validForecast,
          current: { ...validForecast.current, [field]: null },
        }),
      ),
    );

    await expect(getWeather(city)).rejects.toMatchObject({ category: 'unavailable' });
  });

  it('clears both ends of a daily temperature range when minimum exceeds maximum', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          ...validForecast,
          daily: {
            ...validForecast.daily,
            temperature_2m_min: [25, ...validForecast.daily.temperature_2m_min.slice(1)],
          },
        }),
      ),
    );

    const snapshot = await getWeather(city);
    expect(snapshot.current.dailyMinimumC).toBeNull();
    expect(snapshot.current.dailyMaximumC).toBeNull();
    expect(snapshot.days[0]?.minimumC).toBeNull();
    expect(snapshot.days[0]?.maximumC).toBeNull();
  });

  it('rejects incompatible units and provider-declared errors', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ...validForecast,
          current_units: { ...currentUnits, wind_speed_10m: 'mph' },
        }),
      ),
    );
    await expect(getWeather(city)).rejects.toMatchObject({ category: 'provider' });

    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: true })));
    await expect(getWeather(city)).rejects.toMatchObject({ category: 'provider' });
  });

  it('classifies HTTP, invalid JSON, and network failures distinctly from unavailable', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 503 }));
    await expect(getWeather(city)).rejects.toMatchObject({ category: 'provider' });

    fetchMock.mockResolvedValueOnce(new Response('{'));
    await expect(getWeather(city)).rejects.toMatchObject({ category: 'provider' });

    fetchMock.mockRejectedValueOnce(new TypeError('network failure'));
    await expect(getWeather(city)).rejects.toMatchObject({ category: 'network' });
  });

  it('forwards cancellation and reports a ten-second timeout', async () => {
    fetchMock.mockImplementation(
      (_input, init) =>
        new Promise((_, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(init.signal?.reason);
          });
        }),
    );
    const controller = new AbortController();
    const request = getWeather(city, controller.signal);
    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBeDefined();
    controller.abort();
    await expect(request).rejects.toMatchObject({ name: 'AbortError' });

    vi.useFakeTimers();
    fetchMock.mockImplementation(() => new Promise(() => {}));
    const timeoutRequest = getWeather(city);
    const timeoutRejection = expect(timeoutRequest).rejects.toMatchObject({
      category: 'timeout',
    });
    await vi.advanceTimersByTimeAsync(10_000);
    await timeoutRejection;
  });
});

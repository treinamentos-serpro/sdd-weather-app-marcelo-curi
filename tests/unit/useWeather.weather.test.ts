import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useWeather from '../../src/hooks/useWeather';
import { getWeather } from '../../src/services/weatherService';
import type { City, WeatherSnapshot } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', () => ({
  getWeather: vi.fn(),
  searchCities: vi.fn(),
  WeatherServiceError: class WeatherServiceError extends Error {
    constructor(readonly category: string) {
      super(category);
    }
  },
}));

const city: City = {
  id: 1,
  name: 'Lisboa',
  latitude: 38.7,
  longitude: -9.1,
  timezone: 'Europe/Lisbon',
};

const snapshot: WeatherSnapshot = {
  city,
  current: {
    temperatureC: 20,
    conditionCode: 1,
    dailyMinimumC: 15,
    dailyMaximumC: 24,
    precipitationProbabilityPercent: 0,
    windSpeedKmh: 10,
    windDirectionDegrees: 90,
  },
  days: [],
  fetchedAt: '2026-03-08T12:00:00.000Z',
  sourceValidAt: '2026-03-08T11:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useWeather weather requests', () => {
  it('loads the selected city once and refreshes only on explicit action', async () => {
    vi.mocked(getWeather).mockResolvedValue(snapshot);
    const { result } = renderHook(() => useWeather());

    expect(getWeather).not.toHaveBeenCalled();
    await act(async () => {
      await result.current.selectCity(city);
    });
    expect(getWeather).toHaveBeenCalledTimes(1);
    expect(getWeather).toHaveBeenLastCalledWith(city, expect.any(AbortSignal));
    expect(result.current.state.weatherStatus).toBe('success');

    await act(async () => {
      await result.current.refreshWeather();
    });
    expect(getWeather).toHaveBeenCalledTimes(2);
  });

  it('keeps the previous snapshot and timestamp when a refresh fails', async () => {
    vi.mocked(getWeather)
      .mockResolvedValueOnce(snapshot)
      .mockRejectedValueOnce({ category: 'timeout' });
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.selectCity(city);
    });
    await act(async () => {
      await result.current.refreshWeather();
    });

    expect(result.current.state.weatherStatus).toBe('error');
    expect(result.current.state.weatherError).toBe('timeout');
    expect(result.current.state.snapshot).toBe(snapshot);
    expect(result.current.state.snapshot?.city).toBe(city);
    expect(result.current.state.snapshot?.fetchedAt).toBe(snapshot.fetchedAt);
  });

  it('ignores a weather response superseded by a later selection', async () => {
    const secondCity: City = { ...city, id: 2, name: 'Porto' };
    const secondSnapshot: WeatherSnapshot = { ...snapshot, city: secondCity };
    let resolveFirst: ((value: WeatherSnapshot) => void) | undefined;
    vi.mocked(getWeather)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce(secondSnapshot);
    const { result } = renderHook(() => useWeather());

    let firstRequest = Promise.resolve();
    await act(async () => {
      firstRequest = result.current.selectCity(city);
    });
    await act(async () => {
      await result.current.selectCity(secondCity);
    });
    await act(async () => {
      resolveFirst?.(snapshot);
      await firstRequest;
    });

    expect(result.current.state.snapshot).toBe(secondSnapshot);
    expect(result.current.state.selectedCity).toBe(secondCity);
  });
});

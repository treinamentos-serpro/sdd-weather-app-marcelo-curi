import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useWeather from '../../src/hooks/useWeather';
import { searchCities } from '../../src/services/weatherService';
import type { City } from '../../src/types/weather';

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

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useWeather search', () => {
  it.each([
    ['', 'required'],
    ['  ', 'required'],
    ["O'Fallon", 'invalid'],
    ['a'.repeat(201), 'too-long'],
  ] as const)('rejects invalid input without calling the service', async (query, error) => {
    const { result } = renderHook(() => useWeather());

    await act(() => result.current.search(query));

    expect(searchCities).not.toHaveBeenCalled();
    expect(result.current.state.searchStatus).not.toBe('loading');
    expect(result.current.state.searchError).toBe(error);
  });

  it('moves from idle to loading and then to success after an explicit search', async () => {
    let resolveSearch: ((value: City[]) => void) | undefined;
    vi.mocked(searchCities).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSearch = resolve;
        }),
    );
    const { result } = renderHook(() => useWeather());

    expect(result.current.state.searchStatus).toBe('idle');
    let request = Promise.resolve();
    await act(async () => {
      request = result.current.search('Lisboa');
    });
    expect(result.current.state.searchStatus).toBe('loading');

    await act(async () => {
      resolveSearch?.([city]);
      await request;
    });
    expect(result.current.state.searchStatus).toBe('success');
    expect(result.current.state.searchResults).toEqual([city]);
  });

  it('updates results only from the most recent search', async () => {
    let resolveFirst: ((value: City[]) => void) | undefined;
    vi.mocked(searchCities)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce([city]);
    const { result } = renderHook(() => useWeather());

    let firstRequest = Promise.resolve();
    await act(async () => {
      firstRequest = result.current.search('Lisboa');
      await result.current.search('Porto');
    });
    await act(async () => {
      resolveFirst?.([]);
      await firstRequest;
    });

    expect(result.current.state.searchStatus).toBe('success');
    expect(result.current.state.searchResults).toEqual([city]);
    expect(result.current.state.selectedCity).toBeNull();
  });

  it('exposes empty and failed search states without selecting a city', async () => {
    vi.mocked(searchCities)
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce({ category: 'network' });
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('Lisboa');
    });
    expect(result.current.state.searchStatus).toBe('empty');

    await act(async () => {
      await result.current.search('Porto');
    });
    await waitFor(() => expect(result.current.state.searchStatus).toBe('error'));
    expect(result.current.state.searchRequestError).toBe('network');
    expect(result.current.state.selectedCity).toBeNull();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { searchCities } from '../../src/services/weatherService';

const city = {
  id: 2267057,
  name: 'Lisboa',
  latitude: 38.7167,
  longitude: -9.1333,
  country: 'Portugal',
  admin1: 'Lisboa',
  timezone: 'Europe/Lisbon',
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

describe('searchCities', () => {
  it('uses the HTTPS endpoint and all required query parameters', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ results: [city] })));

    await expect(searchCities('Lisboa')).resolves.toEqual([city]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.protocol).toBe('https:');
    expect(url.hostname).toBe('geocoding-api.open-meteo.com');
    expect(url.pathname).toBe('/v1/search');
    expect(url.searchParams.get('name')).toBe('Lisboa');
    expect(url.searchParams.get('count')).toBe('100');
    expect(url.searchParams.get('language')).toBe('pt');
    expect(url.searchParams.get('format')).toBe('json');
  });

  it('maps valid cities when geographic qualifiers are absent', async () => {
    const { country: _country, admin1: _admin1, ...unqualifiedCity } = city;
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ results: [unqualifiedCity] })));

    await expect(searchCities('Lisboa')).resolves.toEqual([unqualifiedCity]);
  });

  it.each([
    { results: [] },
    {},
    { results: null },
  ])('returns an empty result for no matches', async (payload) => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(payload)));
    await expect(searchCities('NoSuchCity')).resolves.toEqual([]);
  });

  it('rejects a city missing required fields or timezone', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ results: [{ ...city, timezone: undefined }] })),
    );
    await expect(searchCities('Lisboa')).rejects.toMatchObject({ category: 'provider' });
  });

  it('classifies non-2xx responses and provider-declared errors', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 503 }));
    await expect(searchCities('Lisboa')).rejects.toMatchObject({ category: 'provider' });

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Invalid query', reason: 'invalid' })),
    );
    await expect(searchCities('Lisboa')).rejects.toMatchObject({ category: 'provider' });
  });

  it('classifies invalid JSON as a provider error', async () => {
    fetchMock.mockResolvedValue(new Response('{'));
    await expect(searchCities('Lisboa')).rejects.toMatchObject({ category: 'provider' });
  });

  it('classifies transport rejection as a network error', async () => {
    fetchMock.mockRejectedValue(new TypeError('network failure'));
    await expect(searchCities('Lisboa')).rejects.toMatchObject({ category: 'network' });
  });

  it('forwards cancellation and rejects an explicitly aborted request', async () => {
    fetchMock.mockImplementation(
      (_input, init) =>
        new Promise((_, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(init.signal?.reason);
          });
        }),
    );
    const controller = new AbortController();
    const request = searchCities('Lisboa', controller.signal);

    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBeDefined();
    controller.abort();
    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('ends a request as timeout after ten seconds', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(() => new Promise(() => {}));
    const request = searchCities('Lisboa');
    const rejection = expect(request).rejects.toMatchObject({ category: 'timeout' });

    await vi.advanceTimersByTimeAsync(10_000);
    await rejection;
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchCities } from '../../src/services/weatherService';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('searchCities', () => {
  it('uses the HTTPS Open-Meteo geocoding endpoint and maps city qualifiers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              id: 2267057,
              name: 'Lisboa',
              latitude: 38.7167,
              longitude: -9.1333,
              country: 'Portugal',
              admin1: 'Lisboa',
              timezone: 'Europe/Lisbon',
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCities('Lisboa')).resolves.toEqual([
      {
        id: 2267057,
        name: 'Lisboa',
        latitude: 38.7167,
        longitude: -9.1333,
        country: 'Portugal',
        admin1: 'Lisboa',
        timezone: 'Europe/Lisbon',
      },
    ]);

    const [requestedUrl] = fetchMock.mock.calls[0] as [URL];
    expect(requestedUrl.protocol).toBe('https:');
    expect(requestedUrl.hostname).toBe('geocoding-api.open-meteo.com');
    expect(requestedUrl.searchParams.get('name')).toBe('Lisboa');
    expect(requestedUrl.searchParams.get('count')).toBe('100');
    expect(requestedUrl.searchParams.get('language')).toBe('pt');
    expect(requestedUrl.searchParams.get('format')).toBe('json');
  });
});

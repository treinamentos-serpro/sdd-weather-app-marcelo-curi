import type { City, WeatherError } from '../types/weather';

const REQUEST_TIMEOUT_MS = 10_000;
const GEOCODING_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';

export class WeatherServiceError extends Error {
  readonly category: WeatherError;

  constructor(category: WeatherError, message: string) {
    super(message);
    this.name = 'WeatherServiceError';
    this.category = category;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function requestJson(url: URL, signal?: AbortSignal): Promise<unknown> {
  if (signal?.aborted) {
    throw signal.reason ?? new DOMException('The operation was aborted.', 'AbortError');
  }

  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout>;
  let rejectAbort: ((reason: unknown) => void) | undefined;
  const abortPromise = new Promise<never>((_, reject) => {
    rejectAbort = reject;
  });
  const handleAbort = () => {
    controller.abort(signal?.reason);
    rejectAbort?.(signal?.reason ?? new DOMException('The operation was aborted.', 'AbortError'));
  };
  signal?.addEventListener('abort', handleAbort, { once: true });

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new WeatherServiceError('timeout', 'The weather provider request timed out.'));
    }, REQUEST_TIMEOUT_MS);
  });

  const requestPromise = fetch(url, { signal: controller.signal }).then(async (response) => {
    if (!response.ok) {
      throw new WeatherServiceError('provider', `Weather provider returned HTTP ${response.status}.`);
    }

    try {
      return await response.json();
    } catch {
      throw new WeatherServiceError('provider', 'Weather provider returned invalid JSON.');
    }
  });

  try {
    return await Promise.race([requestPromise, timeoutPromise, abortPromise]);
  } catch (error) {
    if (error instanceof WeatherServiceError) {
      throw error;
    }
    if (signal?.aborted) {
      throw error;
    }
    throw new WeatherServiceError('network', 'Unable to reach the weather provider.');
  } finally {
    clearTimeout(timeoutId!);
    signal?.removeEventListener('abort', handleAbort);
  }
}

function requiredFiniteNumber(
  value: unknown,
  fieldName: string,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new WeatherServiceError('provider', `Weather provider omitted a valid ${fieldName}.`);
  }
  return value;
}

function requiredString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new WeatherServiceError('provider', `Weather provider omitted a valid ${fieldName}.`);
  }
  return value;
}

function mapCity(value: unknown): City {
  if (!isRecord(value)) {
    throw new WeatherServiceError('provider', 'Weather provider returned an invalid city.');
  }

  const timezone = requiredString(value.timezone, 'timezone');
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
  } catch {
    throw new WeatherServiceError('provider', 'Weather provider returned an invalid timezone.');
  }

  const city: City = {
    id: requiredFiniteNumber(value.id, 'city id'),
    name: requiredString(value.name, 'city name'),
    latitude: requiredFiniteNumber(value.latitude, 'latitude'),
    longitude: requiredFiniteNumber(value.longitude, 'longitude'),
    timezone,
  };

  if (typeof value.country === 'string' && value.country.trim().length > 0) {
    city.country = value.country;
  }
  if (typeof value.admin1 === 'string' && value.admin1.trim().length > 0) {
    city.admin1 = value.admin1;
  }
  return city;
}

export async function searchCities(query: string, signal?: AbortSignal): Promise<City[]> {
  const url = new URL(GEOCODING_ENDPOINT);
  url.search = new URLSearchParams({
    name: query,
    count: '100',
    language: 'pt',
    format: 'json',
  }).toString();

  const payload = await requestJson(url, signal);
  if (!isRecord(payload) || payload.error === true) {
    throw new WeatherServiceError('provider', 'Weather provider returned an invalid geocoding response.');
  }
  if (payload.results === undefined || payload.results === null) {
    return [];
  }
  if (!Array.isArray(payload.results)) {
    throw new WeatherServiceError('provider', 'Weather provider returned invalid geocoding results.');
  }
  return payload.results.map(mapCity);
}

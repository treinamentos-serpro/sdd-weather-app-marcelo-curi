import type { City, WeatherError } from '../types/weather';

const REQUEST_TIMEOUT_MS = 10_000;
const GEOCODING_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';
const CURRENT_FIELDS = 'temperature_2m,weather_code,wind_speed_10m,wind_direction_10m';
const DAILY_FIELDS =
  'temperature_2m_mean,temperature_2m_min,temperature_2m_max,weather_code,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant';

interface ForecastCurrent {
  time: string | null;
  temperature_2m: number | null;
  weather_code: number | null;
  wind_speed_10m: number | null;
  wind_direction_10m: number | null;
}

interface ForecastDaily {
  time: string[];
  temperature_2m_mean?: Array<number | null>;
  temperature_2m_min?: Array<number | null>;
  temperature_2m_max?: Array<number | null>;
  weather_code?: Array<number | null>;
  precipitation_probability_max?: Array<number | null>;
  wind_speed_10m_max?: Array<number | null>;
  wind_direction_10m_dominant?: Array<number | null>;
}

export interface ForecastResponse {
  timezone: string;
  utc_offset_seconds: number | null;
  current: ForecastCurrent;
  daily: ForecastDaily | null;
}

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

function nullableNumber(value: unknown, fieldName: string): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new WeatherServiceError('provider', `Weather provider returned an invalid ${fieldName}.`);
  }
  return value;
}

function mapForecastCurrent(value: unknown): ForecastCurrent {
  if (value === undefined || value === null) {
    return {
      time: null,
      temperature_2m: null,
      weather_code: null,
      wind_speed_10m: null,
      wind_direction_10m: null,
    };
  }
  if (!isRecord(value)) {
    throw new WeatherServiceError('provider', 'Weather provider returned invalid current conditions.');
  }

  if (value.time !== undefined && value.time !== null && typeof value.time !== 'string') {
    throw new WeatherServiceError('provider', 'Weather provider returned an invalid observation time.');
  }
  return {
    time: typeof value.time === 'string' ? value.time : null,
    temperature_2m: nullableNumber(value.temperature_2m, 'current temperature'),
    weather_code: nullableNumber(value.weather_code, 'current weather code'),
    wind_speed_10m: nullableNumber(value.wind_speed_10m, 'current wind speed'),
    wind_direction_10m: nullableNumber(value.wind_direction_10m, 'current wind direction'),
  };
}

function mapDailySeries(value: unknown, fieldName: string): Array<number | null> | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new WeatherServiceError('provider', `Weather provider returned an invalid ${fieldName} series.`);
  }
  return value.map((item) => nullableNumber(item, fieldName));
}

function mapForecastDaily(value: unknown): ForecastDaily | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (!isRecord(value)) {
    throw new WeatherServiceError('provider', 'Weather provider returned invalid daily forecast data.');
  }

  const rawTime = value.time;
  if (rawTime !== undefined && rawTime !== null && (!Array.isArray(rawTime) || !rawTime.every((day) => typeof day === 'string'))) {
    throw new WeatherServiceError('provider', 'Weather provider returned invalid daily dates.');
  }

  return {
    time: Array.isArray(rawTime) ? rawTime : [],
    temperature_2m_mean: mapDailySeries(value.temperature_2m_mean, 'daily mean temperature'),
    temperature_2m_min: mapDailySeries(value.temperature_2m_min, 'daily minimum temperature'),
    temperature_2m_max: mapDailySeries(value.temperature_2m_max, 'daily maximum temperature'),
    weather_code: mapDailySeries(value.weather_code, 'daily weather code'),
    precipitation_probability_max: mapDailySeries(
      value.precipitation_probability_max,
      'daily precipitation probability',
    ),
    wind_speed_10m_max: mapDailySeries(value.wind_speed_10m_max, 'daily wind speed'),
    wind_direction_10m_dominant: mapDailySeries(
      value.wind_direction_10m_dominant,
      'daily wind direction',
    ),
  };
}

function validateUnit(units: unknown, fieldName: string, expected: string): void {
  if (!isRecord(units) || units[fieldName] !== expected) {
    throw new WeatherServiceError(
      'provider',
      `Weather provider returned an incompatible unit for ${fieldName}.`,
    );
  }
}

function validateForecastUnits(payload: Record<string, unknown>): void {
  const currentUnits = payload.current_units;
  validateUnit(currentUnits, 'temperature_2m', '°C');
  validateUnit(currentUnits, 'weather_code', 'wmo code');
  validateUnit(currentUnits, 'wind_speed_10m', 'km/h');
  validateUnit(currentUnits, 'wind_direction_10m', '°');

  if (payload.daily !== undefined && payload.daily !== null) {
    const dailyUnits = payload.daily_units;
    validateUnit(dailyUnits, 'temperature_2m_mean', '°C');
    validateUnit(dailyUnits, 'temperature_2m_min', '°C');
    validateUnit(dailyUnits, 'temperature_2m_max', '°C');
    validateUnit(dailyUnits, 'weather_code', 'wmo code');
    validateUnit(dailyUnits, 'precipitation_probability_max', '%');
    validateUnit(dailyUnits, 'wind_speed_10m_max', 'km/h');
    validateUnit(dailyUnits, 'wind_direction_10m_dominant', '°');
  }
}

export async function fetchForecastResponse(
  city: City,
  signal?: AbortSignal,
): Promise<ForecastResponse> {
  const url = new URL(FORECAST_ENDPOINT);
  url.search = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: CURRENT_FIELDS,
    daily: DAILY_FIELDS,
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    forecast_days: '5',
    timezone: 'auto',
  }).toString();

  const response = await requestJson(url, signal);
  if (!isRecord(response) || response.error === true) {
    throw new WeatherServiceError('provider', 'Weather provider returned an invalid forecast response.');
  }
  validateForecastUnits(response);
  const timezone = requiredString(response.timezone, 'forecast timezone');
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
  } catch {
    throw new WeatherServiceError('provider', 'Weather provider returned an invalid forecast timezone.');
  }

  return {
    timezone,
    utc_offset_seconds:
      typeof response.utc_offset_seconds === 'number' &&
      Number.isFinite(response.utc_offset_seconds)
        ? response.utc_offset_seconds
        : null,
    current: mapForecastCurrent(response.current),
    daily: mapForecastDaily(response.daily),
  };
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

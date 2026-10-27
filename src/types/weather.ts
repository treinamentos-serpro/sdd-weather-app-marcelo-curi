export type TemperatureUnit = 'celsius' | 'fahrenheit';

export type SearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export type WeatherStatus = 'idle' | 'loading' | 'success' | 'error';

export type SearchError = 'required' | 'invalid' | 'too-long';

export type RequestError = 'timeout' | 'network' | 'provider';

export type WeatherError = RequestError | 'unavailable';

export interface City {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  timezone: string;
}

export interface WeatherConditions {
  conditionCode: number | null;
  precipitationProbabilityPercent: number | null;
  windSpeedKmh: number | null;
  windDirectionDegrees: number | null;
}

export interface CurrentWeather extends WeatherConditions {
  temperatureC: number | null;
  dailyMinimumC: number | null;
  dailyMaximumC: number | null;
}

export interface ForecastDay extends WeatherConditions {
  /** Data civil no fuso da cidade, no formato ISO YYYY-MM-DD. */
  date: string;
  meanTemperatureC: number | null;
  minimumC: number | null;
  maximumC: number | null;
}

export interface WeatherSnapshot {
  city: City;
  current: CurrentWeather;
  days: ForecastDay[];
  /** Instante ISO de obtenção bem-sucedida. */
  fetchedAt: string;
  /** Instante ISO de observação/validade do provedor, quando disponível. */
  sourceValidAt: string | null;
}

export interface WeatherState {
  searchStatus: SearchStatus;
  searchResults: City[];
  searchRequestError: RequestError | null;
  selectedCity: City | null;
  weatherStatus: WeatherStatus;
  snapshot: WeatherSnapshot | null;
  weatherError: WeatherError | null;
  currentIsIncomplete: boolean;
  searchError: SearchError | null;
  unit: TemperatureUnit;
}

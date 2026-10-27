export type TemperatureUnit = 'celsius' | 'fahrenheit';

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

import { useCallback, useEffect, useRef, useState } from 'react';
import { normalizeAndValidateSearch } from '../lib/search';
import {
  getWeather as getWeatherService,
  searchCities as searchCitiesService,
  WeatherServiceError,
} from '../services/weatherService';
import type {
  City,
  RequestError,
  WeatherError,
  WeatherState,
} from '../types/weather';

const initialState: WeatherState = {
  searchStatus: 'idle',
  searchResults: [],
  searchRequestError: null,
  selectedCity: null,
  weatherStatus: 'idle',
  snapshot: null,
  weatherError: null,
  currentIsIncomplete: false,
  searchError: null,
  unit: 'celsius',
};

function isRequestError(value: unknown): value is RequestError {
  return value === 'timeout' || value === 'network' || value === 'provider';
}

function requestErrorFrom(error: unknown): RequestError {
  if (error instanceof WeatherServiceError && isRequestError(error.category)) {
    return error.category;
  }
  if (typeof error === 'object' && error !== null && 'category' in error) {
    const category = error.category;
    if (isRequestError(category)) {
      return category;
    }
  }

  console.error('Unexpected city search failure.', error);
  return 'provider';
}

function weatherErrorFrom(error: unknown): WeatherError {
  if (
    error instanceof WeatherServiceError &&
    (isRequestError(error.category) || error.category === 'unavailable')
  ) {
    return error.category;
  }
  if (typeof error === 'object' && error !== null && 'category' in error) {
    const category = error.category;
    if (isRequestError(category) || category === 'unavailable') {
      return category;
    }
  }

  console.error('Unexpected weather request failure.', error);
  return 'provider';
}

function isCurrentIncomplete(snapshot: NonNullable<WeatherState['snapshot']>): boolean {
  const { current } = snapshot;
  return [
    current.dailyMinimumC,
    current.dailyMaximumC,
    current.precipitationProbabilityPercent,
    current.windSpeedKmh,
    current.windDirectionDegrees,
  ].some((value) => value === null);
}

export interface UseWeatherResult {
  state: WeatherState;
  search: (query: string) => Promise<void>;
  selectCity: (city: City) => Promise<void>;
  refreshWeather: () => Promise<void>;
  toggleUnit: () => void;
}

export default function useWeather(): UseWeatherResult {
  const [state, setState] = useState(initialState);
  const searchRequestId = useRef(0);
  const searchController = useRef<AbortController | null>(null);
  const weatherRequestId = useRef(0);
  const weatherController = useRef<AbortController | null>(null);

  const search = useCallback(async (query: string) => {
    const requestId = ++searchRequestId.current;
    searchController.current?.abort();

    const validation = normalizeAndValidateSearch(query);
    const searchError = validation.error;
    if (searchError !== null) {
      setState((current) => ({
        ...current,
        searchStatus: 'idle',
        searchResults: [],
        searchRequestError: null,
        searchError,
      }));
      return;
    }

    const controller = new AbortController();
    searchController.current = controller;
    setState((current) => ({
      ...current,
      searchStatus: 'loading',
      searchResults: [],
      searchRequestError: null,
      searchError: null,
    }));

    try {
      const results = await searchCitiesService(validation.normalized, controller.signal);
      if (requestId !== searchRequestId.current || controller.signal.aborted) {
        return;
      }

      setState((current) => ({
        ...current,
        searchStatus: results.length === 0 ? 'empty' : 'success',
        searchResults: results,
        searchRequestError: null,
        searchError: null,
      }));
    } catch (error) {
      if (requestId !== searchRequestId.current || controller.signal.aborted) {
        return;
      }
      setState((current) => ({
        ...current,
        searchStatus: 'error',
        searchRequestError: requestErrorFrom(error),
        searchError: null,
      }));
    }
  }, []);

  const requestWeather = useCallback(async (city: City) => {
    const requestId = ++weatherRequestId.current;
    weatherController.current?.abort();
    const controller = new AbortController();
    weatherController.current = controller;

    setState((current) => ({
      ...current,
      selectedCity: city,
      weatherStatus: 'loading',
      weatherError: null,
    }));

    try {
      const snapshot = await getWeatherService(city, controller.signal);
      if (requestId !== weatherRequestId.current || controller.signal.aborted) {
        return;
      }

      setState((current) => ({
        ...current,
        selectedCity: city,
        weatherStatus: 'success',
        snapshot,
        weatherError: null,
        currentIsIncomplete: isCurrentIncomplete(snapshot),
      }));
    } catch (error) {
      if (requestId !== weatherRequestId.current || controller.signal.aborted) {
        return;
      }
      setState((current) => ({
        ...current,
        selectedCity: city,
        weatherStatus: 'error',
        weatherError: weatherErrorFrom(error),
      }));
    }
  }, []);

  const selectCity = useCallback(
    async (city: City) => requestWeather(city),
    [requestWeather],
  );

  const refreshWeather = useCallback(async () => {
    const selectedCity = state.selectedCity;
    if (selectedCity !== null) {
      await requestWeather(selectedCity);
    }
  }, [requestWeather, state.selectedCity]);

  const toggleUnit = useCallback(() => {
    setState((current) => ({
      ...current,
      unit: current.unit === 'celsius' ? 'fahrenheit' : 'celsius',
    }));
  }, []);

  useEffect(
    () => () => {
      searchController.current?.abort();
      weatherController.current?.abort();
    },
    [],
  );

  return { state, search, selectCity, refreshWeather, toggleUnit };
}

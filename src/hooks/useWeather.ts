import { useCallback, useEffect, useRef, useState } from 'react';
import { normalizeAndValidateSearch } from '../lib/search';
import {
  searchCities as searchCitiesService,
  WeatherServiceError,
} from '../services/weatherService';
import type {
  RequestError,
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

export interface UseWeatherResult {
  state: WeatherState;
  search: (query: string) => Promise<void>;
}

export default function useWeather(): UseWeatherResult {
  const [state, setState] = useState(initialState);
  const searchRequestId = useRef(0);
  const searchController = useRef<AbortController | null>(null);

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

  useEffect(
    () => () => {
      searchController.current?.abort();
    },
    [],
  );

  return { state, search };
}

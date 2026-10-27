import { useRef } from 'react';
import CityResults from './components/CityResults';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import UnitToggle from './components/UnitToggle';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import useWeather from './hooks/useWeather';
import type { TemperatureUnit } from './types/weather';

export default function App() {
  const { state, search, selectCity, refreshWeather, toggleUnit } = useWeather();
  const lastSearch = useRef<string | null>(null);

  function handleSearch(query: string) {
    lastSearch.current = query;
    return search(query);
  }

  function handleUnitChange(unit: TemperatureUnit) {
    if (unit !== state.unit) {
      toggleUnit();
    }
  }

  return (
    <main className="min-h-screen bg-night-900 px-4 py-8 text-slate-100 sm:px-6 sm:py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-400">
            Clima ao seu redor
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Consulte o tempo da sua cidade
          </h1>
          <p className="max-w-2xl text-slate-300">
            Busque uma localidade, escolha o resultado correto e veja as condições e a previsão
            diária.
          </p>
        </header>

        <section
          aria-label="Busca de cidade"
          className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glass backdrop-blur-md sm:p-7"
        >
          <SearchBar
            error={state.searchError}
            onSearch={handleSearch}
            status={state.searchStatus}
          />
          {state.searchStatus === 'empty' && <EmptyState />}
          {state.searchStatus === 'error' && state.searchRequestError !== null && (
            <ErrorState
              context="search"
              error={state.searchRequestError}
              onRetry={() => {
                if (lastSearch.current !== null) {
                  return search(lastSearch.current);
                }
              }}
            />
          )}
          {state.searchStatus === 'success' && (
            <CityResults cities={state.searchResults} onSelectCity={selectCity} />
          )}
        </section>

        <section aria-label="Informações meteorológicas" className="space-y-6">
          <UnitToggle onChange={handleUnitChange} unit={state.unit} />
          {state.weatherStatus === 'loading' && state.snapshot === null && <LoadingState />}
          {state.weatherStatus === 'error' && state.weatherError !== null && (
            <ErrorState
              context="weather"
              error={state.weatherError}
              onRetry={refreshWeather}
              snapshot={state.snapshot}
            />
          )}
          <CurrentWeather
            isIncomplete={state.currentIsIncomplete}
            onRefresh={refreshWeather}
            snapshot={state.snapshot}
            status={state.weatherStatus}
            unit={state.unit}
          />
          <ForecastList days={state.snapshot?.days ?? null} unit={state.unit} />
          {state.weatherStatus === 'loading' && state.snapshot !== null && (
            <LoadingState message="Atualizando dados meteorológicos..." />
          )}
        </section>
      </div>
    </main>
  );
}

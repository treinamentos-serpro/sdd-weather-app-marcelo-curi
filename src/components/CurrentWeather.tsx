import { formatTemperature } from '../lib/temperature';
import {
  describeWeatherCode,
  formatWeatherTimestamp,
  getWindDirection,
  isWeatherStale,
} from '../lib/weather';
import type { TemperatureUnit, WeatherSnapshot, WeatherStatus } from '../types/weather';

interface CurrentWeatherProps {
  snapshot: WeatherSnapshot | null;
  unit: TemperatureUnit;
  status: WeatherStatus;
  isIncomplete: boolean;
  onRefresh: () => void | Promise<void>;
}

export default function CurrentWeather({
  snapshot,
  unit,
  status,
  isIncomplete,
  onRefresh,
}: CurrentWeatherProps) {
  if (snapshot === null) {
    return null;
  }

  const { city, current } = snapshot;
  const condition = describeWeatherCode(current.conditionCode);
  const temperature = formatTemperature(current.temperatureC, unit);
  const minimum = formatTemperature(current.dailyMinimumC, unit);
  const maximum = formatTemperature(current.dailyMaximumC, unit);
  const windDirection = getWindDirection(current.windDirectionDegrees);
  const stale = isWeatherStale(snapshot.sourceValidAt);

  return (
    <section
      aria-label={`Condições atuais de ${city.name}`}
      className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glass backdrop-blur-md sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium uppercase tracking-wide text-accent-400">
            Condições atuais
          </p>
          <h2 className="mt-1 break-words text-2xl font-semibold text-white">{city.name}</h2>
          <p className="mt-1 text-sm text-slate-400">{city.admin1 ?? city.country}</p>
        </div>
        <button
          className="rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={status === 'loading'}
          onClick={() => void onRefresh()}
          type="button"
        >
          Atualizar
        </button>
      </div>

      <div className="mt-7 flex flex-wrap items-end gap-x-5 gap-y-2">
        {temperature !== null && (
          <p className="text-6xl font-semibold tracking-tight text-white sm:text-7xl">
            {temperature}
          </p>
        )}
        {condition !== null && <p className="pb-2 text-lg text-slate-200">{condition}</p>}
      </div>

      <dl className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {minimum !== null && (
          <div className="rounded-2xl bg-night-800/80 p-4">
            <dt className="text-sm text-slate-400">Mínima do dia</dt>
            <dd className="mt-1 font-semibold text-white">{minimum}</dd>
          </div>
        )}
        {maximum !== null && (
          <div className="rounded-2xl bg-night-800/80 p-4">
            <dt className="text-sm text-slate-400">Máxima do dia</dt>
            <dd className="mt-1 font-semibold text-white">{maximum}</dd>
          </div>
        )}
        {current.precipitationProbabilityPercent !== null && (
          <div className="rounded-2xl bg-night-800/80 p-4">
            <dt className="text-sm text-slate-400">Chuva máxima do dia</dt>
            <dd className="mt-1 font-semibold text-white">
              {current.precipitationProbabilityPercent}%
            </dd>
          </div>
        )}
        {current.windSpeedKmh !== null && (
          <div className="rounded-2xl bg-night-800/80 p-4">
            <dt className="text-sm text-slate-400">Velocidade do vento</dt>
            <dd className="mt-1 font-semibold text-white">{current.windSpeedKmh} km/h</dd>
          </div>
        )}
        {windDirection !== null && (
          <div className="rounded-2xl bg-night-800/80 p-4">
            <dt className="text-sm text-slate-400">Direção do vento</dt>
            <dd className="mt-1 font-semibold text-white">{windDirection}</dd>
          </div>
        )}
      </dl>

      {isIncomplete && (
        <p className="mt-5 text-sm text-slate-300" role="status">
          Algumas condições não estão disponíveis.
        </p>
      )}
      {stale && (
        <p className="mt-3 text-sm text-amber-200" role="status">
          Dados meteorológicos desatualizados.
        </p>
      )}
      <p className="mt-5 text-sm text-slate-400">
        Atualizado em {formatWeatherTimestamp(snapshot.fetchedAt, city.timezone)}
      </p>
    </section>
  );
}

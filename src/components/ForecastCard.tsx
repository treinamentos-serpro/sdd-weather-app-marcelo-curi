import { formatTemperature } from '../lib/temperature';
import { getDayLabel, getShortDate } from '../lib/format';
import { describeWeatherCode, getWindDirection } from '../lib/weather';
import type { ForecastDay, TemperatureUnit } from '../types/weather';

interface ForecastCardProps {
  day: ForecastDay;
  index: number;
  unit: TemperatureUnit;
}

export default function ForecastCard({ day, index, unit }: ForecastCardProps) {
  const mean = formatTemperature(day.meanTemperatureC, unit);
  const minimum = formatTemperature(day.minimumC, unit);
  const maximum = formatTemperature(day.maximumC, unit);
  const condition = describeWeatherCode(day.conditionCode);
  const windDirection = getWindDirection(day.windDirectionDegrees);

  return (
    <article
      aria-label={`Previsão para ${day.date}`}
      className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
    >
      <h3 className="font-semibold capitalize text-white">
        {getDayLabel(day.date, index)} <time dateTime={day.date}>{getShortDate(day.date)}</time>
      </h3>
      <dl className="mt-4 break-words space-y-3 text-sm">
        {mean !== null && (
          <div>
            <dt className="text-slate-400">Média</dt>
            <dd className="mt-0.5 font-medium text-white">{mean}</dd>
          </div>
        )}
        {minimum !== null && (
          <div>
            <dt className="text-slate-400">Mínima</dt>
            <dd className="mt-0.5 font-medium text-white">{minimum}</dd>
          </div>
        )}
        {maximum !== null && (
          <div>
            <dt className="text-slate-400">Máxima</dt>
            <dd className="mt-0.5 font-medium text-white">{maximum}</dd>
          </div>
        )}
        {condition !== null && (
          <div>
            <dt className="text-slate-400">Condição</dt>
            <dd className="mt-0.5 font-medium text-white">{condition}</dd>
          </div>
        )}
        {day.precipitationProbabilityPercent !== null && (
          <div>
            <dt className="text-slate-400">Chuva</dt>
            <dd className="mt-0.5 font-medium text-white">
              {day.precipitationProbabilityPercent}%
            </dd>
          </div>
        )}
        {day.windSpeedKmh !== null && (
          <div>
            <dt className="text-slate-400">Vento</dt>
            <dd className="mt-0.5 font-medium text-white">{day.windSpeedKmh} km/h</dd>
          </div>
        )}
        {windDirection !== null && (
          <div>
            <dt className="text-slate-400">Direção</dt>
            <dd className="mt-0.5 font-medium text-white">{windDirection}</dd>
          </div>
        )}
      </dl>
    </article>
  );
}

import { convertTemperature } from '../lib/temperature';
import { describeWeatherCode, getWindDirection } from '../lib/weather';
import type { ForecastDay, TemperatureUnit } from '../types/weather';

interface ForecastCardProps {
  day: ForecastDay;
  unit: TemperatureUnit;
}

function formatForecastDate(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
}

function formatTemperature(valueC: number | null, unit: TemperatureUnit): string | null {
  if (valueC === null) {
    return null;
  }
  const converted = convertTemperature(valueC, 'celsius', unit);
  if (converted === null) {
    return null;
  }
  return `${converted}${unit === 'celsius' ? '°C' : '°F'}`;
}

export default function ForecastCard({ day, unit }: ForecastCardProps) {
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
        <time dateTime={day.date}>{formatForecastDate(day.date)}</time>
      </h3>
      <dl className="mt-4 space-y-3 text-sm">
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

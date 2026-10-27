import ForecastCard from './ForecastCard';
import type { ForecastDay, TemperatureUnit } from '../types/weather';

interface ForecastListProps {
  days: ForecastDay[] | null;
  unit: TemperatureUnit;
}

export default function ForecastList({ days, unit }: ForecastListProps) {
  if (days === null || days.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="forecast-heading">
      <h2 className="mb-4 text-xl font-semibold text-white" id="forecast-heading">
        Previsão diária
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {days.map((day) => (
          <ForecastCard day={day} key={day.date} unit={unit} />
        ))}
      </div>
    </section>
  );
}

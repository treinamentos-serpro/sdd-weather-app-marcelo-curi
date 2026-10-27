import type { TemperatureUnit } from '../types/weather';

interface UnitToggleProps {
  unit: TemperatureUnit;
  onChange: (unit: TemperatureUnit) => void;
}

export default function UnitToggle({ unit, onChange }: UnitToggleProps) {
  return (
    <fieldset className="flex flex-wrap items-center gap-3">
      <legend className="mr-1 text-sm font-medium text-slate-300">Unidade de temperatura</legend>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus-within:ring-2 focus-within:ring-accent-400">
        <input
          checked={unit === 'celsius'}
          className="accent-accent-400"
          name="temperature-unit"
          onChange={() => onChange('celsius')}
          type="radio"
          value="celsius"
        />
        Celsius (°C)
      </label>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus-within:ring-2 focus-within:ring-accent-400">
        <input
          checked={unit === 'fahrenheit'}
          className="accent-accent-400"
          name="temperature-unit"
          onChange={() => onChange('fahrenheit')}
          type="radio"
          value="fahrenheit"
        />
        Fahrenheit (°F)
      </label>
    </fieldset>
  );
}

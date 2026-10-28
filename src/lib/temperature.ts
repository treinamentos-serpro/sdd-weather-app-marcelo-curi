import type { TemperatureUnit } from '../types/weather';

export function unitLabel(unit: TemperatureUnit): string {
  return unit === 'celsius' ? '°C' : '°F';
}

export function formatTemperature(valueC: number | null, unit: TemperatureUnit): string | null {
  const converted = convertTemperature(valueC, 'celsius', unit);
  return converted === null ? null : `${converted}${unitLabel(unit)}`;
}

export function roundTemperature(value: number): number {
  return Math.sign(value) * Math.floor(Math.abs(value) + 0.5);
}

export function convertTemperature(
  value: number | null,
  fromUnit: TemperatureUnit,
  toUnit: TemperatureUnit,
): number | null {
  if (value === null) {
    return null;
  }

  const converted =
    fromUnit === toUnit
      ? value
      : fromUnit === 'celsius'
        ? (value * 9) / 5 + 32
        : ((value - 32) * 5) / 9;

  return roundTemperature(converted);
}

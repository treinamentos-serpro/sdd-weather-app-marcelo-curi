import { describe, expect, it } from 'vitest';
import {
  convertTemperature,
  formatTemperature,
  roundTemperature,
  unitLabel,
} from '../../src/lib/temperature';

describe('convertTemperature', () => {
  it.each([
    [0, 'celsius', 'fahrenheit', 32],
    [100, 'celsius', 'fahrenheit', 212],
    [-40, 'celsius', 'fahrenheit', -40],
    [20, 'celsius', 'fahrenheit', 68],
    [-10, 'celsius', 'fahrenheit', 14],
    [32, 'fahrenheit', 'celsius', 0],
    [-40, 'fahrenheit', 'celsius', -40],
    [212, 'fahrenheit', 'celsius', 100],
    [1.5, 'celsius', 'celsius', 2],
    [-1.5, 'fahrenheit', 'fahrenheit', -2],
    [20, 'celsius', 'celsius', 20],
    [68, 'fahrenheit', 'fahrenheit', 68],
  ] as const)('converts %s %s to %s', (value, from, to, expected) => {
    expect(convertTemperature(value, from, to)).toBe(expected);
  });

  describe('formatTemperature', () => {
    it.each([
      [0, 'celsius', '0°C'],
      [0, 'fahrenheit', '32°F'],
      [1.5, 'celsius', '2°C'],
      [-1.5, 'celsius', '-2°C'],
      [1.4, 'celsius', '1°C'],
      [-1.4, 'celsius', '-1°C'],
      [20.4, 'fahrenheit', '69°F'],
      [-40, 'fahrenheit', '-40°F'],
      [null, 'celsius', null],
      [null, 'fahrenheit', null],
    ] as const)('formats %s in %s as %s', (value, unit, expected) => {
      expect(formatTemperature(value, unit)).toBe(expected);
    });
  });

  describe('unitLabel', () => {
    it.each([
      ['celsius', '°C'],
      ['fahrenheit', '°F'],
    ] as const)('labels %s as %s', (unit, expected) => {
      expect(unitLabel(unit)).toBe(expected);
    });
  });

  it('preserves missing temperatures', () => {
    expect(convertTemperature(null, 'celsius', 'fahrenheit')).toBeNull();
    expect(convertTemperature(null, 'fahrenheit', 'celsius')).toBeNull();
  });

  it.each([
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ])('does not format a non-finite value (%s)', (value) => {
    expect(formatTemperature(value, 'celsius')).toBeNull();
    expect(formatTemperature(value, 'fahrenheit')).toBeNull();
  });

  it('rounds positive and negative ties away from zero', () => {
    expect(roundTemperature(1.5)).toBe(2);
    expect(roundTemperature(-1.5)).toBe(-2);
    expect(convertTemperature(0.8333333333333334, 'celsius', 'fahrenheit')).toBe(34);
    expect(convertTemperature(-1.9444444444444444, 'celsius', 'fahrenheit')).toBe(29);
  });
});

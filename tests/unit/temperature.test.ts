import { describe, expect, it } from 'vitest';
import { convertTemperature, roundTemperature } from '../../src/lib/temperature';

describe('convertTemperature', () => {
  it.each([
    [0, 'celsius', 'fahrenheit', 32],
    [-40, 'celsius', 'fahrenheit', -40],
    [20, 'celsius', 'fahrenheit', 68],
    [-10, 'celsius', 'fahrenheit', 14],
    [32, 'fahrenheit', 'celsius', 0],
    [-40, 'fahrenheit', 'celsius', -40],
  ] as const)('converts %s %s to %s', (value, from, to, expected) => {
    expect(convertTemperature(value, from, to)).toBe(expected);
  });

  it('preserves missing temperatures', () => {
    expect(convertTemperature(null, 'celsius', 'fahrenheit')).toBeNull();
    expect(convertTemperature(null, 'fahrenheit', 'celsius')).toBeNull();
  });

  it('rounds positive and negative ties away from zero', () => {
    expect(roundTemperature(1.5)).toBe(2);
    expect(roundTemperature(-1.5)).toBe(-2);
    expect(convertTemperature(0.8333333333333334, 'celsius', 'fahrenheit')).toBe(34);
    expect(convertTemperature(-1.9444444444444444, 'celsius', 'fahrenheit')).toBe(29);
  });
});

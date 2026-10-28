import { describe, expect, it } from 'vitest';
import { describeWeatherCode } from '../../src/lib/weatherCodes';

describe('describeWeatherCode', () => {
  it.each([
    [0, 'Céu limpo'],
    [61, 'Chuva fraca'],
    [99, 'Trovoada com granizo intenso'],
  ])('describes known code %i', (code, expected) => {
    expect(describeWeatherCode(code)).toBe(expected);
  });

  it.each([999, -1, null])('returns null for unavailable code %s', (code) => {
    expect(describeWeatherCode(code)).toBeNull();
  });
});

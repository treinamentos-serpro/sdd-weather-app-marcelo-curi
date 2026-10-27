import { describe, expect, it } from 'vitest';
import {
  buildForecastDates,
  describeWeatherCode,
  formatWeatherTimestamp,
  getWindDirection,
  isWeatherStale,
} from '../../src/lib/weather';

describe('formatWeatherTimestamp', () => {
  it('formats in Brazilian Portuguese and includes the city timezone', () => {
    const formatted = formatWeatherTimestamp('2026-03-08T12:00:00Z', 'America/Los_Angeles');
    expect(formatted).toContain('08/03/2026');
    expect(formatted).toContain('05:00');
    expect(formatted).toMatch(/GMT-7|PDT/u);
  });
});

describe('isWeatherStale', () => {
  const referenceTime = new Date('2026-03-08T12:00:00Z');

  it('does not mark data exactly 24 hours old as stale', () => {
    expect(isWeatherStale('2026-03-07T12:00:00Z', referenceTime)).toBe(false);
  });

  it('marks data older than 24 hours as stale', () => {
    expect(isWeatherStale('2026-03-07T11:59:59Z', referenceTime)).toBe(true);
  });

  it('does not infer staleness when the observation time is missing', () => {
    expect(isWeatherStale(null, referenceTime)).toBe(false);
  });
});

describe('buildForecastDates', () => {
  it('builds today and the next four civil days in the requested timezone', () => {
    expect(buildForecastDates(new Date('2026-03-08T12:00:00Z'), 'America/Los_Angeles')).toEqual([
      '2026-03-08',
      '2026-03-09',
      '2026-03-10',
      '2026-03-11',
      '2026-03-12',
    ]);
  });

  it('uses the local date when it differs from UTC', () => {
    expect(buildForecastDates(new Date('2026-03-08T01:00:00Z'), 'America/Los_Angeles')).toEqual([
      '2026-03-07',
      '2026-03-08',
      '2026-03-09',
      '2026-03-10',
      '2026-03-11',
    ]);
  });
});

describe('describeWeatherCode', () => {
  it.each([
    [0, 'Céu limpo'],
    [1, 'Predominantemente limpo'],
    [2, 'Parcialmente nublado'],
    [3, 'Nublado'],
    [45, 'Neblina'],
    [48, 'Neblina com depósito de gelo'],
    [51, 'Garoa fraca'],
    [53, 'Garoa moderada'],
    [55, 'Garoa intensa'],
    [56, 'Garoa congelante fraca'],
    [57, 'Garoa congelante intensa'],
    [61, 'Chuva fraca'],
    [63, 'Chuva moderada'],
    [65, 'Chuva intensa'],
    [66, 'Chuva congelante fraca'],
    [67, 'Chuva congelante intensa'],
    [71, 'Neve fraca'],
    [73, 'Neve moderada'],
    [75, 'Neve intensa'],
    [77, 'Grãos de neve'],
    [80, 'Pancadas de chuva fracas'],
    [81, 'Pancadas de chuva moderadas'],
    [82, 'Pancadas de chuva violentas'],
    [85, 'Pancadas de neve fracas'],
    [86, 'Pancadas de neve intensas'],
    [95, 'Trovoada'],
    [96, 'Trovoada com granizo fraco'],
    [99, 'Trovoada com granizo intenso'],
  ])('describes WMO code %i', (code, description) => {
    expect(describeWeatherCode(code)).toBe(description);
  });

  it('does not invent descriptions for unknown or missing codes', () => {
    expect(describeWeatherCode(999)).toBeNull();
    expect(describeWeatherCode(null)).toBeNull();
  });
});

describe('getWindDirection', () => {
  it.each([
    [0, 'N'],
    [22.5, 'NNE'],
    [45, 'NE'],
    [67.5, 'ENE'],
    [90, 'L'],
    [112.5, 'ESE'],
    [135, 'SE'],
    [157.5, 'SSE'],
    [180, 'S'],
    [202.5, 'SSO'],
    [225, 'SO'],
    [247.5, 'OSO'],
    [270, 'O'],
    [292.5, 'ONO'],
    [315, 'NO'],
    [337.5, 'NNO'],
    [360, 'N'],
  ])('maps %s degrees to %s', (degrees, direction) => {
    expect(getWindDirection(degrees)).toBe(direction);
  });

  it('preserves a missing direction', () => {
    expect(getWindDirection(null)).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { getDayLabel, getShortDate } from '../../src/lib/format';

describe('getDayLabel', () => {
  it.each([
    ['2026-03-08', 0, 'Hoje'],
    ['2026-03-09', 1, 'Amanhã'],
    ['2026-03-10', 2, 'terça-feira'],
    ['2026-03-11', 3, 'quarta-feira'],
    ['2026-03-12', 4, 'quinta-feira'],
    ['2026-03-15', 7, 'domingo'],
  ])('labels %s at index %i as %s', (date, index, expected) => {
    expect(getDayLabel(date, index)).toBe(expected);
  });
});

describe('getShortDate', () => {
  it.each([
    ['2026-03-08', '08/03'],
    ['2026-01-01', '01/01'],
    ['2026-12-31', '31/12'],
    ['2028-02-29', '29/02'],
  ])('formats civil date %s as %s without shifting days', (date, expected) => {
    expect(getShortDate(date)).toBe(expected);
  });
});

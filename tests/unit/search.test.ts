import { describe, expect, it } from 'vitest';
import { normalizeAndValidateSearch } from '../../src/lib/search';

describe('normalizeAndValidateSearch', () => {
  it('normalizes Unicode to NFC and collapses whitespace in qualified queries', () => {
    expect(normalizeAndValidateSearch('  Winston-Salem,  North Carolina,   USA  ')).toEqual({
      normalized: 'Winston-Salem, North Carolina, USA',
      error: null,
    });
  });

  it('requires a non-empty city name', () => {
    expect(normalizeAndValidateSearch(' \t\n ')).toEqual({
      normalized: '',
      error: 'required',
    });
  });

  it.each(["O'Fallon", 'Porto2', 'Lisboa!', 'New_York'])(
    'rejects unsupported characters in %s',
    (input) => {
      expect(normalizeAndValidateSearch(input).error).toBe('invalid');
    },
  );

  it('counts normalized Unicode graphemes and accepts 200 but rejects 201', () => {
    const exactlyTwoHundred = 'e\u0301'.repeat(200);
    const twoHundredAndOne = 'e\u0301'.repeat(201);

    expect(normalizeAndValidateSearch(exactlyTwoHundred)).toEqual({
      normalized: 'é'.repeat(200),
      error: null,
    });
    expect(normalizeAndValidateSearch(twoHundredAndOne)).toEqual({
      normalized: 'é'.repeat(201),
      error: 'too-long',
    });
  });

  it('accepts accented letters after normalization', () => {
    expect(normalizeAndValidateSearch('Águaí')).toEqual({
      normalized: 'Águaí',
      error: null,
    });
  });

  it('accepts hyphens and commas together with geographic qualifiers', () => {
    expect(normalizeAndValidateSearch('Winston-Salem, North Carolina, USA').error).toBeNull();
  });
});

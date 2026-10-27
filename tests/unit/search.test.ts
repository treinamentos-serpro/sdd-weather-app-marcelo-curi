import { describe, expect, it } from 'vitest';
import { normalizeAndValidateSearch } from '../../src/lib/search';

describe('normalizeAndValidateSearch', () => {
  it('normalizes Unicode to NFC and collapses whitespace', () => {
    expect(normalizeAndValidateSearch('  Sa\u0303o   Paulo  ')).toEqual({
      normalized: 'São Paulo',
      error: null,
    });
  });

  it('requires a non-empty city name', () => {
    expect(normalizeAndValidateSearch(' \t\n ')).toEqual({
      normalized: '',
      error: 'required',
    });
  });

  it.each(['Rio-de-Janeiro', "O'Fallon", 'Porto2', 'Lisboa!'])(
    'rejects unsupported characters in %s',
    (input) => {
      expect(normalizeAndValidateSearch(input).error).toBe('invalid');
    },
  );

  it('accepts 199 and 200 graphemes and rejects 201', () => {
    expect(normalizeAndValidateSearch('a'.repeat(199)).error).toBeNull();
    expect(normalizeAndValidateSearch('a'.repeat(200)).error).toBeNull();
    expect(normalizeAndValidateSearch('a'.repeat(201)).error).toBe('too-long');
  });

  it('accepts accented letters after normalization', () => {
    expect(normalizeAndValidateSearch('Águaí')).toEqual({
      normalized: 'Águaí',
      error: null,
    });
  });
});

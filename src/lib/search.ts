import type { SearchError } from '../types/weather';

export interface SearchValidationResult {
  normalized: string;
  error: SearchError | null;
}

export function normalizeAndValidateSearch(input: string): SearchValidationResult {
  const normalized = input.normalize('NFC').trim().replace(/\s+/gu, ' ');

  if (normalized.length === 0) {
    return { normalized, error: 'required' };
  }

  if (!/^[\p{L} ]+$/u.test(normalized)) {
    return { normalized, error: 'invalid' };
  }

  const graphemeCount = Array.from(
    new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(normalized),
  ).length;

  if (graphemeCount > 200) {
    return { normalized, error: 'too-long' };
  }

  return { normalized, error: null };
}

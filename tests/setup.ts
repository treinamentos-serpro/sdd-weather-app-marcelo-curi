import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => {
      throw new Error('Unmocked network request in unit tests.');
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

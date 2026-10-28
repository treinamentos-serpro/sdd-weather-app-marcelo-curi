import { type FormEvent, useState } from 'react';
import type { SearchError, SearchStatus } from '../types/weather';

interface SearchBarProps {
  status: SearchStatus;
  error: SearchError | null;
  onSearch: (query: string) => void | Promise<void>;
}

const validationMessages: Record<SearchError, string> = {
  required: 'Informe o nome da cidade.',
  invalid: 'Use somente letras, espaços, hífen e vírgula no nome da cidade.',
  'too-long': 'O nome da cidade deve ter até 200 caracteres percebidos.',
};

export default function SearchBar({ status, error, onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const isLoading = status === 'loading';
  const validationError = isRequired ? 'required' : error;
  const errorMessage = validationError === null ? null : validationMessages[validationError];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim().length === 0) {
      setIsRequired(true);
      return;
    }
    if (!isLoading) {
      void onSearch(query);
    }
  }

  return (
    <form
      aria-busy={isLoading}
      aria-label="Buscar cidade"
      className="flex w-full flex-col gap-3 sm:flex-row"
      onSubmit={handleSubmit}
      role="search"
    >
      <div className="min-w-0 flex-1">
        <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="city-search">
          Buscar cidade
        </label>
        <input
          autoComplete="off"
          className="w-full rounded-xl border border-white/10 bg-night-800 px-4 py-3 text-white outline-none transition focus:border-accent-400 focus:ring-2 focus:ring-accent-400/40 disabled:opacity-60"
          disabled={isLoading}
          id="city-search"
          aria-describedby={errorMessage === null ? undefined : 'city-search-error'}
          aria-invalid={errorMessage !== null}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsRequired(false);
          }}
          placeholder="Ex.: São Paulo"
          type="search"
          value={query}
        />
        {errorMessage !== null && (
          <p className="mt-2 text-sm text-rose-300" id="city-search-error">
            {errorMessage}
          </p>
        )}
      </div>
      <button
        className="self-end rounded-xl bg-accent-500 px-5 py-3 font-semibold text-night-900 transition hover:bg-accent-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-60 sm:mb-0"
        disabled={isLoading}
        type="submit"
      >
        Buscar
      </button>
      {isLoading && (
        <p className="sr-only" role="status">
          Buscando cidades...
        </p>
      )}
    </form>
  );
}

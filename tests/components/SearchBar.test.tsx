import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SearchBar from '../../src/components/SearchBar';
import type { SearchStatus } from '../../src/types/weather';

function renderSearchBar(
  status: SearchStatus = 'idle',
  error = null as null | 'required' | 'invalid' | 'too-long',
) {
  const onSearch = vi.fn();
  render(<SearchBar error={error} onSearch={onSearch} status={status} />);
  return { onSearch, input: screen.getByRole('searchbox', { name: 'Buscar cidade' }) };
}

describe('SearchBar', () => {
  it.each(['', '   '])('does not submit an empty query %j and explains why', async (value) => {
    const user = userEvent.setup();
    const { input, onSearch } = renderSearchBar();
    if (value) await user.type(input, value);
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(onSearch).not.toHaveBeenCalled();
    expect(input).toHaveAccessibleDescription('Informe o nome da cidade.');
    expect(input).toHaveAttribute('aria-invalid', 'true');

    await user.type(input, 'Lisboa');
    expect(input).toHaveAttribute('aria-invalid', 'false');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(onSearch).toHaveBeenCalledWith(`${value}Lisboa`);
  });

  it('submits once with Enter and does not search while typing', async () => {
    const user = userEvent.setup();
    const { input, onSearch } = renderSearchBar();

    await user.type(input, 'São Paulo');
    expect(onSearch).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('São Paulo');
  });

  it('submits once with the accessible button', async () => {
    const user = userEvent.setup();
    const { input, onSearch } = renderSearchBar();
    await user.type(input, 'Lisboa');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('Lisboa');
  });

  it.each([
    ['required', 'Informe o nome da cidade.'],
    ['invalid', 'Use somente letras e espaços no nome da cidade.'],
    ['too-long', 'O nome da cidade deve ter até 200 caracteres.'],
  ] as const)('associates the %s validation message with the input', (error, message) => {
    const { input } = renderSearchBar('idle', error);
    expect(screen.getByText(message)).toHaveAttribute('id', 'city-search-error');
    expect(input).toHaveAttribute('aria-describedby', 'city-search-error');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('exposes loading and prevents duplicate submission', async () => {
    const user = userEvent.setup();
    const { input, onSearch } = renderSearchBar('loading');

    expect(screen.getByRole('status')).toHaveTextContent('Buscando cidades');
    expect(input).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    fireEvent.submit(input.closest('form')!);
    await user.keyboard('{Enter}');
    expect(onSearch).not.toHaveBeenCalled();
  });
});

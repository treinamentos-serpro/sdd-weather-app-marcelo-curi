import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import EmptyState from '../../src/components/states/EmptyState';
import ErrorState from '../../src/components/states/ErrorState';

describe('search states', () => {
  it('shows the empty result without a network error', () => {
    render(<EmptyState />);
    expect(screen.getByRole('status')).toHaveTextContent('Cidade inexistente');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each([
    ['network', 'conectar'],
    ['provider', 'serviço de busca'],
    ['timeout', 'demorou'],
  ] as const)('shows a distinct %s message and waits for manual retry', async (error, text) => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState context="search" error={error} onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent(text);
    expect(onRetry).not.toHaveBeenCalled();
    await user.keyboard('{Tab}');
    await user.keyboard('{Enter}');
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

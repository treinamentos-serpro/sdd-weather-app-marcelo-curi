import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import EmptyState from '../../src/components/states/EmptyState';
import ErrorState from '../../src/components/states/ErrorState';
import type { WeatherSnapshot } from '../../src/types/weather';

const previousSnapshot: WeatherSnapshot = {
  city: {
    id: 1,
    name: 'Lisboa',
    latitude: 38.7,
    longitude: -9.1,
    country: 'Portugal',
    timezone: 'Europe/Lisbon',
  },
  current: {
    temperatureC: 20,
    conditionCode: 1,
    dailyMinimumC: null,
    dailyMaximumC: null,
    precipitationProbabilityPercent: null,
    windSpeedKmh: null,
    windDirectionDegrees: null,
  },
  days: [],
  fetchedAt: '2026-03-08T12:00:00.000Z',
  sourceValidAt: '2026-03-08T11:00:00.000Z',
};

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

  it.each([
    ['network', 'conectar'],
    ['provider', 'resposta inválida'],
    ['timeout', 'demorou'],
    ['unavailable', 'indisponíveis'],
  ] as const)('shows a distinct weather %s error with the previous snapshot', (error, text) => {
    render(
      <ErrorState context="weather" error={error} onRetry={vi.fn()} snapshot={previousSnapshot} />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(text);
    expect(screen.getByRole('alert')).toHaveTextContent('Lisboa');
    expect(screen.getByRole('alert')).toHaveTextContent('08/03/2026');
  });
});

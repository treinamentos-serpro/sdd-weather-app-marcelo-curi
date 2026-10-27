import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ForecastList from '../../src/components/ForecastList';
import type { ForecastDay } from '../../src/types/weather';

const days: ForecastDay[] = Array.from({ length: 5 }, (_, index) => ({
  date: `2026-03-${String(index + 8).padStart(2, '0')}`,
  meanTemperatureC: index === 2 ? null : 18 + index,
  minimumC: 12 + index,
  maximumC: 22 + index,
  conditionCode: index === 1 ? null : 1,
  precipitationProbabilityPercent: index === 3 ? null : index * 10,
  windSpeedKmh: index === 4 ? null : 10 + index,
  windDirectionDegrees: index === 4 ? null : 90,
}));

describe('ForecastList', () => {
  it('renders exactly five cards in the incoming date order with available fields', () => {
    render(<ForecastList days={days} unit="celsius" />);

    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(5);
    expect(cards.map((card) => card.getAttribute('aria-label'))).toEqual(
      days.map((day) => `Previsão para ${day.date}`),
    );
    expect(screen.getAllByText('Condição')).toHaveLength(4);
    expect(screen.getAllByText('Média')).toHaveLength(4);
    expect(screen.getAllByText('Chuva')).toHaveLength(4);
    expect(screen.getAllByText('Vento')).toHaveLength(4);
    expect(screen.queryByText('null')).not.toBeInTheDocument();
  });

  it('renders no forecast metrics without a snapshot', () => {
    const { container } = render(<ForecastList days={null} unit="celsius" />);
    expect(container).toBeEmptyDOMElement();
  });
});

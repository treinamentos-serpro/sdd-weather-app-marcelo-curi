import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import type { WeatherSnapshot } from '../../src/types/weather';

const snapshot: WeatherSnapshot = {
  city: {
    id: 1,
    name: 'Los Angeles',
    latitude: 34.05,
    longitude: -118.24,
    country: 'Estados Unidos',
    admin1: 'Califórnia',
    timezone: 'America/Los_Angeles',
  },
  current: {
    temperatureC: 20,
    conditionCode: 2,
    dailyMinimumC: 15,
    dailyMaximumC: 25,
    precipitationProbabilityPercent: 35,
    windSpeedKmh: 12,
    windDirectionDegrees: 270,
  },
  days: [],
  fetchedAt: '2026-03-08T12:00:00.000Z',
  sourceValidAt: '2026-03-08T11:00:00.000Z',
};

afterEach(() => {
  vi.useRealTimers();
});

describe('CurrentWeather', () => {
  it('renders every available current metric with local time and timezone', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-08T13:00:00Z'));
    render(
      <CurrentWeather
        isIncomplete={false}
        onRefresh={vi.fn()}
        snapshot={snapshot}
        status="success"
        unit="celsius"
      />,
    );

    const region = screen.getByRole('region', { name: 'Condições atuais de Los Angeles' });
    expect(region).toHaveTextContent('20°C');
    expect(region).toHaveTextContent('Parcialmente nublado');
    expect(region).toHaveTextContent('15°C');
    expect(region).toHaveTextContent('25°C');
    expect(region).toHaveTextContent('35%');
    expect(region).toHaveTextContent('12 km/h');
    expect(region).toHaveTextContent('O');
    expect(region).toHaveTextContent('08/03/2026');
    expect(region).toHaveTextContent('05:00 GMT-7');
    expect(region).not.toHaveTextContent('Dados meteorológicos desatualizados');
  });

  it('leaves null measurements blank and preserves other fields', () => {
    render(
      <CurrentWeather
        isIncomplete
        onRefresh={vi.fn()}
        snapshot={{
          ...snapshot,
          current: {
            ...snapshot.current,
            temperatureC: null,
            dailyMinimumC: null,
            precipitationProbabilityPercent: null,
            windDirectionDegrees: null,
          },
        }}
        status="success"
        unit="celsius"
      />,
    );

    const region = screen.getByRole('region', { name: 'Condições atuais de Los Angeles' });
    expect(within(region).queryByText('20°C')).not.toBeInTheDocument();
    expect(within(region).queryByText('Mínima do dia')).not.toBeInTheDocument();
    expect(within(region).queryByText('35%')).not.toBeInTheDocument();
    expect(within(region).queryByText('O')).not.toBeInTheDocument();
    expect(region).toHaveTextContent('Parcialmente nublado');
    expect(region).toHaveTextContent('25°C');
    expect(region).toHaveTextContent('Algumas condições não estão disponíveis');
  });

  it('renders no metrics without a snapshot and marks observations over 24 hours old', () => {
    const empty = render(
      <CurrentWeather
        isIncomplete={false}
        onRefresh={vi.fn()}
        snapshot={null}
        status="idle"
        unit="celsius"
      />,
    );
    expect(empty.container).toBeEmptyDOMElement();

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-08T12:00:00Z'));
    render(
      <CurrentWeather
        isIncomplete={false}
        onRefresh={vi.fn()}
        snapshot={{ ...snapshot, sourceValidAt: '2026-03-07T11:59:59Z' }}
        status="success"
        unit="celsius"
      />,
    );
    expect(screen.getByText('Dados meteorológicos desatualizados.')).toBeInTheDocument();
  });

  it('does not mark an observation exactly 24 hours old as stale', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-08T12:00:00Z'));
    render(
      <CurrentWeather
        isIncomplete={false}
        onRefresh={vi.fn()}
        snapshot={{ ...snapshot, sourceValidAt: '2026-03-07T12:00:00Z' }}
        status="success"
        unit="celsius"
      />,
    );
    expect(screen.queryByText('Dados meteorológicos desatualizados.')).not.toBeInTheDocument();
  });
});

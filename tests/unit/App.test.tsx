import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { getWeather, searchCities } from '../../src/services/weatherService';
import type { City, WeatherSnapshot } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', () => ({
  getWeather: vi.fn(),
  searchCities: vi.fn(),
  WeatherServiceError: class WeatherServiceError extends Error {
    constructor(readonly category: string) {
      super(category);
    }
  },
}));

const city: City = {
  id: 1,
  name: 'Lisboa',
  latitude: 38.7,
  longitude: -9.1,
  country: 'Portugal',
  timezone: 'Europe/Lisbon',
};

const snapshot: WeatherSnapshot = {
  city,
  current: {
    temperatureC: 20,
    conditionCode: 0,
    dailyMinimumC: 15,
    dailyMaximumC: 23,
    precipitationProbabilityPercent: 0,
    windSpeedKmh: 10,
    windDirectionDegrees: 90,
  },
  days: Array.from({ length: 5 }, (_, index) => ({
    date: `2026-03-${String(index + 8).padStart(2, '0')}`,
    meanTemperatureC: 20,
    minimumC: index === 2 ? null : 15,
    maximumC: 23,
    conditionCode: 0,
    precipitationProbabilityPercent: 0,
    windSpeedKmh: 10,
    windDirectionDegrees: 90,
  })),
  fetchedAt: '2026-03-08T12:00:00.000Z',
  sourceValidAt: '2026-03-08T11:00:00.000Z',
};

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('does not send automatic telemetry requests on mount', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('searches, requires explicit city selection, and renders the weather without login', async () => {
    const user = userEvent.setup();
    vi.mocked(searchCities).mockResolvedValue([city]);
    vi.mocked(getWeather).mockResolvedValue(snapshot);
    render(<App />);

    await user.type(screen.getByRole('searchbox', { name: 'Buscar cidade' }), 'Lisboa');
    expect(searchCities).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    await screen.findByRole('button', { name: 'Lisboa (Portugal)' });
    expect(getWeather).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Lisboa (Portugal)' }));
    const currentConditions = await screen.findByRole('region', {
      name: 'Condições atuais de Lisboa',
    });

    expect(getWeather).toHaveBeenCalledTimes(1);
    expect(getWeather).toHaveBeenCalledWith(city, expect.any(AbortSignal));
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(within(currentConditions).getByText('20°C')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open-Meteo' })).toHaveAttribute(
      'href',
      'https://open-meteo.com/',
    );
  });

  it('changes the displayed unit without a new weather request', async () => {
    const user = userEvent.setup();
    vi.mocked(searchCities).mockResolvedValue([city]);
    vi.mocked(getWeather).mockResolvedValue(snapshot);
    render(<App />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar cidade' }), {
      target: { value: 'Lisboa' },
    });
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    await user.click(await screen.findByRole('button', { name: 'Lisboa (Portugal)' }));
    const currentConditions = await screen.findByRole('region', {
      name: 'Condições atuais de Lisboa',
    });
    await waitFor(() => expect(within(currentConditions).getByText('20°C')).toBeInTheDocument());

    await user.click(screen.getByRole('radio', { name: 'Fahrenheit (°F)' }));
    expect(within(currentConditions).getByText('68°F')).toBeInTheDocument();
    expect(within(currentConditions).getByText('59°F')).toBeInTheDocument();
    expect(within(currentConditions).getByText('73°F')).toBeInTheDocument();
    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(5);
    for (const card of cards) {
      expect(within(card).getByText('68°F')).toBeInTheDocument();
    }
    expect(within(cards[2]!).queryByText('Mínima')).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Fahrenheit (°F)' })).toBeChecked();

    await user.click(screen.getByRole('radio', { name: 'Celsius (°C)' }));
    expect(within(currentConditions).getByText('20°C')).toBeInTheDocument();
    expect(within(cards[0]!).getByText('20°C')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Celsius (°C)' })).toBeChecked();
    expect(getWeather).toHaveBeenCalledTimes(1);
  });
});

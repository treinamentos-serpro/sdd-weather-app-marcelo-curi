import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CityResults from '../../src/components/CityResults';
import type { City } from '../../src/types/weather';

const cities: City[] = [
  {
    id: 1,
    name: 'Springfield',
    latitude: 39.8,
    longitude: -89.6,
    country: 'United States',
    admin1: 'Illinois',
    timezone: 'America/Chicago',
  },
  {
    id: 2,
    name: 'Springfield',
    latitude: 42.1,
    longitude: -72.6,
    country: 'United States',
    admin1: 'Massachusetts',
    timezone: 'America/New_York',
  },
];

describe('CityResults', () => {
  it('shows qualifiers and waits for explicit keyboard selection', async () => {
    const user = userEvent.setup();
    const onSelectCity = vi.fn();
    render(<CityResults cities={cities} onSelectCity={onSelectCity} />);

    const firstOption = screen.getByRole('button', {
      name: 'Springfield, Illinois, United States',
    });
    expect(screen.getByText('Massachusetts, United States')).toBeInTheDocument();
    expect(onSelectCity).not.toHaveBeenCalled();

    firstOption.focus();
    await user.keyboard('{Enter}');
    expect(onSelectCity).toHaveBeenCalledTimes(1);
    expect(onSelectCity).toHaveBeenCalledWith(cities[0]);
  });

  it('does not make identical displayed locations selectable', () => {
    const onSelectCity = vi.fn();
    const duplicates: City[] = [cities[0]!, { ...cities[0]!, id: 3, latitude: 40 }];
    render(<CityResults cities={duplicates} onSelectCity={onSelectCity} />);

    expect(screen.getByRole('status')).toHaveTextContent('Refine a busca');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(onSelectCity).not.toHaveBeenCalled();
  });

  it('supports Space to activate a result', async () => {
    const user = userEvent.setup();
    const onSelectCity = vi.fn();
    render(<CityResults cities={[cities[0]!]} onSelectCity={onSelectCity} />);

    screen.getByRole('button', { name: 'Springfield, Illinois, United States' }).focus();
    await user.keyboard(' ');
    expect(onSelectCity).toHaveBeenCalledWith(cities[0]);
  });
});

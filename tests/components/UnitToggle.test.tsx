import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import UnitToggle from '../../src/components/UnitToggle';

describe('UnitToggle', () => {
  it('exposes Celsius and Fahrenheit radios with the initial selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<UnitToggle onChange={onChange} unit="celsius" />);

    expect(screen.getByRole('radio', { name: 'Celsius (°C)' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Fahrenheit (°F)' })).not.toBeChecked();
    await user.click(screen.getByRole('radio', { name: 'Fahrenheit (°F)' }));
    expect(onChange).toHaveBeenCalledWith('fahrenheit');
  });
});

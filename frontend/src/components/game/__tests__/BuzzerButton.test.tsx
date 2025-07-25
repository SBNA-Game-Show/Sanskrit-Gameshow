import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BuzzerButton from '../BuzzerButton';
import { MemoryRouter } from "react-router-dom";
import { act } from 'react';

describe('BuzzerButton', () => {
  it('renders and calls onBuzz when clicked', () => {
    const onBuzz = jest.fn();
    render(
      <MemoryRouter>
        <BuzzerButton onBuzz={onBuzz} />
      </MemoryRouter>
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(onBuzz).toHaveBeenCalled();
  });

  it('shows loading state when loading is true', () => {
    render(
      <MemoryRouter>
        <BuzzerButton onBuzz={() => {}} loading />
      </MemoryRouter>
    );
    expect(screen.getByText(/buzzing/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

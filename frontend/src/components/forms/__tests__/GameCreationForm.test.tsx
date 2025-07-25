import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';  // <-- Import MemoryRouter
import GameCreationForm from '../GameCreationForm';

describe('GameCreationForm', () => {
  it('renders and calls onCreateGame when button is clicked', () => {
    const handleCreate = jest.fn();
    render(
      <MemoryRouter>
        <GameCreationForm onCreateGame={handleCreate} isLoading={false} />
      </MemoryRouter>
    );
    const button = screen.getByRole('button', { name: /create game/i });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(handleCreate).toHaveBeenCalled();
  });

  it('shows loading state when isLoading is true', () => {
    render(
      <MemoryRouter>
        <GameCreationForm onCreateGame={() => {}} isLoading={true} />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /creating/i })).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import JoinGameForm from '../JoinGameForm';
import { MemoryRouter } from 'react-router-dom';

describe('JoinGameForm', () => {
  const defaultProps = {
    gameCode: 'ABC123',
    playerName: 'Alice',
    onGameCodeChange: jest.fn(),
    onPlayerNameChange: jest.fn(),
    onJoinGame: jest.fn(),
    isLoading: false,
    error: undefined,
  };

  it('renders inputs and join button', () => {
    render(
      <MemoryRouter>
        <JoinGameForm {...defaultProps} />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/game code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /join game/i })).toBeInTheDocument();
  });

  it('shows error message if error prop is set', () => {
    render(
      <MemoryRouter>
        <JoinGameForm {...defaultProps} error="Some error" />
      </MemoryRouter>
    );

    expect(screen.getByText('Some error')).toBeInTheDocument();
  });

  it('calls onJoinGame when button is clicked', () => {
    render(
      <MemoryRouter>
        <JoinGameForm {...defaultProps} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /join game/i }));
    expect(defaultProps.onJoinGame).toHaveBeenCalled();
  });
});

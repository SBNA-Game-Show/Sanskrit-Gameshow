import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import GameResults from '../GameResults';
import { Team } from '../../../types';

describe('GameResults', () => {
  const teams: Team[] = [
    { id: 't1', name: 'Red', members: ['Alice'], score: 20, active: false, roundScores: [10, 5, 5], currentRoundScore: 0 },
    { id: 't2', name: 'Blue', members: ['Bob'], score: 10, active: false, roundScores: [5, 3, 2], currentRoundScore: 0 },
  ];

  const renderWithRouter = (ui: React.ReactNode) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  it('renders winner and team names', () => {
    renderWithRouter(<GameResults teams={teams} />);
    expect(screen.getByText(/FINAL RESULTS/)).toBeInTheDocument();

    // Use getAllByText and check at least one exists to avoid multiple element error
    expect(screen.getAllByText('Red').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Blue').length).toBeGreaterThan(0);
  });

  it('calls onCreateNewGame when button is clicked', () => {
    const onCreateNewGame = jest.fn();
    renderWithRouter(<GameResults teams={teams} onCreateNewGame={onCreateNewGame} showCreateNewGame />);
    fireEvent.click(screen.getByRole('button', { name: /create new game/i }));
    expect(onCreateNewGame).toHaveBeenCalled();
  });
});

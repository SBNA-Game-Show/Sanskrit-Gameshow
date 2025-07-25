import React from 'react';
import { render, screen } from '@testing-library/react';
import PlayerStatus from '../PlayerStatus';
import { Team } from '../../../types';
import { MemoryRouter } from 'react-router-dom';

describe('PlayerStatus', () => {
  const team: Team = {
    id: 't1',
    name: 'Red',
    members: ['Alice'],
    score: 10,
    active: true,
    roundScores: [5, 3, 2],
    currentRoundScore: 5,
  };

  it('renders player name and team info with StatusIndicator text', () => {
    render(
      <MemoryRouter>
        <PlayerStatus playerName="Alice" team={team} isActiveTeam={true} />
      </MemoryRouter>
    );

    // Player name shown
    expect(screen.getByText('Alice')).toBeInTheDocument();

    // Team name and round points displayed correctly
    expect(screen.getByText(/Red/)).toBeInTheDocument();
    expect(screen.getByText(/Round Points: 5/)).toBeInTheDocument();

    // Total score displayed correctly
    expect(screen.getByText(/Total Game Score: 10/)).toBeInTheDocument();

    // Check for StatusIndicator text for active team (e.g., "Your Turn")
    expect(screen.getByText(/Your Turn/i)).toBeInTheDocument();
  });

  it('handles null team gracefully and shows "Waiting" status', () => {
    render(
      <MemoryRouter>
        <PlayerStatus playerName="Bob" team={null} isActiveTeam={false} />
      </MemoryRouter>
    );

    expect(screen.getByText('Bob')).toBeInTheDocument();

    // Defaults 0 points
    expect(screen.getByText(/Round Points: 0/)).toBeInTheDocument();
    expect(screen.getByText(/Total Game Score: 0/)).toBeInTheDocument();

    // Check for StatusIndicator text for inactive team (e.g., "Waiting")
    expect(screen.getByText(/Waiting/i)).toBeInTheDocument();
  });
});

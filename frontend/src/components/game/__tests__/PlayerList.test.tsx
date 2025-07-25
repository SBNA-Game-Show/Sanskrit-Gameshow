import React from 'react';
import { render, screen } from '@testing-library/react';
import PlayerList from '../PlayerList';
import { Player, Team } from '../../../types';
import { MemoryRouter } from 'react-router-dom';  // imported MemoryRouter
import { act } from 'react';
describe('PlayerList', () => {
  const players: Player[] = [
    { id: '1', name: 'Alice', gameCode: '123', connected: true, teamId: 't1' },
    { id: '2', name: 'Bob', gameCode: '123', connected: true },
  ];
  const teams: Team[] = [
    { id: 't1', name: 'Red', members: ['Alice'], score: 0, active: false, roundScores: [0,0,0], currentRoundScore: 0 },
    { id: 't2', name: 'Blue', members: ['Bob'], score: 0, active: false, roundScores: [0,0,0], currentRoundScore: 0 },
  ];

  it('renders player names and highlights current player', () => {
    render(
      <MemoryRouter>
        <PlayerList players={players} teams={teams} currentPlayerId="1" />
      </MemoryRouter>
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Alice').nextSibling).toBeTruthy();
  });

  it('shows team names for players with teamId', () => {
    render(
      <MemoryRouter>
        <PlayerList players={players} teams={teams} />
      </MemoryRouter>
    );
    expect(screen.getByText('Red')).toBeInTheDocument();
  });
});

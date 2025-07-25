import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TeamSelection from '../TeamSelection';
import { Team } from '../../../types';
import { MemoryRouter } from "react-router-dom";
import { act } from 'react';

// Test suite for TeamSelection
// This checks rendering of teams, selection, and joined state

describe('TeamSelection', () => {
  // Provide all required Team properties for the test
  const teams: Team[] = [
    {
      id: '1',
      name: 'Red',
      members: ['Alice', 'Bob'],
      score: 0,
      active: false,
      roundScores: [0, 0, 0],
      currentRoundScore: 0,
    },
    {
      id: '2',
      name: 'Blue',
      members: ['Charlie'],
      score: 0,
      active: false,
      roundScores: [0, 0, 0],
      currentRoundScore: 0,
    },
  ];
  const playerName = 'Alice';
  const onSelectTeam = jest.fn();

  it('renders team buttons and handles selection', () => {
    render(
      <TeamSelection
        teams={teams}
        selectedTeamId={undefined}
        onSelectTeam={onSelectTeam}
        playerName={playerName}
      />
    );
    // Team names should be present
    expect(screen.getByText('Red')).toBeInTheDocument();
    expect(screen.getByText('Blue')).toBeInTheDocument();
    // Simulate click on Red team
    fireEvent.click(screen.getByText('Red'));
    expect(onSelectTeam).toHaveBeenCalledWith('1');
  });

  it('shows joined state when selectedTeamId is set', () => {
    render(
      <TeamSelection
        teams={teams}
        selectedTeamId={'1'}
        onSelectTeam={onSelectTeam}
        playerName={playerName}
      />
    );
    // Should show joined message
    expect(screen.getByText(/you've joined/i)).toBeInTheDocument();
    expect(screen.getByText(/waiting for the host/i)).toBeInTheDocument();
  });
}); 
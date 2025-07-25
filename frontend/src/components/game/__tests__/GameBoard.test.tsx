import React from 'react';
import { render, screen } from '@testing-library/react';
import GameBoard from '../GameBoard';
import { Game } from '../../../types';
import { MemoryRouter } from "react-router-dom";
import { act } from 'react';

// Test suite for GameBoard
// Checks rendering of question, round, and no question case

describe('GameBoard', () => {
  const game: Game = {
    id: 'g1',
    code: '123',
    status: 'active',
    currentQuestionIndex: 0,
    currentRound: 1,
    questions: [
      {
        id: 1,
        round: 1,
        teamAssignment: 'team1',
        questionNumber: 1,
        category: 'General',
        question: 'What is 2+2?',
        answers: [
          { text: '4', points: 10, revealed: false },
          { text: '3', points: 5, revealed: false },
          { text: '2', points: 2, revealed: false },
        ],
      },
    ],
    teams: [],
    players: [],
    hostId: null,
    createdAt: new Date(),
    gameState: {
      currentTurn: null,
      questionsAnswered: { team1: 0, team2: 0 },
      roundScores: { round1: { team1: 0, team2: 0 }, round2: { team1: 0, team2: 0 }, round3: { team1: 0, team2: 0 } },
      awaitingAnswer: false,
      canAdvance: false,
      currentQuestionAttempts: 0,
      maxAttemptsPerQuestion: 3,
      questionData: { team1: { round1: [], round2: [], round3: [] }, team2: { round1: [], round2: [], round3: [] } },
    },
  };

  it('renders question and round info', () => {
    render(<GameBoard game={game} />);
    expect(screen.getByText(/What is 2\+2/)).toBeInTheDocument();
    expect(screen.getByText(/Round 1/)).toBeInTheDocument();
  });

  it('shows no question available if no current question', () => {
    const gameNoQ = { ...game, questions: [] };
    render(<GameBoard game={gameNoQ as Game} />);
    expect(screen.getByText(/No question available/)).toBeInTheDocument();
  });
}); 
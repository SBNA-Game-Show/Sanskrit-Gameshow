import { test, expect } from '@playwright/test';
import { 
  generateGameCode, 
  initializeQuestionData,
  createGame,
  startGame,
  joinGame,
  getGame,
  getPlayer,           
  updatePlayer,
  submitAnswer,
  checkAnswerMatch,
  updateGame,
  advanceGameState,
  updateTeamActiveStatus,
  isRoundComplete,
  getCurrentQuestion,
  getGameWinner,
  continueToNextRound,
  cleanupOldGames,
  getGameStats,
  games,
  players,
  updateQuestionData,
  overrideQuestionData
} from '../../server/services/gameService.js';

// Helper functions with proper typing
function clearGames() {
  const gameKeys = Object.keys(games) as (keyof typeof games)[];
  gameKeys.forEach(key => delete games[key]);
}

function clearPlayers() {
  const playerKeys = Object.keys(players) as (keyof typeof players)[];
  playerKeys.forEach(key => delete players[key]);
}

function resetGameState() {
  clearGames();
  clearPlayers();
}

// Reset state before each test
test.beforeEach(() => {
  resetGameState();
});

test.describe('Game Service Core Functions', () => {
  test('generateGameCode should create valid game codes', () => {
    const code1 = generateGameCode();
    const code2 = generateGameCode();
    
    expect(code1).toMatch(/^[A-Z0-9]{6}$/);
    expect(code2).toMatch(/^[A-Z0-9]{6}$/);
    expect(code1).not.toBe(code2);
  });

  test('initializeQuestionData should create proper structure', () => {
    const questionData = initializeQuestionData();
    
    expect(questionData).toHaveProperty('team1');
    expect(questionData).toHaveProperty('team2');
    
    // Fix: Use type assertion for round keys
    const rounds = ['round1', 'round2', 'round3'] as const;
    
    rounds.forEach(round => {
      // Use type-safe property access with type assertion
      const team1Data = questionData.team1 as any;
      const team2Data = questionData.team2 as any;
      
      expect(team1Data[round]).toHaveLength(3);
      expect(team2Data[round]).toHaveLength(3);
      
      team1Data[round].forEach((question: any, index: number) => {
        expect(question).toEqual({
          firstAttemptCorrect: null,
          pointsEarned: 0
        });
      });
    });
  });

  test('createGame should initialize game with correct structure', async () => {
    const mockQuestions = [
      { _id: 'q1', question: 'Test Q1', round: 1, teamAssignment: 'team1', questionNumber: 1, answers: [] },
      { _id: 'q2', question: 'Test Q2', round: 1, teamAssignment: 'team2', questionNumber: 1, answers: [] }
    ];
    const mockTossUp = { _id: 'toss1', question: 'Toss Up', answers: [] };
    const teamNames = { team1: 'Team Alpha', team2: 'Team Beta' };

    const result = await createGame(mockQuestions, mockTossUp, teamNames);
    
    // Updated assertion - result now contains game object directly
    expect(result).toHaveProperty('game');
    expect(result.game).toHaveProperty('code');
    expect(result.game).toHaveProperty('id');
    
    const game = result.game;
    expect(game.code).toMatch(/^[A-Z0-9]{6}$/);
    expect(game.status).toBe('waiting');
    expect(game.teams).toHaveLength(2);
    expect(game.teams[0].name).toBe('Team Alpha');
    expect(game.teams[1].name).toBe('Team Beta');
    expect(game.gameState.tossUpQuestion).toEqual(mockTossUp);
    expect(game.questions).toEqual(mockQuestions);
  });

  test('startGame should activate game and set initial state', async () => {
    const mockQuestions = [
      { _id: 'q1', question: 'Test Q1', round: 1, teamAssignment: 'team1', questionNumber: 1, answers: [] }
    ];
    const mockTossUp = { _id: 'toss1', question: 'Toss Up', answers: [] };
    
    const result = await createGame(mockQuestions, mockTossUp, { team1: 'Team A', team2: 'Team B' });
    const gameCode = result.game.code;
    
    const game = startGame(gameCode);
    
    expect(game!.status).toBe('active');
    expect(game!.gameState.currentTurn).toBeNull();
    expect(game!.gameState.awaitingAnswer).toBe(true);
  });
});

test.describe('Player Management', () => {
  test('joinGame should add player to game', async () => {
    // Create a game first
    const mockQuestions: any[] = [];
    const mockTossUp = { _id: 'toss1', question: 'Toss Up', answers: [] };
    const result = await createGame(mockQuestions, mockTossUp, { team1: 'Team Alpha', team2: 'Team Beta' });
    const gameCode = result.game.code;
    
    // Join the game
    const joinResult = joinGame(gameCode, 'TestPlayer');
    
    // Verify join result
    expect(joinResult).toHaveProperty('playerId');
    expect(joinResult).toHaveProperty('game');
    
    // Verify game state was updated
    const game = getGame(gameCode);
    expect(game!.players).toHaveLength(1);
    expect(game!.players[0].name).toBe('TestPlayer');
    
    // Verify players storage was updated
    const player = getPlayer(joinResult.playerId!);
    expect(player!.name).toBe('TestPlayer');
    expect(player!.gameCode).toBe(gameCode);
  });

  test('joinGame should throw error for invalid game code', () => {
    expect(() => {
      joinGame('INVALID', 'TestPlayer');
    }).toThrow('Game not found');
  });

  test('getGame should return correct game', async () => {
    // Create a game first
    const mockQuestions: any[] = [];
    const mockTossUp = { _id: 'toss1', question: 'Toss Up', answers: [] };
    const result = await createGame(mockQuestions, mockTossUp, { team1: 'Team A', team2: 'Team B' });
    const gameCode = result.game.code;
    
    // Test getting valid game
    const game = getGame(gameCode);
    expect(game).toBeDefined();
    expect(game!.code).toBe(gameCode);
    expect(game!.status).toBe('waiting');
    
    // Test getting invalid game
    const invalidGame = getGame('INVALID');
    expect(invalidGame).toBeNull();
  });

  test('getPlayer should return correct player', async () => {
    // Create a game and join a player
    const mockQuestions: any[] = [];
    const mockTossUp = { _id: 'toss1', question: 'Toss Up', answers: [] };
    const result = await createGame(mockQuestions, mockTossUp, { team1: 'Team One', team2: 'Team Two' });
    const gameCode = result.game.code;
    const joinResult = joinGame(gameCode, 'TestPlayer');
    const { playerId } = joinResult;
    
    // Test getting valid player
    const player = getPlayer(playerId!);
    expect(player).toBeDefined();
    expect(player!.name).toBe('TestPlayer');
    expect(player!.gameCode).toBe(gameCode);
    
    // Test getting invalid player
    const invalidPlayer = getPlayer('INVALID_PLAYER');
    expect(invalidPlayer).toBeNull();
  });

  test('multiple players can join the same game', async () => {
    const mockQuestions: any[] = [];
    const mockTossUp = { _id: 'toss1', question: 'Toss Up', answers: [] };
    const result = await createGame(mockQuestions, mockTossUp, { team1: 'Red Team', team2: 'Blue Team' });
    const gameCode = result.game.code;
    
    // Join multiple players
    const player1Result = joinGame(gameCode, 'Player1');
    const player2Result = joinGame(gameCode, 'Player2');
    const player3Result = joinGame(gameCode, 'Player3');
    
    // Verify all players were added to the game
    const game = getGame(gameCode);
    expect(game!.players).toHaveLength(3);
    expect(game!.players.map((p: any) => p.name)).toEqual(['Player1', 'Player2', 'Player3']);
    
    // Verify all players exist in players storage using getPlayer
    expect(getPlayer(player1Result.playerId!)!.name).toBe('Player1');
    expect(getPlayer(player2Result.playerId!)!.name).toBe('Player2');
    expect(getPlayer(player3Result.playerId!)!.name).toBe('Player3');
  });

  test('player should have correct initial state', async () => {
    const mockQuestions: any[] = [];
    const mockTossUp = { _id: 'toss1', question: 'Toss Up', answers: [] };
    const result = await createGame(mockQuestions, mockTossUp, { team1: 'Team X', team2: 'Team Y' });
    const gameCode = result.game.code;
    const joinResult = joinGame(gameCode, 'TestPlayer');
    const { playerId } = joinResult;
    
    const player = getPlayer(playerId!);
    expect(player).toEqual({
      id: playerId,
      name: 'TestPlayer',
      gameCode: gameCode,
      connected: true,
      teamId: null
    });
  });

  test('updatePlayer should modify player properties', async () => {
    const mockQuestions: any[] = [];
    const mockTossUp = { _id: 'toss1', question: 'Toss Up', answers: [] };
    const result = await createGame(mockQuestions, mockTossUp, { team1: 'First Team', team2: 'Second Team' });
    const gameCode = result.game.code;
    const joinResult = joinGame(gameCode, 'TestPlayer');
    const { playerId } = joinResult;
    
    // Update player
    const updatedPlayer = updatePlayer(playerId!, { 
      teamId: 'team1_123', 
      connected: false 
    });
    
    expect(updatedPlayer).toBeDefined();
    expect(updatedPlayer!.name).toBe('TestPlayer');
    expect(updatedPlayer!.teamId).toBe('team1_123');
    expect(updatedPlayer!.connected).toBe(false);
    
    // Verify the update persisted using getPlayer
    const player = getPlayer(playerId!);
    expect(player!.teamId).toBe('team1_123');
    expect(player!.connected).toBe(false);
  });

  test('updatePlayer should return null for invalid player ID', () => {
    const result = updatePlayer('INVALID_PLAYER', { connected: false });
    expect(result).toBeNull();
  });

  test('players should be assigned unique IDs', async () => {
    const mockQuestions: any[] = [];
    const mockTossUp = { _id: 'toss1', question: 'Toss Up', answers: [] };
    const result = await createGame(mockQuestions, mockTossUp, { team1: 'Alpha', team2: 'Beta' });
    const gameCode = result.game.code;
    
    const player1 = joinGame(gameCode, 'Player1');
    const player2 = joinGame(gameCode, 'Player2');
    
    // Add null checks
    expect(player1.playerId).not.toBeNull();
    expect(player2.playerId).not.toBeNull();
    expect(player1.playerId).not.toBe(player2.playerId);
    expect(typeof player1.playerId).toBe('string');
    expect(typeof player2.playerId).toBe('string');
    expect(player1.playerId!.length).toBeGreaterThan(0);
    expect(player2.playerId!.length).toBeGreaterThan(0);
  });
});

test.describe('Answer Submission Logic', () => {
  test('checkAnswerMatch should find correct answers with fuzzy matching', () => {
    const answers = [
      { answer: 'apple', score: 10, revealed: false },
      { answer: 'banana', score: 20, revealed: false },
      { answer: 'cherry', score: 30, revealed: false }
    ];

    // Exact match
    const exactMatch = checkAnswerMatch('apple', answers);
    expect(exactMatch!.answer).toBe('apple');

    // Close match (within Levenshtein distance)
    const closeMatch = checkAnswerMatch('aple', answers); // Missing 'p'
    expect(closeMatch!.answer).toBe('apple');

    // No match
    const noMatch = checkAnswerMatch('orange', answers);
    expect(noMatch).toBeUndefined();

    // Should not match revealed answers
    answers[0].revealed = true;
    const noMatchRevealed = checkAnswerMatch('apple', answers);
    expect(noMatchRevealed).toBeUndefined();
  });

  test('submitAnswer should handle toss-up round correctly', async () => {
    const mockQuestions = [{ _id: 'q1', round: 1, teamAssignment: 'team1', questionNumber: 1, answers: [] }];
    const mockTossUp = { 
      _id: 'toss1', 
      question: 'Toss Up', 
      answers: [
        { answer: 'correct', score: 10, revealed: false }
      ] 
    };
    
    const result = await createGame(mockQuestions, mockTossUp, { team1: 'Team Alpha', team2: 'Team Beta' });
    const gameCode = result.game.code;
    const joinResult = joinGame(gameCode, 'Player1');
    const { playerId } = joinResult;
    const game = startGame(gameCode);
    
    // Assign player to team using updatePlayer
    updatePlayer(playerId!, { teamId: game!.teams[0].id });
    
    const submitResult = submitAnswer(gameCode, playerId!, 'correct');
    
    expect(submitResult.success).toBe(true);
    
    if (submitResult.success) {
      const successResult = submitResult as any;
      expect(successResult.isCorrect).toBe(true);
      expect(successResult.pointsAwarded).toBe(10);
      expect(successResult.tossUp).toBe(true);
    }
  });

  test('submitAnswer should handle wrong answers in regular rounds', async () => {
    const mockQuestions = [{ 
      _id: 'q1', 
      round: 1, 
      teamAssignment: 'team1', 
      questionNumber: 1, 
      answers: [
        { answer: 'right', score: 10, revealed: false }
      ] 
    }];
    const mockTossUp = { _id: 'toss1', answers: [] };
    
    const result = await createGame(mockQuestions, mockTossUp, { team1: 'Red Team', team2: 'Blue Team' });
    const gameCode = result.game.code;
    const joinResult = joinGame(gameCode, 'Player1');
    const { playerId } = joinResult;
    const game = startGame(gameCode);
    
    // Skip toss-up and go to round 1 using updateGame
    updateGame(gameCode, { 
      currentRound: 1,
      gameState: {
        ...game!.gameState,
        currentTurn: 'team1'
      }
    });
    
    // Update player and team using proper functions
    updatePlayer(playerId!, { teamId: game!.teams[0].id });
    updateTeamActiveStatus(getGame(gameCode)!);
    
    const submitResult = submitAnswer(gameCode, playerId!, 'wrong');
    
    expect(submitResult.success).toBe(true);
    
    if (submitResult.success) {
      const successResult = submitResult as any;
      expect(successResult.isCorrect).toBe(false);
      expect(successResult.revealAllCards).toBe(true);
    }
  });

  test('submitAnswer should return error for invalid game state', () => {
    const result = submitAnswer('INVALID_GAME', 'INVALID_PLAYER', 'answer');
    
    expect(result.success).toBe(false);
    
    const errorResult = result as any;
    expect(errorResult.message).toContain('Invalid game state');
  });

  test('submitAnswer should handle correct answers in regular rounds', async () => {
    const mockQuestions = [{ 
      _id: 'q1', 
      round: 1, 
      teamAssignment: 'team1', 
      questionNumber: 1, 
      answers: [
        { answer: 'correct answer', score: 10, revealed: false }
      ] 
    }];
    const mockTossUp = { _id: 'toss1', answers: [] };
    
    const result = await createGame(mockQuestions, mockTossUp, { team1: 'Team One', team2: 'Team Two' });
    const gameCode = result.game.code;
    const joinResult = joinGame(gameCode, 'Player1');
    const { playerId } = joinResult;
    
    // Set up game state for regular round
    const game = getGame(gameCode);
    updateGame(gameCode, { 
      currentRound: 1,
      status: 'active',
      gameState: {
        ...game!.gameState,
        currentTurn: 'team1'
      }
    });
    
    updatePlayer(playerId!, { teamId: game!.teams[0].id });
    updateTeamActiveStatus(getGame(gameCode)!);
    
    const submitResult = submitAnswer(gameCode, playerId!, 'correct answer');
    
    expect(submitResult.success).toBe(true);
    
    if (submitResult.success) {
      const successResult = submitResult as any;
      expect(successResult.isCorrect).toBe(true);
      expect(successResult.pointsAwarded).toBe(10);
    }
  });
});

test.describe('Game State Management', () => {
  test('advanceGameState should progress game correctly', async () => {
    const mockQuestions = [
      { _id: 'q1', round: 1, teamAssignment: 'team1', questionNumber: 1, answers: [] },
      { _id: 'q2', round: 1, teamAssignment: 'team1', questionNumber: 2, answers: [] }
    ];
    const mockTossUp = { _id: 'toss1', answers: [] };
    
    const result = await createGame(mockQuestions, mockTossUp, { team1: 'Alpha Team', team2: 'Beta Team' });
    const gameCode = result.game.code;
    const game = startGame(gameCode);
    
    // Set up for regular round
    game!.currentRound = 1;
    game!.gameState.currentTurn = 'team1';
    game!.gameState.questionsAnswered.team1 = 0;
    
    const updatedGame = advanceGameState(gameCode);
    
    expect(updatedGame!.gameState.questionsAnswered.team1).toBe(1);
  });

  test('isRoundComplete should detect completed rounds', async () => {
    const result = await createGame([], { answers: [] }, { team1: 'First Team', team2: 'Second Team' });
    const gameCode = result.game.code;
    const game = getGame(gameCode);
    
    // Not complete
    game!.gameState.questionsAnswered = { team1: 2, team2: 2 };
    expect(isRoundComplete(game!)).toBe(false);
    
    // Complete
    game!.gameState.questionsAnswered = { team1: 3, team2: 3 };
    expect(isRoundComplete(game!)).toBe(true);
  });

  test('getCurrentQuestion should return correct question', async () => {
    const mockQuestions = [
      { _id: 'q1', round: 1, teamAssignment: 'team1', questionNumber: 1, answers: [] },
      { _id: 'q2', round: 1, teamAssignment: 'team1', questionNumber: 2, answers: [] }
    ];
    const mockTossUp = { _id: 'toss1', question: 'Toss Up', answers: [] };
    
    const result = await createGame(mockQuestions, mockTossUp, { team1: 'Team X', team2: 'Team Y' });
    const gameCode = result.game.code;
    const game = getGame(gameCode);
    
    // Toss-up round
    game!.currentRound = 0;
    expect(getCurrentQuestion(game!)).toStrictEqual(mockTossUp);
    
    // Regular round
    game!.currentRound = 1;
    game!.currentQuestionIndex = 0;
    expect(getCurrentQuestion(game!)).toStrictEqual(mockQuestions[0]);
    
    // No question
    game!.currentQuestionIndex = 10;
    expect(getCurrentQuestion(game!)).toBeNull();
  });
});

test.describe('Team and Scoring Logic', () => {
  test('updateTeamActiveStatus should set correct active team', async () => {
    const result = await createGame([], { answers: [] }, {
      team1: 'Team One',
      team2: 'Team Two'
    });
    const gameCode = result.game.code;
    const game = getGame(gameCode);
    
    updateTeamActiveStatus(game!);
    
    // No team should be active initially
    expect(game!.teams[0].active).toBe(false);
    expect(game!.teams[1].active).toBe(false);
    
    // Set team1 as current turn
    game!.gameState.currentTurn = 'team1';
    updateTeamActiveStatus(game!);
    expect(game!.teams[0].active).toBe(true);
    expect(game!.teams[1].active).toBe(false);
    
    // Set team2 as current turn
    game!.gameState.currentTurn = 'team2';
    updateTeamActiveStatus(game!);
    expect(game!.teams[0].active).toBe(false);
    expect(game!.teams[1].active).toBe(true);
  });

  test('getGameWinner should determine winner correctly', async () => {
    const result = await createGame([], { answers: [] }, { team1: 'Alpha Team', team2: 'Beta Team' });
    const gameCode = result.game.code;
    const game = getGame(gameCode);
    
    const team1 = game!.teams[0];
    const team2 = game!.teams[1];
    
    // Team 1 wins
    team1.roundScores = [10, 20, 30]; // Total: 60
    team2.roundScores = [5, 15, 25];  // Total: 45
    expect(getGameWinner(game!)).toBe(team1);
    
    // Team 2 wins
    team1.roundScores = [10, 10, 10]; // Total: 30
    team2.roundScores = [15, 15, 15]; // Total: 45
    expect(getGameWinner(game!)).toBe(team2);
    
    // Tie
    team1.roundScores = [10, 10, 10]; // Total: 30
    team2.roundScores = [10, 10, 10]; // Total: 30
    expect(getGameWinner(game!)).toBeNull();
  });
});

test.describe('Utility Functions', () => {
  test('updateQuestionData should track question attempts', async () => {
    const result = await createGame([], { answers: [] }, { team1: 'Red Team', team2: 'Blue Team' });
    const gameCode = result.game.code;
    const game = getGame(gameCode);
    
    updateQuestionData(game!, 'team1', 1, 1, true, 10);
    
    const questionData = game!.gameState.questionData.team1.round1[0];
    expect(questionData.firstAttemptCorrect).toBe(true);
    expect(questionData.pointsEarned).toBe(10);
    
    // Should not update if already attempted
    updateQuestionData(game!, 'team1', 1, 1, false, 0);
    expect(questionData.firstAttemptCorrect).toBe(true); // Still true
  });

  test('overrideQuestionData should force update question data', async () => {
    const result = await createGame([], { answers: [] }, { team1: 'Team X', team2: 'Team Y' });
    const gameCode = result.game.code;
    const game = getGame(gameCode);
    
    overrideQuestionData(game!, 'team1', 1, 1, false, 0);
    
    const questionData = game!.gameState.questionData.team1.round1[0];
    expect(questionData.firstAttemptCorrect).toBe(false);
    expect(questionData.pointsEarned).toBe(0);
  });

  test('cleanupOldGames should remove expired games', async () => {
    const result = await createGame([], { answers: [] }, { team1: 'First Team', team2: 'Second Team' });
    const gameCode = result.game.code;
    
    // Make game old
    const game = getGame(gameCode);
    game!.createdAt = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    
    cleanupOldGames();
    
    expect(getGame(gameCode)).toBeNull();
  });

  test('getGameStats should return correct statistics', () => {
    // Clear existing games
    resetGameState();
    
    // Create test games and players with distinct team names
    createGame([], { answers: [] }, { team1: 'Team A', team2: 'Team B' });
    createGame([], { answers: [] }, { team1: 'Team C', team2: 'Team D' });
    
    // Create test players directly in the players object
    const player1 = { id: 'player1', name: 'Test', gameCode: 'TEST', connected: true, teamId: null };
    const player2 = { id: 'player2', name: 'Test2', gameCode: 'TEST', connected: true, teamId: null };
    (players as any)['player1'] = player1;
    (players as any)['player2'] = player2;
    
    const stats = getGameStats();
    
    expect(stats.activeGames).toBe(2);
    expect(stats.connectedPlayers).toBe(2);
  });
});

test.describe('Error Handling', () => {
  test('submitAnswer should handle invalid game state', () => {
    const result = submitAnswer('INVALID', 'player1', 'answer');
    expect(result.success).toBe(false);
    expect((result as any).message).toContain('Invalid game state');
  });

  test('submitAnswer should handle non-existent player', async () => {
    const result = await createGame([], { answers: [] }, { team1: 'Home Team', team2: 'Away Team' });
    const gameCode = result.game.code;
    startGame(gameCode);
    
    const result2 = submitAnswer(gameCode, 'INVALID_PLAYER', 'answer');
    expect(result2.success).toBe(false);
    expect((result2 as any).message).toContain('Invalid game state');
  });
});
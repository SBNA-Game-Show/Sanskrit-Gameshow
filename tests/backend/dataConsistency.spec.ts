import { test, expect, request, APIRequestContext } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Define interfaces for our data structures
interface Question {
  _id: string;
  round: number;
  questionNumber: number;
  teamAssignment: string;
  answers: Answer[];
}

interface Answer {
  answer: string;
  score: number;
  revealed: boolean;
}

interface GameData {
  gameCode: string;
  gameId: string;
  players?: any[];
  status?: string;
}

interface GameState {
  status: string;
  players: any[];
  gameCode: string;
  scores?: { [key: string]: number };
}

interface Operation {
  type: 'player_join' | 'load_questions';
  data?: { playerName: string; gameCode: string };
  endpoint?: string;
}

interface AnswerSubmission {
  playerName: string;
  answer: string;
  expectedScore: number;
}

test.describe('Data Consistency Tests', () => {
  let hostToken: string;

  test.beforeEach(async ({ request }: { request: APIRequestContext }) => {
    // Login as host before each test
    const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
      data: { username: 'Host', password: '12345678' },
    });
    const loginBody = await loginResponse.json();
    hostToken = loginBody.token;
  });

  test('Question data should maintain integrity across rounds', async ({ request }: { request: APIRequestContext }) => {
    const response = await request.get(`${BASE_URL}/api/questions/load`, {
      headers: { Authorization: `Bearer ${hostToken}` }
    });
    
    expect(response.status()).toBe(200);
    const questions: Question[] = await response.json();
    
    // Check that question numbers are sequential within rounds
    const rounds: { [key: number]: number[] } = {};
    questions.forEach((question: Question) => {
      if (!rounds[question.round]) {
        rounds[question.round] = [];
      }
      rounds[question.round].push(question.questionNumber);
    });

    // Each round should have sequential question numbers
    Object.values(rounds).forEach((questionNumbers: number[]) => {
      const sorted = [...questionNumbers].sort((a, b) => a - b);
      expect(questionNumbers).toEqual(sorted);
    });

    // Verify no duplicate question numbers within rounds
    Object.entries(rounds).forEach(([round, numbers]: [string, number[]]) => {
      const uniqueNumbers = [...new Set(numbers)];
      expect(numbers.length).toBe(uniqueNumbers.length);
    });
  });

  test('Game state consistency after multiple operations', async ({ request }: { request: APIRequestContext }) => {
    // Start a new game
    const startResponse = await request.post(`${BASE_URL}/api/game/start`, {
      headers: { Authorization: `Bearer ${hostToken}` },
      data: { gameType: 'quiz', settings: { maxPlayers: 4 } }
    });
    expect(startResponse.status()).toBe(200);
    const gameData: GameData = await startResponse.json();

    // Get initial game state
    const initialStateResponse = await request.get(`${BASE_URL}/api/game/state`, {
      headers: { Authorization: `Bearer ${hostToken}` }
    });
    const initialState: GameState = await initialStateResponse.json();

    // Perform multiple operations
    const operations: Operation[] = [
      { type: 'player_join', data: { playerName: 'Player1', gameCode: gameData.gameCode } },
      { type: 'player_join', data: { playerName: 'Player2', gameCode: gameData.gameCode } },
      { type: 'load_questions', endpoint: '/api/questions/load' }
    ];

    for (const operation of operations) {
      let response;
      if (operation.type === 'player_join' && operation.data) {
        response = await request.post(`${BASE_URL}/api/players/join`, {
          data: operation.data
        });
      } else if (operation.type === 'load_questions' && operation.endpoint) {
        response = await request.get(`${BASE_URL}${operation.endpoint}`, {
          headers: { Authorization: `Bearer ${hostToken}` }
        });
      }
      expect(response!.status()).toBe(200);
    }

    // Verify final game state consistency
    const finalStateResponse = await request.get(`${BASE_URL}/api/game/state`, {
      headers: { Authorization: `Bearer ${hostToken}` }
    });
    const finalState: GameState = await finalStateResponse.json();

    // Game should still be in valid state
    expect(finalState.status).toBeDefined();
    expect(finalState.players).toHaveLength(2);
    expect(finalState.gameCode).toBe(initialState.gameCode);
  });

  test('Score calculation consistency', async ({ request }: { request: APIRequestContext }) => {
    // Start game
    const startResponse = await request.post(`${BASE_URL}/api/game/start`, {
      headers: { Authorization: `Bearer ${hostToken}` }
    });
    const gameData: GameData = await startResponse.json();

    // Simulate multiple answer submissions
    const answerSubmissions: AnswerSubmission[] = [
      { playerName: 'Player1', answer: 'correct', expectedScore: 10 },
      { playerName: 'Player2', answer: 'wrong', expectedScore: 0 },
      { playerName: 'Player1', answer: 'correct', expectedScore: 20 }
    ];

    let totalScore = 0;
    for (const submission of answerSubmissions) {
      // Join player if not already joined
      await request.post(`${BASE_URL}/api/players/join`, {
        data: { playerName: submission.playerName, gameCode: gameData.gameCode }
      });

      // Submit answer (this would need to be adapted to your actual API)
      const answerResponse = await request.post(`${BASE_URL}/api/game/answer`, {
        headers: { Authorization: `Bearer ${hostToken}` },
        data: {
          playerName: submission.playerName,
          answer: submission.answer,
          gameCode: gameData.gameCode
        }
      });

      if (answerResponse.status() === 200) {
        const result = await answerResponse.json();
        if (result.isCorrect) {
          totalScore += submission.expectedScore;
        }
      }
    }

    // Verify final scores
    const stateResponse = await request.get(`${BASE_URL}/api/game/state`, {
      headers: { Authorization: `Bearer ${hostToken}` }
    });
    const gameState: GameState = await stateResponse.json();

    // Scores should be consistent with submissions
    expect(gameState.scores).toBeDefined();
    // Add more specific score validation based on your game logic
  });

  test('Data persistence across game sessions', async ({ request }: { request: APIRequestContext }) => {
    // Create first game session
    const session1Response = await request.post(`${BASE_URL}/api/game/start`, {
      headers: { Authorization: `Bearer ${hostToken}` },
      data: { gameType: 'quiz', settings: { maxPlayers: 4 } }
    });
    const session1: GameData = await session1Response.json();

    // End first session
    await request.post(`${BASE_URL}/api/game/end`, {
      headers: { Authorization: `Bearer ${hostToken}` }
    });

    // Create second game session
    const session2Response = await request.post(`${BASE_URL}/api/game/start`, {
      headers: { Authorization: `Bearer ${hostToken}` },
      data: { gameType: 'quiz', settings: { maxPlayers: 4 } }
    });
    const session2: GameData = await session2Response.json();

    // New session should have fresh state
    expect(session2.gameCode).not.toBe(session1.gameCode);
    expect(session2.players).toHaveLength(0);

    // Verify no data leakage between sessions
    const stateResponse = await request.get(`${BASE_URL}/api/game/state`, {
      headers: { Authorization: `Bearer ${hostToken}` }
    });
    const currentState: GameState = await stateResponse.json();

    expect(currentState.players).toHaveLength(0);
    expect(currentState.scores).toEqual({});
  });
});
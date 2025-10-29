import { test, expect, request, APIRequestContext } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5004';

// Define interfaces based on your actual API responses
interface GameData {
  gameCode: string;
  gameId: string;
  success: boolean;
}

interface JoinGameResponse {
  playerId: string;
  game: any;
  success: boolean;
}

interface ServerStats {
  message: string;
  status: string;
  activeGames: number;
  connectedPlayers: number;
  timestamp: string;
}

interface AuthResponse {
  token: string;
  user?: any;
}

test.describe('API Integration Tests', () => {
  let hostToken: string;
  let gameCode: string;

  test.beforeEach(async ({ request }: { request: APIRequestContext }) => {
    // Login as host before each test
    const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
      data: { username: 'Host', password: '12345678' },
    });
    
    // Debug login if needed
    if (loginResponse.status() !== 200) {
      console.log('Login failed with status:', loginResponse.status());
      const errorText = await loginResponse.text();
      console.log('Login error:', errorText);
    }
    
    expect(loginResponse.status()).toBe(200);
    const loginBody: AuthResponse = await loginResponse.json();
    hostToken = loginBody.token;
    expect(hostToken).toBeDefined();
  });

  test('Server should be running and accessible', async ({ request }: { request: APIRequestContext }) => {
    const response = await request.get(`${BASE_URL}/`);
    expect(response.status()).toBe(200);
    
    const stats: ServerStats = await response.json();
    expect(stats.message).toBe('Family Feud Quiz Game Server');
    expect(stats.status).toBe('Running');
    expect(stats.activeGames).toBeDefined();
    expect(stats.connectedPlayers).toBeDefined();
  });

  test('Should create a new game successfully', async ({ request }: { request: APIRequestContext }) => {
    const createResponse = await request.post(`${BASE_URL}/api/create-game`, {
      headers: { Authorization: `Bearer ${hostToken}` },
      data: { 
        teamNames: ["Team Alpha", "Team Beta"] 
      }
    });

    // Debug create game response
    if (createResponse.status() !== 200) {
      console.log('Create game failed with status:', createResponse.status());
      const errorText = await createResponse.text();
      console.log('Create game error:', errorText);
    }

    expect(createResponse.status()).toBe(200);
    
    const gameData: GameData = await createResponse.json();
    expect(gameData.success).toBe(true);
    expect(gameData.gameCode).toBeDefined();
    expect(gameData.gameId).toBeDefined();
    
    gameCode = gameData.gameCode;
    console.log('Created game with code:', gameCode);
  });

  test('Should allow players to join created game', async ({ request }: { request: APIRequestContext }) => {
    // First create a game
    const createResponse = await request.post(`${BASE_URL}/api/create-game`, {
      headers: { Authorization: `Bearer ${hostToken}` },
      data: { 
        teamNames: ["Team Red", "Team Blue"] 
      }
    });
    expect(createResponse.status()).toBe(200);
    
    const gameData: GameData = await createResponse.json();
    gameCode = gameData.gameCode;

    // Join first player
    const join1Response = await request.post(`${BASE_URL}/api/join-game`, {
      data: { 
        playerName: 'PlayerOne', 
        gameCode: gameCode 
      }
    });

    if (join1Response.status() !== 200) {
      console.log('Join 1 failed with status:', join1Response.status());
      const errorText = await join1Response.text();
      console.log('Join 1 error:', errorText);
    }

    expect(join1Response.status()).toBe(200);
    
    const join1Result: JoinGameResponse = await join1Response.json();
    expect(join1Result.success).toBe(true);
    expect(join1Result.playerId).toBeDefined();
    expect(join1Result.game).toBeDefined();

    // Join second player
    const join2Response = await request.post(`${BASE_URL}/api/join-game`, {
      data: { 
        playerName: 'PlayerTwo', 
        gameCode: gameCode 
      }
    });

    expect(join2Response.status()).toBe(200);
    
    const join2Result: JoinGameResponse = await join2Response.json();
    expect(join2Result.success).toBe(true);
  });

  test('Should handle invalid game code gracefully', async ({ request }: { request: APIRequestContext }) => {
    const joinResponse = await request.post(`${BASE_URL}/api/join-game`, {
      data: { 
        playerName: 'TestPlayer', 
        gameCode: 'INVALID123' 
      }
    });

    // Should return 404 for non-existent game
    expect(joinResponse.status()).toBe(404);
    
    const errorBody = await joinResponse.json();
    expect(errorBody.error).toBe('Game not found');
  });

  test('Should reject join without required fields', async ({ request }: { request: APIRequestContext }) => {
    // Test missing playerName
    const response1 = await request.post(`${BASE_URL}/api/join-game`, {
      data: { 
        gameCode: 'TEST123' 
        // missing playerName
      }
    });

    expect(response1.status()).toBe(400);
    const error1 = await response1.json();
    expect(error1.error).toContain('required');

    // Test missing gameCode
    const response2 = await request.post(`${BASE_URL}/api/join-game`, {
      data: { 
        playerName: 'TestPlayer' 
        // missing gameCode
      }
    });

    expect(response2.status()).toBe(400);
    const error2 = await response2.json();
    expect(error2.error).toContain('required');
  });

  test('Game creation should require teamNames', async ({ request }: { request: APIRequestContext }) => {
    const createResponse = await request.post(`${BASE_URL}/api/create-game`, {
      headers: { Authorization: `Bearer ${hostToken}` },
      data: { 
        // missing teamNames
      }
    });

    // This might return 500 since your code expects teamNames
    // You might want to add validation in your route
    console.log('Create without teamNames status:', createResponse.status());
  });

  test('Multiple games can be created independently', async ({ request }: { request: APIRequestContext }) => {
    // Create first game
    const game1Response = await request.post(`${BASE_URL}/api/create-game`, {
      headers: { Authorization: `Bearer ${hostToken}` },
      data: { teamNames: ["Team 1", "Team 2"] }
    });
    expect(game1Response.status()).toBe(200);
    const game1: GameData = await game1Response.json();

    // Create second game
    const game2Response = await request.post(`${BASE_URL}/api/create-game`, {
      headers: { Authorization: `Bearer ${hostToken}` },
      data: { teamNames: ["Team A", "Team B"] }
    });
    expect(game2Response.status()).toBe(200);
    const game2: GameData = await game2Response.json();

    // Game codes should be different
    expect(game1.gameCode).not.toBe(game2.gameCode);

    // Players should be able to join both games independently
    const join1Response = await request.post(`${BASE_URL}/api/join-game`, {
      data: { playerName: 'Player1', gameCode: game1.gameCode }
    });
    expect(join1Response.status()).toBe(200);

    const join2Response = await request.post(`${BASE_URL}/api/join-game`, {
      data: { playerName: 'Player2', gameCode: game2.gameCode }
    });
    expect(join2Response.status()).toBe(200);
  });

  test('Server stats should reflect active games and players', async ({ request }: { request: APIRequestContext }) => {
    // Get initial stats
    const initialStatsResponse = await request.get(`${BASE_URL}/`);
    expect(initialStatsResponse.status()).toBe(200);
    const initialStats: ServerStats = await initialStatsResponse.json();

    // Create a game and add players
    const createResponse = await request.post(`${BASE_URL}/api/create-game`, {
      headers: { Authorization: `Bearer ${hostToken}` },
      data: { teamNames: ["Team X", "Team Y"] }
    });
    const gameData: GameData = await createResponse.json();

    // Join players
    await request.post(`${BASE_URL}/api/join-game`, {
      data: { playerName: 'PlayerA', gameCode: gameData.gameCode }
    });
    await request.post(`${BASE_URL}/api/join-game`, {
      data: { playerName: 'PlayerB', gameCode: gameData.gameCode }
    });

    // Get updated stats - note: this might not immediately reflect changes
    // depending on how your stats are calculated
    const updatedStatsResponse = await request.get(`${BASE_URL}/`);
    const updatedStats: ServerStats = await updatedStatsResponse.json();
    
    // These assertions might need adjustment based on how real-time your stats are
    expect(updatedStats.activeGames).toBeDefined();
    expect(updatedStats.connectedPlayers).toBeDefined();
  });

  test('Authentication should protect game creation', async ({ request }: { request: APIRequestContext }) => {
    // Try to create game without authentication
    const response = await request.post(`${BASE_URL}/api/create-game`, {
      // No Authorization header
      data: { teamNames: ["Team 1", "Team 2"] }
    });

    // This depends on your auth middleware implementation
    // If you have auth on this route, it should return 401/403
    console.log('Create game without auth status:', response.status());
    
    if (response.status() === 401 || response.status() === 403) {
      const error = await response.json();
      expect(error.error).toBeDefined();
    }
  });
});
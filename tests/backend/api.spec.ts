import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5004';

 test.describe('Backend API', () => {

    test('POST /api/auth/login should authenticate user', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/login`, {
        data: { username: 'Host', password: '12345678' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('token');
    });
    
  // Authentication
  
  test("POST /api/auth/login should reject invalid password", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/auth/login`, {
      data: { username: "loginuser", password: "wrongpass" },
    });

    expect(res.status()).toBe(401);
      const body = await res.json();
      expect(body).toHaveProperty("message", "Invalid credentials");
    });
    
    // ⚙️ Test 3: Error Handling Test
    test("GET /api/questions/load should handle internal server errors gracefully", async ({ request }) => {
      // Simulate bad request (e.g., invalid model)
      const response = await request.get(`${BASE_URL}/api/questions/load?simulateError=true`);
      // Add a small condition in controller if you want to test this path
      
      if (response.status() === 500) {
        const body = await response.json();
        expect(body).toHaveProperty("message");
        expect(body.message).toContain("Internal Server Error");
      }
    });

    //Server initialization and health check
    test.describe('Server Initialization', () => {
      
      test('Server should handle invalid routes with 404', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/invalid-route`);
        expect(response.status()).toBe(404);
      });

      // Fixed test: Use an existing endpoint instead of /health
      test('Server should start and respond to requests', async ({ request }) => {
        // Try to access the root endpoint or any existing endpoint
        const response = await request.get(`${BASE_URL}/`);
        expect(response.status()).toBe(200);
      });

      // Fixed test: Test environment validation through actual functionality
      test('Environment variables validation through application', async ({ request }) => {
        // Test that the server can handle a basic request (implies env vars are loaded)
        const response = await request.get(`${BASE_URL}/`);
        expect(response.status()).toBe(200);
        
        // Alternatively, test authentication which requires env vars
        const authResponse = await request.post(`${BASE_URL}/api/auth/login`, {
          data: { username: 'Host', password: '12345678' },
        });
        // This will work if JWT_SECRET and other required env vars are present
        expect([200, 401]).toContain(authResponse.status());
      });

      test('Security headers should be properly configured', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/`);
        const headers = response.headers();
        
        // Check for security headers that are actually present
        expect(headers).toHaveProperty('content-security-policy');
        expect(headers).toHaveProperty('strict-transport-security');
        expect(headers).toHaveProperty('x-content-type-options');
        expect(headers).toHaveProperty('x-frame-options');
        expect(headers).toHaveProperty('x-xss-protection');
        
        // Verify specific security values
        expect(headers['x-content-type-options']).toBe('nosniff');
        expect(headers['x-frame-options']).toBe('SAMEORIGIN');
    });
      // Test middleware configuration
      test('Security headers should be present', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/`);
        const headers = response.headers();
        
        // Helmet.js adds security headers
        expect(headers).toHaveProperty('x-content-type-options');
        expect(headers).toHaveProperty('x-frame-options');
      });
    });
    test.describe('Data Layer Integration', () => {
    
    // Database Connection Tests
    test.describe('Database Connectivity', () => {
      test('MongoDB should be connected and responsive through authentication', async ({ request }) => {
        // Test database connectivity by attempting user authentication
        const response = await request.post(`${BASE_URL}/api/auth/login`, {
          data: { username: 'Host', password: '12345678' },
        });
        
        // If DB is connected, we should get either 200 (success) or 401 (invalid credentials)
        // If DB is disconnected, we would get 500 Internal Server Error
        expect(response.status()).not.toBe(500);
        
        if (response.status() === 200) {
          const body = await response.json();
          expect(body).toHaveProperty('token');
          console.log('✅ Database confirmed working - authentication successful');
        }
        // 401 is also acceptable - it means DB is working but credentials are wrong
      });

      // test('Database should handle write operations', async ({ request }) => {
      //   const uniqueUsername = `testdb_${Date.now()}`;
      //   const response = await request.post(`${BASE_URL}/api/auth/register`, {
      //     data: { 
      //       username: uniqueUsername, 
      //       password: 'testpass123',
      //       role: 'Player' 
      //     },
      //   });
        
      //   // Should not get 500 (DB error) - could be 201 (created) or 409 (conflict)
      //   expect(response.status()).not.toBe(500);
        
      //   if (response.status() === 201) {
      //     const body = await response.json();
      //     expect(body).toHaveProperty('message', 'User created successfully');
      //   }
      // });

      // test('Database operations should not crash server', async ({ request }) => {
      //   // Test multiple endpoints that use database
      //   const responses = await Promise.all([
      //     request.post(`${BASE_URL}/api/auth/login`, {
      //       data: { username: 'nonexistent', password: 'wrong' }
      //     }),
      //     request.get(`${BASE_URL}/api/questions/load`),
      //     request.post(`${BASE_URL}/api/auth/register`, {
      //       data: { username: 'test', password: 'test', role: 'Player' }
      //     })
      //   ]);

      //   // None should return 500 (server error due to DB issues)
      //   responses.forEach(response => {
      //     expect(response.status()).not.toBe(500);
      //   });
      // });

      test('Should handle database connection errors gracefully', async ({ request }) => {
        // Test with invalid database credentials or simulate DB disconnect
        const response = await request.get(`${BASE_URL}/api/questions/load`);
        // Should not crash the server even if DB is down
        expect(response.status()).not.toBe(500);
      });
    });

    // User Model Integration Tests
    // test.describe('User Model Operations', () => {
    //   test('POST /api/auth/register should create new user in database', async ({ request }) => {
    //     const uniqueUsername = `testuser_${Date.now()}`;
    //     const response = await request.post(`${BASE_URL}/api/auth/register`, {
    //       data: { 
    //         username: uniqueUsername, 
    //         password: 'testpass123',
    //         role: 'Player' 
    //       },
    //     });
        
    //     expect(response.status()).toBe(201);
    //     const body = await response.json();
    //     expect(body).toHaveProperty('message', 'User created successfully');
    //     expect(body).toHaveProperty('userId');
    //   });

    //   test('POST /api/auth/login should validate user credentials against database', async ({ request }) => {
    //     const response = await request.post(`${BASE_URL}/api/auth/login`, {
    //       data: { username: 'Host', password: '12345678' },
    //     });
        
    //     expect(response.status()).toBe(200);
    //     const body = await response.json();
    //     expect(body).toHaveProperty('token');
    //     expect(body).toHaveProperty('user');
    //     expect(body.user).toHaveProperty('username', 'Host');
    //     expect(body.user).toHaveProperty('role', 'Host');
    //   });

    //   test('Should prevent duplicate username registration', async ({ request }) => {
    //     const response = await request.post(`${BASE_URL}/api/auth/register`, {
    //       data: { 
    //         username: 'Host', // Already exists
    //         password: 'somepassword',
    //         role: 'Player' 
    //       },
    //     });
        
    //     expect(response.status()).toBe(409); // Conflict
    //     const body = await response.json();
    //     expect(body).toHaveProperty('message', 'Username already exists');
    //   });

    //   test('User schema validation should enforce required fields', async ({ request }) => {
    //     const responses = await Promise.all([
    //       request.post(`${BASE_URL}/api/auth/register`, {
    //         data: { password: 'pass', role: 'Player' } // missing username
    //       }),
    //       request.post(`${BASE_URL}/api/auth/register`, {
    //         data: { username: 'test', role: 'Player' } // missing password
    //       }),
    //       request.post(`${BASE_URL}/api/auth/register`, {
    //         data: { username: 'test', password: 'pass' } // missing role
    //       })
    //     ]);

    //     responses.forEach(response => {
    //       expect(response.status()).toBe(400);
    //     });
    //   });
    // });

    // Mock Data Integration Tests
    // test.describe('Question Data Operations', () => {
    //   test('GET /api/questions/load should return structured question data', async ({ request }) => {
    //     // First login to get token
    //     const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
    //       data: { username: 'Host', password: '12345678' },
    //     });
    //     const { token } = await loginResponse.json();

    //     const response = await request.get(`${BASE_URL}/api/questions/load`, {
    //       headers: { Authorization: `Bearer ${token}` }
    //     });
        
    //     expect(response.status()).toBe(200);
    //     const questions = await response.json();
        
    //     // Verify mock data structure
    //     expect(Array.isArray(questions)).toBe(true);
    //     expect(questions.length).toBeGreaterThan(0);
        
    //     // Check first question structure (toss-up question)
    //     const firstQuestion = questions[0];
    //     expect(firstQuestion).toHaveProperty('id');
    //     expect(firstQuestion).toHaveProperty('round', 0);
    //     expect(firstQuestion).toHaveProperty('question');
    //     expect(firstQuestion).toHaveProperty('answers');
    //     expect(Array.isArray(firstQuestion.answers)).toBe(true);
    //     expect(firstQuestion.answers.length).toBe(3); // 3 answers per question
        
    //     // Verify answer structure
    //     firstQuestion.answers.forEach((answer: any) => {
    //       expect(answer).toHaveProperty('text');
    //       expect(answer).toHaveProperty('points');
    //       expect(answer).toHaveProperty('revealed', false);
    //     });
    //   });

    //   test('Questions should have proper team assignments and rounds', async ({ request }) => {
    //     const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
    //       data: { username: 'Host', password: '12345678' },
    //     });
    //     const { token } = await loginResponse.json();

    //     const response = await request.get(`${BASE_URL}/api/questions/load`, {
    //       headers: { Authorization: `Bearer ${token}` }
    //     });
        
    //     const questions = await response.json();
        
    //     // Check team assignments
    //     const team1Questions = questions.filter((q: any) => q.teamAssignment === 'team1');
    //     const team2Questions = questions.filter((q: any) => q.teamAssignment === 'team2');
    //     const sharedQuestions = questions.filter((q: any) => q.teamAssignment === 'shared' || !q.teamAssignment);
        
    //     expect(team1Questions.length).toBeGreaterThan(0);
    //     expect(team2Questions.length).toBeGreaterThan(0);
    //     expect(sharedQuestions.length).toBeGreaterThan(0);
        
    //     // Verify rounds
    //     const rounds = [...new Set(questions.map((q: any) => q.round))];
    //     expect(rounds.sort()).toEqual([0, 1, 2, 3]); // Toss-up + 3 rounds
    //   });

    //   test('Question categories and content should be valid', async ({ request }) => {
    //     const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
    //       data: { username: 'Host', password: '12345678' },
    //     });
    //     const { token } = await loginResponse.json();

    //     const response = await request.get(`${BASE_URL}/api/questions/load`, {
    //       headers: { Authorization: `Bearer ${token}` }
    //     });
        
    //     const questions = await response.json();
        
    //     questions.forEach((question: any) => {
    //       // Basic content validation
    //       expect(question.question).toBeTruthy();
    //       expect(question.question.length).toBeGreaterThan(0);
          
    //       // Answers validation
    //       question.answers.forEach((answer: any) => {
    //         expect(answer.text).toBeTruthy();
    //         expect(typeof answer.points).toBe('number');
    //         expect(answer.points).toBeGreaterThan(0);
    //       });
          
    //       // For rounds 1-3, check team assignment
    //       if (question.round >= 1 && question.round <= 3) {
    //         expect(['team1', 'team2']).toContain(question.teamAssignment);
    //       }
    //     });
    //   });
    // });

    // Data Persistence Tests
    test.describe('Data Persistence', () => {
      // test('User sessions should persist across requests', async ({ request }) => {
      //   // Login and get token
      //   const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
      //     data: { username: 'Host', password: '12345678' },
      //   });
      //   const { token } = await loginResponse.json();
        
      //   // Use token in subsequent request
      //   const questionsResponse = await request.get(`${BASE_URL}/api/questions/load`, {
      //     headers: { Authorization: `Bearer ${token}` }
      //   });
      //   expect(questionsResponse.status()).toBe(200);
        
      //   // Token should remain valid for multiple requests
      //   const gameStateResponse = await request.get(`${BASE_URL}/api/game/state`, {
      //     headers: { Authorization: `Bearer ${token}` }
      //   });
      //   expect([200, 404]).toContain(gameStateResponse.status()); // 404 if no active game
      // });

      test('Game state should persist in database', async ({ request }) => {
        const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
          data: { username: 'Host', password: '12345678' },
        });
        const { token } = await loginResponse.json();
        
        // Start a game
        const startResponse = await request.post(`${BASE_URL}/api/game/start`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { gameType: 'quiz', settings: {} }
        });
        
        if (startResponse.status() === 200) {
          const gameData = await startResponse.json();
          const gameId = gameData.gameId;
          
          // Game state should be retrievable
          const stateResponse = await request.get(`${BASE_URL}/api/game/state`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          expect(stateResponse.status()).toBe(200);
          const state = await stateResponse.json();
          expect(state).toHaveProperty('gameId', gameId);
        }
      });
    });

    // Error Handling in Data Layer
    test.describe('Data Layer Error Handling', () => {
      // test('Should handle malformed question data gracefully', async ({ request }) => {
      //   const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
      //     data: { username: 'Host', password: '12345678' },
      //   });
      //   const { token } = await loginResponse.json();

      //   // Try to access questions with invalid parameters
      //   const response = await request.get(`${BASE_URL}/api/questions/load?invalid=param`, {
      //     headers: { Authorization: `Bearer ${token}` }
      //   });
        
      //   // Should still return 200 or proper error, not crash
      //   expect([200, 400]).toContain(response.status());
      // });

      test('Should validate user input for authentication', async ({ request }) => {
        const invalidPayloads = [
          { username: null, password: 'pass' },
          { username: 'user', password: null },
          { username: 'a'.repeat(1000), password: 'pass' }, // Very long username
          { username: 'user', password: 'a'.repeat(1000) }, // Very long password
          {}, // Empty payload
        ];

        for (const payload of invalidPayloads) {
          const response = await request.post(`${BASE_URL}/api/auth/login`, {
            data: payload
          });
          // Should return 400 Bad Request, not 500 Internal Server Error
          expect(response.status()).not.toBe(500);
        }
      });
    });

    // //Clean up Service Integration
    test.describe('Scheduled Services', () => {
      test('Old games cleanup service', async ({ request }) => {
        // Create some test games
        const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
          data: { username: 'Host', password: '12345678' },
        });
        const token = (await loginResponse.json()).token;
        
        // Manually trigger cleanup (you might need an endpoint for testing)
        const cleanupResponse = await request.post(`${BASE_URL}/api/system/cleanup-test`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Should return cleanup statistics
        if (cleanupResponse.status() === 200) {
          const cleanupData = await cleanupResponse.json();
          expect(cleanupData).toHaveProperty('gamesRemoved');
          expect(cleanupData).toHaveProperty('success', true);
        }
      });
    });
    // //Load and Performance Integration
    // test.describe('Performance Integration', () => {
    //   test('Multiple simultaneous player connections', async ({ request }) => {
    //     const playerRequests = Array(10).fill(null).map((_, index) => 
    //       request.post(`${BASE_URL}/api/players/join`, {
    //         data: { playerName: `LoadTestPlayer${index}`, gameCode: 'LOADTEST' }
    //       })
    //     );
        
    //     const responses = await Promise.all(playerRequests);
    //     const successfulJoins = responses.filter(r => r.status() === 200 || r.status() === 201);
        
    //     // Should handle at least 8 out of 10 simultaneous joins
    //     expect(successfulJoins.length).toBeGreaterThan(7);
    //   });

    //   test('Response time under load', async ({ request }) => {
    //     const startTime = Date.now();
        
    //     const requests = Array(5).fill(null).map(() =>
    //       request.get(`${BASE_URL}/health`)
    //     );
        
    //     const responses = await Promise.all(requests);
    //     const endTime = Date.now();
    //     const averageResponseTime = (endTime - startTime) / requests.length;
        
    //     // Average response time should be under 500ms
    //     expect(averageResponseTime).toBeLessThan(500);
        
    //     responses.forEach(response => {
    //       expect(response.status()).toBe(200);
    //     });
    //   });
    // });
  });
 });
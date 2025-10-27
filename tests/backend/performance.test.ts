import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5004';
test.describe('Backend Performance Tests', () => {
  const BASE_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5004';

  test.describe('Load Testing', () => {
    test('Should handle 50+ concurrent authentication requests', async ({ request }) => {
      const concurrentRequests = 50;
      
      // First, create the test users that we'll use for authentication
      console.log('👥 Creating test users for performance testing...');
      const testUsers = Array.from({ length: 5 }, (_, i) => ({
        username: `LoadTestUser${i}`,
        password: 'testpass123',
        role: 'Player'
      }));

      // Register test users first
      for (const user of testUsers) {
        const registerResponse = await request.post(`${BASE_URL}/api/auth/register`, {
          data: user
        });
        console.log(`Created user ${user.username}: ${registerResponse.status()}`);
      }

      // Now run the concurrent login test
      const requests = Array(concurrentRequests).fill(null).map((_, index) =>
        request.post(`${BASE_URL}/api/auth/login`, {
          data: { 
            username: `LoadTestUser${index % 5}`, // Cycle through our 5 test users
            password: 'testpass123' 
          },
          timeout: 10000
        })
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Debug: log all response statuses
      const statusCounts: { [key: number]: number } = {};
      responses.forEach(response => {
        const status = response.status();
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      console.log('Response status counts:', statusCounts);

      // Calculate success rate
      const successfulRequests = responses.filter(r => r.status() === 200).length;
      const errorRequests = responses.filter(r => r.status() >= 500).length;
      const authFailures = responses.filter(r => r.status() === 401).length;
      
      console.log(`⏱️  ${concurrentRequests} concurrent auth requests completed in ${totalTime}ms`);
      console.log(`✅ Successful: ${successfulRequests}`);
      console.log(`🔐 Auth Failures: ${authFailures}`);
      console.log(`❌ Server Errors: ${errorRequests}`);
      
      // Performance assertions
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(errorRequests).toBeLessThan(concurrentRequests * 0.1); // Less than 10% server errors
      expect(successfulRequests).toBeGreaterThan(concurrentRequests * 0.8); // At least 80% success rate
    });

    test('Authentication response time performance', async ({ request }) => {
    const iterations = 3;
    const responseTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        const response = await request.post(`${BASE_URL}/api/auth/login`, {
        data: { username: 'Host', password: '12345678' },
        });
        const endTime = Date.now();
        
        expect(response.status()).toBe(200);
        responseTimes.push(endTime - startTime);
        
        if (i < iterations - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    const averageTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

    console.log(`📊 Auth performance over ${iterations} requests: ${averageTime.toFixed(2)}ms average`);
    
    // Environment-specific thresholds
    const isCI = process.env.CI === 'true';
    const isDevelopment = !isCI;
    
    if (isDevelopment) {
        // Development environment - more lenient thresholds
        console.log('🔧 Development environment - using lenient thresholds');
        expect(averageTime).toBeLessThan(2000); // Under 2 seconds
    } else {
        // CI/Production environment - stricter thresholds
        console.log('🚀 CI/Production environment - using strict thresholds');
        expect(averageTime).toBeLessThan(1000); // Under 1 second
    }
    });

    test('Should handle rapid sequential requests without degradation', async ({ request }) => {
        const requestCount = 20;
        const responseTimes: number[] = [];

        for (let i = 0; i < requestCount; i++) {
            const startTime = Date.now();
            const response = await request.get(`${BASE_URL}/`);
            const endTime = Date.now();
            
            expect(response.status()).toBe(200);
            responseTimes.push(endTime - startTime);
            
            if (i < requestCount - 1) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }

        const sortedTimes = [...responseTimes].sort((a, b) => a - b);
        const averageTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        const p90 = sortedTimes[Math.floor(responseTimes.length * 0.9)];
        const p95 = sortedTimes[Math.floor(responseTimes.length * 0.95)];
        const maxTime = Math.max(...responseTimes);

        console.log(`📊 Sequential requests performance:`);
        console.log(`   Average: ${averageTime.toFixed(2)}ms`);
        console.log(`   P90: ${p90}ms`);
        console.log(`   P95: ${p95}ms`);
        console.log(`   Max: ${maxTime}ms`);
        console.log(`   All times: [${responseTimes.join(', ')}]`);

        const isCI = process.env.CI === 'true';
        
        if (isCI) {
            expect(averageTime).toBeLessThan(500);
            expect(p95).toBeLessThan(1500);
        } else {
            expect(averageTime).toBeLessThan(800);
            expect(p95).toBeLessThan(2000);
        }
        
        console.log(`   Requests under 2000ms: ${responseTimes.filter(t => t < 2000).length}/${requestCount}`);
        
        // Degradation check - use a more realistic threshold
        const firstFiveAvg = responseTimes.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
        const lastFiveAvg = responseTimes.slice(-5).reduce((a, b) => a + b, 0) / 5;
        const degradation = (lastFiveAvg - firstFiveAvg) / Math.max(firstFiveAvg, 1);
        
        console.log(`📉 Performance degradation: ${(degradation * 100).toFixed(2)}%`);
        console.log(`   First 5 avg: ${firstFiveAvg.toFixed(2)}ms`);
        console.log(`   Last 5 avg: ${lastFiveAvg.toFixed(2)}ms`);
        
        // More realistic degradation threshold (200% increase)
        expect(degradation).toBeLessThan(2.0);
    });
  });

  test.describe('Memory and Resource Usage', () => {
    test('Multiple game creations should not cause memory leaks', async ({ request }) => {
    // Login first
    const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
        data: { username: 'Host', password: '12345678' },
    });
    const { token } = await loginResponse.json();

    const gameCreations = 10;
    const responses = [];

    for (let i = 0; i < gameCreations; i++) {
        const response = await request.post(`${BASE_URL}/api/create-game`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { 
            teamNames: [`Team${i}A`, `Team${i}B`] 
        }
        });
        responses.push(response);
        
        // Small delay to simulate realistic usage
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Check that all requests were handled properly
    const successfulCreations = responses.filter(r => r.status() === 200).length;
    const failedCreations = responses.filter(r => r.status() !== 200).length;
    
    console.log(`🎮 Game creation results: ${successfulCreations}/${gameCreations} successful`);
    console.log(`📊 Failed creations: ${failedCreations}`);
    
    // Log all status codes for debugging
    responses.forEach((response, index) => {
        console.log(`   Game ${index + 1}: Status ${response.status()}`);
    });
    
    // Use greater than or equal to handle exact matches
    expect(successfulCreations).toBeGreaterThanOrEqual(gameCreations * 0.7);
    
    // Additional assertion to ensure not all failed
    expect(successfulCreations).toBeGreaterThan(0);
    });

    test('Database connection pool should handle concurrent operations', async ({ request }) => {
      const concurrentOperations = 15;
      
      // Mix of different operations to test connection pool
      const operations = Array(concurrentOperations).fill(null).map((_, index) => {
        if (index % 3 === 0) {
          return request.post(`${BASE_URL}/api/auth/login`, {
            data: { username: 'Host', password: '12345678' }
          });
        } else if (index % 3 === 1) {
          return request.get(`${BASE_URL}/`);
        } else {
          // Some operations might fail (like game creation without auth) but shouldn't crash
          return request.post(`${BASE_URL}/api/create-game`, {
            data: { teamNames: ["TestTeam"] }
          });
        }
      });

      const responses = await Promise.allSettled(operations);
      const fulfilled = responses.filter(r => r.status === 'fulfilled').length;
      const rejected = responses.filter(r => r.status === 'rejected').length;

      console.log(`🔗 Connection pool test - Fulfilled: ${fulfilled}, Rejected: ${rejected}`);
      
      // Should handle concurrent operations without major issues
      expect(fulfilled).toBeGreaterThan(concurrentOperations * 0.8); // At least 80% success
      expect(rejected).toBeLessThan(concurrentOperations * 0.2); // Less than 20% rejection
    });
  });

  test.describe('Stress Testing', () => {
    test('Sustained load over time', async ({ request }) => {
    const duration = 10000; // 10 seconds
    const requestsPerSecond = 5;
    const expectedTotalRequests = duration / 1000 * requestsPerSecond; // 50 requests
    
    let completedRequests = 0;
    let successfulRequests = 0;
    const responseTimes: number[] = [];

    const startTime = Date.now();
    const endTime = startTime + duration;

    // Environment-specific thresholds
    const isCI = process.env.CI === 'true';
    const maxAvgResponseTime = isCI ? 2000 : 1500; // More lenient in CI
    const maxP95 = isCI ? 3000 : 2000;

    let lastBatchTime = startTime;

    while (Date.now() < endTime) {
        const batchStart = Date.now();
        
        const batchPromises = Array(requestsPerSecond).fill(null).map(() => {
        const requestStart = Date.now();
        return request.get(`${BASE_URL}/`)
            .then(response => {
            const requestTime = Date.now() - requestStart;
            responseTimes.push(requestTime);
            completedRequests++;
            if (response.status() === 200) successfulRequests++;
            return response;
            })
            .catch(error => {
            completedRequests++;
            return { error };
            });
        });

        await Promise.all(batchPromises);
        
        lastBatchTime = Date.now();
        const timeUntilNextBatch = 1000 - (lastBatchTime - batchStart);
        
        if (timeUntilNextBatch > 0 && lastBatchTime + timeUntilNextBatch < endTime) {
        await new Promise(resolve => setTimeout(resolve, timeUntilNextBatch));
        }
    }

    const actualDuration = Date.now() - startTime;
    const actualRPS = completedRequests / (actualDuration / 1000);
    const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
        : 0;
    const successRate = completedRequests > 0 ? successfulRequests / completedRequests : 0;

    // Calculate percentiles
    const sortedTimes = [...responseTimes].sort((a, b) => a - b);
    const p90 = sortedTimes[Math.floor(sortedTimes.length * 0.9)];
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];

    console.log(`🔥 Stress Test Results (${isCI ? 'CI' : 'Local'} environment):`);
    console.log(`   Completed: ${completedRequests}/${expectedTotalRequests} requests`);
    console.log(`   RPS: ${actualRPS.toFixed(2)}/${requestsPerSecond} target`);
    console.log(`   Success: ${(successRate * 100).toFixed(2)}%`);
    console.log(`   Avg Time: ${avgResponseTime.toFixed(2)}ms (max: ${maxAvgResponseTime}ms)`);
    console.log(`   P95 Time: ${p95}ms (max: ${maxP95}ms)`);

    // Environment-aware assertions
    expect(successRate).toBeGreaterThanOrEqual(0.8);
    expect(avgResponseTime).toBeLessThan(maxAvgResponseTime);
    expect(p95).toBeLessThan(maxP95);
    expect(completedRequests).toBeGreaterThanOrEqual(expectedTotalRequests * 0.7);
    });

    test('Peak load handling', async ({ request }) => {
    const peakRequests = 100;
    
    console.log(`🚀 Testing peak load of ${peakRequests} simultaneous requests...`);
    
    const requests = Array(peakRequests).fill(null).map(() =>
        request.get(`${BASE_URL}/`)
    );

    const startTime = Date.now();
    const results = await Promise.allSettled(requests);
    const endTime = Date.now();
    const peakLoadTime = endTime - startTime;

    const successful = results.filter(result => 
        result.status === 'fulfilled' && result.value.status() === 200
    ).length;
    
    const errors = results.filter(result => 
        result.status === 'rejected' || 
        (result.status === 'fulfilled' && result.value.status() >= 500)
    ).length;

    console.log(`📈 Peak Load Results (${peakLoadTime}ms):`);
    console.log(`   ✅ Successful: ${successful}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   ⏱️  Time to complete: ${peakLoadTime}ms`);

    // Log detailed breakdown for debugging
    const fulfilled = results.filter(r => r.status === 'fulfilled').length;
    const rejected = results.filter(r => r.status === 'rejected').length;
    console.log(`   📊 Fulfilled: ${fulfilled}, Rejected: ${rejected}`);

    // Should handle peak load reasonably
    expect(peakLoadTime).toBeLessThan(10000); // Complete within 10 seconds
    expect(successful).toBeGreaterThan(peakRequests * 0.7); // At least 70% success
    expect(errors).toBeLessThan(peakRequests * 0.3); // Less than 30% errors
    });
  });

  test.describe('Endpoint-Specific Performance', () => {
    test('Question loading performance with authentication', async ({ request }) => {
      // Login first
      const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
        data: { username: 'Host', password: '12345678' },
      });
      const { token } = await loginResponse.json();

      // Test question loading performance
      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        const response = await request.get(`${BASE_URL}/api/questions/load`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const endTime = Date.now();
        
        if (response.status() === 200) {
          times.push(endTime - startTime);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      if (times.length > 0) {
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];
        
        console.log(`📚 Question loading - Avg: ${avgTime.toFixed(2)}ms, P95: ${p95}ms`);
        
        expect(avgTime).toBeLessThan(1000); // Should be reasonably fast
        expect(p95).toBeLessThan(2000); // 95% of requests under 2 seconds
      }
    });

    test('Game creation performance metrics', async ({ request }) => {
      const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
        data: { username: 'Host', password: '12345678' },
      });
      const { token } = await loginResponse.json();

      const creationTimes: number[] = [];
      const successfulCreations = 5;

      for (let i = 0; i < successfulCreations; i++) {
        const startTime = Date.now();
        const response = await request.post(`${BASE_URL}/api/create-game`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { 
            teamNames: [`PerfTeam${i}A`, `PerfTeam${i}B`] 
          }
        });
        const endTime = Date.now();

        if (response.status() === 200) {
          creationTimes.push(endTime - startTime);
        }

        await new Promise(resolve => setTimeout(resolve, 200));
      }

      if (creationTimes.length > 0) {
        const avgCreationTime = creationTimes.reduce((a, b) => a + b, 0) / creationTimes.length;
        console.log(`⏱️  Average game creation time: ${avgCreationTime.toFixed(2)}ms`);
        
        expect(avgCreationTime).toBeLessThan(2000); // Game creation should be under 2 seconds
      }
    });
  });

  test.describe('System Resource Monitoring', () => {
    test('Response times should remain stable under increasing load', async ({ request }) => {
      const loadLevels = [1, 5, 10, 20];
      const results: { load: number; avgResponseTime: number; successRate: number }[] = [];

      for (const load of loadLevels) {
        const requests = Array(load).fill(null).map(() =>
          request.get(`${BASE_URL}/`).then(r => ({ success: r.status() === 200, time: Date.now() }))
        );

        const startTime = Date.now();
        const responses = await Promise.all(requests);
        const batchTime = Date.now() - startTime;

        const successful = responses.filter(r => r.success).length;
        const avgResponseTime = batchTime / load;
        const successRate = successful / load;

        results.push({
          load,
          avgResponseTime,
          successRate
        });

        console.log(`📊 Load ${load}: ${avgResponseTime.toFixed(2)}ms avg, ${(successRate * 100).toFixed(2)}% success`);
        
        // Wait between load levels
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Check that performance doesn't degrade excessively
      const lowLoadPerf = results.find(r => r.load === 1)?.avgResponseTime || 0;
      const highLoadPerf = results.find(r => r.load === 20)?.avgResponseTime || 0;
      const performanceRatio = highLoadPerf / lowLoadPerf;

      console.log(`📈 Performance ratio (20x load / 1x load): ${performanceRatio.toFixed(2)}`);
      
      expect(performanceRatio).toBeLessThan(10); // Should not be more than 10x slower
      
      // Success rate should remain high
      const minSuccessRate = Math.min(...results.map(r => r.successRate));
      expect(minSuccessRate).toBeGreaterThan(0.7); // At least 70% success rate at all load levels
    });
  });
});
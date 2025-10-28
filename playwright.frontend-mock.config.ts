import { defineConfig, devices } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL  = 'http://localhost:5004';

export default defineConfig({
  testDir: './tests/frontend',
  timeout: 1_000_000,
  fullyParallel: true,
  reporter: 'html',

  use: {
    ...devices['Desktop Chrome'],
    headless: false,
    baseURL: FRONTEND_URL,
    trace: 'on-first-retry',
    launchOptions: { slowMo: 0 },
  },

  // Root-level webServer is supported across Playwright versions
  webServer: [
    {
      command: 'npm start --prefix frontend',
      url: FRONTEND_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npm run start:mock',
      cwd: './server',
      url: BACKEND_URL,
      env: { USE_MOCK_QUESTIONS: 'true', PORT: '5004' },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',   // 👈 so tests open your app
    headless: false,                     // 👈 show test browser
    trace: 'on-first-retry',
    launchOptions: {
      slowMo: 5000,                      // 👈 slows actions by 1s so you can watch
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], headless: false },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], headless: false },
    },
  ],

  // Start both frontend and backend before running tests
  webServer: [
    {
      command: 'npm start --prefix frontend',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: 'npm run dev --prefix server', // 👈 change if your backend uses another command
      url: 'http://localhost:5004',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});
// import { defineConfig, devices } from '@playwright/test';
 
// export default defineConfig({
//   testDir: './tests',
//   fullyParallel: true,
//   forbidOnly: !!process.env.CI,
//   retries: process.env.CI ? 2 : 0,
//   workers: process.env.CI ? 1 : undefined,
//   reporter: 'html',
 
//   use: {
//     // Base URL (optional, you can uncomment if you want to avoid repeating localhost:3000)
//      baseURL: 'http://localhost:3000',
 
//     // Slow down actions by 500ms so you can watch steps happen
//     launchOptions: {
//       slowMo: 1000,   // 0.5s delay; change to 1000 for 1s per action
//     },
 
//     trace: 'on-first-retry',
//     headless: false, // ensures you actually see the browser window
//   },
 
//   projects: [
//     {
//       name: 'chromium',
//       use: { ...devices['Desktop Chrome'] },
//     },
//     {
//       name: 'firefox',
//       use: { ...devices['Desktop Firefox'] },
//     },
//     {
//       name: 'webkit',
//       use: { ...devices['Desktop Safari'] },
//     },
//   ],
// });
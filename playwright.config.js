// const { defineConfig } = require('@playwright/test');

// module.exports = defineConfig({
//   testDir: './tests', // All your e2e tests will live here
//   use: {
//     baseURL: 'http://localhost:3000', // 👈 React frontend URL
//     browserName: 'chromium',
//     //headless: true,
//     //screenshot: 'only-on-failure',
//     //video: 'retain-on-failure',
//     launchOptions: {
//       slowMo: 1000,   // 0.5s delay; change to 1000 for 1s per action
//     },
 
//     trace: 'on-first-retry',
//     headless: false, // ensures you actually see the browser window  
//   },
//   webServer: {
//     command: 'npm start --prefix frontend', // Starts frontend before tests
//     port: 3000,
//     timeout: 120 * 1000,
//     reuseExistingServer: !process.env.CI,
//   },
// });

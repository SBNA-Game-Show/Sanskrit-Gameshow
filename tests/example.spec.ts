import { test, expect } from '@playwright/test';

// Update base URL in playwright.config.js or use environment variable
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

test('has title', async ({ page }) => {
  // Navigate to your local app instead of Playwright website
  await page.goto(APP_URL);

  // Expect your app's title - replace with your actual app title
  await expect(page).toHaveTitle(/Your App Title|Sanskrit Shabd Samvad/);
});

// test('get started link', async ({ page }) => {
//   await page.goto(APP_URL);

//   // Replace with actual elements from your app
//   // Example: Click on a specific button or link in your app
//   await page.getByRole('button', { name: /login|start|begin/i }).click();

//   // Expect your app's specific content after click
//   await expect(page.getByRole('heading', { name: /dashboard|welcome|quiz/i })).toBeVisible();
// });

import { expect, test } from '@playwright/test';

async function login(page: any, username: string, password: string, baseURL?: string) {
  await page.goto(baseURL ?? 'http://localhost:3000/');
  await page.waitForTimeout(10000);

  await page.locator('#username').fill(username);
  await page.locator('#password').fill(password);

  const loginBtn = page.getByRole('button', { name: /login to play/i });
  await expect(loginBtn).toBeEnabled();

  await Promise.all([
    page.waitForLoadState('networkidle'),
    loginBtn.click(),
  ]);
}

test('Host creates game and Player1 logs in (two separate pages)', async ({ browser, baseURL }) => {
  // -------- HOST PAGE --------
  const hostContext = await browser.newContext();
  const hostPage = await hostContext.newPage();

  await login(hostPage, 'Host', '12345678', baseURL);

  await hostPage.getByRole('button', { name: /create room/i }).click();
  await hostPage.getByRole('textbox', { name: 'Team 1 Name' }).fill('Red');
  await hostPage.getByRole('textbox', { name: 'Team 2 Name' }).fill('Blue');
  await hostPage.getByRole('button', { name: /🚀 create game/i }).click();
});


test('check if Join Room button exists', async ({ page }) => {
  await page.goto('http://localhost:3000/HostHomePage');

  const joinRoomButton = page.getByRole('button', {name: '🔄 Join Room'});

  const isVisible = await joinRoomButton.isVisible();

  if (isVisible) {
    console.log('✅ Button exists and is visible.');
  } else {
    console.log('❌ Button does not exist or is hidden.');
  }
});

test('check if Join Room button works', async ({ page }) => {
  await page.goto('http://localhost:3000/HostHomePage');

  const joinRoomButton = page.getByRole('button', { name: '🔄 Join Room' });

  await Promise.all([
    page.waitForLoadState('networkidle'),
    joinRoomButton.click(),
  ]);

  await expect(page).toHaveURL('http://localhost:3000/host/rejoin');
  console.log('✅ Join Room button works correctly.');
});

test('check if Create Room button exists', async ({ page }) => {
  await page.goto('http://localhost:3000/HostHomePage');

  const createRoomButton = page.getByRole('button', {name: '👑 Create Room'});

  const isVisible = await createRoomButton.isVisible();

  if (isVisible) {
    console.log('✅ Button exists and is visible.');
  } else {
    console.log('❌ Button does not exist or is hidden.');
  }
});

test('check if Create Room button works', async ({ page }) => {
  await page.goto('http://localhost:3000/HostHomePage');

  const createRoomButton = page.getByRole('button', { name: '👑 Create Room' });

  await Promise.all([
    page.waitForLoadState('networkidle'),
    createRoomButton.click(),
  ]);

  await expect(page).toHaveURL('http://localhost:3000/host');
  console.log('✅ Create Room button works correctly.');
});

test('check if Delete Room button doesnot exists', async ({ page }) => {
  await page.goto('http://localhost:3000/HostHomePage');

  const deleteRoomButton = page.getByRole('button', {name: 'Delete Room'});

  const isHidden = await deleteRoomButton.isHidden();

  if (isHidden) {
    console.log('✅ Button does not exist and is hidden.');
  } else {
    console.log('❌ Button does exist and exist.');
  }
});

test('Check if Team 1 Name input exists', async ({ page }) => {
  await page.goto('http://localhost:3000/host');

  const team1Input = page.locator('#team1');

  await expect(team1Input).toBeVisible();
});


test('Check if Team 2 Name input exists', async ({ page }) => {
  await page.goto('http://localhost:3000/host');

  const team2Input = page.locator('#team2');

  await expect(team2Input).toBeVisible();
});

test('Check if Team 3 Name input doesnot exists', async ({ page }) => {
  await page.goto('http://localhost:3000/host');

  const team3Input = page.locator('#team3');

  await expect(team3Input).toBeHidden();
});

test('check if Create Game button exists on Host Page', async ({ page }) => {
  await page.goto('http://localhost:3000/host');

  const createGameButton = page.getByRole('button', {name: '🚀 CREATE GAME'});

  const isVisible = await createGameButton.isVisible();

  if (isVisible) {
    console.log('✅ Button exists and is visible.');
  } else {
    console.log('❌ Button does not exist or is hidden.');
  }
});

test('Check if "← Back to Home" link exists', async ({ page }) => {
  await page.goto('http://localhost:3000/host');

  const backLink = page.locator('a[href="/HostHomePage"]');

  await expect(backLink).toBeVisible();
});

test('Check if "Next" link exists', async ({ page }) => {
  await page.goto('http://localhost:3000/host');

  const nextLink = page.locator('a[href="/Host"]');

  await expect(nextLink).toBeHidden();
});


test('Host can enter team names and create game successfully', async ({ page }) => {
  await page.goto('http://localhost:3000/host');

  const team1Input = page.locator('#team1');
  const team2Input = page.locator('#team2');

  await expect(team1Input).toBeVisible();
  await expect(team2Input).toBeVisible();

  await team1Input.fill('Red Team');
  await team2Input.fill('Blue Team');

  const createGameButton = page.getByRole('button', { name: /🚀 create game/i });
  await expect(createGameButton).toBeEnabled();

  await Promise.all([
    page.waitForLoadState('networkidle'),
    createGameButton.click(),
  ]);
  });

test('Check if "Back Home" link works', async ({ page }) => {
  await page.goto('http://localhost:3000/host');

  const backLinkCheck = page.locator('a[href="/HostHomePage"]');

  await Promise.all([
    page.waitForLoadState('networkidle'),
    backLinkCheck.click(),
  ]);

  await expect(page).toHaveURL('http://localhost:3000/HostHomePage');
});

test('Check if game code is visible after game creation', async ({ page }) => {

  await page.goto('http://localhost:3000/host');

  const team1Input = page.locator('#team1');
  const team2Input = page.locator('#team2');
  await team1Input.fill('Red Team');
  await team2Input.fill('Blue Team');

  const createGameButton = page.getByRole('button', { name: /🚀 create game/i });
  await expect(createGameButton).toBeEnabled();
  await Promise.all([
    page.waitForLoadState('networkidle'),
    createGameButton.click(),
  ]);

  const gameCodeElement = page.locator('.text-5xl.font-mono');

  await expect(gameCodeElement).toBeVisible();
  const gameCodeText = await gameCodeElement.textContent();
  expect(gameCodeText?.trim().length).toBeGreaterThan(0);

  console.log(`✅ Game code "${gameCodeText}" is visible.`);
});

test('Begin single attempt button exists at Host Game Creation Page', async ({ page }) => {
  await page.goto('http://localhost:3000/host');

  const team1Input = page.locator('#team1');
  const team2Input = page.locator('#team2');
  await team1Input.fill('Red Team');
  await team2Input.fill('Blue Team');

  const createGameButton = page.getByRole('button', { name: /🚀 create game/i });
  await expect(createGameButton).toBeEnabled();
  await Promise.all([
    page.waitForLoadState('networkidle'),
    createGameButton.click(),
  ]);

  const attemptGameButton = page.getByRole('button', {name: '🎮 BEGIN SINGLE-ATTEMPT COMPETITION'});

  const isVisible = await attemptGameButton.isVisible();

  if (isVisible) {
    console.log('✅ Button exists and is visible.');
  } else {
    console.log('❌ Button does not exist or is hidden.');
  }
});


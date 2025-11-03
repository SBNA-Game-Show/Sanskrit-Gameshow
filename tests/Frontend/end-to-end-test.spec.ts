import { test, expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';

/* ---------- auth ---------- */
async function login(page: Page, username: string, password: string, baseURL?: string) {
  await page.goto(baseURL ?? 'http://localhost:3000/');
  await page.waitForTimeout(2000);
  await page.getByTestId('username-input').fill(username);
  await page.getByTestId('password-input').fill(password);
  const loginBtn = page.getByTestId('login-button');
  await expect(loginBtn).toBeEnabled();
  await Promise.all([page.waitForLoadState('networkidle'), loginBtn.click()]);
}

/* ---------- inputs ---------- */
function editableInput(p: Page): Locator {
  return p
    .locator(
      'input[placeholder*="Type your answer here"], ' +
      'textarea[placeholder*="Type your answer here"], ' +
      '[contenteditable="true"][role="textbox"]'
    )
    .first()
    .or(p.getByRole('textbox', { name: /Type your answer here/i }));
}

async function getEditableAnswerInput(p: Page): Promise<Locator> {
  const el = editableInput(p);
  await el.waitFor({ state: 'visible', timeout: 15_000 });
  const [disabled, readonly] = await Promise.all([
    el.isDisabled().catch(() => false),
    el.evaluate((n: any) => !!n?.readOnly).catch(() => false),
  ]);
  if (disabled || readonly) throw new Error('Found non-editable answer input');
  return el;
}

async function typeAndSubmit(p: Page, text: string) {
  await p.bringToFront();
  const input = await getEditableAnswerInput(p);
  await input.scrollIntoViewIfNeeded();
  await input.focus();
  await input.fill('');
  await input.type(text, { delay: 35 });
  await p.getByRole('button', { name: /submit answer/i }).click();
  await p.waitForTimeout(200);
}

/* ---------- small helpers ---------- */
const buzzBtn = (p: Page) => p.getByRole('button', { name: /🔔 BUZZ IN!/i });
async function buzz(p: Page) { await buzzBtn(p).click(); }
async function answer(p: Page, text: string) { await typeAndSubmit(p, text); }
async function nextQuestion(host: Page) {
  const btn = host.getByRole('button', { name: /^next question$/i });
  await expect(btn).toBeEnabled({ timeout: 10_000 });
  await btn.click();
  await Promise.race([
    btn.waitFor({ state: 'detached', timeout: 7_000 }),
    expect(btn).toBeHidden({ timeout: 7_000 }),
  ]);
}

/* ---------- round navigation ---------- */
async function goToNextRound(hostPage: Page, activePlayerPage: Page) {
  // If a leftover "NEXT QUESTION" is present, click it first.
  const nextQ = hostPage.getByRole('button', { name: /^next question$/i });
  if (await nextQ.isVisible().catch(() => false)) {
    await expect(nextQ).toBeEnabled({ timeout: 5_000 });
    await nextQ.click();
    await Promise.race([
      nextQ.waitFor({ state: 'detached', timeout: 5_000 }),
      expect(nextQ).toBeHidden({ timeout: 5_000 }),
    ]);
  }

  // Now the "Next Round" button should be available.
  const nextRoundBtn = hostPage.getByRole('button', { name: /next round/i });
  await nextRoundBtn.waitFor({ state: 'visible', timeout: 20_000 });
  await expect(nextRoundBtn).toBeEnabled({ timeout: 10_000 });
  await nextRoundBtn.scrollIntoViewIfNeeded();
  await nextRoundBtn.click();

  // Entered the new round once host controls are visible.
  await hostPage.getByText(/host controls/i).waitFor({ timeout: 15_000 });

  // Active player's input should be editable in the new round.
  const input = editableInput(activePlayerPage);
  await input.waitFor({ state: 'visible', timeout: 15_000 });
  await expect(input).toBeEditable({ timeout: 15_000 });

  await hostPage.waitForTimeout(200);
}

/* ---------- scripts ---------- */
type Step = { by: 'p1' | 'p2'; answer: string };
const ROUND_SCRIPTS: { round: 1 | 2 | 3; steps: Step[] }[] = [
  { round: 1, steps: [
      { by: 'p1', answer: 'Clock' },
      { by: 'p1', answer: 'Cereal' },
      { by: 'p1', answer: 'Tennis' },
      { by: 'p2', answer: 'Dog' },
      { by: 'p2', answer: 'Red' },
      { by: 'p2', answer: 'Germany' },
  ]},
  { round: 2, steps: [
      { by: 'p1', answer: 'Facebook' },
      { by: 'p1', answer: 'Batman' },
      { by: 'p1', answer: 'Earth' },
      { by: 'p2', answer: 'Rock' },
      { by: 'p2', answer: 'Bus' },
      { by: 'p2', answer: 'Monopoly' },
  ]},
  { round: 3, steps: [
      { by: 'p1', answer: 'Macbeth' },
      { by: 'p1', answer: 'Eiffel Tower' },
      { by: 'p1', answer: 'Engineer' },
      { by: 'p2', answer: 'Sunny' },
      { by: 'p2', answer: 'Refrigerator' },
      { by: 'p2', answer: 'Apple' },
  ]},
];

/* ---------- test ---------- */
test('Host creates game and plays through 3 rounds (mock data)', async ({ browser, baseURL }) => {
  // HOST
  const hostContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  await login(hostPage, 'Host', '12345678', baseURL);

  await hostPage.getByRole('button', { name: /create room/i }).click();
  await hostPage.getByRole('textbox', { name: 'Team 1 Name' }).fill('Red');
  await hostPage.getByRole('textbox', { name: 'Team 2 Name' }).fill('Blue');
  await hostPage.getByRole('button', { name: /🚀 create game/i }).click();

  const codeElement = hostPage.locator('p:has-text("Share this code with contestants:") + div');
  const gameCode = (await codeElement.innerText()).trim();

  // PLAYER 1
  const p1Ctx = await browser.newContext();
  const p1 = await p1Ctx.newPage();
  await login(p1, 'Player1', '12345', baseURL);
  await p1.getByRole('button', { name: '🎯 Enter as a contestant' }).click();
  await p1.getByRole('textbox', { name: 'Game Code' }).fill(gameCode);
  await p1.getByRole('button', { name: '🚀 JOIN GAME' }).click();

  // PLAYER 2
  const p2Ctx = await browser.newContext();
  const p2 = await p2Ctx.newPage();
  await login(p2, 'Player2', '12345', baseURL);
  await p2.getByRole('button', { name: '🎯 Enter as a contestant' }).click();
  await p2.getByRole('textbox', { name: 'Game Code' }).fill(gameCode);
  await p2.getByRole('button', { name: '🚀 JOIN GAME' }).click();

  // START GAME
  await hostPage.getByRole('button', { name: '🎮 BEGIN SINGLE-ATTEMPT' }).click();

  // Toss-up
  await buzz(p1);
  await answer(p1, 'Check phone');
  await answer(p2, 'Brush Teeth');

  // Enter Round 1 (Red starts)
  await goToNextRound(hostPage, p1);

  // Rounds 1..3
  for (let r = 0; r < ROUND_SCRIPTS.length; r++) {
    const script = ROUND_SCRIPTS[r];

    // For round 2 and 3, we come from a scoreboard. Enter the new round first.
    if (r > 0) {
      const firstPlayer = script.steps[0].by === 'p1' ? p1 : p2;
      await goToNextRound(hostPage, firstPlayer);
    }

    // Always click NEXT QUESTION after every answer, including the last one.
    for (const step of script.steps) {
      const who = step.by === 'p1' ? p1 : p2;
      await answer(who, step.answer);
      await nextQuestion(hostPage);
    }
  }

  // Final scoreboard
  await expect(hostPage.getByText(/Total Score|Final Score|Game Over/i)).toBeVisible();
});

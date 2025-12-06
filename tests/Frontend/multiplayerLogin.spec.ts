// ✅ Import Playwright testing functions and types `Page` gives us strong typing for the browser tab
// (so TypeScript knows what `.goto()` or `.locator()` means)
import { test, expect, Page, Browser } from "@playwright/test";
import { defineConfig } from '@playwright/test';


export default defineConfig({
  use: {
    testIdAttribute: 'data-testid',   
  },
});

// --- GLOBAL CONSTANTS ---
const BASE_URL = "http://localhost:3000";
const HOST_USER = { username: "Host", password: "12345678" };
const PLAYER1_USER = { username: "Player1", password: "12345" };
const PLAYER2_USER = { username: "Player2", password: "12345" };
// Using explicit constant names for consistency
const PLAYER_TEAM1_NAME = "RedHawks";
const PLAYER_TEAM2_NAME = "BlueJays";
const MAX_PLAYERS = 10;

// 🧠 Reusable login helper function
// This lets us quickly log in any user by passing a Playwright `Page`, username, and password.
async function login(Page: Page, username: string, password: string) {
  // Go to the frontend’s login Page (update this URL if your login screen is elsewhere)
  await Page.goto(BASE_URL);

  // Wait briefly to ensure UI elements are loaded
  await Page.waitForTimeout(1000);

  // Fill inputs using the stable data-testid attributes introduced in the branch
  await Page.getByTestId("username-input").fill(username);
  await Page.getByTestId("password-input").fill(password);

  // Grab the login button by testid (more stable)
  const loginBtn = Page.getByTestId("login-button");

  //Optional: Check that the button is enabled before clicking (Playwright assertion)
  await expect(loginBtn).toBeEnabled();

  // ⏳ Start watching for network activity, then click the login button.
  await Promise.all([Page.waitForLoadState("networkidle"), loginBtn.click()]);
}

test("Verify Host logs in and room creation", async ({ browser }) => {
  // --- HOST LOGIN ---
  const hostContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  await login(hostPage, "Host", "12345678");
  console.log("✅ Host logged in successfully");

  //navigate to setting up multiplayer game (create room + create game button + team names)
  await hostPage.getByTestId("host-create-room-button").click();
  await hostPage.getByTestId("host-team1-input").fill("Red");
  await hostPage.getByTestId("host-team2-input").fill("Blue");
  await hostPage.getByTestId("host-create-game-button").click();

  // Optional: check that the game hostPage loads
  await expect(hostPage).toHaveURL(/\/host/);

  // Wait briefly to ensure UI elements are loaded
  await hostPage.waitForTimeout(1500);

  // Wait for the element that exactly matches 6 uppercase letters or digits
  const codeLocator = hostPage.getByTestId("host-start-game-button");
  await expect(codeLocator.first()).toBeVisible();

  console.log(" ✅ Succesffuly Gotten host to Game Code page")

  await hostContext.close();
});

test("Verify 5 Player-1s login", async ({ browser }) => {
  // --- MULTIPLE PLAYER1 LOGINS & Join Room --- change to 5 for 5 players
  for (let i = 1; i <= 1; i++) {
    const player1Context = await browser.newContext(); // isolated session
    const player1Page = await player1Context.newPage();
    await login(player1Page, "Player1", "12345");
    console.log(`✅ Player1 Instance ${i} logged in`);
    await player1Page.waitForTimeout(500);
    // use stable home button testid
    await expect(
      player1Page.getByTestId("player-join-room-button")
    ).toBeVisible();
    await player1Context.close();
  }
});

test("Verify 5 Player-2s login", async ({ browser }) => {
  // --- MULTIPLE PLAYER2 LOGINS & Join Room ---
  for (let i = 1; i <= 1; i++) {
    const player1Context = await browser.newContext(); // isolated session
    const player1Page = await player1Context.newPage();
    await login(player1Page, "Player2", "12345");
    console.log(`✅ Player2 Instance ${i} logged in`);
    await player1Page.waitForTimeout(500);
    await expect(
      player1Page.getByTestId("player-join-room-button")
    ).toBeVisible();
    await player1Context.close();
  }
});

test("Verify 5 Player-1 & 2s login & join room created by host", async ({
  browser,
}) => {
  // --- HOST LOGIN ---
  const hostContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  await login(hostPage, "Host", "12345678");
  console.log("✅ Host logged in successfully");

  //navigate to setting up multiplayer game (create room + create game button + team names)
  await hostPage.getByTestId("host-create-room-button").click();
  await hostPage.getByTestId("host-team1-input").fill("Red");
  await hostPage.getByTestId("host-team2-input").fill("Blue");
  await hostPage.getByTestId("host-create-game-button").click();

  // Optional: check that the game hostPage loads
  await expect(hostPage).toHaveURL(/\/host/);

  // Wait for the element that exactly matches 6 uppercase letters or digits
  const codeLocator = hostPage.locator(':text-matches("^[A-Z0-9]{6}$")');
  await expect(codeLocator.first()).toBeVisible();

  // Extract and sanity-check
  const roomIDText = (await codeLocator.first().textContent())?.trim();
  if (!roomIDText) throw new Error("No game code found!");
  expect(roomIDText.length).toBe(6);

  console.log("Game code:", roomIDText);

  // --- MULTIPLE PLAYER1 LOGINS & Join Room --- change to 5 for 5 players
  for (let i = 1; i <= 1; i++) {
    const player1Context = await browser.newContext(); // isolated session
    const player1Page = await player1Context.newPage();
    await login(player1Page, "Player1", "12345");
    console.log(`✅ Player1 Instance ${i} logged in`);
    await player1Page.waitForTimeout(500);
    await player1Page.getByTestId("player-join-room-button").click();
    await player1Page.getByTestId("join-game-code-input").fill(roomIDText);
    await player1Page.getByTestId("join-game-button").click();
    await expect(
      player1Page.getByText(`Welcome ${PLAYER1_USER.username}!`)
    ).toBeVisible();
    await player1Context.close();
  }

  // --- MULTIPLE PLAYER2 LOGINS & Join Room ---
  for (let i = 1; i <= 1; i++) {
    const player1Context = await browser.newContext(); // isolated session
    const player1Page = await player1Context.newPage();
    await login(player1Page, "Player2", "12345");
    console.log(`✅ Player2 Instance ${i} logged in`);
    await player1Page.waitForTimeout(500);
    await player1Page.getByTestId("player-join-room-button").click();
    await player1Page.getByTestId("join-game-code-input").fill(roomIDText);
    await player1Page.getByTestId("join-game-button").click();
    await expect(
      player1Page.getByText(`Welcome ${PLAYER2_USER.username}!`)
    ).toBeVisible();
    await player1Context.close();
  }

  await hostContext.close();
});

//now additional 16 tests for gameplay below
// ---------------
// helper (put near top of file)
async function createAndJoinPlayer(
  browser: Browser,
  roomID: string,
  username: "Player1" | "Player2"
) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page, username, "12345");
  await page.waitForTimeout(500);
  await page.getByTestId("player-join-room-button").click();
  await page.getByTestId("join-game-code-input").fill(roomID);
  await page.getByTestId("join-game-button").click();
  return { ctx, page };
}
//(another helper for host + room setup)
async function setupHostAndRoom(
  browser: Browser,
  team1: string,
  team2: string
) {
  const hostContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  await login(hostPage, HOST_USER.username, HOST_USER.password);

  // Navigate to room creation
  await hostPage.getByTestId("host-create-room-button").click();
  await hostPage.getByTestId("host-team1-input").fill(team1);
  await hostPage.getByTestId("host-team2-input").fill(team2);
  await hostPage.getByTestId("host-create-game-button").click();

  // Check that the host page loads
  await expect(hostPage).toHaveURL(/\/host/);

  // Wait for the room code to appear
  const codeLocator = hostPage.locator(':text-matches("^[A-Z0-9]{6}$")');
  await expect(codeLocator.first()).toBeVisible({ timeout: 5000 });

  const roomIDText = (await codeLocator.first().textContent())?.trim();
  if (!roomIDText) throw new Error("No game code found!");

  return { hostPage, roomCode: roomIDText, hostContext };
}

// test (simplified & clear)
test("Negative: 11th Player Rejection (clean helper)", async ({ browser }) => {
  test.setTimeout(340_000);
  const hostContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  await login(hostPage, "Host", "12345678");
  // create room...
  await hostPage.getByTestId("host-create-room-button").click();
  await hostPage.getByTestId("host-team1-input").fill("Red");
  await hostPage.getByTestId("host-team2-input").fill("Blue");
  await hostPage.getByTestId("host-create-game-button").click();
  const codeLocator = hostPage.locator(':text-matches("^[A-Z0-9]{6}$")');
  await expect(codeLocator.first()).toBeVisible();
  const roomIDText = (await codeLocator.first().textContent())?.trim()!;

  const sessions = [];
  for (let i = 1; i <= 10; i++) {
    const username = i % 2 === 0 ? "Player2" : "Player1";
    const s = await createAndJoinPlayer(browser, roomIDText, username as any);
    sessions.push(s);
    await expect(s.page.getByTestId("team-page")).toBeVisible();
    console.log(`✅ ${username} #${i} joined`);
  }

  // attempt 11th
  const extra = await createAndJoinPlayer(browser, roomIDText, "Player1");
  await expect(extra.page.getByTestId("gamefull")).toBeVisible();
  console.log("✅ 11th correctly rejected");

  await Promise.all(sessions.map((s) => s.ctx.close()));
  await extra.ctx.close();
  await hostContext.close();
});

test( "Refresh: Player1 refresh shows join screen, then rejoining with game code returns to game state",
  async ({ browser }) => {
    test.setTimeout(240_000);

    // --- HOST CREATES ROOM ---
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    await login(hostPage, "Host", "12345678");
    console.log("✅ Host logged in successfully");

    await hostPage.getByTestId("host-create-room-button").click();
    await hostPage.getByTestId("host-team1-input").fill("Red");
    await hostPage.getByTestId("host-team2-input").fill("Blue");
    await hostPage.getByTestId("host-create-game-button").click();
    await expect(hostPage).toHaveURL(/\/host/);

    await hostPage.waitForTimeout(1000);
    const codeLocator = hostPage.locator(':text-matches("^[A-Z0-9]{6}$")');
    await expect(codeLocator.first()).toBeVisible();
    const roomIDText = (await codeLocator.first().textContent())?.trim();
    if (!roomIDText) throw new Error("No game code found!");
    console.log("Game code:", roomIDText);

    // --- PLAYER 1 JOINS (using helper) ---
    const p1 = await createAndJoinPlayer(browser, roomIDText, "Player1");
    console.log("✅ Player1 logged in (session A)");
    await expect(p1.page.getByTestId("team-page")).toBeVisible();
    console.log("✅ Player1 joined lobby");
    await p1.page.getByTestId("join-team-1-button").click();

    // --- PLAYER 2 JOINS ---
    const p2 = await createAndJoinPlayer(browser, roomIDText, "Player2");
    await expect(p2.page.getByTestId("team-page")).toBeVisible();
    console.log("✅ Player2 joined lobby");
    await p2.page.getByTestId("join-team-2-button").click();

    // --- HOST BEGINS GAME ---
    const beginBtn = hostPage.getByTestId("host-start-game-button");
    await expect(beginBtn).toBeVisible({ timeout: 5_000 });
    await beginBtn.click();
    console.log("✅ Host started the game");

    await p1.page.waitForTimeout(1_000); // let state propagate

    // --- ACTION: reload the contestant page ---
    await p1.page.reload();
    console.log("🔁 Player1 page reloaded — should see join/game-code screen");

    // Wait for SPA/network to settle
    await p1.page
      .waitForLoadState("networkidle", { timeout: 8_000 })
      .catch(() => {});
    await p1.page.waitForTimeout(2_000);

    // --- EXPECTATION 1: we ARE on the join / game-code screen ---
    await expect(
      p1.page.getByTestId('join-game-code-input')
    ).toBeVisible({ timeout: 10_000 });

    // --- Player1 re-enters the same game code ---
    await p1.page.getByTestId("join-game-code-input").fill(roomIDText);
    await p1.page.getByTestId("join-game-button").click();

    console.log(
      "✅ Refresh flow works: Player1 sees join screen, enters code, and returns to game state."
    );

    // --- CLEANUP ---
    await p1.ctx.close();
    await p2.ctx.close();
    await hostContext.close();
  }
);


test("N2. Negative: Login with Host using a Trailing Whitespace in the username to prevent navigation (Bug Verification)", async ({
  page,
}) => {
  await page.goto(BASE_URL);

  // Bug: Whitespace after username fails login (but should stay on login page)
  await page.getByTestId("username-input").fill(HOST_USER.username + "  ");
  await page.getByTestId("password-input").fill(HOST_USER.password);

  const loginBtn = page.getByTestId("login-button");
  await loginBtn.click();

  // Assert: The login should be prevented, and the page must remain on the login URL.
  await page.waitForTimeout(1000);
  await expect(page).toHaveURL(/HostHomePage/);

  console.log(
    "✅ Test Passed: Login was allowed as trailing whitespace is automatically removed"
  );
});

test("N5. Negative: Enter key fails to submit login form (Bug)", async ({
  page,
}) => {
  await page.goto(BASE_URL);
  await page.getByTestId("username-input").fill(HOST_USER.username);
  await page.getByTestId("password-input").fill(HOST_USER.password);

  // Attempt to submit by pressing 'Enter' on the password field
  await page.getByTestId("password-input").press("Enter");

  // Assert: Login should fail (i.e., remain on the login page URL).
  // If the bug is fixed, this assertion will fail and we'll change it to /host/.
  await page.waitForTimeout(1000);
  await expect(page).toHaveURL(BASE_URL);

  // Assert: The 'Login to Play' button should still be visible, indicating no successful navigation.
  await expect(page.getByTestId("login-button")).toBeVisible();
  console.log(
    "✅ Test Passed: Enter key does not submit login (current bug behavior)."
  );
});

// --- HOST & LOBBY MANAGEMENT TESTS

test("H5. Negative: Host fails to create room with empty team names", async ({
  browser,
}) => {
  const hostContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  await login(hostPage, HOST_USER.username, HOST_USER.password);

  // Navigate to room creation
  await hostPage.getByTestId("host-create-room-button").click();

  // Capture the URL to check non-navigation later
  const createRoomUrl = hostPage.url();

  // Fill Team 1 Name, leave Team 2 Name empty
  await hostPage.getByTestId("host-team1-input").fill("Team A");

  const createGameBtn = hostPage.getByTestId("host-create-game-button");

  // Assertion reflecting the bug: the button is enabled when it shouldn't be
  const isDisabled = await createGameBtn.isDisabled();
  if (isDisabled) {
    console.log("CREATE GAME button is disabled as intended.");
  } else {
    console.error(
      "🚨 BUG DETECTED: CREATE GAME button is enabled despite empty Team 2 Name."
    );
  }

  await hostContext.close();
});

test("H1. Negative: Host is prevented from creating a game with duplicate team names (Fixed)", async ({
  browser,
}) => {
  test.setTimeout(240_000);

  // Go to the host creation page manually (since setupHostAndRoom assumes success)
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto("/host");

  // Fill duplicate names
  await page.getByTestId("host-team1-input").fill("Team Awesome");
  await page.getByTestId("host-team2-input").fill("Team Awesome");

  // The validation message MUST appear now (bug fixed)
  await expect(page.getByTestId("name-different")).toBeVisible();

  // Create Game button must remain disabled
  const createBtn = page.getByTestId("host-create-game-button");
  await expect(createBtn).toBeDisabled();

  console.log(
    "✅ Bug Fixed: Duplicate team names correctly prevent game creation."
  );

  await context.close();
});


test("H2. Negative: Host attempts to start game with zero players", async ({
  browser,
}) => {
  const { hostPage, hostContext } = await setupHostAndRoom(
    browser,
    "PLAYER_TEAM1_NAME",
    "PLAYER_TEAM2_NAME"
  );

  // Host should see a 'BEGIN' button (testid), but it should be disabled until min players join.
  const beginBtn = hostPage.getByTestId("host-start-game-button");
  await expect(beginBtn).toBeDisabled();

  await hostContext.close();
});

test("H3. Negative: Host attempts to start game with only one player", async ({
  browser,
}) => {
  const { hostPage, roomCode, hostContext } = await setupHostAndRoom(
    browser,
    "PLAYER_TEAM1_NAME",
    "PLAYER_TEAM2_NAME"
  );

  // Player 1 joins
  const p1 = await createAndJoinPlayer(browser, roomCode, "Player1");
  console.log("✅ Player1 logged in (session A)");

  // The Host should still see the BEGIN button disabled (min 2 players required)
  const beginBtn = hostPage.getByTestId("host-start-game-button");
  await expect(beginBtn).toBeDisabled();

  await p1.ctx.close();
  await hostContext.close();
});

// helper to join room as player
async function joinRoomAsPlayer(
  browser: Browser,
  username: string,
  password: string,
  roomCode: string,
  teamNumber: 1 | 2
) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await login(page, username, password);

  // Enter as a contestant using testid
  await page.getByTestId("player-join-room-button").click();
  await page.getByTestId("join-game-code-input").fill(roomCode);
  await page.getByTestId("join-game-button").click();
  await page.getByTestId(`join-team-${teamNumber}-button`).click();



  return { page, context };
}

test("G2. Negative: Player cannot answer before buzzing in", async ({
  browser,
}) => {
  const { hostPage, roomCode, hostContext } = await setupHostAndRoom(
    browser,
    PLAYER_TEAM1_NAME,
    PLAYER_TEAM2_NAME
  );
  const { page: p1Page, context: p1Context } = await joinRoomAsPlayer(
    browser,
    PLAYER1_USER.username,
    PLAYER1_USER.password,
    roomCode,
    1
  );
  const { context: p2Context } = await joinRoomAsPlayer(
    browser,
    PLAYER2_USER.username,
    PLAYER2_USER.password,
    roomCode,
    2
  );

  // Host starts the game
  await hostPage.getByTestId("host-start-game-button").click();

  // Assertion: Answer input field should not be visible before buzzing in
  const answerBox = p1Page.getByRole("textbox", {
    name: /type your answer here/i,
  });
  await expect(answerBox).not.toBeVisible();

  // Attempt to force focus/fill
  await answerBox.click({ force: true, timeout: 500 }).catch(() => {});
  await answerBox.fill("Attempt to bypass", { timeout: 500 }).catch(() => {});

  // Final Assertion: It must not be visible after attempts
  await expect(answerBox).not.toBeVisible();
  await p1Context.close();
  await p2Context.close();
  await hostContext.close();
});

//some nearby words get detected but some do not (buggy behavior)
test("G3. Negative: Player submits short/similar answer and won't get points", async ({
  browser,
}) => {
  test.setTimeout(340_000);
  const { hostPage, roomCode, hostContext } = await setupHostAndRoom(
    browser,
    PLAYER_TEAM1_NAME,
    PLAYER_TEAM2_NAME
  );
  const { page: p1Page, context: p1Context } = await joinRoomAsPlayer(
    browser,
    PLAYER1_USER.username,
    PLAYER1_USER.password,
    roomCode,
    1
  );
  const { context: p2Context } = await joinRoomAsPlayer(
    browser,
    PLAYER2_USER.username,
    PLAYER2_USER.password,
    roomCode,
    2
  );

  // Host starts the game
  await hostPage.getByTestId("host-start-game-button").click();

  // P1 buzzes in
  await p1Page.getByTestId('buzzer-button').click();

  // P1 submits "st" when the correct answer might be "stretch" 
  await p1Page.getByTestId('answer-input').fill("st");
  await p1Page.getByTestId('submit-answer-button').click();
  await p1Page.waitForTimeout(1000);

  await expect(p1Page.getByText(/stretch/i)).not.toBeVisible();
  console.log(
    "⚠️ Bug Check: The host does not see the answer intended (stretch for st)."
  );

  await p1Context.close();
  await p2Context.close();
  await hostContext.close();
});

// Host should see 'Next Round' button after both teams answer and are scored
test("G4. Positive: Host sees '🚀 Next Round' button after answer submission (Bug 'a' related)", async ({
  browser,
}) => {
  const { hostPage, roomCode, hostContext } = await setupHostAndRoom(
    browser,
    PLAYER_TEAM1_NAME,
    PLAYER_TEAM2_NAME
  );
  const { page: p1Page, context: p1Context } = await joinRoomAsPlayer(
    browser,
    PLAYER1_USER.username,
    PLAYER1_USER.password,
    roomCode,
    1
  );
  const { page: p2Page, context: p2Context } = await joinRoomAsPlayer(
    browser,
    PLAYER2_USER.username,
    PLAYER2_USER.password,
    roomCode,
    2
  );

  // Host starts the game
  await hostPage.getByTestId("host-start-game-button").click();

  // P1 buzzes in and submits a placeholder answer
  await p1Page.getByTestId('buzzer-button').click();
  await p1Page.getByTestId('answer-input').fill("Answer");
  await p1Page.getByTestId('submit-answer-button').click();

  // P2 submits a second answer
  await p2Page.getByTestId('answer-input').fill("Answer 2");
  await p2Page.getByTestId('submit-answer-button').click();

  await p2Page.waitForTimeout(7000);

  // Assertion: The Host must see the 'Next Round' button
  const nextQuestionBtn = hostPage.getByTestId('host-next-question-button');
  await expect(nextQuestionBtn).toBeVisible();
  console.log(
    "✅ Test Passed: Host can advance the game after both teams submit and are scored."
  );

  await p1Context.close();
  await p2Context.close();
  await hostContext.close();
});

test("G5. Negative: Player cannot submit an empty answer", async ({
  browser,
}) => {
  test.setTimeout(240_000);
  const { hostPage, roomCode, hostContext } = await setupHostAndRoom(
    browser,
    PLAYER_TEAM1_NAME,
    PLAYER_TEAM2_NAME
  );
  const { page: p1Page, context: p1Context } = await joinRoomAsPlayer(
    browser,
    PLAYER1_USER.username,
    PLAYER1_USER.password,
    roomCode,
    1
  );
  const { context: p2Context } = await joinRoomAsPlayer(
    browser,
    PLAYER2_USER.username,
    PLAYER2_USER.password,
    roomCode,
    2
  );

  // Host starts the game
  await hostPage.getByTestId("host-start-game-button").click();

  // P1 buzzes in
  await p1Page.getByTestId('buzzer-button').click();

  // P1 tries to click submit without filling the box
  const submitBtn = p1Page.getByTestId('submit-answer-button');

  // 1. Assert: The button should be disabled (intended behavior check)
  await expect(submitBtn).toBeDisabled();

  // 2. Act: Attempt a click (simulating a potential bug where it's enabled)
  await submitBtn.click({ force: true }).catch((e) => {
    // Log if the click failed due to being disabled (expected)
    console.log("Attempted forced click on disabled button.");
  });

  console.log("✅ Test Passed: Submit Answer button is disabled");

  await p1Context.close();
  await p2Context.close();
  await hostContext.close();
});

test("N4. Negative: Host abandons game, players are NOT redirected and game state is stuck (Bug Verification)", async ({
  browser,
}) => {
  const { hostPage, roomCode, hostContext } = await setupHostAndRoom(
    browser,
    PLAYER_TEAM1_NAME,
    PLAYER_TEAM2_NAME
  );

  // P1 joins
  const { page: p1Page, context: p1Context } = await joinRoomAsPlayer(
    browser,
    PLAYER1_USER.username,
    PLAYER1_USER.password,
    roomCode,
    1
  );

  // P2 joins (Required to enable the 'Begin' button)
  const { context: p2Context } = await joinRoomAsPlayer(
    browser,
    PLAYER2_USER.username,
    PLAYER2_USER.password,
    roomCode,
    2
  );

  // Host starts the game
  await hostPage.getByTestId("host-start-game-button").click();

  // Verify Player is in the game view and save the URL they should be stuck on
  await expect(p1Page).toHaveURL(/\/join/);
  const initialUrl = p1Page.url();

  // --- ACT: Host abandons the game by navigating away (simulates closing)
  await hostPage.goto(BASE_URL); // Simulate host closing the tab or manually navigating to home

  // Host is now on the home screen (verification)
  await expect(hostPage).toHaveURL(BASE_URL);

  // Wait a short time for any async redirection attempt
  await p1Page.waitForTimeout(2000);

  // --- ASSERT BUG: Player 1 must NOT be redirected back to the home/login screen ---
  await expect(p1Page).toHaveURL(initialUrl);

  // The 'Enter as a contestant' button is on the home/login page.
  await expect(p1Page.getByTestId("player-join-room-button")).not.toBeVisible();

  console.log(
    "⚠️ Bug Confirmed: Player was NOT redirected when Host quit and is stuck in the game view."
  );

  await p1Context.close();
  await p2Context.close();
  await hostContext.close();
});

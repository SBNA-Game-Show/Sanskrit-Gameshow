import { v4 as uuidv4 } from "uuid";
import fs from "fs";

// In-memory storage
export let games = {};
export let players = {};

function shuffleArray(array) {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}
// Generate random game code
export function generateGameCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

// In gameService.js - Add this new function

export function setGameQuestions(
  gameCode,
  selectedQuestionIds,
  tossUpQuestionId
) {
  const game = games[gameCode];
  if (!game) {
    return { success: false, message: "Game not found" };
  }

  // --- 1. SET TOSS-UP ---
  const tossUpQuestion = game.questions.find((q) => q._id === tossUpQuestionId);
  if (!tossUpQuestion) {
    return { success: false, message: "Selected toss-up question not found" };
  }
  game.gameState.tossUpQuestion = {
    ...tossUpQuestion,
    round: 0,
    questionNumber: 1,
  };

  // --- 2. PREPARE FINAL QUESTION LIST ---
  // Get all *other* selected questions
  const selectedQuestions = game.questions.filter(
    (q) => selectedQuestionIds.includes(q._id) && q._id !== tossUpQuestionId
  );

  const finalOrderedQuestions = [];

  // --- 3. PROCESS ROUNDS 1, 2, 3 ---
  for (let roundNum = 1; roundNum <= 3; roundNum++) {
    // Get all selected questions for this round
    let roundQuestions = selectedQuestions.filter((q) => q.round === roundNum);

    // Shuffle them to randomize who gets which question
    shuffleArray(roundQuestions);

    // Assign team and question number
    const team1Questions = [];
    const team2Questions = [];

    roundQuestions.forEach((q, index) => {
      const questionNumber = Math.floor(index / 2) + 1;
      if (index % 2 === 0) {
        // Even index (0, 2, 4) -> Team 1
        team1Questions.push({
          ...q,
          teamAssignment: "team1",
          questionNumber,
        });
      } else {
        // Odd index (1, 3, 5) -> Team 2
        team2Questions.push({
          ...q,
          teamAssignment: "team2",
          questionNumber,
        });
      }
    });

    // Add them to the final list, ordered by team
    // This order is CRITICAL for the game logic
    finalOrderedQuestions.push(...team1Questions, ...team2Questions);
  }

  // --- 4. PROCESS ROUND 4 ---
  const round4Questions = selectedQuestions
    .filter((q) => q.round === 4)
    .sort((a, b) => a.questionNumber - b.questionNumber); // Sort by pre-assigned number

  finalOrderedQuestions.push(...round4Questions);

  // --- 5. SET GAME QUESTIONS ---
  game.questions = finalOrderedQuestions;

  console.log(
    `Game ${gameCode} now has ${game.questions.length} ordered questions`
  );
  console.log(
    `Toss-up question set for ${gameCode}: ${game.gameState.tossUpQuestion.question}`
  );

  return { success: true, game };
}

// Initialize question data structure
export function initializeQuestionData() {
  return {
    team1: {
      round1: [
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
      ],
      round2: [
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
      ],
      round3: [
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
      ],
      round4: [
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
      ],
    },
    team2: {
      round1: [
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
      ],
      round2: [
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
      ],
      round3: [
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
      ],
      round4: [
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
      ],
    },
  };
}

// Get current question based on game state
export function getCurrentQuestion(game) {
  if (game.currentRound === 0 && game.gameState.tossUpQuestion) {
    return game.gameState.tossUpQuestion;
  }
  if (game.currentQuestionIndex < game.questions.length) {
    return game.questions[game.currentQuestionIndex];
  }
  return null;
}

// Get questions for a specific team and round
export function getQuestionsForTeamRound(team, round) {
  return mockQuestions.filter(
    (q) => q.teamAssignment === team && q.round === round
  );
}

// Determine next question index based on turn logic
export function getNextQuestionIndex(game) {
  if (game.currentRound === 4) {
    return game.currentQuestionIndex + 1;
  }

  const currentQuestion = getCurrentQuestion(game);
  if (!currentQuestion) return game.currentQuestionIndex;

  const currentTeam = game.gameState.currentTurn;
  const otherTeam = currentTeam === "team1" ? "team2" : "team1";
  const questionsAnswered = game.gameState.questionsAnswered[currentTeam];

  // If current team has answered all 3 questions, switch to other team
  if (questionsAnswered >= 3) {
    // If the other team still has questions left, jump to their next one
    if (game.gameState.questionsAnswered[otherTeam] < 3) {
      const otherTeamQuestions = game.questions.filter(
        (q) => q.teamAssignment === otherTeam && q.round === game.currentRound
      );
      if (otherTeamQuestions.length > 0) {
        return game.questions.findIndex(
          (q) => q._id === otherTeamQuestions[0]._id
        );
      }
    } else {
      // Both teams finished, move on
      return game.currentQuestionIndex + 1;
    }
  } else {
    // Continue with current team's next question
    const teamQuestions = game.questions.filter(
      (q) => q.teamAssignment === currentTeam && q.round === game.currentRound
    );
    const nextTeamQuestion = teamQuestions[questionsAnswered];
    if (nextTeamQuestion) {
      return game.questions.findIndex((q) => q._id === nextTeamQuestion._id);
    }
  }

  return game.currentQuestionIndex + 1;
}

// Check if round is complete
export function isRoundComplete(game) {
  return (
    game.gameState.questionsAnswered.team1 >= 3 &&
    game.gameState.questionsAnswered.team2 >= 3
  );
}

// Start new round
function startNewRound(game) {
  game.currentRound += 1;
  game.gameState.questionsAnswered.team1 = 0;
  game.gameState.questionsAnswered.team2 = 0;
  game.gameState.canAdvance = false;

  // Determine which team should start this round.
  // By default team1 would start, but after the toss-up the winning team
  // should begin every subsequent round.
  let startingTeam = "team1";
  if (game.tossUpWinner && game.tossUpWinner.teamId) {
    startingTeam = game.tossUpWinner.teamId.includes("team1")
      ? "team1"
      : "team2";
  }
  game.gameState.currentTurn = startingTeam;

  // Reset round scores
  game.teams.forEach((team) => {
    team.currentRoundScore = 0;
  });

  if (game.currentRound !== 4) {
    // Set to first question of new round for the starting team
    const firstQuestion = game.questions.find(
      (q) =>
        q.teamAssignment === startingTeam &&
        q.round === game.currentRound &&
        q.questionNumber === 1
    );

    if (firstQuestion) {
      game.currentQuestionIndex = game.questions.findIndex(
        (q) => q._id === firstQuestion._id
      );
    }
  } else {
    // âš¡ Lightning Round (Round 4) fix
    const firstLightningQuestion = game.questions.find((q) => q.round === 4);
    if (firstLightningQuestion) {
      game.currentQuestionIndex = game.questions.findIndex(
        (q) => q._id === firstLightningQuestion._id
      );
      console.log(
        `⚡ Lightning Round started at index ${game.currentQuestionIndex}`
      );
    } else {
      console.error("⚠️No Lightning Round questions found in game.questions!");
      game.currentQuestionIndex = 0; // safe fallback
    }
  }

  // Update team active status
  updateTeamActiveStatus(game);
}

// Update which team is active
export function updateTeamActiveStatus(game) {
  game.teams.forEach((team) => {
    if (game.gameState.currentTurn === "team1") {
      team.active = team.id.includes("team1") || team.name.includes("1");
    } else if (game.gameState.currentTurn === "team2") {
      team.active = team.id.includes("team2") || team.name.includes("2");
    } else {
      team.active = false;
    }
  });
}

// Create a new game (SINGLE ATTEMPT + Question Data)
export async function createGame(updatedQuestions, tossUpQuestion, teamNames) {
  if (
    teamNames?.team1?.trim().toLowerCase() ===
    teamNames?.team2?.trim().toLowerCase()
  ) {
    throw new Error("Team names must be different (case-insensitive).");
  }

  const gameCode = generateGameCode();
  const gameId = uuidv4();

  console.log("Questions Fetched: ", updatedQuestions);

  console.log("TossUpQuestion Fetched ", tossUpQuestion);

  games[gameCode] = {
    id: gameId,
    code: gameCode,
    status: "waiting",
    currentQuestionIndex: 0,
    currentRound: 0,
    questions: JSON.parse(JSON.stringify(updatedQuestions)),
    teams: [
      {
        id: uuidv4() + "_team1",
        name: teamNames?.team1 || "Team 1",
        score: 0,
        active: false,
        members: [],
        roundScores: [0, 0, 0, 0],
        currentRoundScore: 0,
      },
      {
        id: uuidv4() + "_team2",
        name: teamNames?.team2 || "Team 2",
        score: 0,
        active: false,
        members: [],
        roundScores: [0, 0, 0, 0],
        currentRoundScore: 0,
      },
    ],
    players: [],
    hostId: null,
    createdAt: new Date(),
    buzzedTeamId: null,
    activeTeamId: null,
    // Stores the winning team of the toss-up round so that
    // subsequent rounds start with the correct team
    tossUpWinner: null,
    disableForceNext: false,
    gameState: {
      currentTurn: null,
      questionsAnswered: {
        team1: 0,
        team2: 0,
      },
      roundScores: {
        round1: { team1: 0, team2: 0 },
        round2: { team1: 0, team2: 0 },
        round3: { team1: 0, team2: 0 },
        round4: { team1: 0, team2: 0 },
      },
      tossUpQuestion: JSON.parse(JSON.stringify(tossUpQuestion)),
      awaitingAnswer: false,
      canAdvance: false,
      questionData: initializeQuestionData(),
    },
    tossUpAnswers: [], // Stores both team responses
    tossUpSubmittedTeams: [], // To track who already answered
    tossUpComplete: false,
    lightningRoundSubmittedTeams: [],
    pauseTimer: false,
  };

  console.log(
    `🎮 Single-attempt game created with question tracking: ${gameCode}`
  );
  return { game: games[gameCode] };
}

// Start the game (called by host)
export function startGame(gameCode) {
  const game = games[gameCode];
  if (!game) return null;

  game.status = "active";
  // No team is active during the toss-up until a buzz occurs
  game.gameState.currentTurn = null;
  game.gameState.awaitingAnswer = true;
  game.gameState.canAdvance = false;

  // Set to first question (should be team1's first question)
  const firstQuestion = game.questions.find(
    (q) =>
      q.teamAssignment === "team1" && q.round === 1 && q.questionNumber === 1
  );

  if (firstQuestion) {
    game.currentQuestionIndex = game.questions.findIndex(
      (q) => q._id === firstQuestion._id
    );
  }

  updateTeamActiveStatus(game);

  return game;
}

// Update question data in game state
export function updateQuestionData(
  game,
  teamKey,
  round,
  questionNumber,
  isCorrect,
  points
) {
  const roundKey = `round${round}`;
  const questionIndex = questionNumber - 1; // Convert to 0-based index

  if (
    game.gameState.questionData[teamKey] &&
    game.gameState.questionData[teamKey][roundKey] &&
    game.gameState.questionData[teamKey][roundKey][questionIndex]
  ) {
    // Only update if this is the first attempt (firstAttemptCorrect is null)
    if (
      game.gameState.questionData[teamKey][roundKey][questionIndex]
        .firstAttemptCorrect === null
    ) {
      game.gameState.questionData[teamKey][roundKey][
        questionIndex
      ].firstAttemptCorrect = isCorrect;
    }

    // Always update points earned (could increase with correct answers)
    game.gameState.questionData[teamKey][roundKey][questionIndex].pointsEarned =
      points;
  }
}

// Override question data in game state (host override)
export function overrideQuestionData(
  game,
  teamKey,
  round,
  questionNumber,
  isCorrect,
  points
) {
  const roundKey = `round${round}`;
  const questionIndex = questionNumber - 1;
  if (
    game.gameState.questionData[teamKey] &&
    game.gameState.questionData[teamKey][roundKey] &&
    game.gameState.questionData[teamKey][roundKey][questionIndex]
  ) {
    game.gameState.questionData[teamKey][roundKey][
      questionIndex
    ].firstAttemptCorrect = isCorrect;
    game.gameState.questionData[teamKey][roundKey][questionIndex].pointsEarned =
      points;
  }
}

// Host override an answer after submission
export function overrideAnswer(
  gameCode,
  teamId,
  round,
  questionNumber,
  isCorrect,
  points,
  answerIndex
) {
  const game = games[gameCode];
  if (!game) return { success: false, message: "Game not found" };
  const team = game.teams.find((t) => t.id === teamId);
  if (!team) return { success: false, message: "Team not found" };
  const teamKey = teamId.includes("team1") ? "team1" : "team2";
  const currentPoints =
    game.gameState.questionData?.[teamKey]?.[`round${round}`]?.[
      questionNumber - 1
    ]?.pointsEarned || 0;
  const diff = points - currentPoints;
  team.score += diff;
  team.currentRoundScore += diff;
  overrideQuestionData(game, teamKey, round, questionNumber, isCorrect, points);

  // Reveal the specified answer if provided
  if (typeof answerIndex === "number") {
    const question = game.questions.find(
      (q) =>
        q.teamAssignment === teamKey &&
        q.round === round &&
        q.questionNumber === questionNumber
    );
    if (question && question.answers[answerIndex]) {
      question.answers[answerIndex].revealed = true;
    }
  }

  updateGame(gameCode, game);
  return {
    success: true,
    game,
    teamId,
    teamName: team.name,
    round,
    questionNumber,
    pointsAwarded: points,
    isCorrect,
  };
}

// Submit an answer
export function submitAnswer(gameCode, playerId, answerText) {
  const game = games[gameCode];
  const player = players[playerId];

  if (!game || !player || game.status !== "active") {
    return { success: false, message: "Invalid game state" };
  }

  const currentQuestion = getCurrentQuestion(game);
  if (!currentQuestion) {
    return { success: false, message: "No current question" };
  }

  const playerTeam = game.teams.find((t) => t.id === player.teamId);
  if (!playerTeam) {
    return { success: false, message: "Invalid team" };
  }

  // âœ… TOSS-UP ROUND LOGIC
  if (game.currentRound === 0) {
    if (!game.tossUpSubmittedTeams) game.tossUpSubmittedTeams = [];
    if (!game.tossUpAnswers) game.tossUpAnswers = [];

    if (game.tossUpSubmittedTeams.includes(player.teamId)) {
      return {
        success: false,
        message: "Your team has already answered the toss-up",
      };
    }

    const matchingAnswer = checkAnswerMatch(
      answerText,
      currentQuestion.answers
    );
    const score = matchingAnswer ? matchingAnswer.score : 0;
    if (score > 0) {
      playerTeam.currentRoundScore = score;
    }

    game.tossUpAnswers.push({
      teamId: player.teamId,
      teamName: playerTeam.name,
      playerName: player.name,
      answer: answerText,
      score,
      matchingAnswer,
    });

    game.tossUpSubmittedTeams.push(player.teamId);

    // Reveal answer immediately
    if (matchingAnswer) matchingAnswer.revealed = true;

    const response = {
      success: true,
      isCorrect: !!matchingAnswer,
      pointsAwarded: score,
      matchingAnswer,
      playerName: player.name,
      teamName: playerTeam.name,
      teamId: playerTeam.id,
      submittedText: answerText,
      game: game,
      singleAttempt: true,
      tossUp: true,
      revealAllCards: !matchingAnswer,
    };

    // If both teams answered, just store the winning team for the next round
    if (game.tossUpSubmittedTeams.length === 2) {
      const best = game.tossUpAnswers.reduce((a, b) =>
        a.score > b.score ? a : b
      );

      game.tossUpWinner = best;
      game.tossUpComplete = true;

      // No round advancement here; host will continue to next round
    }

    return response;
  }

  // âœ… LIGHTNING ROUND LOGIC (Round 4)
  // âœ… LIGHTNING ROUND LOGIC (Round 4)
  if (game.currentRound === 4) {
    if (!game.lightningRoundSubmittedTeams)
      game.lightningRoundSubmittedTeams = [];

    // Check if this team has already answered THIS SPECIFIC QUESTION
    const currentQuestionId = currentQuestion._id;
    const teamQuestionKey = `${currentQuestionId}_${player.teamId}`;

    if (game.lightningRoundSubmittedTeams.includes(teamQuestionKey)) {
      return {
        success: false,
        message: "Your team has already answered this question",
      };
    }

    const matchingAnswer = checkAnswerMatch(
      answerText,
      currentQuestion.answers
    );
    const teamKey = player.teamId.includes("team1") ? "team1" : "team2";
    const otherTeamKey = teamKey === "team1" ? "team2" : "team1";

    // Mark this team as having answered this specific question
    game.lightningRoundSubmittedTeams.push(teamQuestionKey);

    let result = {
      success: true,
      isCorrect: false,
      pointsAwarded: 0,
      matchingAnswer: null,
      playerName: player.name,
      teamName: playerTeam.name,
      teamId: playerTeam.id,
      game: null,
      shouldAdvance: false, // Don't auto-advance in lightning round
      revealAllCards: false,
      revealRemainingAfterDelay: false,
      submittedText: answerText,
      singleAttempt: true,
      lightningRound: true,
    };

    if (matchingAnswer && matchingAnswer.score > 0) {
      // Correct answer
      matchingAnswer.revealed = true;
      const points = matchingAnswer.score * game.currentRound;

      playerTeam.score += points;
      playerTeam.currentRoundScore += points;

      result.isCorrect = true;
      result.pointsAwarded = points;
      result.matchingAnswer = matchingAnswer;
      result.revealRemainingAfterDelay = true;
      result.shouldAdvance = true; // Advance to next question on correct answer

      // Update question data for CORRECT team
      const questionNumber =
        game.currentQuestionIndex -
        game.questions.findIndex((q) => q.round === 4) +
        1;
      updateQuestionData(game, teamKey, 4, questionNumber, true, points);

      // Mark the OTHER team as incorrect for this question (they didn't get it right)
      updateQuestionData(game, otherTeamKey, 4, questionNumber, false, 0);

      console.log(
        `✅ Lightning Round: ${playerTeam.name} answered correctly: "${answerText}" = "${matchingAnswer.answer}" (+${points} pts)`
      );
    } else {
      // Wrong answer - reveal the clicked answer as incorrect
      const clickedAnswer = currentQuestion.answers.find(
        (a) => a.answer.toLowerCase().trim() === answerText.toLowerCase().trim()
      );

      if (clickedAnswer) {
        clickedAnswer.revealed = true;
      }

      result.isCorrect = false;
      result.revealAllCards = false;
      result.shouldAdvance = false; // Don't advance yet - wait to see if other team answers

      // Update question data for WRONG attempt
      const questionNumber =
        game.currentQuestionIndex -
        game.questions.findIndex((q) => q.round === 4) +
        1;
      updateQuestionData(game, teamKey, 4, questionNumber, false, 0);

      console.log(
        `❌ Lightning Round: ${playerTeam.name} answered incorrectly: "${answerText}"`
      );

      // Check if the other team has already answered this question
      const otherTeamQuestionKey = `${currentQuestionId}_${
        game.teams.find((t) => t.id.includes(otherTeamKey)).id
      }`;
      const otherTeamAnswered =
        game.lightningRoundSubmittedTeams.includes(otherTeamQuestionKey);

      if (!otherTeamAnswered) {
        // Other team hasn't answered yet - wait for them
        console.log(
          `⚡ Lightning Round: Waiting for ${otherTeamKey} to answer`
        );
        result.waitingForOtherTeam = true;
      } else {
        // Both teams answered incorrectly - reveal all and move on
        currentQuestion.answers.forEach((answer) => {
          answer.revealed = true;
        });
        result.revealAllCards = true;
        result.shouldAdvance = true;
        console.log(
          `❌ Lightning Round: Both teams answered incorrectly - revealing all answers and advancing`
        );
      }
    }

    result.game = games[gameCode];
    return result;
  }

  // âœ… REGULAR ROUND LOGIC (Rounds 1-3)
  if (!playerTeam.active) {
    return { success: false, message: "Not your team's turn" };
  }

  const matchingAnswer = checkAnswerMatch(answerText, currentQuestion.answers);

  let result = {
    success: true,
    isCorrect: false,
    pointsAwarded: 0,
    matchingAnswer: null,
    playerName: player.name,
    teamName: playerTeam.name,
    teamId: playerTeam.id,
    game: null,
    shouldAdvance: true,
    revealAllCards: false,
    revealRemainingAfterDelay: false,
    submittedText: answerText,
    singleAttempt: true,
  };

  if (matchingAnswer) {
    matchingAnswer.revealed = true;
    const points = matchingAnswer.score * game.currentRound;

    playerTeam.score += points;
    playerTeam.currentRoundScore += points;

    result.isCorrect = true;
    result.pointsAwarded = points;
    result.matchingAnswer = matchingAnswer;
    result.revealRemainingAfterDelay = true; // Reveal remaining cards after 2 seconds

    // Update question data
    const teamKey = game.gameState.currentTurn;
    const currentRound = game.currentRound;
    const questionNumber = game.gameState.questionsAnswered[teamKey] + 1;
    updateQuestionData(
      game,
      teamKey,
      currentRound,
      questionNumber,
      true,
      points
    );

    console.log(
      `✅ Correct answer: "${answerText}" = "${matchingAnswer.answer}" (+${points} pts) - Will reveal remaining cards after 2s`
    );
  } else {
    // Wrong answer - REVEAL ALL CARDS IMMEDIATELY
    currentQuestion.answers.forEach((answer) => {
      answer.revealed = true;
    });

    result.isCorrect = false;
    result.revealAllCards = true;

    // Update question data for wrong attempt
    const teamKey = game.gameState.currentTurn;
    const currentRound = game.currentRound;
    const questionNumber = game.gameState.questionsAnswered[teamKey] + 1;
    updateQuestionData(game, teamKey, currentRound, questionNumber, false, 0);

    console.log(
      `❌ Wrong answer: "${answerText}" - All cards revealed, moving to next question`
    );
  }

  // Don't advance the game state here - let the socket handler do it after appropriate delays
  result.game = games[gameCode];
  return result;
}

export function advanceGameState(gameCode) {
  const game = games[gameCode];
  if (!game) return null;

  // Lightning round has different advancement logic
  if (game.currentRound === 4) {
    // Simply move to the next question
    const nextQuestionIndex = game.currentQuestionIndex + 1;

    // Check if we've reached the end of lightning round questions
    const lightningQuestions = game.questions.filter((q) => q.round === 4);
    const currentLightningIndex =
      game.currentQuestionIndex -
      game.questions.findIndex((q) => q.round === 4);

    if (currentLightningIndex >= lightningQuestions.length - 1) {
      const roundKey = `round${game.currentRound}`;
      const team1 = game.teams.find((t) => t.id.includes("team1"));
      const team2 = game.teams.find((t) => t.id.includes("team2"));

      if (team1 && team2) {
        game.gameState.roundScores[roundKey] = {
          team1: team1.currentRoundScore,
          team2: team2.currentRoundScore,
        };

        team1.roundScores[game.currentRound - 1] = team1.currentRoundScore;
        team2.roundScores[game.currentRound - 1] = team2.currentRoundScore;
      }

      game.status = "finished";
      game.gameState.currentTurn = null;
      updateTeamActiveStatus(game);
    } else {
      // Move to next lightning round question
      game.currentQuestionIndex = nextQuestionIndex;
    }

    game.gameState.questionsAnswered.team1 += 1;
    game.gameState.questionsAnswered.team2 += 1;
  } else {
    // Original logic for rounds 1-3
    const currentTeam = game.gameState.currentTurn;
    const otherTeam = currentTeam === "team1" ? "team2" : "team1";

    // Increment questions answered count
    game.gameState.questionsAnswered[currentTeam] += 1;

    if (game.currentQuestionIndex === 24) {
      // Game finished
      const roundKey = `round${game.currentRound}`;
      const team1 = game.teams.find((t) => t.id.includes("team1"));
      const team2 = game.teams.find((t) => t.id.includes("team2"));

      if (team1 && team2) {
        game.gameState.roundScores[roundKey] = {
          team1: team1.currentRoundScore,
          team2: team2.currentRoundScore,
        };

        team1.roundScores[game.currentRound - 1] = team1.currentRoundScore;
        team2.roundScores[game.currentRound - 1] = team2.currentRoundScore;
      }

      game.status = "finished";
      game.gameState.currentTurn = null;
      updateTeamActiveStatus(game);
    } else {
      // Check if the current team has answered all 3 questions
      if (game.gameState.questionsAnswered[currentTeam] >= 3) {
        if (game.gameState.questionsAnswered[otherTeam] < 3) {
          // Switch to the other team
          game.gameState.currentTurn = otherTeam;
          updateTeamActiveStatus(game);

          // Jump to the other team's next unanswered question
          const questionNumber =
            game.gameState.questionsAnswered[otherTeam] + 1;
          const nextQuestion = game.questions.find(
            (q) =>
              q.teamAssignment === otherTeam &&
              q.round === game.currentRound &&
              q.questionNumber === questionNumber
          );

          if (nextQuestion) {
            game.currentQuestionIndex = game.questions.findIndex(
              (q) => q._id === nextQuestion._id
            );
          }
        } else {
          // Both teams finished - round complete
          if (game.currentRound < 4) {
            game.status = "round-summary";
            game.gameState.currentTurn = null;
            updateTeamActiveStatus(game);
          } else {
            // Game finished
            const roundKey = `round${game.currentRound}`;
            const team1 = game.teams.find((t) => t.id.includes("team1"));
            const team2 = game.teams.find((t) => t.id.includes("team2"));

            if (team1 && team2) {
              game.gameState.roundScores[roundKey] = {
                team1: team1.currentRoundScore,
                team2: team2.currentRoundScore,
              };

              team1.roundScores[game.currentRound - 1] =
                team1.currentRoundScore;
              team2.roundScores[game.currentRound - 1] =
                team2.currentRoundScore;
            }

            game.status = "finished";
            game.gameState.currentTurn = null;
            updateTeamActiveStatus(game);
          }
        }
      } else {
        // Continue with same team's next question
        const nextQuestionIndex = getNextQuestionIndex(game);
        game.currentQuestionIndex = nextQuestionIndex;
      }
    }
  }

  return updateGame(gameCode, game);
}

// Continue to next round (from round summary)
export function continueToNextRound(gameCode) {
  const game = games[gameCode];
  if (!game || game.status !== "round-summary") {
    return null;
  }

  // Save round scores
  const roundKey = `round${game.currentRound}`;
  const team1 = game.teams.find((t) => t.id.includes("team1"));
  const team2 = game.teams.find((t) => t.id.includes("team2"));

  if (team1 && team2) {
    game.gameState.roundScores[roundKey] = {
      team1: team1.currentRoundScore,
      team2: team2.currentRoundScore,
    };

    team1.roundScores[game.currentRound - 1] = team1.currentRoundScore;
    team2.roundScores[game.currentRound - 1] = team2.currentRoundScore;
  }

  if (game.currentRound < 4) {
    startNewRound(game);
    game.status = "active";
    game.gameState.awaitingAnswer = true;
    game.gameState.canAdvance = false;

    if (game.currentRound === 4) {
      game.teams.forEach((team) => {
        team.active = false;
      });
    }
  } else {
    game.status = "finished";
  }

  return updateGame(gameCode, game);
}

// Join a game
export function joinGame(gameCode, playerName, localPlayerId) {
  if (!games[gameCode]) {
    throw new Error("Game not found");
  }

  if (games[gameCode].players.length < 10) {
    let playerId = "";
    if (!localPlayerId) {
      playerId = uuidv4();
    } else {
      playerId = localPlayerId;
    }

    let player = games[gameCode].players.find((p) => p.id === playerId);

    if (player) {
      console.log("PLAYER EXISTS");
      player.connected = true;
    } else {
      console.log("PLAYER DOESN'T EXIST");
      player = {
        id: playerId,
        name: playerName,
        gameCode,
        connected: true,
        teamId: null,
      };

      // If new player is joining a game that is in progress
      if (games[gameCode].status !== "waiting") {
        // Put them on the team with the lowest player count
        const existingTeams = [
          ...new Set(
            games[gameCode].players.map((p) => p.teamId).filter(Boolean)
          ),
        ].map((teamId) => ({
          id: teamId,
          playerCount: games[gameCode].players.filter(
            (p) => p.teamId === teamId
          ).length,
        }));

        if (existingTeams.length > 0) {
          console.log(existingTeams);
          existingTeams.sort((a, b) => a.playerCount - b.playerCount);
          console.log(existingTeams);
          player.teamId = existingTeams[0].id;
        }
      }

      players[playerId] = player;
      games[gameCode].players.push(player);
    }

    console.log(`👤 Player joined: ${playerName} in game ${gameCode}`);
    return {
      playerId,
      game: games[gameCode],
      teamId: player.teamId,
      gameFull: false,
    };
  } else {
    return { playerId: null, game: null, teamId: null, gameFull: true };
  }
}

// Get game by code
export function getGame(gameCode) {
  return games[gameCode] || null;
}

// Get player by ID
export function getPlayer(playerId) {
  return players[playerId] || null;
}

// Update game
export function updateGame(gameCode, updates) {
  if (games[gameCode]) {
    const jsonString = JSON.stringify(games[gameCode], null, 2);
    fs.writeFileSync("../gameObjectLog.json", jsonString);
    // console.log(games[gameCode].gameState.currentTurn);
    Object.assign(games[gameCode], updates);
    return games[gameCode];
  }
  return null;
}

// Update player
export function updatePlayer(playerId, updates) {
  if (players[playerId]) {
    Object.assign(players[playerId], updates);
    return players[playerId];
  }
  return null;
}

// Check if answer matches any correct answer
// Simple Levenshtein distance implementation
function levenshtein(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function checkAnswerMatch(userAnswer, correctAnswers) {
  const normalizedUser = userAnswer.toLowerCase().trim();

  const correctAnswer = correctAnswers.find((answer) => {
    if (answer.revealed) return false;
    const normalizedCorrect = answer.answer.toLowerCase();

    const distance = levenshtein(normalizedUser, normalizedCorrect);
    const ratio =
      distance / Math.max(normalizedUser.length, normalizedCorrect.length);
    const allowed = Math.max(1, Math.floor(normalizedCorrect.length * 0.25));

    return distance <= allowed && ratio <= 0.25;
  });

  // if (correctAnswer && correctAnswer.score <= 0) {
  //   return null;
  // }

  return correctAnswer;
}

// Get team by assignment string
export function getTeamByAssignment(game, teamAssignment) {
  if (teamAssignment === "team1") {
    return game.teams.find(
      (t) => t.id.includes("team1") || t.name.includes("1")
    );
  } else if (teamAssignment === "team2") {
    return game.teams.find(
      (t) => t.id.includes("team2") || t.name.includes("2")
    );
  }
  return null;
}

// Get current team that should be answering
export function getCurrentActiveTeam(game) {
  return game.teams.find((t) => t.active);
}

// Check if game should end
export function checkGameEnd(game) {
  return (
    game.currentRound > 3 ||
    (game.currentRound === 3 &&
      game.gameState.questionsAnswered.team1 >= 3 &&
      game.gameState.questionsAnswered.team2 >= 3)
  );
}

// Get game winner
export function getGameWinner(game) {
  const team1 = game.teams.find((t) => t.id.includes("team1"));
  const team2 = game.teams.find((t) => t.id.includes("team2"));

  if (!team1 || !team2) return null;

  const team1Total = team1.roundScores.reduce((sum, s) => sum + s, 0);
  const team2Total = team2.roundScores.reduce((sum, s) => sum + s, 0);

  if (team1Total > team2Total) return team1;
  if (team2Total > team1Total) return team2;
  return null; // Tie
}

// Cleanup old games
export function cleanupOldGames() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  Object.keys(games).forEach((gameCode) => {
    if (games[gameCode].createdAt < oneHourAgo) {
      delete games[gameCode];
      console.log(`🧹 Cleaned up old game: ${gameCode}`);
    }
  });
}

// Handle player disconnect
export function handlePlayerDisconnect(socketId) {
  Object.values(players).forEach((player) => {
    if (player.socketId === socketId) {
      player.connected = false;
    }
  });

  Object.values(games).forEach((game) => {
    if (game.hostId === socketId) {
      game.hostId = null;
      console.log(`👑 Host disconnected from game: ${game.code}`);
    }
  });
}

// Get game statistics
export function getGameStats() {
  return {
    activeGames: Object.keys(games).length,
    connectedPlayers: Object.keys(players).length,
  };
}

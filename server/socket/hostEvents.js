import {
  getGame,
  updateGame,
  startGame,
  continueToNextRound,
  getCurrentQuestion,
  calculateRoundSummary,
  initializeQuestionData,
  updateQuestionData,
  advanceGameState,
  overrideAnswer,
  getGameWinner,
} from "../services/gameService.js";
import { handleGameStateAdvancement } from "./playerEvents.js";

export function setupHostEvents(socket, io) {
  // Host joins game
  socket.on("host-join", (data) => {
    console.log("👑 Host join event received:", data);
    const { gameCode, teams } = data;
    const game = getGame(gameCode);

    if (game) {
      console.log("🎮 Game found, updating with host data");

      // Update game with host
      const updates = { hostId: socket.id };

      // Update team names and members if provided
      if (teams) {
        updates.teams = [
          {
            ...game.teams[0],
            name: teams[0].name,
            members: teams[0].members.filter((m) => m.trim() !== ""),
          },
          {
            ...game.teams[1],
            name: teams[1].name,
            members: teams[1].members.filter((m) => m.trim() !== ""),
          },
        ];
      }

      const updatedGame = updateGame(gameCode, updates);

      // Join the socket to the game room
      socket.join(gameCode);

      // Send the updated game along with state details so a host can rejoin mid-game
      console.log("📤 Emitting host-joined event with game data");
      socket.emit("host-joined", {
        game: updatedGame,
        currentQuestion: getCurrentQuestion(updatedGame),
        activeTeam: updatedGame.gameState.currentTurn,
      });

      console.log(`👑 Host successfully joined game: ${gameCode}`);
    } else {
      console.error(`❌ Game not found: ${gameCode}`);
      socket.emit("error", { message: "Game not found" });
    }
  });

  // Start game - Initialize turn-based game state with question data
  socket.on("start-game", (data) => {
    console.log("🚀 Start game event received:", data);
    const { gameCode } = data;
    const game = getGame(gameCode);

    console.log("Game found:", !!game);
    console.log("Host ID matches:", game?.hostId === socket.id);
    console.log("Current game status:", game?.status);

    if (game && game.hostId === socket.id) {
      console.log("✅ Starting turn-based game with question tracking...");

      const startedGame = startGame(gameCode);
      if (startedGame) {
        console.log("Updated game status:", startedGame.status);
        console.log("Current turn:", startedGame.gameState.currentTurn);
        console.log(
          "Question data initialized:",
          !!startedGame.gameState.questionData
        );
        console.log("Emitting game-started event to room:", gameCode);

        io.to(gameCode).emit("game-started", {
          game: startedGame,
          currentQuestion: getCurrentQuestion(startedGame),
          activeTeam: startedGame.gameState.currentTurn,
        });

        console.log(
          `🚀 Turn-based game started successfully with question tracking: ${gameCode}`
        );
      } else {
        console.error("❌ Failed to start game");
      }
    } else {
      console.error("❌ Cannot start game:", {
        gameExists: !!game,
        hostIdMatch: game?.hostId === socket.id,
        expectedHostId: game?.hostId,
        actualSocketId: socket.id,
      });
    }
  });


  // Continue to next round (from round summary screen)
  socket.on("continue-to-next-round", (data) => {
    const { gameCode } = data;
    const game = getGame(gameCode);

    if (game && game.hostId === socket.id && game.status === "round-summary") {
      console.log(
        `➡️ Host continuing to next round from round ${game.currentRound}`
      );

      const updatedGame = continueToNextRound(gameCode);
      if (updatedGame) {
        if (updatedGame.status === "active") {
          // Started new round
          io.to(gameCode).emit("round-started", {
            game: updatedGame,
            currentQuestion: getCurrentQuestion(updatedGame),
            round: updatedGame.currentRound,
            activeTeam: updatedGame.gameState.currentTurn,
          });

          console.log(`🆕 Round ${updatedGame.currentRound} started`);
        } else if (updatedGame.status === "finished") {
          // Game finished after round 3
          const winner = getGameWinner(updatedGame);
          const roundSummary = calculateRoundSummary(updatedGame);

          io.to(gameCode).emit("game-over", {
            game: updatedGame,
            winner: winner,
            roundSummary,
          });

          console.log(`🏆 Game finished after all rounds: ${gameCode}`);
        }
      }
    }
  });

  // Manual next question (emergency override)
  socket.on("force-next-question", (data) => {
    const { gameCode } = data;
    const game = getGame(gameCode);

    if (game && game.hostId === socket.id && game.status === "active") {
      console.log(`⚠️ Host forcing next question in game: ${gameCode}`);

      const currentQuestion = getCurrentQuestion(game);
      if (currentQuestion) {
        // Reveal all answers
        currentQuestion.answers.forEach((a) => (a.revealed = true));

        // Record skipped question as incorrect
        const teamKey = game.gameState.currentTurn;
        const questionNumber =
          game.gameState.questionsAnswered[teamKey] + 1;
        updateQuestionData(
          game,
          teamKey,
          game.currentRound,
          questionNumber,
          false,
          0
        );

        updateGame(gameCode, game);

        io.to(gameCode).emit("answers-revealed", {
          game,
          currentQuestion,
          byHost: true,
        });

        // Allow host to manually advance like a normal question
        game.gameState.canAdvance = true;
        const updatedGame = updateGame(gameCode, game);

        io.to(gameCode).emit("question-complete", {
          game: updatedGame,
          currentQuestion: getCurrentQuestion(updatedGame),
        });
        console.log(`⚠️ Host forced question completion, awaiting next command`);
      }
    }
  });

  // Host advances to the next question after a question is completed
  socket.on("advance-question", (data) => {
    const { gameCode } = data;
    const game = getGame(gameCode);

    if (
      game &&
      game.hostId === socket.id &&
      game.status === "active" &&
      game.gameState.canAdvance
    ) {
      const advancedGame = advanceGameState(gameCode);
      if (advancedGame) {
        // Reset advancement flag
        advancedGame.gameState.canAdvance = false;
        updateGame(gameCode, advancedGame);

        handleGameStateAdvancement(gameCode, advancedGame, io, {
          game: advancedGame,
          teamName: "Host",
        });
      }
    }
  });

  // Manual round summary (emergency override)
  socket.on("force-round-summary", (data) => {
    const { gameCode } = data;
    const game = getGame(gameCode);

    if (game && game.hostId === socket.id && game.status === "active") {
      console.log(`⚠️ Host forcing round summary for game: ${gameCode}`);

      game.status = "round-summary";
      game.gameState.currentTurn = null;

      // Update team active status
      game.teams.forEach((team) => (team.active = false));

      const updatedGame = updateGame(gameCode, game);
      const roundSummary = calculateRoundSummary(updatedGame);

      io.to(gameCode).emit("round-complete", {
        game: updatedGame,
        roundSummary: roundSummary,
        isGameFinished: updatedGame.currentRound >= 3,
        byHost: true,
      });

      console.log(
        `⚠️ Host forced round summary for round ${game.currentRound}`
      );
    }
  });

  // Host overrides a player's answer
  socket.on("override-answer", (data) => {
    const { gameCode, teamId, round, questionNumber, isCorrect, pointsAwarded, answerIndex } = data;
    const game = getGame(gameCode);

    if (game && game.hostId === socket.id) {
      const result = overrideAnswer(
        gameCode,
        teamId,
        round,
        questionNumber,
        isCorrect,
        pointsAwarded,
        answerIndex
      );

      if (result.success) {
        io.to(gameCode).emit("answer-overridden", result);
      } else {
        socket.emit("error", { message: result.message });
      }
    }
  });

  // Reset game (emergency reset) - Reset question data too
  socket.on("reset-game", (data) => {
    const { gameCode } = data;
    const game = getGame(gameCode);

    if (game && game.hostId === socket.id) {
      console.log(`🔄 Host resetting game: ${gameCode}`);

      // Reset game to initial state but keep players
      const resetUpdates = {
        status: "waiting",
        currentQuestionIndex: 0,
        currentRound: 0,
        gameState: {
          ...game.gameState,
          currentTurn: null,
          questionsAnswered: { team1: 0, team2: 0 },
          roundScores: {
            round1: { team1: 0, team2: 0 },
            round2: { team1: 0, team2: 0 },
            round3: { team1: 0, team2: 0 },
          },
          awaitingAnswer: false,
          canAdvance: false,
          currentQuestionAttempts: 0,
          maxAttemptsPerQuestion: 3,
          questionData: initializeQuestionData(), // Reset question data
          tossUpQuestion: game.gameState.tossUpQuestion
            ? JSON.parse(JSON.stringify(game.gameState.tossUpQuestion))
            : undefined,
          tossUpAnswers: [],
          tossUpSubmittedTeams: [],
        },
      };

      // Ensure the copied toss-up question has all answers hidden
      if (resetUpdates.gameState.tossUpQuestion) {
        resetUpdates.gameState.tossUpQuestion.answers.forEach(
          (a) => (a.revealed = false)
        );
      }

      game.buzzedTeamId = null;
      game.activeTeamId = null;
      game.tossUpWinner = null;
      game.tossUpAnswers = [];
      game.tossUpSubmittedTeams = [];

      // Reset team scores and states
      game.teams.forEach((team) => {
        team.score = 0;
        team.active = false;
        team.roundScores = [0, 0, 0];
        team.currentRoundScore = 0;
      });

      // Reset all question answers
      game.questions.forEach((question) => {
        question.answers.forEach((answer) => {
          answer.revealed = false;
        });
      });

      if (game.gameState.tossUpQuestion) {
        game.gameState.tossUpQuestion.answers.forEach(
          (a) => (a.revealed = false)
        );
      }

      const resetGame = updateGame(gameCode, resetUpdates);

      io.to(gameCode).emit("game-reset", {
        game: resetGame,
        message: "Game has been reset by the host",
      });

      // Automatically restart the game so play can resume without creating a new code
      const startedGame = startGame(gameCode);
      if (startedGame) {
        io.to(gameCode).emit("game-started", {
          game: startedGame,
          currentQuestion: getCurrentQuestion(startedGame),
          activeTeam: startedGame.gameState.currentTurn,
        });
      }

      console.log(`🔄 Game reset successfully with question data: ${gameCode}`);
    }
  });

  // Get current game state (for host dashboard)
  socket.on("get-game-state", (data) => {
    const { gameCode } = data;
    const game = getGame(gameCode);

    if (game && game.hostId === socket.id) {
      socket.emit("game-state-update", {
        game: game,
        currentQuestion: getCurrentQuestion(game),
        roundSummary:
          game.status === "round-summary" ? calculateRoundSummary(game) : null,
      });
    }
  });
}

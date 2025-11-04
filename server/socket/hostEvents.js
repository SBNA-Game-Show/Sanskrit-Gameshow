import {
  getGame,
  updateGame,
  startGame,
  continueToNextRound,
  getCurrentQuestion,
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

  // Continue to the toss up round summary screen
  socket.on("complete-toss-up-round", (data) => {
    const { gameCode } = data;
    const game = getGame(gameCode);

    if (game && game.hostId === socket.id) {
      game.status = "round-summary";

      // activeTeamId must be set from null to the starting teamId
      // Set the first team that buzzed in as the default starting team
      // If buzzedTeamId is falsy set team one as default
      if (!game.gameState.tossUpWinner) {
        if (game.buzzedTeamId) {
          game.activeTeamId = game.buzzedTeamId;
        }
        else {
          game.activeTeamId = game.teams[0].id;
        }
      } 
      // Else, set activeTeamId to the winner team id
      else {
        game.activeTeamId = summary.tossUpWinner.teamId;
      }

      game.disableForceNext = false;

      io.to(gameCode).emit("round-complete", {
        game,
        isGameFinished: false,
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

          io.to(gameCode).emit("game-over", {
            game: updatedGame,
            winner: winner,
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

    if (game && game.hostId === socket.id && game.status === "active" && !game.disableForceNext) {
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
        game.activeTeamId = null;
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

    if (game.currentRound === 4) {
      game.gameState.canAdvance = true;
      game.pauseTimer = false;
      game.teams.forEach((team) => {
        team.active = false;
      })
    }

    // Reset active team id
    const activeTeam = game.teams.find( team => team.active);
    if (activeTeam) {
      game.activeTeamId = activeTeam.id
    }

    // Reset disable force next button
    game.disableForceNext = false;

    if (
      game &&
      game.hostId === socket.id &&
      game.status === "active" &&
      game.gameState.canAdvance
    ) {
      const advancedGame = advanceGameState(gameCode);
      if (advancedGame) {
        advancedGame.buzzedTeamId = null;
        advancedGame.lightningRoundSubmittedTeams = [];
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

  socket.on("pause-timer", (data) => {
    const { gameCode } = data;
    const game = getGame(gameCode);

    if (game && game.hostId === socket.id && game.status === "active") {
      const currentQuestion = getCurrentQuestion(game);

      if (currentQuestion) {
        // Reveal all answers
        currentQuestion.answers.forEach((a) => (a.revealed = true));
        game.pauseTimer = true;
        updateGame(gameCode, game);

        io.to(gameCode).emit("answers-revealed", {
          game,
          currentQuestion,
          byHost: true,
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

      io.to(gameCode).emit("round-complete", {
        game: updatedGame,
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
    const { gameCode, pointsAwarded, answerIndex } = data;
    const game = getGame(gameCode);

    if (game && game.hostId === socket.id) {
      const result = overrideAnswer(
        gameCode, // the game code
        game.teams.find(team => team.active)?.id, // the id of the team that just answered
        game.currentRound, // the current round
        game.currentQuestionIndex % 3 + 1, // the question number (1-3)
        true, // is correct?
        pointsAwarded, // points overrided and awarded
        answerIndex // the index of the answer that was clicked
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
        disableForceNext: false,
        gameState: {
          ...game.gameState,
          currentTurn: null,
          questionsAnswered: { team1: 0, team2: 0 },
          roundScores: {
            round1: { team1: 0, team2: 0 },
            round2: { team1: 0, team2: 0 },
            round3: { team1: 0, team2: 0 },
            round4: { team1: 0, team2: 0 },
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
        team.roundScores = [0, 0, 0, 0];
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

  socket.on("skip-to-round", (gameCode, round, selectedStartingTeam) => {
    const game = getGame(gameCode);

    let skipUpdates = {};
    if (game && game.hostId === socket.id) {

      game.teams[0].roundScores[game.currentRound - 1] = game.teams[0].currentRoundScore;
      game.teams[1].roundScores[game.currentRound - 1] = game.teams[1].currentRoundScore;

      const updatedRoundScoreTeamOne = game.teams[0].roundScores.map((score, idx) => {
        if (idx + 1 < round) {
          return game.teams[0].roundScores[idx];
        } else {
          return 0;
        }
      });
      const updatedRoundScoreTeamTwo = game.teams[1].roundScores.map((score, idx) => {
        if (idx + 1 < round) {
          return game.teams[1].roundScores[idx];
        } else {
          return 0;
        }
      });
      const updatedRoundScores = [
        updatedRoundScoreTeamOne,
        updatedRoundScoreTeamTwo
      ]

      console.log("UPDATED ROUND SCORES");
      console.log(updatedRoundScores);

      if (round === 4) {
        skipUpdates = {
          status: "active",
          currentQuestionIndex: 18,
          currentRound: 4,
          teams: game.teams.map((team, idx) => ({ 
            ...team, 
            score: team.roundScores.reduce((total, num) => total + num, 0),
            active: false,
            roundScores: updatedRoundScores[idx],
            currentRoundScore: 0
          })),
          disableForceNext: false,
          gameState: {
            ...game.gameState,
            currentTurn: null,
            questionsAnswered: { team1: 0, team2: 0 },
            roundScores: {
              ...game.gameState.roundScores,
              round4: {team1: 0, team2: 0}
            },
            awaitingAnswer: false,
            canAdvance: false,
            currentQuestionAttempts: 0,
            maxAttemptsPerQuestion: 3,
          },
        };

        game.buzzedTeamId = null;
        game.activeTeamId = null;
        game.tossUpWinner = null;
        game.tossUpAnswers = [];
        game.tossUpSubmittedTeams = [];
        game.lightningRoundSubmittedTeams = [];
        game.pauseTimer = false;
      }
      else {
        const updatedQuestionIndex = selectedStartingTeam === "team1"
          ? (round - 1) * 6
          : (round - 1) * 6 + 3;

        skipUpdates = {
          status: "active",
          currentQuestionIndex: updatedQuestionIndex,
          currentRound: round,
          teams: game.teams.map((team, idx) => ({ 
            ...team, 
            score: team.roundScores.reduce((total, num) => total + num, 0),
            active: (selectedStartingTeam === "team1" && idx === 0) || (selectedStartingTeam === "team2" && idx === 1),
            roundScores: updatedRoundScores[idx],
            currentRoundScore: 0
          })),
          disableForceNext: false,
          gameState: {
            ...game.gameState,
            currentTurn: selectedStartingTeam,
            questionsAnswered: { team1: 0, team2: 0 },
            awaitingAnswer: true,
            canAdvance: false,
          },
        }

        game.activeTeamId = selectedStartingTeam;
      }

      // Reset all question answers 
      game.questions.forEach((question) => {
        question.answers.forEach((answer) => {
          answer.revealed = false;
        });
      });

      const updatedGame = updateGame(gameCode, skipUpdates);

      io.to(gameCode).emit("skipped-to-round", {
        game: updatedGame,
        message: `Host has skipped to round ${round}`,
      });
    }
  })

  //UNUSED EVENT
  // Get current game state (for host dashboard)
  socket.on("get-game-state", (data) => {
    const { gameCode } = data;
    const game = getGame(gameCode);

    if (game && game.hostId === socket.id) {
      socket.emit("game-state-update", {
        game: game,
        currentQuestion: getCurrentQuestion(game),
      });
    }
  });
}

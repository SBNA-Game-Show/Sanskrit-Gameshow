import { Router } from "express";
import { ApiError } from "../utils/ApiError.js";
import { prepareGameQuestions } from "../services/loadQuestionFromDB.js";
import {
  joinGame,
  getGameStats,
  createGame,
  setGameQuestions,
} from "../services/gameService.js";
//Comments By: Austin Sinclair

//Main Game Router for creating and joining games. Routes are called within
//utils/gameApi.ts file.

// Root endpoint
// Used for testing and displaying server and game status

const router = Router();

// Root endpoint
router.get("/", (req, res) => {
  try {
    const stats = getGameStats();
    res.json({
      message: "Family Feud Quiz Game Server",
      status: "Running",
      activeGames: stats.activeGames,
      connectedPlayers: stats.connectedPlayers,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting stats:", error);
    res.status(500).json({
      error: "Failed to get server stats",
      message: "Family Feud Quiz Game Server",
      status: "Running",
    });
  }
});

// Create game endpoint
// Called via CreateGame method using a promise, and runs when
// Host clicks a button to create a new game. Questions are loaded
// for the game object before game is created. Full Game Data object can
// be found in gameService.js
router.post("/api/create-game", async (req, res) => {
  try {
    console.log("🎮 Create game request received");

    const { teamNames } = req.body;

    //Prepare the Questions From FinalQuestion Schema to GameQuestion for the Game
    console.log("Pulling fresh questions from DB...");
    let { updatedTossUpQuestion, updatedQuestions } =
      await prepareGameQuestions();

    console.log(updatedQuestions[0].answers);

    const { game } = await createGame(
      updatedQuestions,
      updatedTossUpQuestion, // This will be null now
      teamNames
    );
    if (!game.code) {
      throw new ApiError(500, "No GameCode Created");
    }
    //successful game creation returns JSON format for gameCode, gameId
    console.log(`✅ Game created successfully: ${game.code}`);
    res.json({
      game,
      success: true,
    });
  } catch (error) {
    console.error("❌ Error creating game:", error);
    res.status(500).json({
      error: "Failed to create game",
      details: error.message,
    });
  }
});

// Join game endpoint
// POST method to add a player to a game session, and return the
// status of the join. As long as the game code exists and has room,
// a player is able to join by their unique ID and unique game code
router.post("/api/join-game", (req, res) => {
  try {
    console.log("👤 Join game request received:", req.body);
    //gameCode and playerName are taken from the request when joining a game
    const { gameCode, playerName, localPlayerId } = req.body;

    if (!gameCode || !playerName) {
      return res.status(400).json({
        error: "Game code and player name are required",
      });
    }

    const { playerId, game, teamId, gameFull } = joinGame(
      gameCode.toUpperCase(),
      playerName.trim(),
      localPlayerId
    );
    console.log(`✅ Player joined successfully: ${playerName} in ${gameCode}`);
    res.json({
      playerId,
      game,
      teamId,
      gameFull,
      success: true,
    });
  } catch (error) {
    console.error("❌ Error joining game:", error);
    if (error.message === "Game not found") {
      res.status(404).json({ error: "Game not found" });
    } else if (error.message === "Game is full") {
      res.status(400).json({ error: "Game is full" });
    } else {
      res.status(500).json({
        error: "Failed to join game",
        details: error.message,
      });
    }
  }
});
// In gameRoutes.js - Add this new route

router.post("/api/set-game-questions", async (req, res) => {
  try {
    console.log("Set game questions request received");
    const { gameCode, questionIds, tossUpQuestionId } = req.body; // Added tossUpQuestionId

    if (
      !gameCode ||
      !questionIds ||
      !Array.isArray(questionIds) ||
      tossUpQuestionId === undefined // Check for undefined (null is valid)
    ) {
      return res.status(400).json({
        error:
          "Game code, question IDs array, and tossUpQuestionId are required",
      });
    }

    const result = await setGameQuestions(
      gameCode,
      questionIds,
      tossUpQuestionId
    ); // Pass to service

    if (!result.success) {
      return res.status(404).json({ error: result.message });
    }

    console.log(
      `✅ Questions set for game ${gameCode}: ${questionIds.length} questions`
    );
    res.json({
      success: true,
      game: result.game,
    });
  } catch (error) {
    console.error("Error setting game questions:", error);
    res.status(500).json({
      error: "Failed to set game questions",
      details: error.message,
    });
  }
});

export default router;

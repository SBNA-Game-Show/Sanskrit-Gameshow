const {
  getGame,
  getPlayer,
  updateGame,
  updatePlayer,
  getCurrentQuestion,
} = require("../services/gameService");

function setupPlayerEvents(socket, io) {
  // Player joins game room
  socket.on("player-join", (data) => {
    const { gameCode, playerId } = data;
    const game = getGame(gameCode);
    const player = getPlayer(playerId);

    console.log(`👤 Player join event: ${playerId} trying to join ${gameCode}`);

    if (game && player) {
      socket.join(gameCode);
      updatePlayer(playerId, { socketId: socket.id });

      // Make sure the player is in the game's players array
      const playerExists = game.players.some((p) => p.id === playerId);
      if (!playerExists) {
        game.players.push(player);
        updateGame(gameCode, game);
        console.log(
          `✅ Added player ${player.name} to game ${gameCode}. Total players: ${game.players.length}`
        );
      }

      // Emit to all players in the room, including the host
      io.to(gameCode).emit("player-joined", {
        player: player,
        totalPlayers: game.players.length,
      });

      console.log(
        `👤 Player ${player.name} joined room ${gameCode}. Total: ${game.players.length}`
      );
    } else {
      console.error(
        `❌ Player join failed: game=${!!game}, player=${!!player}`
      );
    }
  });

  socket.on("get-players", ({ gameCode }) => {
    const game = getGame(gameCode);
  
    if (game) {
      io.to(gameCode).emit("players-list", {
        players: game.players,
        teams: game.teams,
      });
    }
  });
  
  // Assign player to team
  socket.on("join-team", (data) => {
    const { gameCode, playerId, teamId } = data;
    const game = getGame(gameCode);
    const player = getPlayer(playerId);

    if (game && player) {
      updatePlayer(playerId, { teamId });

      io.to(gameCode).emit("team-updated", {
        playerId,
        teamId,
        game,
      });
    }
  });

  // Player buzzes in - ENHANCED: Now separate from answer submission
  socket.on("buzz-in", (data) => {
    const { gameCode, playerId } = data;
    const game = getGame(gameCode);
    const player = getPlayer(playerId);
  
    if (!game || !player || game.status !== "active") return;
  
    const teamId = player.teamId;
    if (!teamId) {
      return socket.emit("buzz-rejected", {
        message: "Join a team before buzzing in.",
      });
    }
  
    // Only allow 1 team to buzz
    if (!game.buzzedTeamId) {
      game.buzzedTeamId = teamId;
      game.gameState.activeTeamId = teamId;
      game.gameState.inputEnabled = true;
  
      io.to(gameCode).emit("player-buzzed", {
        playerId: player.id,
        teamId: player.teamId,
        playerName: player.name,
        //teamName: team.name,
        timestamp: Date.now(),
        game: game,
      });
      
  
      console.log(`✅ ${player.name} buzzed in for team ${teamId}`);
    } else {
      socket.emit("buzz-rejected", {
        message: "Another team already buzzed.",
      });
    }
  });
  

  // Submit answer - ENHANCED: Now requires buzzer control first
  socket.on("submit-answer", (data) => {
    const { gameCode, playerId, answer } = data;
    const game = getGame(gameCode);
    const player = getPlayer(playerId);
  
    if (!game || !player || game.status !== "active") return;
  
    const teamId = player.teamId;
    if (!teamId || game.answers[teamId]) return;
  
    const currentQuestion = getCurrentQuestion(game);
    const matchedAnswer = currentQuestion?.answers.find(
      (a) => a.answer.toLowerCase() === answer.toLowerCase()
    );
    const score = matchedAnswer ? matchedAnswer.points : 0;
  
    game.answers[teamId] = { answer, score, playerName: player.name };
    game.answerQueue.push(teamId);
  
    io.to(gameCode).emit("answer-revealed", {
      teamId,
      answer,
      score,
    });
  
    // 👇 Move to second team once first team has answered
    if (game.answerQueue.length === 1) {
      const secondTeam = game.teams.find((t) => t.id !== game.buzzedTeamId);
      if (secondTeam) {
        game.gameState.activeTeamId = secondTeam.id;
        game.gameState.inputEnabled = true;
  
        io.to(gameCode).emit("team-switched", {
          teamId: secondTeam.id,
          message: "Your team may now answer!",
          game: game,
        });
      }
    }
  
    // ✅ After both answered, declare winner
    if (game.answerQueue.length === 2) {
      const [teamAId, teamBId] = game.answerQueue;
      const a = game.answers[teamAId];
      const b = game.answers[teamBId];
  
      const winner =
        a.score > b.score
          ? game.teams.find((t) => t.id === teamAId)
          : b.score > a.score
          ? game.teams.find((t) => t.id === teamBId)
          : null;
  
      io.to(gameCode).emit("round-winner", {
        winnerTeamId: winner?.id || null,
        winnerTeamName: winner?.name || "Tie",
        scores: {
          [teamAId]: a.score,
          [teamBId]: b.score,
        },
        answers: {
          [teamAId]: a.answer,
          [teamBId]: b.answer,
        },
      });
  
      // Reset for next round
      game.buzzedTeamId = null;
      game.answerQueue = [];
      game.answers = {};
      game.gameState.inputEnabled = false;
      game.gameState.activeTeamId = null;
    }
  });
  
}

// Helper function to advance to next question
function advanceToNextRound(game, gameCode, io) {
  game.currentQuestionIndex += 1;

  const nextQuestion = getCurrentQuestion(game);
  if (nextQuestion) {
    // Set round based on question index
    game.currentRound = game.currentQuestionIndex + 1;

    // Reset state
    game.currentBuzzer = null;
    game.buzzedTeamId = null;
    game.answerQueue = [];
    game.answers = {};
    game.gameState.activeTeamId = null;
    game.gameState.inputEnabled = false;
    game.gameState.lastBuzzingTeam = null;
    game.gameState.waitingForOpponent = false;

    // Reset team strikes
    game.teams.forEach((t) => {
      t.strikes = 0;
      t.active = false;
    });

    const finalGame = updateGame(gameCode, game);

    io.to(gameCode).emit("next-round", {
      game: finalGame,
      currentQuestion: nextQuestion,
      round: game.currentRound,
    });

    console.log(`➡️ Moved to Round ${game.currentRound}`);
  } else {
    // No more questions — game over
    game.status = "finished";
    const winner = game.teams.reduce((prev, current) =>
      prev.score > current.score ? prev : current
    );

    const finalGame = updateGame(gameCode, game);

    io.to(gameCode).emit("game-over", {
      game: finalGame,
      winner,
    });

    console.log(`🏁 Game over — Winner: ${winner.name}`);
  }
}


module.exports = { setupPlayerEvents };

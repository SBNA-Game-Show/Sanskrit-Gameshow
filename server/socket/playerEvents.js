function calculateScore(answer, question) {
  if (!answer || !question || !question.answers) return 0;

  const submitted = answer.trim().toLowerCase();

  const matchedAnswer = question.answers.find(
    (a) => a.text.toLowerCase() === submitted
  );

  return matchedAnswer ? matchedAnswer.points : 0;
}

const {
  getGame,
  getPlayer,
  updateGame,
  updatePlayer,
  getCurrentQuestion,
  getGameByCode, 
} = require("../services/gameService");

function setupPlayerEvents(socket, io) {
  // Player joins game room
  console.log("✅ Player socket events registered.");

  socket.on("player-join", (data) => {
    const { gameCode, playerId } = data;
    const game = getGame(gameCode);
    const player = getPlayer(playerId);

    console.log(`👤 Player join event: ${playerId} trying to join ${gameCode}`);

    if (game && player) {
      socket.join(gameCode);
      updatePlayer(playerId, { socketId: socket.id });

      const playerExists = game.players.some((p) => p.id === playerId);
      if (!playerExists) {
        game.players.push(player);
        updateGame(gameCode, game);
        console.log(`✅ Added player ${player.name} to game ${gameCode}. Total players: ${game.players.length}`);
      }

      io.to(gameCode).emit("player-joined", {
        player: player,
        totalPlayers: game.players.length,
      });

      console.log(`👤 Player ${player.name} joined room ${gameCode}. Total: ${game.players.length}`);
    } else {
      console.error(`❌ Player join failed: game=${!!game}, player=${!!player}`);
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

    if (!game.buzzedTeamId) {
      game.buzzedTeamId = teamId;
      game.gameState.activeTeamId = teamId;
      game.gameState.inputEnabled = true;

      io.to(gameCode).emit("player-buzzed", {
        playerId: player.id,
        teamId: player.teamId,
        playerName: player.name,
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

  // Pseudo structure assuming you have game.answers and game.buzzedTeamId
  socket.on("submitAnswer", async ({ gameCode, playerId, answer }) => {
    console.log("📥 [Socket] Received submitAnswer:", { gameCode, playerId, answer });
  
    const game = getGameByCode(gameCode);
    if (!game) return console.warn(`⚠️ No game found for code ${gameCode}`);
  
    const player = getPlayer(playerId);
    if (!player || !player.teamId) return console.warn(`⚠️ Invalid player: ${playerId}`);
  
    const teamId = player.teamId;
    if (!game.answers) game.answers = {};
  
    if (game.answers[teamId]) {
      console.warn(`❌ Team ${teamId} already submitted an answer.`);
      return;
    }
  
    const question = getCurrentQuestion(game);
    const score = calculateScore(answer, question); // You implemented this
    game.answers[teamId] = { answer, score };
  
    console.log(`📝 Answer submitted: Team ${teamId} → "${answer}" (Score: ${score})`);
  
    // Check if the other team has answered yet
    const [teamA, teamB] = game.teams;
    const otherTeamId = teamA.id === teamId ? teamB.id : teamA.id;
  
    if (!game.answers[otherTeamId]) {
      game.buzzedTeamId = otherTeamId;
      game.activeTeamId = otherTeamId; // ✅ Switch turn here
      game.gameState.inputEnabled = true;
  
      io.to(gameCode).emit("onPlayerBuzzed", {
        game,
        playerId: null,
        teamId: otherTeamId,
      });
  
      io.to(gameCode).emit("team-switched", {
        currentTeamId: game.activeTeamId,
      });
  
      console.log(`🔔 Switching to Team ${otherTeamId}`);
    } else {
      revealAnswersToPlayers(game, io);
    }
  
    updateGame(gameCode, game);
  });
  
  function revealAnswersToPlayers(game, io) {
    const { answers, teams, code } = game;
  
    // Emit individual answers
    for (const team of teams) {
      const teamId = team.id;
      const { score } = answers[teamId] || { score: 0 };
  
      io.to(code).emit("onAnswerRevealed", {
        game,
        teamId,
        score,
      });
    }
  
    const [teamA, teamB] = teams;
    const scoreA = answers[teamA.id]?.score || 0;
    const scoreB = answers[teamB.id]?.score || 0;
  
    let winner;
    if (scoreA === scoreB) {
      winner = "Tie";
    } else {
      winner = scoreA > scoreB ? teamA.id : teamB.id;
    }
  
    const winnerName = winner === "Tie"
      ? "Tie"
      : teams.find((t) => t.id === winner)?.name || winner;
  
    console.log(`🏁 Round Winner: ${winnerName} (TeamA: ${teamA.name} = ${scoreA}, TeamB: ${teamB.name} = ${scoreB})`);
  
    game.buzzedTeamId = null;
    game.answers = {};
    game.gameState.inputEnabled = false;
  
    io.to(code).emit("roundWinner", {
      game,
      winnerId: winner === "Tie" ? null : winner,
      winnerName: winner === "Tie" ? "Tie" : teams.find(t => t.id === winner)?.name,
    });
    
  }
  
  
  
  
}
function advanceToNextRound(game, gameCode, io) {
  game.currentQuestionIndex += 1;
  const nextQuestion = getCurrentQuestion(game);

  if (nextQuestion) {
    game.currentRound = game.currentQuestionIndex + 1;
    game.currentBuzzer = null;
    game.buzzedTeamId = null;
    game.answerQueue = [];
    game.answers = {};
    game.gameState.activeTeamId = null;
    game.gameState.inputEnabled = false;
    game.gameState.lastBuzzingTeam = null;
    game.gameState.waitingForOpponent = false;

    game.teams.forEach((t) => {
      t.strikes = 0;
      t.active = false;
    });

    const finalGame = updateGame(gameCode, game);

    // Emit to frontend to update round (but allow delay if needed to show winner first)
    io.to(gameCode).emit("next-round", {
      game: finalGame,
      currentQuestion: nextQuestion,
      round: game.currentRound,
    });

    console.log(`➡️ Moved to Round ${game.currentRound}`);
  } else {
    // Game over: determine winner
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
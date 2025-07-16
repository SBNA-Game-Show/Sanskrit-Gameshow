const {
  games,
  getGame,
  updateGame,
  getCurrentQuestion,
} = require("../services/gameService");

function setupHostEvents(socket, io) {
  socket.on("assign-player-team", ({ gameCode, playerId, teamId }) => {
    const game = games[gameCode];
    if (!game) return;

    const player = game.players.find((p) => p.id === playerId);
    if (player) {
      player.teamId = teamId;
    }

    const updatedGame = updateGame(gameCode, game);

    io.to(gameCode).emit("team-updated", {
      game: updatedGame,
      playerId,
      teamId,
    });

    console.log(`[TEAM ASSIGNED] ${player.name} assigned to ${teamId}`);
  });

  socket.on("join-team", ({ gameCode, playerId, teamId }) => {
    const game = getGame(gameCode);
    if (!game) return;

    const player = game.players.find(p => p.id === playerId);
    if (player) {
      player.teamId = teamId;
    }

    const updatedGame = updateGame(gameCode, game);
    io.to(gameCode).emit("team-updated", { game: updatedGame });
    console.log(`🧑‍🤝‍🧑 Player ${playerId} joined team ${teamId} in game ${gameCode}`);
  });

  socket.on("host-join", (data) => {
    console.log("👑 Host join event received:", data);
    const { gameCode, teams } = data;
    const game = getGame(gameCode);

    if (game) {
      const updates = { hostId: socket.id };

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
      socket.join(gameCode);
      socket.emit("host-joined", updatedGame);
    } else {
      socket.emit("error", { message: "Game not found" });
    }
  });

  socket.on("start-game", (data) => {
    const { gameCode } = data;
    const game = getGame(gameCode);

    if (game && game.hostId === socket.id) {
      const resetQuestions = game.questions.map((q) => ({
        ...q,
        answers: q.answers.map((a) => ({ ...a, revealed: false })),
      }));

      const updates = {
        status: "active",
        currentQuestionIndex: 0,
        questions: resetQuestions,
        currentBuzzer: null,
        gameState: {
          activeTeamId: null,
          inputEnabled: false,
          lastBuzzingTeam: null,
          waitingForOpponent: false,
        },
      };
      socket.on("requestPlayers", ({ gameCode }) => {
        const game = getGame(gameCode);
        if (game) {
          io.to(gameCode).emit("players-list", {
            players: game.players,
            teams: game.teams,
          });
        }
      });
      const updatedGame = updateGame(gameCode, updates);

      io.to(gameCode).emit("game-started", {
        game: updatedGame,
        currentQuestion: getCurrentQuestion(updatedGame),
      });
    }
  });

  socket.on("host-mark-correct", (data) => {
    const { gameCode, playerId, teamId } = data;
    const game = getGame(gameCode);
    if (game && game.hostId === socket.id) {
      const currentQuestion = getCurrentQuestion(game);
      if (!currentQuestion) return;

      const team = game.teams.find(t => t.id === teamId);
      if (!team) return;

      const firstUnrevealedAnswer = currentQuestion.answers.find(a => !a.revealed);
      if (firstUnrevealedAnswer) {
        firstUnrevealedAnswer.revealed = true;
        const pointValue = firstUnrevealedAnswer.points * game.currentRound;
        team.score += pointValue;

        const updatedGame = updateGame(gameCode, game);

        io.to(gameCode).emit("answer-correct", {
          answer: firstUnrevealedAnswer,
          playerName: game.currentBuzzer?.playerName || "Player",
          teamName: team.name,
          pointsAwarded: pointValue,
          game: updatedGame
        });

        setTimeout(() => {
          const allRevealed = currentQuestion.answers.every(a => a.revealed);

          if (allRevealed) {
            advanceToNextQuestion(game, gameCode, io);
          } else {
            game.currentBuzzer = null;
            game.gameState.activeTeamId = null;
            game.gameState.inputEnabled = false;
            const resetGame = updateGame(gameCode, game);

            io.to(gameCode).emit("buzzer-cleared", {
              game: resetGame,
              reason: "correct-answer-continue",
              message: "Correct! More answers remaining - buzz in for the next one!"
            });
          }
        }, 2000);
      }
    }
  });

  socket.on("host-mark-incorrect", (data) => {
    const { gameCode, playerId, teamId } = data;
    const game = getGame(gameCode);
    if (game && game.hostId === socket.id) {
      const team = game.teams.find(t => t.id === teamId);
      if (!team) return;
      team.strikes += 1;
      const updatedGame = updateGame(gameCode, game);

      io.to(gameCode).emit("wrong-answer", {
        playerName: game.currentBuzzer?.playerName || "Player",
        teamName: team.name,
        strikes: team.strikes,
        game: updatedGame
      });

      if (team.strikes >= 3) {
        const opponentTeam = game.teams.find(t => t.id !== team.id);
        if (opponentTeam) {
          game.teams.forEach(t => t.active = t.id === opponentTeam.id);
          game.gameState.activeTeamId = opponentTeam.id;
          game.gameState.inputEnabled = true;

          const switchedGame = updateGame(gameCode, game);
          io.to(gameCode).emit("team-switched", {
            game: switchedGame,
            activeTeamName: opponentTeam.name
          });
        }
      } else {
        setTimeout(() => {
          game.currentBuzzer = null;
          game.gameState.activeTeamId = null;
          game.gameState.inputEnabled = false;

          const resetGame = updateGame(gameCode, game);
          io.to(gameCode).emit("buzzer-cleared", {
            game: resetGame,
            reason: "wrong-answer",
            message: `Wrong answer! ${3 - team.strikes} strikes remaining for ${team.name}. Buzzer is now open!`
          });
        }, 1500);
      }
    }
  });

  socket.on("reveal-answer", (data) => {
    const { gameCode, answerIndex } = data;
    const game = getGame(gameCode);

    if (game && game.hostId === socket.id) {
      const currentQuestion = getCurrentQuestion(game);
      if (currentQuestion && currentQuestion.answers[answerIndex]) {
        const answer = currentQuestion.answers[answerIndex];
        answer.revealed = true;

        const activeTeam = game.teams.find((t) => t.active);
        if (activeTeam) {
          activeTeam.score += answer.points * game.currentRound;
        }

        const updatedGame = updateGame(gameCode, game);

        io.to(gameCode).emit("answer-revealed", {
          answer,
          playerName: "Host Override",
          game: updatedGame,
          byHost: true,
        });
      }
    }
  });

  socket.on("clear-buzzer", (data) => {
    const { gameCode } = data;
    const game = getGame(gameCode);

    if (game && game.hostId === socket.id) {
      game.currentBuzzer = null;
      game.gameState.activeTeamId = null;
      game.gameState.inputEnabled = false;
      game.gameState.lastBuzzingTeam = null;
      game.gameState.waitingForOpponent = false;

      const updatedGame = updateGame(gameCode, game);
      io.to(gameCode).emit("buzzer-cleared", {
        game: updatedGame,
        reason: "host-reset",
      });
    }
  });

  socket.on("next-question", (data) => {
    const { gameCode } = data;
    const game = getGame(gameCode);

    if (game && game.hostId === socket.id) {
      game.currentQuestionIndex += 1;
      game.currentBuzzer = null;

      const currentQuestion = getCurrentQuestion(game);
      if (currentQuestion) {
        game.currentRound = currentQuestion.round;
      }

      if (game.currentQuestionIndex >= game.questions.length) {
        game.status = "finished";
        const winner = game.teams.reduce((prev, current) =>
          prev.score > current.score ? prev : current
        );

        const updatedGame = updateGame(gameCode, game);
        io.to(gameCode).emit("game-over", { game: updatedGame, winner });
      } else {
        game.teams.forEach((team) => {
          team.strikes = 0;
        });
        game.teams[0].active = true;
        game.teams[1].active = false;

        game.gameState.activeTeamId = null;
        game.gameState.inputEnabled = false;
        game.gameState.lastBuzzingTeam = null;
        game.gameState.waitingForOpponent = false;

        const updatedGame = updateGame(gameCode, game);
        io.to(gameCode).emit("next-question", {
          game: updatedGame,
          currentQuestion: getCurrentQuestion(updatedGame),
        });
      }
    }
  });

  socket.on("player-buzz", ({ gameCode, playerId }) => {
    const game = getGame(gameCode);
    const player = game.players.find((p) => p.id === playerId);
    if (player && !game.currentBuzzer) {
      const updates = {
        currentBuzzer: { playerId, teamId: player.teamId },
        gameState: {
          ...game.gameState,
          activeTeamId: player.teamId,
          inputEnabled: true,
          lastBuzzingTeam: player.teamId,
        },
      };
  
      const updatedGame = updateGame(gameCode, updates);
      io.to(gameCode).emit("player-buzzed", {
        playerId,
        teamId: player.teamId,
        playerName: player.name,
        teamName: getTeamNameById(player.teamId),
        game: updatedGame,
      });
    }
  });
  
}

module.exports = { setupHostEvents };

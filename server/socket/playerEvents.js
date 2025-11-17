import {
  getGame,
  getPlayer,
  updatePlayer,
  submitAnswer,
  updateGame,
  advanceGameState,
  getCurrentQuestion,
  getGameWinner,
} from "../services/gameService.js";

export function setupPlayerEvents(socket, io) {
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

  // Request players list (for host)
  socket.on("get-players", (data) => {
    const { gameCode } = data;
    const game = getGame(gameCode);

    if (game) {
      // console.log(
      //   `📋 Host requested players list for ${gameCode}: ${game.players.length} players`
      // );
      socket.emit("players-list", {
        players: game.players,
        totalPlayers: game.players.length,
      });
    }
  });
socket.on("join-team", (data) => {
  const { gameCode, playerId, teamId } = data;
  const game = getGame(gameCode);
  const player = getPlayer(playerId);

  if (!game || !player) {
    console.error(`❌ join-team failed: game=${!!game}, player=${!!player}`);
    return;
  }

  const team = game.teams.find((t) => t.id === teamId);
  if (!team) {
    socket.emit("team-join-failed", { reason: "invalid-team" });
    return;
  }

  // ✅ Remove player from previous team if they had one
  if (player.teamId) {
    const oldTeam = game.teams.find((t) => t.id === player.teamId);
    if (oldTeam && oldTeam.members) {
      oldTeam.members = oldTeam.members.filter((m) => m !== player.name);
    }
  }

  // ✅ Check if team is already full (5 members max)
  const teamMembers = game.players.filter((p) => p.teamId === teamId);
  if (teamMembers.length >= 5) {
    console.log(`🚫 ${player.name} tried to join full team: ${team.name}`);
    socket.emit("team-join-failed", {
      reason: "team-full",
      message: `Team ${team.name} already has 5 players.`,
    });
    return;
  }

  // ✅ Assign team ID to player
  updatePlayer(playerId, { teamId });

  // ✅ Add player to team.members array
  if (!team.members) team.members = [];
  if (!team.members.includes(player.name)) {
    team.members.push(player.name);
  }

  // ✅ Update game object in memory
  updateGame(gameCode, game);

  // ✅ Join both the game and private team room
  socket.join(gameCode);
  socket.join(teamId);

  console.log(`👥 Player ${player.name} joined team room: ${teamId}`);
  console.log(`📡 ${player.name} is now in rooms:`, socket.rooms);

  // Notify everyone in the game room that a player joined or switched
  io.to(gameCode).emit("team-updated", {
    playerId,
    teamId,
    game,
  });
});



  // UPDATED: Submit answer with SINGLE ATTEMPT system
  socket.on("submit-answer", (data) => {
    const { gameCode, playerId, answer } = data;
    const game = getGame(gameCode);
    const player = getPlayer(playerId);

    if (!game || !player || game.status !== "active") {
      socket.emit("answer-rejected", {
        reason: "invalid-state",
        message: "Cannot submit answer - invalid game state",
      });
      return;
    }

    const currentRound = game.currentRound ?? 1;

    // ✅ TOSS-UP ROUND (Round 0)
    if (currentRound === 0) {
      if (!game.tossUpAnswers) game.tossUpAnswers = [];
      if (!game.tossUpSubmittedTeams) game.tossUpSubmittedTeams = [];

      const teamId = player.teamId;

      if (game.tossUpSubmittedTeams.includes(teamId)) {
        socket.emit("answer-rejected", {
          reason: "already-answered",
          message: "Your team has already answered the toss-up round.",
        });
        return;
      }

      const result = submitAnswer(gameCode, playerId, answer);
      if (!result.success) {
        socket.emit("answer-rejected", {
          reason: "submission-failed",
          message: result.message,
        });
        return;
      }

      // The service already records the team's answer and marks them as having
      // submitted. Avoid duplicating that state here so the toss-up round waits
      // for both teams correctly.

      // Emit answer result
      if (result.isCorrect) {
        io.to(gameCode).emit("answer-correct", {
          ...result,
          submittedText: answer,
          singleAttempt: true,
        });
      } else {
        io.to(gameCode).emit("answer-incorrect", {
          ...result,
          submittedText: answer,
          singleAttempt: true,
          allCardsRevealed: false,
        });
      }

      // ✅ Both teams have answered — reveal and decide winner
      if (game.tossUpSubmittedTeams.length === 2) {
        game.disableForceNext = true;
        updateGame(gameCode, game);
        
        setTimeout(() => {
          const currentQuestion = getCurrentQuestion(game);

          if (currentQuestion) {
            currentQuestion.answers.forEach((a) => (a.revealed = true));
            io.to(gameCode).emit("remaining-cards-revealed", {
              game,
              currentQuestion,
            });
          }

          const [answer1, answer2] = game.tossUpAnswers;
          let winnerTeamId = null;

          if (answer1.score > answer2.score) {
            winnerTeamId = answer1.teamId;
          } else if (answer2.score > answer1.score) {
            winnerTeamId = answer2.teamId;
          } else {
            // Tie - use the team that buzzed first
            winnerTeamId = game.buzzedTeamId;
          }

          game.teams.forEach((t) => {
            t.active = false;
          });

          game.gameState.canAdvance = true;
          game.gameState.currentTurn = null;
          game.tossUpWinner = {
            teamId: winnerTeamId,
            teamName: game.teams.find((t) => t.id === winnerTeamId)?.name,
          };

          updateGame(gameCode, game);

          io.to(gameCode).emit("question-complete", {
            game: game,
            currentQuestion: getCurrentQuestion(game),
          });
        }, 2000);
      } else {
        // ✅ Switch turn to the other team (buzzer logic)
        const [teamA, teamB] = game.teams;
        const otherTeamId = teamA.id === teamId ? teamB.id : teamA.id;

        // Keep the original buzzed team for tie-break purposes but switch the
        // active team to allow the second team to answer.
        game.activeTeamId = otherTeamId;
        game.teams.forEach((t) => (t.active = t.id === otherTeamId));
        game.gameState.currentTurn = otherTeamId.includes("team1")
          ? "team1"
          : "team2";

        const updatedGame = updateGame(gameCode, game);

        io.to(gameCode).emit("turn-changed", {
          game: updatedGame,
          newActiveTeam: updatedGame.gameState.currentTurn,
          teamName: updatedGame.teams.find((t) => t.active)?.name || "Unknown",
          currentQuestion: getCurrentQuestion(updatedGame),
        });

        console.log(`🔁 Switching to Team ${otherTeamId}`);
      }

      return;
    }

    if (currentRound === 4) {
      if (!game.lightningRoundSubmittedTeams)
        game.lightningRoundSubmittedTeams = [];

      const teamId = player.teamId;

      const result = submitAnswer(gameCode, playerId, answer);
      
      if (!result.success) {
        socket.emit("answer-rejected", {
          reason: "submission-failed",
          message: result.message,
        });
        return;
      }

      if (result.isCorrect) {
        game.pauseTimer = true;
        io.to(gameCode).emit("answer-correct", {
          ...result,
          submittedText: answer,
          singleAttempt: true,
        });

        if (result.revealRemainingAfterDelay) {
          setTimeout(() => {
            const updatedGame = getGame(gameCode);
            const currentQuestion = getCurrentQuestion(updatedGame);
            if (currentQuestion) {
              currentQuestion.answers.forEach((a) => (a.revealed = true));
              io.to(gameCode).emit("remaining-cards-revealed", {
                game: updatedGame,
                currentQuestion,
              });
            }
          }, 2000);
        }
      } else {
        if (game.lightningRoundSubmittedTeams.length === 2) {
          game.pauseTimer = true;
        }
        io.to(gameCode).emit("answer-incorrect", {
          ...result,
          submittedText: answer,
          singleAttempt: true,
          allCardsRevealed: false,
        });

        if (game.lightningRoundSubmittedTeams.length === 2) {
          
          setTimeout(() => {
            const currentQuestion = getCurrentQuestion(game);

            if (currentQuestion) {
              currentQuestion.answers.forEach((a) => (a.revealed = true));
              io.to(gameCode).emit("remaining-cards-revealed", {
                game,
                currentQuestion,
              });
            }
          }, 2000);
        }
        else {
          // ✅ Switch turn to the other team (buzzer logic)
          const [teamA, teamB] = game.teams;
          const otherTeamId = teamA.id === teamId ? teamB.id : teamA.id;

          // Keep the original buzzed team for tie-break purposes but switch the
          // active team to allow the second team to answer.
          game.activeTeamId = otherTeamId;
          game.teams.forEach((t) => (t.active = t.id === otherTeamId));
          game.gameState.currentTurn = otherTeamId.includes("team1")
            ? "team1"
            : "team2";

          const updatedGame = updateGame(gameCode, game);

          io.to(gameCode).emit("turn-changed", {
            game: updatedGame,
            newActiveTeam: updatedGame.gameState.currentTurn,
            teamName: updatedGame.teams.find((t) => t.active)?.name || "Unknown",
            currentQuestion: getCurrentQuestion(updatedGame),
          });

          console.log(`🔁 Switching to Team ${otherTeamId}`);
        }
      }
    } else {
      // ✅ REGULAR ROUNDS
      const playerTeam = game.teams.find((t) => t.id === player.teamId);
      if (!playerTeam || !playerTeam.active) {
        socket.emit("answer-rejected", {
          reason: "not-your-turn",
          message: "It's not your team's turn to answer",
        });
        return;
      }

      const result = submitAnswer(gameCode, playerId, answer);
      //Setting activeTeamId to null prevents usage of input field after submitting answer
      game.activeTeamId = null;

      if (!result.success) {
        socket.emit("answer-rejected", {
          reason: "submission-failed",
          message: result.message,
        });
        return;
      }

      if (result.isCorrect) {
        io.to(gameCode).emit("answer-correct", {
          ...result,
          submittedText: answer,
          singleAttempt: true,
        });

        // Inform other team that the question is being answered (no reveal)
        const [teamA, teamB] = game.teams;
        const otherTeamId = teamA.id === player.teamId ? teamB.id : teamA.id;
        io.to(otherTeamId).emit("opponent-answered", {
          message: `${playerTeam.name} has answered the question.`,
          hideAnswers: true,
        });

        if (result.revealRemainingAfterDelay) {
          game.disableForceNext = true;
          updateGame(gameCode, game);
          setTimeout(() => {
            const updatedGame = getGame(gameCode);
            const currentQuestion = getCurrentQuestion(updatedGame);
            if (currentQuestion) {
              currentQuestion.answers.forEach((a) => (a.revealed = true));
              io.to(gameCode).emit("remaining-cards-revealed", {
                game: updatedGame,
                currentQuestion,
              });
            }

            updatedGame.gameState.canAdvance = true;
            updateGame(gameCode, updatedGame);

            io.to(gameCode).emit("question-complete", {
              game: updatedGame,
              currentQuestion: getCurrentQuestion(updatedGame),
            });
          }, 2000);
        }
      } else {
        io.to(gameCode).emit("answer-incorrect", {
          ...result,
          submittedText: answer,
          singleAttempt: true,
          allCardsRevealed: true,
        });

        game.disableForceNext = true;
        updateGame(gameCode, game);

        setTimeout(() => {
          const readyGame = getGame(gameCode);
          if (readyGame) {
            readyGame.gameState.canAdvance = true;
            updateGame(gameCode, readyGame);

            io.to(gameCode).emit("question-complete", {
              game: readyGame,
              currentQuestion: getCurrentQuestion(readyGame),
            });
          }
        }, 2000);
      }
    }
  });

  socket.on("player-buzz", ({ gameCode, playerId }) => {
    const game = getGame(gameCode);
    const player = getPlayer(playerId);

    // Debug logs for each condition
    if (!game) {
      console.log("Error in Player Buzz: game not found", { gameCode });
    }
    if (!player) {
      console.log("Error in Player Buzz: player not found", { playerId });
    }
    // if (game && game.currentRound !== 0) {
    //   console.log("Error in Player Buzz: not round 0", {
    //     currentRound: game.currentRound,
    //   });
    // }
    if (game && game.status !== "active") {
      console.log("Error in Player Buzz: game not active", {
        status: game.status,
      });
    }
    if (
      !game ||
      !player ||
      // game.currentRound !== 0 ||
      game.status !== "active"
    ) {
      console.log("Error in Player Buzz: condition failed", {
        gameExists: !!game,
        playerExists: !!player,
        currentRound: game ? game.currentRound : undefined,
        status: game ? game.status : undefined,
      });
      return;
    }

    // Only allow buzzer if no team has buzzed yet
    if (game.buzzedTeamId) {
      socket.emit("buzz-too-late", { message: "Another team already buzzed." });
      return;
    }

    // Register the team that buzzed and make them active
    game.buzzedTeamId = player.teamId;
    game.activeTeamId = player.teamId;
    game.gameState.currentTurn = player.teamId.includes("team1")
      ? "team1"
      : "team2";
    game.teams.forEach((t) => (t.active = t.id === player.teamId));
    const updatedGame = updateGame(gameCode, game);

    io.to(gameCode).emit("buzzer-pressed", {
      game: updatedGame,
      playerId: player.id,
      teamId: player.teamId,
      teamName: updatedGame.teams.find((t) => t.id === player.teamId)?.name,
      playerName: player.name,
    });
  });
}

// Helper function to handle game state advancement logic
export function handleGameStateAdvancement(gameCode, advancedGame, io, result) {
  // Check what happened after advancing
  if (advancedGame.status === "round-summary") {
    // Round completed - emit round summary

    io.to(gameCode).emit("round-complete", {
      game: advancedGame,
      isGameFinished: advancedGame.currentRound >= 3,
    });

    console.log(`🏁 Round ${advancedGame.currentRound} completed`);
  } else if (advancedGame.status === "finished") {
    // Game finished - include round summary for final round
    const winner = getGameWinner(advancedGame);

    io.to(gameCode).emit("game-over", {
      game: advancedGame,
      winner: winner,
    });

    console.log(`🏆 Game finished: ${gameCode}`);
  } else if (
    advancedGame.gameState.currentTurn !== result.game.gameState.currentTurn
  ) {
    // Turn switched
    const newActiveTeam = advancedGame.teams.find((t) => t.active);

    io.to(gameCode).emit("turn-changed", {
      game: advancedGame,
      newActiveTeam: advancedGame.gameState.currentTurn,
      teamName: newActiveTeam?.name || "Unknown",
      currentQuestion: getCurrentQuestion(advancedGame),
    });

    console.log(`↔️ Turn switched to ${newActiveTeam?.name || "Unknown Team"}`);
  } else {
    // Same team continues with next question
    io.to(gameCode).emit("next-question", {
      game: advancedGame,
      currentQuestion: getCurrentQuestion(advancedGame),
      sameTeam: true,
    });

    console.log(`➡️ ${result.teamName} continues with next question`);
  }
}

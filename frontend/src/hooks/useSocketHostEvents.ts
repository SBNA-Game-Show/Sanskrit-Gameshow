import { useEffect } from "react";
import { Socket } from "socket.io-client";
import { getTeamName } from "../utils/gameHelper";
import { Game } from "../types/index";

type PendingOverride = {
  teamId: string;
  round: number;
  questionNumber: number;
};

export const useSocketHostEvents = (
  socketRef: React.MutableRefObject<Socket | null>,
  gameCode: string | null | undefined,
  setGame: React.Dispatch<React.SetStateAction<Game | null>>,
  setControlMessage: React.Dispatch<React.SetStateAction<string>>,
  setPendingOverride: React.Dispatch<React.SetStateAction<PendingOverride | null>>,
  setOverrideMode: React.Dispatch<React.SetStateAction<boolean>>,
  setOverridePoints: React.Dispatch<React.SetStateAction<string>>
) => {
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    console.log("HOST IS SUBSCRIBING TO SOCKET EVENTS")

    socket.on("game-started", (data) => {
      console.log("🚀 Single-attempt game started with question tracking!");
      setGame(data.game);
      if (data.activeTeam) {
        const teamName = getTeamName(data.game, data.activeTeam);
        setControlMessage(
          `Game started! ${teamName} goes first. Each question allows only 1 attempt.`
        );
      } else {
        setControlMessage("Game started! Buzz in for the toss-up question.");
      }
    });

    socket.on("buzzer-pressed", (data) => {
      console.log("🔔 Buzzer pressed:", data);
      setGame(data.game);
      setControlMessage(`Turn switched to ${data.teamName}!`);
    });

    socket.on("player-joined", (data) => {
      console.log("👤 Player joined event received:", data);

      if (data.player) {
        setGame((prev) => {
          if (!prev) return null;

          const playerExists = prev.players.some(
            (p) => p.id === data.player.id
          );
          if (playerExists) {
            return {
              ...prev,
              players: prev.players.map((p) =>
                p.id === data.player.id ? { ...p, ...data.player } : p
              ),
            };
          }

          return {
            ...prev,
            players: [...prev.players, data.player],
          };
        });
      }
    });

    socket.on("answer-correct", (data) => {
      console.log("✅ Correct answer with question tracking:", data);
      setGame(data.game);
      setControlMessage(
        `✅ ${data.playerName} answered correctly! +${data.pointsAwarded} points for ${data.teamName}.`
      );

      const round = data.game.currentRound;
      const teamId = data.teamId;
      const teamKey = teamId?.includes("team1") ? "team1" : "team2";
      const questionNumber = data.game.gameState.questionsAnswered[teamKey] + 1;
      setPendingOverride({ teamId, round, questionNumber });
    });

    socket.on("answer-incorrect", (data) => {
      console.log("❌ Incorrect answer with question tracking:", data);
      setGame(data.game);
      setControlMessage(`❌ ${data.playerName} answered incorrectly.`);

      const round = data.game.currentRound;
      const teamId = data.teamId;
      const teamKey = teamId?.includes("team1") ? "team1" : "team2";
      const questionNumber = data.game.gameState.questionsAnswered[teamKey] + 1;

      setPendingOverride({ teamId, round, questionNumber });
    });

    socket.on("remaining-cards-revealed", (data) => {
      console.log("👁️ Remaining cards revealed:", data);
      setGame(data.game);
      // Preserve the previous message instead of showing a new one

      if (data.game.currentRound === 4) {
        setTimeout(() => {
          socket.emit("advance-question", { gameCode });
        }, 2500);
      }
    });

    socket.on("turn-changed", (data) => {
      console.log("↔️ Turn changed:", data);
      setGame(data.game);
      setControlMessage(`Turn switched to ${data.teamName}!`);
    });

    socket.on("next-question", (data) => {
      console.log("➡️ Next question:", data);
      setGame(data.game);
      if (data.sameTeam) {
        setControlMessage(`Same team continues with their next question.`);
      } else {
        setControlMessage(`Moving to next question.`);
      }
      setPendingOverride(null);
      setOverrideMode(false);
      setOverridePoints("0");
    });

    socket.on("question-complete", (data) => {
      console.log("🟢 Question complete:", data);
      setGame(data.game);
      setControlMessage("Question finished. Click Next Question when ready.");
    });

    socket.on("round-complete", (data) => {
      console.log("🏁 Round completed:", data);

      console.log(data.game);

      // Update game state
      if (data.game) {
        setGame(data.game);
        if (data.game.currentRound === 0) {
          setControlMessage(
            `${data.game.tossUpWinner?.teamName || "A team"} won the toss-up!`
          );
        } else {
          setControlMessage(
            `Round ${data.game.currentRound} completed! ${
              data.isGameFinished ? "Game finished!" : "Ready for next round."
            }`
          );
        }
      } else {
        setControlMessage(
          `Round ${data.game.currentRound} completed! ${
            data.isGameFinished ? "Game finished!" : "Ready for next round."
          }`
        );
      }
    });

    socket.on("round-started", (data) => {
      console.log("🆕 New round started:", data);
      setGame(data.game);
      const teamName = getTeamName(data.game, data.activeTeam);
      setControlMessage(
        `Round ${data.round} started! ${teamName} goes first. Each question allows only 1 attempt.`
      );
    });

    socket.on("game-over", (data) => {
      console.log("🏆 Game over:", data);
      setGame(data.game);
      setControlMessage("Game finished! Check out the final results.");
    });

    socket.on("players-list", (data: any) => {
      console.log("📋 Received players list:", data);
      if (data.players && data.players.length > 0) {
        setGame((prevGame) => {
          if (!prevGame) return null;

          const same = prevGame.players.length === data.players.length && 
          prevGame.players.every((player, idx) => player.id === data.players[idx].id);

          if (same) {
            return prevGame;
          }
          return {
            ...prevGame,
            players: data.players,
          };
        });
      }
    });

    socket.on("team-updated", (data: any) => {
      console.log("🔄 Team updated:", data);
      setGame(data.game);
    });

    socket.on("answers-revealed", (data) => {
      console.log("👁️ All answers revealed:", data);
      setGame(data.game);
      setControlMessage("All answers have been revealed!");
      setOverrideMode(false);

      if (data.game.currentRound === 4) {
        setTimeout(() => {
          socket.emit("advance-question", { gameCode });
        }, 2500);
      }
    });

    socket.on("answer-overridden", (data) => {
      console.log("✅ Answer overridden:", data);
      setGame(data.game);
      setControlMessage(
        `Host awarded ${data.pointsAwarded} points to ${data.teamName}.`
      );
      setOverrideMode(false);
    });

    socket.on("game-reset", (data) => {
      console.log("🔄 Game reset:", data);
      setGame(data.game);
      setControlMessage(data.message || "Game has been reset.");
      setOverrideMode(false);
    });

    socket.on("skipped-to-round", (data) => {
      console.log(data.message);
      setGame(data.game);
      setControlMessage(data.message || "Skipped rounds.");
      setOverrideMode(false);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
      setControlMessage("Connection error. Please try again.");
    });

    socket.on("error", (error) => {
      console.error("❌ Socket error:", error);
      setControlMessage(`Socket error: ${error.message || error}`);
    });

    return () => {
      socket.removeAllListeners();
    };
  }, [socketRef.current, gameCode]);
};

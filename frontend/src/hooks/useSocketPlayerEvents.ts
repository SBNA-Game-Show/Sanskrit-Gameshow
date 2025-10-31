import { useEffect } from "react";
import { Socket } from "socket.io-client";
import { getTeamName } from "../utils/gameHelper";
import { Game } from "../types/index";
import { Player } from "../types/index";

export const useSocketPlayerEvents = (
  socketRef: React.MutableRefObject<Socket | null>,
  game: Game | null,
  player: Player | null,
  setGame: React.Dispatch<React.SetStateAction<Game | null>>,
  setGameMessage: React.Dispatch<React.SetStateAction<string>>,
  setPlayer: React.Dispatch<React.SetStateAction<Player | null>>,
  setAnswer: React.Dispatch<React.SetStateAction<string>>,
  setHasBuzzed: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<string>>,
) => {
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    console.log("Player IS SUBSCRIBING TO SOCKET EVENTS")

    socket.on("player-joined", (data) => {
      console.log("Player joined event received:", data);

      if (game) {
        setGame((prevGame) => {
          if (!prevGame) return null;

          const playerExists = prevGame.players.some(
            (p) => p.id === data.player.id
          );
          if (playerExists) {
            return {
              ...prevGame,
              players: prevGame.players.map((p) =>
                p.id === data.player.id ? { ...p, ...data.player } : p
              ),
            };
          }

          return {
            ...prevGame,
            players: [...prevGame.players, data.player],
          };
        });
      }
    });

    socket.on("team-updated", (data) => {
      console.log("Team updated event received:", data);
      setGame(data.game);

      if (player && data.playerId === player.id) {
        setPlayer({
          ...player,
          teamId: data.teamId,
        });
      }
    });

    socket.on("game-started", (data) => {
      console.log("Single-attempt game started:", data);

      const updatedPlayer = data.game.players.find(
        (p: Player) => player && p.id === player.id
      );

      if (updatedPlayer && player) {
        setPlayer({
          ...player,
          teamId: updatedPlayer.teamId || player.teamId,
        });
      }

      setGame(data.game);
      if (data.activeTeam) {
        const teamName = getTeamName(data.game, data.activeTeam);
        setGameMessage(`Game started! ${teamName} goes first.`);
      } else {
        setGameMessage("Game started! Buzz in for the toss-up question.");
      }
    });

    socket.on("answer-correct", (data) => {
      console.log("Answer correct event received (single attempt):", data);
      setGame(data.game);
      setAnswer("");
      setGameMessage(
        `✅ ${data.playerName} answered correctly! +${data.pointsAwarded} points.`
      );
    });

    socket.on("answer-incorrect", (data) => {
      console.log("Answer incorrect event received (single attempt):", data);
      setGame(data.game);
      setAnswer("");

      // Check if it's lightning round and opposing team gets a chance
      if (data.game?.currentRound === 4 && data.switchToOpposingTeam) {
        const opposingTeamName = data.opposingTeamName || "Opposing team";
        setGameMessage(
          `❌ ${data.playerName} answered incorrectly. ${opposingTeamName} can now attempt to answer!`
        );
        // Reset buzz state for opposing team
        setHasBuzzed(false);
      } else {
        setGameMessage(`❌ ${data.playerName} answered incorrectly.`);
      }
    });

    socket.on("remaining-cards-revealed", (data) => {
      console.log("Remaining cards revealed:", data);
      setGame(data.game);
      // Do not override the current message when cards are revealed
    });

    socket.on("turn-changed", (data) => {
      console.log("Turn changed event received:", data);
      setGame(data.game);
      setGameMessage(`It's now ${data.teamName}'s turn!`);
    });

    socket.on("next-question", (data) => {
      console.log("Next question event received:", data);
      setGame(data.game);
      setAnswer("");
      if (data.sameTeam && data.game?.currentRound !== 4) {
        setGameMessage("Same team continues with their next question.");
      } else {
        setGameMessage("Moving to next question.");
      }
    });

    socket.on("question-complete", (data) => {
      console.log("Question complete event received:", data);
      setGame(data.game);
      setGameMessage("Waiting for host to advance...");
    });

    socket.on("round-complete", (data) => {
      console.log("Round complete event received:", data);

      // Update local game state when provided
      if (data.game) {
        setGame(data.game);
        if (data.game.currentRound === 0) {
          setGameMessage(
            `${
              data.game.tossUpWinner?.teamName || "A team"
            } won the toss-up!`
          );
        } else {
          setGameMessage(`Round ${data.game.currentRound} completed!`);
        }
      } else if (typeof data.round !== "undefined") {
        // Fallback to a simple message when summary is missing
        setGameMessage(`Round ${data.round} completed!`);
      }
    });

    socket.on("round-started", (data) => {
      console.log("Round started event received:", data);
      setGame(data.game);
      const teamName = getTeamName(data.game, data.activeTeam);
      setGameMessage(`Round ${data.round} started! ${teamName} goes first.`);
    });

    socket.on("game-over", (data) => {
      console.log("Game over event received:", data);
      setGame(data.game);
      setAnswer("");
      setGameMessage("Game finished!");
    });

    socket.on("players-list", (data) => {
      console.log("Players list received:", data);
      if (game) {
        const updatedPlayer = data.players.find(
          (p: Player) => player && p.id === player.id
        );
        if (updatedPlayer && player) {
          setPlayer({
            ...player,
            teamId: updatedPlayer.teamId || player.teamId,
          });
        }

        setGame((prevGame) => {
          if (!prevGame) return null;
          return {
            ...prevGame,
            players: data.players,
          };
        });
      }
    });

    socket.on("answer-rejected", (data) => {
      console.log("Answer rejected:", data);
      setError(data.message || "Answer rejected");
      setTimeout(() => setError(""), 3000);
    });

    socket.on("buzzer-pressed", (data) => {
      const { teamName, playerName } = data;
      console.log(`${teamName} buzzed first! ${playerName}, answer now!`);
      // Handle buzz-in and update state
      if (data.game) {
        setGame(data.game);
      }
      setGameMessage(`Turn switched to ${data.teamName}!`);
    });

    socket.on("answers-revealed", (data) => {
      console.log("All answers revealed:", data);
      setGame(data.game);
      setGameMessage("All answers have been revealed!");
    });

    socket.on("answer-overridden", (data) => {
      console.log("Answer overridden:", data);
      setGame(data.game);
      setGameMessage(
        `Host awarded ${data.pointsAwarded} points to ${data.teamName}.`
      );
    });

    socket.on("game-reset", (data) => {
      console.log("Game reset received:", data);
      setGame(data.game);
      setGameMessage(data.message || "Game has been reset.");
    });

    socket.on("skipped-to-round", (data) => {
      console.log("Game reset received:", data);
      setGame(data.game);
      setGameMessage(data.message || "Game has been reset.");
    });

    return () => {
      socket.removeAllListeners();
    };
  }, [socketRef.current]);
};

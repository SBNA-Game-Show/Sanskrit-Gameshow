import { useEffect } from "react";
import { Socket } from "socket.io-client";
import { getTeamName } from "../utils/gameHelper";
import { Game } from "../types/index";

export const useSocketAudienceEvents = (
  socketRef: React.MutableRefObject<Socket | null>,
  game: Game | null,
  isConnected: boolean,
  setGame: React.Dispatch<React.SetStateAction<Game | null>>,
  setMessage: React.Dispatch<
    React.SetStateAction<{
      text: string;
      type: "info" | "success" | "error";
    } | null>
  >
) => {
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    console.log("AUDIENCE IS SUBSCRIBING TO SOCKET EVENTS");

    socket.on("audience-joined", (data) => {
      setGame(data.game);
    });

    socket.on("game-started", (data) => {
      setGame(data.game);
      if (data.activeTeam) {
        const teamName = getTeamName(data.game, data.activeTeam);
        setMessage({
          text: `Game started! ${teamName} goes first.`,
          type: "info",
        });
      } else {
        setMessage({
          text: "Game started! Buzz in for the toss-up question.",
          type: "info",
        });
      }
    });

    socket.on("buzzer-pressed", (data) => {
      setGame(data.game);
      setMessage({
        text: `🔔 ${data.teamName} buzzed in! ${data.playerName}, answer now!`,
        type: "info",
      });
    });

    socket.on("answer-correct", (data) => {
      setGame(data.game);
      setMessage({
        text: `✅ ${data.teamName} answered "${data.submittedText}" correctly! +${data.pointsAwarded} points.`,
        type: "success",
      });
    });

    socket.on("answer-incorrect", (data) => {
      setGame(data.game);
      setMessage({
        text: `❌ ${data.teamName} answered "${data.submittedText}" incorrectly.`,
        type: "error",
      });
    });

    socket.on("answer-overridden", (data) => {
      setGame(data.game);
      setMessage({
        text: `✅ Host awarded ${data.pointsAwarded} points to ${data.teamName}.`,
        type: "success",
      });
    });

    socket.on("remaining-cards-revealed", (data) => {
      setGame(data.game);
      // Keep the previous message rather than displaying a new one
    });

    socket.on("answers-revealed", (data) => {
      setGame(data.game);
      setMessage({ text: "All answers have been revealed!", type: "info" });
    });

    socket.on("turn-changed", (data) => {
      setGame(data.game);
      setMessage({ text: `Turn switched to ${data.teamName}!`, type: "info" });
    });

    socket.on("next-question", (data) => {
      setGame(data.game);
      setMessage({ text: `Advanced to the next question!`, type: "info" });
    });

    socket.on("question-complete", (data) => {
      setGame(data.game);
    });

    socket.on("round-complete", (data) => {
      if (data.game) setGame(data.game);
    });

    socket.on("round-started", (data) => {
      setGame(data.game);
      const teamName = getTeamName(data.game, data.activeTeam);
      setMessage({
        text: `Round ${data.round} started! ${teamName} goes first.`,
        type: "info",
      });
    });

    socket.on("game-over", (data) => {
      setGame(data.game);
    });

    socket.on("players-list", (data) => {
      if (game) {
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

    socket.on("skipped-to-round", (data) => {
      console.log("Game reset received:", data);
      setGame(data.game);
      setMessage({
        text: `Host skipped to round ${data.game.currentRound}`,
        type: "info",
      });
    });

    return () => {
      socket.removeAllListeners();
    };
  }, [isConnected]);
};

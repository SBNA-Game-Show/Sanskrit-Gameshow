import { useState, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { GAME_CONFIG } from "../utils/constants";

interface SocketCallbacks {
  onPlayerJoined?: (data: any) => void;
  onTeamUpdated?: (data: any) => void;
  onHostJoined?: (data: any) => void;
  onGameStarted?: (data: any) => void;
  onPlayerBuzzed?: (data: any) => void;
  onBuzzTooLate?: (data: any) => void;
  onBuzzRejected?: (data: any) => void;
  onAnswerRevealed?: (data: any) => void;
  onNextQuestion?: (data: any) => void;
  onGameOver?: (data: any) => void;
  onBuzzerCleared?: (data: any) => void;
  onWrongAnswer?: (data: any) => void;
  onTeamSwitched?: (data: any) => void;
  onPlayersListReceived?: (data: any) => void;
  onAnswerRejected?: (data: any) => void;
}

export const useSocket = (callbacks: SocketCallbacks = {}) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      console.log("✅ Socket already connected:", socketRef.current.id);
      return socketRef.current;
    }

    console.log("🌐 Connecting to socket...");
    const newSocket = io(GAME_CONFIG.SOCKET_URL, {
      transports: ["websocket"], // ✅ Force WebSocket to avoid polling
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", (reason) => {
      console.warn("⚠️ Socket disconnected:", reason);
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
    });

    // 🧩 Register all callback handlers
    const eventsMap: { [event: string]: keyof SocketCallbacks } = {
      "player-joined": "onPlayerJoined",
      "team-updated": "onTeamUpdated",
      "host-joined": "onHostJoined",
      "game-started": "onGameStarted",
      "player-buzzed": "onPlayerBuzzed",
      "buzz-too-late": "onBuzzTooLate",
      "buzz-rejected": "onBuzzRejected",
      "answer-revealed": "onAnswerRevealed",
      "next-question": "onNextQuestion",
      "game-over": "onGameOver",
      "buzzer-cleared": "onBuzzerCleared",
      "wrong-answer": "onWrongAnswer",
      "team-switched": "onTeamSwitched",
      "players-list": "onPlayersListReceived",
      "answer-rejected": "onAnswerRejected",
    };

    Object.entries(eventsMap).forEach(([event, cbName]) => {
      const handler = callbacks[cbName];
      if (handler) {
        newSocket.on(event, handler);
      }
    });

    socketRef.current = newSocket;
    return newSocket;
  }, [callbacks]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log("🛑 Disconnecting socket...");
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // ⚙️ Utility emitters
  const emit = (event: string, payload: any) => {
    socketRef.current?.emit(event, payload);
  };

  const hostJoinGame = (gameCode: string, teams: any[]) =>
    emit("host-join", { gameCode, teams });

  const startGame = (gameCode: string) =>
    emit("start-game", { gameCode });

  const revealAnswer = (gameCode: string, answerIndex: number) =>
    emit("reveal-answer", { gameCode, answerIndex });

  const nextQuestion = (gameCode: string) =>
    emit("next-question", { gameCode });

  const clearBuzzer = (gameCode: string) =>
    emit("clear-buzzer", { gameCode });

  const playerJoinGame = (gameCode: string, playerId: string) =>
    emit("player-join", { gameCode, playerId });

  const buzzIn = (gameCode: string, playerId: string) =>
    emit("buzz-in", { gameCode, playerId });

  const submitAnswer = (
    gameCode: string,
    playerId: string,
    answer: string
  ) => emit("submit-answer", { gameCode, playerId, answer });

  const joinTeam = (
    gameCode: string,
    playerId: string,
    teamId: string
  ) => emit("join-team", { gameCode, playerId, teamId });

  const requestPlayersList = (gameCode: string) =>
    emit("get-players", { gameCode });

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    connect,
    disconnect,
    hostJoinGame,
    startGame,
    revealAnswer,
    nextQuestion,
    clearBuzzer,
    playerJoinGame,
    buzzIn,
    submitAnswer,
    joinTeam,
    requestPlayersList,
  };
};

import { useState, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { GAME_CONFIG } from "../utils/constants";
import { Game } from "../types";

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
  onTeamSwitched?: (data: { currentTeamId: string }) => void;
  onPlayersListReceived?: (data: any) => void;
  onAnswerRejected?: (data: any) => void;
}

export const useSocket = (callbacks: SocketCallbacks = {}) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [game, setGame] = useState<Game | null>(null);
  const [gameCode, setGameCode] = useState<string>("");

  const connect = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      return socketRef.current;
    }

    const newSocket = io(GAME_CONFIG.SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
    });

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
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const emit = (event: string, payload: any) => {
    socketRef.current?.emit(event, payload);
  };

  // 🔌 Emitters
  const hostJoinGame = (code: string, teams: any[]) => {
    setGameCode(code);
    emit("host-join", { gameCode: code, teams });
  };

  const startGame = (code: string) => emit("start-game", { gameCode: code });

  const revealAnswer = (code: string, answerIndex: number) =>
    emit("reveal-answer", { gameCode: code, answerIndex });

  const nextQuestion = (code: string) => emit("next-question", { gameCode: code });

  const onTeamSwitched = (code: string) => emit("team-switched", { gameCode: code });

  const clearBuzzer = (code: string) => emit("clear-buzzer", { gameCode: code });

  const playerJoinGame = (code: string, playerId: string) => {
    setGameCode(code);
    emit("player-join", { gameCode: code, playerId });
  };

  const buzzIn = (code: string, playerId: string) =>
    emit("buzz-in", { gameCode: code, playerId });

  const submitAnswer = (gameCode: string, playerId: string, answer: string) => {
    if (socketRef.current) {
      console.log("📤 Emitting submitAnswer socket event:", { gameCode, playerId, answer });
      emit("submitAnswer", { gameCode, playerId, answer });
    } else {
      console.error("❌ Socket not connected. Cannot emit submitAnswer.");
    }
  };

  const joinTeam = (code: string, playerId: string, teamId: string) =>
    emit("join-team", { gameCode: code, playerId, teamId });

  const requestPlayersList = (code: string) =>
    emit("get-players", { gameCode: code });

  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    connect,
    disconnect,
    game,
    setGame,
    gameCode,
    setGameCode,
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
    onTeamSwitched,
  };
};

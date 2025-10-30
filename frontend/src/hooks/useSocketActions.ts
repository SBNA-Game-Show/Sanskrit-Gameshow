import { Socket } from "socket.io-client";

export const useSocketActions = (socketRef: React.MutableRefObject<Socket | null>) => {
  const socket = socketRef.current;
  // Host actions
  const hostJoinGame = (gameCode: string, teams: any[]) => {
    if (socket) {
      console.log("Host joining game:", gameCode);
      socket.emit("host-join", { gameCode, teams });
    } else {
      console.error("Cannot join as host: socket not connected");
    }
  };

  const startGame = (gameCode: string) => {
    if (socket) { 
      console.log("Starting game:", gameCode);
      socket.emit("start-game", { gameCode });
    }
    else {
      console.error("Cannot start game - missing requirements");
    }
  };
  const buzzIn = (code: string, playerId: string) => {
    if (!socket) {
      console.error("❌ Cannot buzz in: socket is not connected.");
      return;
    }

    socket.emit("player-buzz", {
      gameCode: code,
      playerId,
    });
  };
  const completeTossUpRound = (gameCode: string) => {
    if (socket) {
      socket.emit("complete-toss-up-round", { gameCode });
    }
  };
  const continueToNextRound = (gameCode: string) => {
    if (socket) {
      socket.emit("continue-to-next-round", { gameCode });
    }
  };

  const forceNextQuestion = (gameCode: string) => {
    if (socket) {
      socket.emit("force-next-question", { gameCode });
    }
  };

  const advanceQuestion = (gameCode: string) => {
    if (socket) {
      socket.emit("advance-question", { gameCode });
    }
  };

  const forceRoundSummary = (gameCode: string) => {
    if (socket) {
      socket.emit("force-round-summary", { gameCode });
    }
  };

  const resetGame = (gameCode: string) => {
    if (socket) {
      socket.emit("reset-game", { gameCode });
    }
  };

  const overrideAnswer = (
    gameCode: string,
    teamId: string,
    round: number,
    questionNumber: number,
    isCorrect: boolean,
    points: number,
    answerIndex?: number
  ) => {
    if (socket) {
      socket.emit("override-answer", {
        gameCode,
        teamId,
        round,
        questionNumber,
        isCorrect,
        pointsAwarded: points,
        answerIndex,
      });
    }
  };

  const pauseTimer = (gameCode: string) => {
    if (socket) {
      socket.emit("pause-timer", { gameCode });
    }
  };

  const skipToRound = (
    gameCode: string,
    round: number,
    radioButtonRef: React.RefObject<HTMLFormElement>
  ) => {
    if (socket) {
      const selectedStartingTeam =
        radioButtonRef.current?.querySelector<HTMLInputElement>(
          'input[name="starting-team"]:checked'
        )?.value;
      socket.emit(
        "skip-to-round",
        gameCode,
        round,
        selectedStartingTeam
      );
    }
  };

  // Player actions
  const playerJoinGame = (gameCode: string, playerId: string) => {
    const newlyCreatedSocket = socketRef.current;
    if (newlyCreatedSocket) {
      console.log("Player joining game:", gameCode, "playerId:", playerId);
      newlyCreatedSocket.emit("player-join", { gameCode, playerId });
    } else {
      console.error("Cannot join game: socket not connected");
    }
  };

  const submitAnswer = (gameCode: string, playerId: string, answer: string) => {
    if (socket) {
      console.log("📝 Submitting single attempt answer:", {
        gameCode,
        playerId,
        answer,
      });
      socket.emit("submit-answer", { gameCode, playerId, answer });
    } else {
      console.error("Cannot submit answer: socket not connected");
    }
  };

  const joinTeam = (gameCode: string, playerId: string, teamId: string) => {
    if (socket) {
      console.log("Joining team:", teamId, "in game:", gameCode);
      socket.emit("join-team", { gameCode, playerId, teamId });
    }
  };

  const requestPlayersList = (gameCode: string) => {
    if (socket) {
      socket.emit("get-players", { gameCode });
    }
  };

  const audienceJoinGame = (gameCode: string) => {
    const newlyCreatedSocket = socketRef.current;
    if (newlyCreatedSocket) {
      console.log(`EMITTING audience-join ${gameCode}`)
      newlyCreatedSocket.emit("audience-join", { gameCode });
    }
  };

  return {
    // Host actions
    hostJoinGame,
    startGame,
    completeTossUpRound,
    continueToNextRound,
    advanceQuestion,
    forceNextQuestion,
    forceRoundSummary,
    overrideAnswer,
    resetGame,
    buzzIn,
    requestPlayersList,
    audienceJoinGame,
    pauseTimer,
    skipToRound,
    // Player actions
    playerJoinGame,
    submitAnswer,
    joinTeam,
  };
};

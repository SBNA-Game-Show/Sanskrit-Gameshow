import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";

interface SocketCallbacks {
  onPlayerJoined?: (data: any) => void;
  onTeamUpdated?: (data: any) => void;
  onHostJoined?: (data: any) => void;
  onGameStarted?: (data: any) => void;
  onBuzzerPressed?: (data: any) => void;
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
  onAnswerCorrect?: (data: any) => void;
  onAnswerIncorrect?: (data: any) => void;
  onTurnChanged?: (data: any) => void;
  onRoundComplete?: (data: any) => void;
  onRoundStarted?: (data: any) => void;
  onQuestionForced?: (data: any) => void;
  onQuestionComplete?: (data: any) => void;
  onGameReset?: (data: any) => void;
  onSkippedToRound?: (data: any) => void;
  onAnswersRevealed?: (data: any) => void;
  onRemainingCardsRevealed?: (data: any) => void;
  onAnswerOverridden?: (data: any) => void;
  onAudienceJoined?: (data: any) => void;
}

export function useSocketEvents(
  socket: Socket | null,
  callbacks: SocketCallbacks
) {
  const callbacksRef = useRef(callbacks);

  // Keep ref updated with latest callbacks
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    if (!socket) return;

    // Create handler functions that reference the ref
    const handlePlayerJoined = (data: any) => callbacksRef.current.onPlayerJoined?.(data);
    const handleTeamUpdated = (data: any) => callbacksRef.current.onTeamUpdated?.(data);
    const handleHostJoined = (data: any) => callbacksRef.current.onHostJoined?.(data);
    const handleGameStarted = (data: any) => callbacksRef.current.onGameStarted?.(data);
    const handleBuzzerPressed = (data: any) => callbacksRef.current.onBuzzerPressed?.(data);
    const handleBuzzTooLate = (data: any) => callbacksRef.current.onBuzzTooLate?.(data);
    const handleBuzzRejected = (data: any) => callbacksRef.current.onBuzzRejected?.(data);
    const handleAnswerRevealed = (data: any) => callbacksRef.current.onAnswerRevealed?.(data);
    const handleNextQuestion = (data: any) => callbacksRef.current.onNextQuestion?.(data);
    const handleGameOver = (data: any) => callbacksRef.current.onGameOver?.(data);
    const handleBuzzerCleared = (data: any) => callbacksRef.current.onBuzzerCleared?.(data);
    const handleWrongAnswer = (data: any) => callbacksRef.current.onWrongAnswer?.(data);
    const handleTeamSwitched = (data: any) => callbacksRef.current.onTeamSwitched?.(data);
    const handlePlayersListReceived = (data: any) => callbacksRef.current.onPlayersListReceived?.(data);
    const handleAnswerRejected = (data: any) => callbacksRef.current.onAnswerRejected?.(data);
    const handleAnswerCorrect = (data: any) => callbacksRef.current.onAnswerCorrect?.(data);
    const handleAnswerIncorrect = (data: any) => callbacksRef.current.onAnswerIncorrect?.(data);
    const handleTurnChanged = (data: any) => callbacksRef.current.onTurnChanged?.(data);
    const handleRoundComplete = (data: any) => callbacksRef.current.onRoundComplete?.(data);
    const handleRoundStarted = (data: any) => callbacksRef.current.onRoundStarted?.(data);
    const handleQuestionForced = (data: any) => callbacksRef.current.onQuestionForced?.(data);
    const handleQuestionComplete = (data: any) => callbacksRef.current.onQuestionComplete?.(data);
    const handleGameReset = (data: any) => callbacksRef.current.onGameReset?.(data);
    const handleSkippedToRound = (data: any) => callbacksRef.current.onSkippedToRound?.(data);
    const handleAnswersRevealed = (data: any) => callbacksRef.current.onAnswersRevealed?.(data);
    const handleRemainingCardsRevealed = (data: any) => callbacksRef.current.onRemainingCardsRevealed?.(data);
    const handleAnswerOverridden = (data: any) => callbacksRef.current.onAnswerOverridden?.(data);
    const handleAudienceJoined = (data: any) => callbacksRef.current.onAudienceJoined?.(data);

    // Register all handlers
    socket.on("player-joined", handlePlayerJoined);
    socket.on("team-updated", handleTeamUpdated);
    socket.on("host-joined", handleHostJoined);
    socket.on("game-started", handleGameStarted);
    socket.on("buzzer-pressed", handleBuzzerPressed);
    socket.on("buzz-too-late", handleBuzzTooLate);
    socket.on("buzz-rejected", handleBuzzRejected);
    socket.on("answer-revealed", handleAnswerRevealed);
    socket.on("next-question", handleNextQuestion);
    socket.on("game-over", handleGameOver);
    socket.on("buzzer-cleared", handleBuzzerCleared);
    socket.on("wrong-answer", handleWrongAnswer);
    socket.on("team-switched", handleTeamSwitched);
    socket.on("players-list", handlePlayersListReceived);
    socket.on("answer-rejected", handleAnswerRejected);
    socket.on("answer-correct", handleAnswerCorrect);
    socket.on("answer-incorrect", handleAnswerIncorrect);
    socket.on("turn-changed", handleTurnChanged);
    socket.on("round-complete", handleRoundComplete);
    socket.on("round-started", handleRoundStarted);
    socket.on("question-forced", handleQuestionForced);
    socket.on("question-complete", handleQuestionComplete);
    socket.on("game-reset", handleGameReset);
    socket.on("skipped-to-round", handleSkippedToRound);
    socket.on("answers-revealed", handleAnswersRevealed);
    socket.on("remaining-cards-revealed", handleRemainingCardsRevealed);
    socket.on("answer-overridden", handleAnswerOverridden);
    socket.on("audience-joined", handleAudienceJoined);

    return () => {
      console.log('Cleaning up socket events');
      socket.off("player-joined", handlePlayerJoined);
      socket.off("team-updated", handleTeamUpdated);
      socket.off("host-joined", handleHostJoined);
      socket.off("game-started", handleGameStarted);
      socket.off("buzzer-pressed", handleBuzzerPressed);
      socket.off("buzz-too-late", handleBuzzTooLate);
      socket.off("buzz-rejected", handleBuzzRejected);
      socket.off("answer-revealed", handleAnswerRevealed);
      socket.off("next-question", handleNextQuestion);
      socket.off("game-over", handleGameOver);
      socket.off("buzzer-cleared", handleBuzzerCleared);
      socket.off("wrong-answer", handleWrongAnswer);
      socket.off("team-switched", handleTeamSwitched);
      socket.off("players-list", handlePlayersListReceived);
      socket.off("answer-rejected", handleAnswerRejected);
      socket.off("answer-correct", handleAnswerCorrect);
      socket.off("answer-incorrect", handleAnswerIncorrect);
      socket.off("turn-changed", handleTurnChanged);
      socket.off("round-complete", handleRoundComplete);
      socket.off("round-started", handleRoundStarted);
      socket.off("question-forced", handleQuestionForced);
      socket.off("question-complete", handleQuestionComplete);
      socket.off("game-reset", handleGameReset);
      socket.off("skipped-to-round", handleSkippedToRound);
      socket.off("answers-revealed", handleAnswersRevealed);
      socket.off("remaining-cards-revealed", handleRemainingCardsRevealed);
      socket.off("answer-overridden", handleAnswerOverridden);
      socket.off("audience-joined", handleAudienceJoined);
    };
  }, [socket]); 
}
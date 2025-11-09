import React from "react";
import { useState, useEffect, useRef, useContext } from "react";
import { SocketContext } from "store/socket-context";
import { Game } from "../../types";
import { useSocketActions } from "../../hooks/useSocketActions";

interface QuestionCardProps {
  game?: Game;
  question: string;
  duration: number;
  isTimerActive: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  game,
  question,
  duration,
  isTimerActive,
}) => {
  const [progress, setProgress] = useState(100);
  const socketContext = useContext(SocketContext);
  if (!socketContext) {
    throw new Error("HostGamePage must be used within a SocketProvider");
  }
  const { socketRef } = socketContext;
  const {pauseTimer} = useSocketActions(socketRef)

  // The canAdvance ref ensures that the onNextQuestion function doesn't run twice due to strict mode
  const canAdvanceRef = useRef(true);
  const timerSpeedModifierRef = useRef(1);
  const timerColorRef = useRef("bg-green-200");

  if (game?.pauseTimer) {
    timerSpeedModifierRef.current = 0;
    timerColorRef.current = "bg-gray-100";
  } else {
    game?.teams.forEach((team) => {
      if (team.active && game.currentRound === 4) {
        timerSpeedModifierRef.current = 0.75;
        timerColorRef.current = "bg-yellow-100";
        return;
      }
    });
  }

  if (progress <= 0 && canAdvanceRef.current && game) {
    pauseTimer(game.code);
    canAdvanceRef.current = false;
  }

  useEffect(() => {
    if (isTimerActive) {
      const interval = 30;
      const startTime = Date.now();
      let timePassedInMs;

      canAdvanceRef.current = true;
      timerSpeedModifierRef.current = 1;
      timerColorRef.current = "bg-green-200";
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            return 0;
          }
          timePassedInMs =
            (Date.now() - startTime) * timerSpeedModifierRef.current;
          return ((duration - timePassedInMs) / duration) * 100;
        });
      }, interval);

      return () => clearInterval(timer);
    }
  }, [isTimerActive, duration]);

  return (
    <>
      <div className="question-card flex-shrink-0 relative flex items-center justify-center">
        {isTimerActive && (
          <div
            className={`${timerColorRef.current} absolute inset-0 h-full`}
            style={{ width: `${progress}%` }}
          ></div>
        )}
        <h2 className="relative z-10 px-4">{question}</h2>
      </div>
    </>
  );
};
export default QuestionCard;

import React from "react";
import { useState, useEffect, useRef } from "react";
import { Game } from "../../types";

interface QuestionCardProps {
  game?: Game;
  question: string;
  duration: number;
  isTimerActive: boolean;
  onPauseTimer?: () => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  game,
  question,
  duration,
  isTimerActive,
  onPauseTimer,
}) => {

  const [progress, setProgress] = useState(100);

  // The canAdvance ref ensures that the onNextQuestion function doesn't run twice due to strict mode
  const canAdvanceRef = useRef(true); 
  const timerSpeedModifierRef = useRef(1);
  const timerColorRef = useRef("bg-green-200")

  if (game?.pauseTimer ) {
    timerSpeedModifierRef.current = 0;
    timerColorRef.current = "bg-gray-100"; 
  }
  else {
    game?.teams.forEach((team) => {
      if (team.active && game.currentRound === 4) {
        timerSpeedModifierRef.current = 0.75;
        timerColorRef.current = "bg-yellow-100";
        return;
      }
    })
  }
  

  if (progress <= 0 && canAdvanceRef.current) {
    onPauseTimer?.();
    canAdvanceRef.current = false;
  }

  useEffect(() => {
    if (isTimerActive) {
      const interval = 30;
      const startTime = Date.now()
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
          timePassedInMs = (Date.now() - startTime) * timerSpeedModifierRef.current;
          return (duration-timePassedInMs)/duration*100 
        })
      }, interval)

      return () => clearInterval(timer);
    }
  }, [isTimerActive, duration])

  return (
    <>
      <div className=" question-card flex-shrink-0">
        {isTimerActive && <div className={`${timerColorRef.current} h-full`} style={{width: `${progress}%`}}></div>}
        <h2 className="absolute top-7 inset-0">{question}</h2>
      </div>
    </>
  );

}
export default QuestionCard;
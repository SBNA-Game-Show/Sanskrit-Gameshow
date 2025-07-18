import React from "react";
import { Game } from "../../types";
import { getCurrentQuestion } from "../../utils/gameHelper";
import QuestionCard from "./QuestionCard";
import AnswerGrid from "./AnswerGrid";
import BuzzerDisplay from "./BuzzerDisplay";
import GameControls from "./GameControls";

interface GameBoardProps {
  game: Game;
  currentBuzzer?: {
    playerId?: string;
    teamId?: string;
    playerName: string;
    teamName: string;
    timestamp: number;
  } | null;
  answerTimeLeft?: number;
  onRevealAnswer?: (answerIndex: number) => void;
  onNextQuestion?: () => void;
  onClearBuzzer?: () => void;
  onCorrectAnswer?: () => void;
  onIncorrectAnswer?: () => void;
  isHost?: boolean;
  variant?: "host" | "player";
  revealedAnswers?: number[];
  controlMessage?: string;
  playerAnswer?: string;
}

const GameBoard: React.FC<GameBoardProps> = ({
  game,
  currentBuzzer,
  answerTimeLeft = 0,
  onRevealAnswer,
  onNextQuestion,
  onClearBuzzer,
  onCorrectAnswer,
  onIncorrectAnswer,
  isHost = false,
  variant = "host",
  controlMessage,
  playerAnswer,
}) => {
  const currentQuestion = getCurrentQuestion(game);

  if (!currentQuestion) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-xl font-bold text-slate-300">
          No question available
        </p>
      </div>
    );
  }

  if (variant === "player") {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <QuestionCard
          question={currentQuestion}
          currentRound={game.currentRound}
          questionIndex={game.currentQuestionIndex}
          totalQuestions={game.questions.length}
          variant="compact"
        />

        <AnswerGrid
          answers={currentQuestion.answers}
          currentRound={game.currentRound}
          variant="player"
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <QuestionCard
        question={currentQuestion}
        currentRound={game.currentRound}
        questionIndex={game.currentQuestionIndex}
        totalQuestions={game.questions.length}
        variant="compact"
      />

      <AnswerGrid
        answers={currentQuestion.answers}
        currentRound={game.currentRound}
        onRevealAnswer={onRevealAnswer}
        isHost={isHost}
        variant="compact"
      />

      {/* Host-Side Buzzer Display */}
      {isHost && currentBuzzer && (
        <div className="text-center text-white mt-4">
          <p>
            Answering: <strong>{currentBuzzer.playerName}</strong> from <strong>{currentBuzzer.teamName}</strong>
          </p>
          <div className="flex justify-center mt-2 gap-4">
            <button
              onClick={onCorrectAnswer}
              className="px-4 py-2 bg-green-600 rounded shadow"
            >
              ✅ Correct
            </button>
            <button
              onClick={onIncorrectAnswer}
              className="px-4 py-2 bg-red-600 rounded shadow"
            >
              ❌ Incorrect
            </button>
          </div>
        </div>
      )}

      {/* Optional BuzzerDisplay for animation */}
      {!isHost && game.currentBuzzer && currentBuzzer && (
        <BuzzerDisplay
          currentBuzzer={currentBuzzer}
          answerTimeLeft={answerTimeLeft}
          onNextQuestion={onNextQuestion}
          onCorrectAnswer={onCorrectAnswer}
          onIncorrectAnswer={onIncorrectAnswer}
          isHost={isHost}
          playerAnswer={playerAnswer}
        />
      )}

      {/* Host Controls */}
      {isHost && onClearBuzzer && onNextQuestion && (
        <GameControls
          onClearBuzzer={onClearBuzzer}
          onNextQuestion={onNextQuestion}
          controlMessage={controlMessage}
          variant="compact"
        />
      )}
    </div>
  );
};

export default GameBoard;

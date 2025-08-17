import React from "react";
import { Game } from "../../types";
import Button from "../common/Button";
import Input from "../common/Input";
import { getCurrentQuestion } from "../../utils/gameHelper";

interface GameBoardProps {
  game: Game;
  onRevealAnswer?: (answerIndex: number) => void;
  onSelectAnswer?: (answerIndex: number) => void;
  onNextQuestion?: () => void;
  isHost?: boolean;
  variant?: "host" | "player";
  controlMessage?: string;
  overrideMode?: boolean;
  overridePoints?: string;
  onOverridePointsChange?: (value: string) => void;
  onCancelOverride?: () => void;
  onConfirmOverride?: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({
  game,
  onRevealAnswer,
  onSelectAnswer,
  onNextQuestion,
  isHost = false,
  variant = "host",
  controlMessage,
  overrideMode = false,
  overridePoints,
  onOverridePointsChange,
  onCancelOverride,
  onConfirmOverride,
}) => {
  const currentQuestion = getCurrentQuestion(game);

  if (!currentQuestion) {
    return (
      <div className="glass-card p-6 text-center question-card">
        <p className="text-lg font-bold text-slate-300">
          No question available
        </p>
      </div>
    );
  }

  // Create round status indicator like in the image
  const RoundStatus = () => (
    <div className="flex items-center gap-2">
      {[1, 2, 3].map((roundNum) => (
        <div key={roundNum} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
              roundNum < game.currentRound
                ? "bg-green-500 text-white border-green-400"
                : roundNum === game.currentRound
                ? "bg-yellow-400 text-black border-yellow-300"
                : "bg-gray-600 text-gray-300 border-gray-500"
            }`}
          >
            {roundNum}
          </div>
          {roundNum < 3 && (
            <div
              className={`w-6 h-0.5 mx-1 ${
                roundNum < game.currentRound ? "bg-green-500" : "bg-gray-500"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  if (variant === "player") {
    return (
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Keep question visible on mobile by sticking it to the top */}
        <div className="sticky top-0 z-10">
          {/* Question Header - Compact with Round Status */}
          <div className="glass-card question-header flex-shrink-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/30">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-bold">
                  {game.currentRound === 0
                    ? 'Toss-up Round'
                    : `Round ${game.currentRound}`} •{' '}
                  {currentQuestion.questionCategory}
                </h2>
                <div className="text-xs text-slate-400">
                  Question {game.currentRound === 0 ? 1 : game.currentQuestionIndex + 1} of{' '}
                  {game.currentRound === 0 ? 1 : game.questions.length}
                </div>
              </div>
              <RoundStatus />
            </div>
          </div>

          {/* Question Text - Compact */}
          <div className="glass-card question-card flex-shrink-0">
            <h2 className="text-center">{currentQuestion.question}</h2>
          </div>
        </div>

        {/* Answer Grid - Vertical Layout */}
        <div className="answer-grid">
          {currentQuestion.answers.slice(0, 3).map((answer, index) => (
            <div
              key={index}
              className={`answer-card glass-card transition-all ${
                answer.revealed
                  ? "bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-green-400 animate-pulse"
                  : "border-slate-500/50"
              }`}
            >
              <span className="answer-text">
                {answer.revealed ? (
                  <span className="text-black">
                    {index + 1}. {answer.answer}
                  </span>
                ) : (
                  <span className="text-slate-400">
                    {index + 1}. {"\u00A0".repeat(12)}
                  </span>
                )}
              </span>
              <span
                className={`answer-points ${
                  answer.revealed
                    ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-black"
                    : "bg-slate-700 text-slate-400"
                }`}
              >
                {answer.revealed
                  ? game.currentRound === 0
                    ? answer.score
                    : answer.score * game.currentRound
                  : "?"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
      <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Keep question visible on mobile by sticking it to the top */}
      <div className="sticky top-0 z-10">
        {/* Question Header with Round Status */}
        <div className="glass-card question-header flex-shrink-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/30">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-bold">
                {game.currentRound === 0
                  ? 'Toss-up Round'
                  : `Round ${game.currentRound}`} •{' '}
                {currentQuestion.questionCategory}
              </h2>
              <div className="text-xs text-slate-400">
                Question {game.currentRound === 0 ? 1 : game.currentQuestionIndex + 1} of{' '}
                {game.currentRound === 0 ? 1 : game.questions.length}
              </div>
            </div>
            <RoundStatus />
          </div>
        </div>

        {/* Question Text */}
        <div className="glass-card question-card flex-shrink-0">
          <h2 className="text-center">{currentQuestion.question}</h2>
        </div>
      </div>

      {/* Answer Grid - Vertical Layout for Host - Only 3 answers, Host sees all */}
      <div className="answer-grid">
        {currentQuestion.answers.slice(0, 3).map((answer, index) => (
          <div
            key={index}
            className={`answer-card glass-card transition-all ${
              answer.revealed
                ? "bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-green-400 animate-pulse"
                : "hover:border-blue-400"
            } ${
              isHost && (!answer.revealed || overrideMode) ? "cursor-pointer" : ""
            }`}
            onClick={() => {
              if (overrideMode) {
                onSelectAnswer?.(index);
              } else if (isHost && !answer.revealed) {
                onRevealAnswer?.(index);
              }
            }}
          >
            <span className="answer-text">
              {/* HOST ALWAYS SEES THE ANSWER TEXT */}
              {isHost ? (
                <span className={answer.revealed ? "text-black" : "text-blue-300"}>
                  {index + 1}. {answer.answer}
                  {!answer.revealed && <span className="ml-2 text-xs text-yellow-400">(Click to reveal)</span>}
                </span>
              ) : (
                // NON-HOST VIEW
                answer.revealed ? (
                  <span className="text-black">
                    {index + 1}. {answer.answer}
                  </span>
                ) : (
                  <span className="text-slate-400">
                    {index + 1}. {"\u00A0".repeat(15)}
                  </span>
                )
              )}
            </span>
            <span
              className={`answer-points ${
                answer.revealed
                  ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-black"
                  : "bg-slate-700 text-slate-400"
              }`}
            >
              {answer.revealed || isHost
                ? game.currentRound === 0
                  ? answer.score
                  : answer.score * game.currentRound
                : "?"}
            </span>
          </div>
        ))}
      </div>

      {/* Host Control Message */}
      {isHost && (controlMessage || overrideMode || game.gameState.canAdvance) && (
        <div className="glass-card host-controls">
          <div className="text-center">
            {overrideMode && (
              <>
                <div className="text-xs text-yellow-300 mb-2">
                  Select an answer or enter points to award
                </div>
                <div className="flex justify-center items-center gap-2 mt-1">
                  <Input
                    id="overridePoints"
                    type="number"
                    value={overridePoints ?? ""}
                    onChange={(e) =>
                      onOverridePointsChange &&
                      onOverridePointsChange(e.target.value)
                    }
                    className="w-24 text-center"
                    variant="center"
                    placeholder="Award points"
                  />
                  {onConfirmOverride && (
                    <Button
                      onClick={onConfirmOverride}
                      variant="primary"
                      size="sm"
                      className="text-xs py-1 px-3"
                    >
                      Award
                    </Button>
                  )}
                  {onCancelOverride && (
                    <Button
                      onClick={onCancelOverride}
                      variant="secondary"
                      size="sm"
                      className="text-xs py-1 px-3"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </>
            )}
            {controlMessage && !overrideMode && (
              <div className="text-xs text-blue-400">{controlMessage}</div>
            )}
            {game.gameState.canAdvance && !overrideMode && (
              <Button
                onClick={onNextQuestion}
                variant="primary"
                size="sm"
                className="mt-2 text-xs py-1 px-3"
              >
                Next Question
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;

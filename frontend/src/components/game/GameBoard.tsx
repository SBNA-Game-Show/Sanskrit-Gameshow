import React from "react";
import { useContext } from "react";
import { SocketContext } from "store/socket-context";
import { useSocketActions } from "../../hooks/useSocketActions";
import { Game } from "../../types";
import Button from "../common/Button";
import Input from "../common/Input";
import { getCurrentQuestion } from "../../utils/gameHelper";
import QuestionCard from "./QuestionCard";
import { Team } from "../../types";
import { Question } from "../../types";

interface GameBoardProps {
  game: Game;
  onRevealAnswer?: (answerIndex: number) => void;
  onOverride?: (answerIndex?: number) => void;
  onCompleteTossUpRound?: () => void;
  isHost?: boolean;
  variant?: "host" | "player";
  controlMessage?: string;
  overrideMode?: boolean;
  overridePoints?: string;
  onOverridePointsChange?: (value: string) => void;
  onCancelOverride?: () => void;
  onClickAnswerCard?: (answer: string) => void;
  currentTeam: "team1" | "team2" | null;
  teams: Team[];
  currentQuestion: Question | null;
  questionsAnswered: { team1: number; team2: number };
  round: number;
}

const GameBoard: React.FC<GameBoardProps> = ({
  game,
  onRevealAnswer,
  onOverride,
  onCompleteTossUpRound,
  isHost = false,
  variant = "host",
  controlMessage,
  overrideMode = false,
  overridePoints,
  onOverridePointsChange,
  onCancelOverride,
  onClickAnswerCard,
  currentTeam,
  teams,
  // currentQuestion,
  questionsAnswered,
  round,
}) => {
  const socketContext = useContext(SocketContext);
  if (!socketContext) {
    throw new Error("HostGamePage must be used within a SocketProvider");
  }
  const { socketRef } = socketContext;
  const {advanceQuestion} = useSocketActions(socketRef)

  const currentQuestion = getCurrentQuestion(game);

  // if (currentQuestion) {
  //   console.log(currentQuestion.answers)
  // }

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
    <div className="flex items-center gap-2 ml-auto">
      {[1, 2, 3, 4].map((roundNum) => (
        <div key={roundNum} className="flex items-center ">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
              roundNum < game.currentRound
                ? "bg-green-500 text-white border-green-400"
                : roundNum === game.currentRound
                ? "bg-yellow-400 text-black border-yellow-300"
                : "bg-gray-600 text-gray-300 border-gray-500"
            }`}
          >
            {roundNum === 4 ? "LR" : roundNum}
          </div>
          {roundNum < 4 && (
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
  const activeTeam = teams.find((t) => t.active);
  if (variant === "player") {
    return (
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Keep question visible on mobile by sticking it to the top */}
        <div className="sticky top-0 z-10">
          {/* Question Header - Compact with Round Status */}
          <div className="question-header flex-shrink-0 bg-[#FEFEFC]">
            <div className="flex justify-between items-center">
              {/* Left section - Question info */}
              <div
                className={`flex ${
                  game.currentRound === 0 ? "flex-col" : "flex-row gap-2"
                }`}
              >
                {game.currentRound === 0 && (
                  <h2 className="font-bold">Toss-up Round</h2>
                )}

                <div className="text-xs text-slate-400">
                  Question{" "}
                  {game.currentRound === 0
                    ? 1
                    : currentTeam
                    ? questionsAnswered[currentTeam] + 1
                    : game.currentQuestionIndex + 1}{" "}
                  of{" "}
                  {game.currentRound === 0
                    ? 1
                    : game.currentRound === 4
                    ? 7
                    : 3}
                </div>
              </div>

              {/* Center section - Active team */}
              <h3 className="text-lg font-bold text-blue-300 mb-1 absolute left-1/2 -translate-x-1/2">
                🎯 {activeTeam?.name}'s Turn
              </h3>

              {/* Right section - Round status */}
              <RoundStatus />
            </div>
          </div>

          {/* Question Text - Compact */}
          <QuestionCard
            key={game.currentQuestionIndex}
            game={game}
            question={currentQuestion.question}
            duration={10000}
            isTimerActive={game.currentRound === 4}
          />
        </div>

        {/* Answer Grid - Vertical Layout */}
        <div className="answer-grid">
          {currentQuestion.answers.slice(0, 5).map((answer, index) => (
            <div
              data-testid={`answer-${index + 1}-card`}
              key={index}
              onClick={() => onClickAnswerCard?.(answer.answer)}
              className={`answer-card glass-card transition-all ${
                currentQuestion.questionType === "MCQ" &&
                answer.revealed &&
                answer.score > 0
                  ? "!bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-green-400 animate-pulse"
                  : currentQuestion.questionType === "MCQ" &&
                    answer.revealed &&
                    answer.score <= 0
                  ? "!bg-gradient-to-r from-red-600/30 to-red-600/30 border-red-400 animate-pulse"
                  : currentQuestion.questionType === "MCQ"
                  ? "bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-green-400"
                  : answer.revealed && answer.score > 0
                  ? "!bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-green-400 animate-pulse"
                  : "border-slate-500/50"
              }`}
            >
              <span className="answer-text">
                {currentQuestion.questionType === "MCQ" ? (
                  <span className="text-black">
                    {index + 1}. {answer.answer}
                  </span>
                ) : answer.revealed ? (
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
        <div className="question-header flex-shrink-0 bg-[#FEFEFC]">
          <div className="flex justify-between items-center">
            {/* Left section - Question info */}
            <div
              className={`flex ${
                game.currentRound === 0 ? "flex-col" : "flex-row gap-2"
              }`}
            >
              {game.currentRound === 0 && (
                <h2 className="font-bold">Toss-up Round</h2>
              )}
              <div className="text-xs text-slate-400">
                Question{" "}
                {game.currentRound === 0
                  ? 1 
                  : game.currentRound === 4 
                  ? game.currentQuestionIndex - 17
                  : (game.currentQuestionIndex % 3 + 1)}
                  {" "}
                of{" "}
                {game.currentRound === 0 ? 1 : game.currentRound === 4 ? 7 : 3}{" "}
              </div>
            </div>

            {/* Center section - Active team */}
            <h3 className="text-lg font-bold text-blue-300 mb-1 absolute left-1/2 -translate-x-1/2">
              🎯 {activeTeam?.name}'s Turn
            </h3>

            {/* Right section - Round status */}
            <RoundStatus />
          </div>
        </div>

        {/* Question Text */}
        <QuestionCard
          key={game.currentQuestionIndex}
          game={game}
          question={currentQuestion.question}
          duration={10000}
          isTimerActive={game.currentRound === 4}
        />
      </div>

      {/* Answer Grid - Vertical Layout for Host */}
      <div className="answer-grid">
        {currentQuestion.answers.slice(0, 5).map((answer, index) => (
          <div
            key={index}
            className={`answer-card glass-card transition-all ${
              currentQuestion.questionType === "MCQ" &&
              answer.revealed &&
              answer.score > 0
                ? "!bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-green-400 animate-pulse"
                : currentQuestion.questionType === "MCQ" &&
                  answer.revealed &&
                  answer.score <= 0
                ? "!bg-gradient-to-r from-red-600/30 to-red-600/30 border-red-400 animate-pulse"
                : currentQuestion.questionType === "MCQ"
                ? "bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-green-400"
                : answer.revealed && answer.score > 0
                ? "!bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-green-400 animate-pulse"
                : "border-slate-500/50"
            }`}
            // className={`answer-card glass-card transition-all ${
            //   answer.revealed
            //     ? "bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-green-400 animate-pulse"
            //     : "hover:border-blue-400"
            // } ${
            //   isHost && (!answer.revealed || overrideMode) ? "cursor-pointer" : ""
            // }`}

            onClick={() => {
              if (overrideMode) {
                onOverride?.(index);
              } else if (isHost && !answer.revealed) {
                onRevealAnswer?.(index);
              }
            }}
          >
            <span className="answer-text">
              {/* HOST ALWAYS SEES THE ANSWER TEXT */}
              {isHost ? (
                <span
                  className={answer.revealed ? "text-black" : "text-blue-300"}
                >
                  {index + 1}. {answer.answer}
                  {!answer.revealed && (
                    <span className="ml-2 text-xs text-yellow-400">
                      (Click to reveal)
                    </span>
                  )}
                </span>
              ) : // NON-HOST VIEW
              answer.revealed ? (
                <span className="text-black">
                  {index + 1}. {answer.answer}
                </span>
              ) : (
                <span className="text-slate-400">
                  {index + 1}. {"\u00A0".repeat(15)}
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
      {isHost &&
        (controlMessage || overrideMode || game.gameState.canAdvance) && (
          <div className=" host-controls">
            <div className="text-center">
              {overrideMode && (
                <>
                  <div className="text-xs text-yellow-300 mb-2">
                    Select an answer or enter points to award
                  </div>
                  <div className="flex justify-center items-center gap-2 mt-1">
                    <Input
                      id="overridePoints"
                      testid="override-points-input"
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
                    {onOverride && (
                      <Button
                        testid="confirm-override-button"
                        onClick={() => onOverride()}
                        variant="primary"
                        size="sm"
                        className="text-xs py-1 px-3"
                      >
                        Award
                      </Button>
                    )}
                    {onCancelOverride && (
                      <Button
                        testid="cancel-override-button"
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
                  testid="host-next-question-button"
                  onClick={
                    game.currentRound === 0
                      ? onCompleteTossUpRound
                      : () => advanceQuestion(game.code)
                  }
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

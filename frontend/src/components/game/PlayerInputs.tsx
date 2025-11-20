import { useContext } from "react";
import BuzzerButton from "./BuzzerButton";
import { useSocketActions } from "../../hooks/useSocketActions";
import { SocketContext } from "store/socket-context";
import { Game, Player } from "../../types/index";

interface PlayerInputsProps {
  game: Game;
  player: Player;
  gameMessage: string;
  error: string;
  hasBuzzed: boolean;
  answer: string;
  setAnswer: React.Dispatch<React.SetStateAction<string>>;
  onSubmitAnswer: (answer: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const PlayerInputs: React.FC<PlayerInputsProps> = ({
  game,
  player,
  gameMessage,
  error,
  hasBuzzed,
  answer,
  setAnswer,
  onSubmitAnswer,
  onKeyDown,
}) => {
  const socketContext = useContext(SocketContext);
  if (!socketContext) {
    throw new Error("JoinGamePage must be used within a SocketProvider");
  }
  const { socketRef } = socketContext;
  const { buzzIn, submitAnswer } = useSocketActions(socketRef);

  const myTeam = game?.teams.find((team) => team.id === player?.teamId);
  const isMyTurn = myTeam && myTeam.active;
  const canAnswer = isMyTurn && player?.teamId;

  return (
    <div className="bg-[#FEFEFC] rounded p-2 mt-2">
      {player.teamId ? (
        <div>
          {/* Game Status Message */}
          {gameMessage && (
            <div className="mb-3 p-1 bg-blue-500/20 border border-blue-500/50 rounded">
              <p className="text-blue-300 text-sm text-center">{gameMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-3 p-2 bg-red-500/20 border border-red-500/50 rounded">
              <p className="text-red-300 text-sm text-center">{error}</p>
            </div>
          )}

          {/* TOSS UP ROUND */}
          {game.currentRound === 0 ? (
            !game.buzzedTeamId ? (
              <div className="flex justify-center my-4">
                <BuzzerButton
                  onBuzz={() => buzzIn(game.code, player.id)}
                  disabled={
                    hasBuzzed ||
                    !!game.buzzedTeamId ||
                    game.gameState.canAdvance
                  }
                  teamName={myTeam?.name}
                />
              </div>
            ) : canAnswer && game?.activeTeamId ? (
              <div className="max-w-md mx-auto">
                <input
                  data-testid="answer-input"
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Type your answer here..."
                  disabled={!canAnswer}
                  autoFocus={true}
                  className="w-full px-4 py-3 text-lg font-semibold rounded-lg bg-white text-gray-900 border-2 border-green-400 focus:outline-none focus:border-green-300 focus:ring-4 focus:ring-green-300/30 transition-all shadow-md placeholder-gray-500"
                />
                <button
                  data-testid="submit-answer-button"
                  onClick={() => onSubmitAnswer(answer)}
                  disabled={!answer.trim() || !canAnswer}
                  className={`w-full py-3 px-6 mt-2 rounded-lg font-bold text-lg transition-all transform shadow-lg ${
                    canAnswer && answer.trim()
                      ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white hover:scale-105 active:scale-95"
                      : "bg-gray-500 text-gray-300 cursor-not-allowed opacity-60"
                  }`}
                >
                  {answer.trim() ? "Submit Answer" : "Type an answer..."}
                </button>
              </div>
            ) : (
              <div className="p-6 bg-gray-700/30 rounded-lg backdrop-blur">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-white"></div>
                  <p className="text-gray-300 font-medium">
                    {game.teams.find((t) => t.active)?.name || "Other team"} is
                    answering...
                  </p>
                </div>
              </div>
            )
          ) : // LIGHTNING ROUND
          game.currentRound === 4 ? (
            !game.buzzedTeamId ? (
              <div className="flex justify-center my-4">
                <BuzzerButton
                  onBuzz={() => buzzIn(game.code, player.id)}
                  disabled={hasBuzzed || !!game.buzzedTeamId || game.pauseTimer}
                  teamName={myTeam?.name}
                />
              </div>
            ) : canAnswer ? (
              <div className="p-4 bg-blue-500/20 border border-blue-500/50 rounded text-center">
                <p className="text-blue-300 font-medium">
                  Click on an answer card above to submit your answer
                </p>
              </div>
            ) : (
              <div className="p-6 bg-gray-700/30 rounded-lg backdrop-blur">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-white"></div>
                  <p className="text-gray-300 font-medium">
                    {game.teams.find((t) => t.active)?.name || "Other team"} is
                    answering...
                  </p>
                </div>
              </div>
            )
          ) : // STANDARD ROUNDS
          isMyTurn && game?.activeTeamId ? (
            <div className="max-w-md mx-auto">
              <input
                data-testid="answer-input"
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Type your answer here..."
                disabled={!canAnswer}
                autoFocus={true}
                className="w-full px-4 py-3 text-lg font-semibold rounded-lg bg-white text-gray-900 border-2 border-green-400 focus:outline-none focus:border-green-300 focus:ring-4 focus:ring-green-300/30 transition-all shadow-md placeholder-gray-500"
              />
              <button
                data-testid="submit-answer-button"
                onClick={() => onSubmitAnswer(answer)}
                disabled={!answer.trim() || !canAnswer}
                className={`w-full py-3 px-6 mt-2 rounded-lg font-bold text-lg transition-all transform shadow-lg ${
                  canAnswer && answer.trim()
                    ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white hover:scale-105 active:scale-95"
                    : "bg-gray-500 text-gray-300 cursor-not-allowed opacity-60"
                }`}
              >
                {answer.trim() ? "Submit Answer" : "Type an answer..."}
              </button>
            </div>
          ) : (
            <div className="p-6 bg-gray-700/30 rounded-lg backdrop-blur">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-white"></div>
                <p className="text-gray-300 font-medium">
                  {game.teams.find((t) => t.active)?.name || "Other team"} is
                  answering...
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 border-2 border-red-400/50 bg-red-400/10 rounded text-center">
          <p className="text-red-300 font-medium text-sm">
            You didn't select a team before the game started. Please wait for
            the next game.
          </p>
        </div>
      )}
    </div>
  );
};

export default PlayerInputs;

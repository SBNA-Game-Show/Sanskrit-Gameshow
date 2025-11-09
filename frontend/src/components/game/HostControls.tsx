import { useContext, useRef } from "react";
import { Game } from "../../types/index";
import Button from "../../components/common/Button";
import { SocketContext } from "store/socket-context";
import { useSocketActions } from "../../hooks/useSocketActions";

interface HostControlsProps {
  game: Game;
  role: String | null;
  pendingOverride: {
    teamId: string;
    round: number;
    questionNumber: number;
  } | null;
  overrideMode: boolean;
  onOverrideAnswer: () => void;
}

const HostControls: React.FC<HostControlsProps> = ({ 
  game, 
  role,
  pendingOverride,
  overrideMode,
  onOverrideAnswer
 }) => {
  const socketContext = useContext(SocketContext);
  if (!socketContext) {
    throw new Error("HostGamePage must be used within a SocketProvider");
  }
  const { socketRef } = socketContext;

  const radioButtonRef = useRef<HTMLFormElement>(null);

  const { 
    pauseTimer, 
    forceNextQuestion, 
    resetGame, 
    skipToRound 
  } = useSocketActions(socketRef);

  return (
    <>
      {/* Host Controls - CLEAN VERSION */}
      <div className="bg-[#FEFEFC] rounded p-3 mt-2">
        <div className="text-center mb-2">
          <div className="text-sm text-slate-400 mb-2">Host Controls</div>
        </div>
        <div className="flex gap-2 justify-center flex-wrap">
          <Button
            testid="force-next-question-button"
            onClick={
              game.currentRound === 4
                ? () => pauseTimer(game.code)
                : () => forceNextQuestion(game.code)
            }
            disabled={game.currentRound === 4 && game.pauseTimer}
            variant="secondary"
            size="sm"
            className="text-xs py-1 px-3"
          >
            ⏭️ Force Next
          </Button>
          {pendingOverride && !overrideMode && (
            <Button
              testid="override-answer-button"
              onClick={onOverrideAnswer}
              variant="secondary"
              size="sm"
              className="text-xs py-1 px-3"
            >
              ✅ Override
            </Button>
          )}
          <Button
            testid="reset-game-button"
            onClick={() => resetGame(game.code)}
            variant="secondary"
            size="sm"
            className="text-xs py-1 px-3"
          >
            🔄 Reset
          </Button>

          {role === "Tester" && (
            <>
              <Button
                testid="skip-to-round-1-button"
                onClick={() => skipToRound(game.code, 1, radioButtonRef)}
                variant="secondary"
                size="sm"
                className="text-xs py-1 px-3"
              >
                Skip to R1
              </Button>
              <Button
                testid="skip-to-round-2-button"
                onClick={() => skipToRound(game.code, 2, radioButtonRef)}
                variant="secondary"
                size="sm"
                className="text-xs py-1 px-3"
              >
                Skip to R2
              </Button>
              <Button
                testid="skip-to-round-3-button"
                onClick={() => skipToRound(game.code, 3, radioButtonRef)}
                variant="secondary"
                size="sm"
                className="text-xs py-1 px-3"
              >
                Skip to R3
              </Button>
              <Button
                testid="skip-to-lightning-round-button"
                onClick={() => skipToRound(game.code, 4, radioButtonRef)}
                variant="secondary"
                size="sm"
                className="text-xs py-1 px-3"
              >
                Skip to LR
              </Button>

              <form className="ml-3" ref={radioButtonRef}>
                <div className="flex gap-6">
                  <div className="inline-flex items-center">
                    <input
                      type="radio"
                      data-testid="set-starting-team-1-button"
                      id="team1"
                      name="starting-team"
                      value="team1"
                      defaultChecked
                    />
                    <label className="pl-2" htmlFor="team1">
                      {game.teams[0].name}
                    </label>
                  </div>

                  <div className="inline-flex items-center">
                    <input
                      type="radio"
                      data-testid="set-starting-team-2-button"
                      id="team2"
                      name="starting-team"
                      value="team2"
                    />
                    <label className="pl-2" htmlFor="team2">
                      {game.teams[1].name}
                    </label>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
};


export default HostControls;
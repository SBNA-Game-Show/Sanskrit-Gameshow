import React, { useState, useEffect, useRef, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import io, { Socket } from "socket.io-client";
import { GAME_CONFIG } from "../utils/constants";

// Import components
import CopyGameCode from "../components/game/CopyGameCode";
import PageLayout from "../components/layout/PageLayout";
import AnimatedCard from "../components/common/AnimatedCard";
import TeamPanel from "../components/game/TeamPanel";
import GameBoard from "../components/game/GameBoard";
import GameResults from "../components/game/GameResults";
import PlayerList from "../components/game/PlayerList";
import GameCreationForm from "../components/forms/GameCreationForm";
import Button from "../components/common/Button";
import TurnIndicator from "../components/game/TurnIndicator";
import RoundSummaryComponent from "../components/game/RoundSummaryComponent";

// Import hooks and services
import { useSetupSocket } from "../hooks/useSetupSocket";
import { useSocketHostEvents } from "../hooks/useSocketHostEvents";
import { useSocketActions } from "../hooks/useSocketActions";
import { useTimer } from "../hooks/useTimer";
import gameApi from "../services/gameApi";
import { SocketContext } from "store/socket-context";

// Import types and utils
import { Game, RoundData } from "../types"; //Team
import { getCurrentQuestion, getTeamName } from "../utils/gameHelper"; //getGameWinner
import { ROUTES } from "../utils/constants";

const role = localStorage.getItem("role");
const HostGamePage: React.FC = () => {
  const [game, setGame] = useState<Game | null>(null);
  const [team1Name, setTeam1Name] = useState("");
  const [team2Name, setTeam2Name] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [controlMessage, setControlMessage] = useState<string>("");
  const [overrideMode, setOverrideMode] = useState(false);
  const [pendingOverride, setPendingOverride] = useState<{
    teamId: string;
    round: number;
    questionNumber: number;
  } | null>(null);
  const [overridePoints, setOverridePoints] = useState("0");

  const socketContext = useContext(SocketContext);
  if (!socketContext) {
    throw new Error("HostGamePage must be used within a SocketProvider");
  }
  const { socketRef } = socketContext;

  const radioButtonRef = useRef<HTMLFormElement>(null);

  const location = useLocation();

  // Hooks
  const { timer } = useTimer(game?.status === "active");

  // Extract question data for teams
  const getTeamQuestionData = (teamKey: "team1" | "team2"): RoundData => {
    if (!game?.gameState?.questionData?.[teamKey]) {
      return {
        round1: [
          { firstAttemptCorrect: null, pointsEarned: 0 },
          { firstAttemptCorrect: null, pointsEarned: 0 },
          { firstAttemptCorrect: null, pointsEarned: 0 },
        ],
        round2: [
          { firstAttemptCorrect: null, pointsEarned: 0 },
          { firstAttemptCorrect: null, pointsEarned: 0 },
          { firstAttemptCorrect: null, pointsEarned: 0 },
        ],
        round3: [
          { firstAttemptCorrect: null, pointsEarned: 0 },
          { firstAttemptCorrect: null, pointsEarned: 0 },
          { firstAttemptCorrect: null, pointsEarned: 0 },
        ],
        round4: [
          { firstAttemptCorrect: null, pointsEarned: 0 },
          { firstAttemptCorrect: null, pointsEarned: 0 },
          { firstAttemptCorrect: null, pointsEarned: 0 },
          { firstAttemptCorrect: null, pointsEarned: 0 },
          { firstAttemptCorrect: null, pointsEarned: 0 },
          { firstAttemptCorrect: null, pointsEarned: 0 },
          { firstAttemptCorrect: null, pointsEarned: 0 },
        ],
      };
    }
    return game.gameState.questionData[teamKey];
  };

  const {connect, disconnect} = useSetupSocket(socketRef);
  useSocketHostEvents(
    socketRef,
    game?.code,
    setGame,
    setControlMessage,
    setPendingOverride,
    setOverrideMode,
    setOverridePoints
  );
  const {
    startGame,
    completeTossUpRound,
    continueToNextRound,
    forceNextQuestion,
    advanceQuestion,
    resetGame,
    overrideAnswer,
    pauseTimer,
    skipToRound,
  } = useSocketActions(socketRef);
  
  

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    if (code && !game) {
      const upper = code.toUpperCase();
      connect(upper, true, setGame, setControlMessage);
    }
  }, [location.search, game, connect]);

  // Validation function to check if game can start
  const canStartGame = (game: Game | null) => {
    if (!game || !game.players || game.players.length < 2) {
      return {
        canStart: false,
        reason: "Need at least 2 players to start the game",
      };
    }

    // Check if all players have selected a team
    const playersWithoutTeam = game.players.filter((p) => !p.teamId);
    if (playersWithoutTeam.length > 0) {
      return {
        canStart: false,
        reason: `${playersWithoutTeam.length} player(s) haven't selected a team yet`,
      };
    }

    // Check if each team has at least one member
    const team1Players = game.players.filter(
      (p) => p.teamId === game.teams[0]?.id
    );
    const team2Players = game.players.filter(
      (p) => p.teamId === game.teams[1]?.id
    );

    if (team1Players.length === 0) {
      return {
        canStart: false,
        reason: `Team "${game.teams[0]?.name}" needs at least one player`,
      };
    }

    if (team2Players.length === 0) {
      return {
        canStart: false,
        reason: `Team "${game.teams[1]?.name}" needs at least one player`,
      };
    }

    return { canStart: true, reason: "" };
  };

  const createGame = async () => {
    console.log(
      "🎮 Creating new single-attempt game with question tracking..."
    );
    setIsLoading(true);
    setControlMessage("");

    try {
      const testResponse = await gameApi.testConnection();
      console.log("✅ Server connection successful:", testResponse);

      const response = await gameApi.createGame({
        team1: team1Name.trim(),
        team2: team2Name.trim(),
      });
      console.log("✅ Game creation response:", response);

      const { game: newGame } = response;

      setGame(newGame);

      setControlMessage(
        `Game created successfully! Code: ${newGame.code}. Each question allows only 1 attempt.`
      );

      connect(newGame.code, true, setGame, setControlMessage);
    } catch (error: unknown) {
      console.error("❌ Error creating game:", error);

      if (error instanceof Error) {
        if (
          error.message.includes("ECONNREFUSED") ||
          error.message.includes("ERR_NETWORK")
        ) {
          setControlMessage(
            "Cannot connect to server. Make sure the server is running on http://localhost:5004"
          );
        } else {
          setControlMessage(`Error: ${error.message}`);
        }
      } else {
        setControlMessage("An unexpected error occurred. Please try again.");
      }
    }
    setIsLoading(false);
  };

  // const handleStartGame = () => {
  //   console.log("🎮 Starting single-attempt game with question tracking...");

  //   if (game && socketRef.current && socketRef.current.connected) {
  //     socketRef.current.emit("start-game", { gameCode: game.code });
  //   } else {
  //     console.error("❌ Cannot start game - missing requirements");
  //     setControlMessage("Cannot start game. Please check your connection.");
  //   }
  // };

  // const handleCompleteTossUpRound = () => {
  //   if (game && socketRef.current) {
  //     socketRef.current.emit("complete-toss-up-round", { gameCode: game.code });
  //   }
  // };

  const handleContinueToNextRound = () => {
    if (game && socketRef.current) {
      socketRef.current.emit("continue-to-next-round", { gameCode: game.code });
    }
  };

  // const handleForceNextQuestion = () => {
  //   if (game && socketRef.current) {
  //     socketRef.current.emit("force-next-question", { gameCode: game.code });
  //   }
  // };

  const handleNextQuestion = () => {
    if (game && socketRef.current) {
      socketRef.current.emit("advance-question", { gameCode: game.code });
    }
  };

  const handlePauseTimer = () => {
    if (game && socketRef.current) {
      socketRef.current.emit("pause-timer", { gameCode: game.code });
    }
  };

  const handleOverrideAnswer = () => {
    if (pendingOverride) {
      setOverrideMode(true);
      setControlMessage("");
      setOverridePoints("0");
    }
  };

  const handleSelectOverride = (answerIndex: number) => {
    if (game && pendingOverride && socketRef.current && currentQuestion) {
      const points = currentQuestion.answers[answerIndex]?.score || 0;
      socketRef.current.emit("override-answer", {
        gameCode: game.code,
        teamId: pendingOverride.teamId,
        round: pendingOverride.round,
        questionNumber: pendingOverride.questionNumber,
        isCorrect: true,
        pointsAwarded: points,
        answerIndex,
      });
      setPendingOverride(null);
      setOverrideMode(false);
      setOverridePoints("0");
      setControlMessage("");
    }
  };

  const handleConfirmOverride = () => {
    if (game && pendingOverride && socketRef.current) {
      const points = parseInt(overridePoints, 10) || 0;
      socketRef.current.emit("override-answer", {
        gameCode: game.code,
        teamId: pendingOverride.teamId,
        round: pendingOverride.round,
        questionNumber: pendingOverride.questionNumber,
        isCorrect: true,
        pointsAwarded: points,
      });
      setPendingOverride(null);
      setOverrideMode(false);
      setOverridePoints("0");
      setControlMessage("");
    }
  };

  const handleCancelOverride = () => {
    setOverrideMode(false);
    setOverridePoints("0");
  };

  const handleResetGame = () => {
    if (game && socketRef.current) {
      socketRef.current.emit("reset-game", { gameCode: game.code });
    }
  };

  // const handleSkipToRound = (round: number, radioButtonRef: React.RefObject<HTMLFormElement>) => {
  //   if (game && socketRef.current) {
  //     const selectedStartingTeam = radioButtonRef.current?.querySelector<HTMLInputElement>(
  //       'input[name="starting-team"]:checked'
  //     )?.value;
  //     socketRef.current.emit("skip-to-round", game.code , round, selectedStartingTeam );
  //   }
  // };

  // Request updated player list periodically when in waiting state
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (game && game.status === "waiting" && socketRef.current) {
      socketRef.current.emit("get-players", { gameCode: game.code });

      interval = setInterval(() => {
        if (socketRef.current?.connected) {
          socketRef.current.emit("get-players", { gameCode: game.code });
        }
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [game]);

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const currentQuestion = game ? getCurrentQuestion(game) : null;

  // Not created yet - show creation form
  if (!game) {
    return (
      <PageLayout>
        <div className="flex justify-center">
          <GameCreationForm
            team1Name={team1Name}
            team2Name={team2Name}
            onTeam1Change={setTeam1Name}
            onTeam2Change={setTeam2Name}
            onCreateGame={createGame}
            isLoading={isLoading}
          />
        </div>
        {controlMessage && (
          <div className="mt-4 text-center">
            <div className="text-blue-400">{controlMessage}</div>
          </div>
        )}
      </PageLayout>
    );
  }

  // Game created but waiting for players
  if (game && game.status === "waiting") {
    const validation = canStartGame(game);

    return (
      <PageLayout gameCode={game.code}>
        <AnimatedCard>
          <div className="max-w-4xl mx-auto">
            <div className="rounded shadow bg-white p-8 text-center">
              <h2 className="text-3xl font-bold mb-6">Game Setup</h2>

              <CopyGameCode gameCode={game.code} />

              {!validation.canStart && (
                <div className="mb-4 p-4 bg-gray-200 border-yellow-500/50 rounded">
                  <p className="text-white text-sm">{validation.reason}</p>
                </div>
              )}

              <Button
                data-testid="host-start-game-button"
                onClick={() => startGame(game.code)}
                variant="success"
                size="xl"
                disabled={!validation.canStart}
                icon={<span className="text-2xl">🎮</span>}
                className="mb-6"
              >
                BEGIN SINGLE-ATTEMPT COMPETITION
              </Button>

              {game.players && game.players.length > 0 && (
                <PlayerList
                  players={game.players}
                  teams={game.teams}
                  variant="waiting"
                />
              )}
            </div>
          </div>
        </AnimatedCard>
      </PageLayout>
    );
  }

  // Round Summary Screen
  if (game && game.status === "round-summary") {
    return (
      <PageLayout gameCode={game.code} timer={timer} variant="game">
        <div className="p-4">
          <RoundSummaryComponent
            game={game}
            teams={game.teams}
            isHost={true}
            isGameFinished={game.currentRound >= 4}
            onContinueToNextRound={handleContinueToNextRound}
            onBackToHome={() => (window.location.href = ROUTES.HOSTHOME)}
          />
        </div>
      </PageLayout>
    );
  }

  // Active Game - SINGLE-ATTEMPT LAYOUT WITH CLEAN CONTROLS
  if (game?.status === "active" && currentQuestion) {
    // Calculate questions answered for each team in current round
    const team1QuestionsAnswered = game.gameState.questionsAnswered.team1 || 0;
    const team2QuestionsAnswered = game.gameState.questionsAnswered.team2 || 0;

    return (
      <PageLayout gameCode={game.code} timer={timer} variant="game">
        {/* Mobile: Team panels container at bottom */}
        <div className="order-2 md:hidden w-full flex gap-2">
          <div className="w-1/2">
            <TeamPanel
              team={game.teams[0]}
              teamIndex={0}
              isActive={game.teams[0]?.active}
              showMembers={true}
              currentRound={game.currentRound}
              roundScore={game.teams[0].currentRoundScore}
              questionsAnswered={team1QuestionsAnswered}
              questionData={getTeamQuestionData("team1")}
              allTeams={game.teams}
              activeBorderColor="#dc2626"
              activeBackgroundColor="#ffd6d6ff"
              players={game.players}
            />
          </div>
          <div className="w-1/2">
            <TeamPanel
              team={game.teams[1]}
              teamIndex={1}
              isActive={game.teams[1]?.active}
              showMembers={true}
              currentRound={game.currentRound}
              roundScore={game.teams[1].currentRoundScore}
              questionsAnswered={team2QuestionsAnswered}
              questionData={getTeamQuestionData("team2")}
              allTeams={game.teams}
              activeBorderColor="#264adcff"
              activeBackgroundColor="#d6e0ffff"
              players={game.players}
            />
          </div>
        </div>

        {/* Desktop: Left Team Panel with Question Data */}
        <div className="hidden md:block md:w-48 md:flex-shrink-0">
          <TeamPanel
            team={game.teams[0]}
            teamIndex={0}
            isActive={game.teams[0]?.active}
            showMembers={true}
            currentRound={game.currentRound}
            roundScore={game.teams[0].currentRoundScore}
            questionsAnswered={team1QuestionsAnswered}
            questionData={getTeamQuestionData("team1")}
            allTeams={game.teams}
            activeBorderColor="#dc2626"
            activeBackgroundColor="#ffd6d6ff"
            players={game.players}
          />
        </div>

        {/* Center Game Area */}
        <div className="order-1 md:order-none flex-1 flex flex-col overflow-y-auto">
          {/* Turn Indicator */}
          {/* <TurnIndicator
            currentTeam={game.gameState.currentTurn}
            teams={game.teams}
            currentQuestion={currentQuestion}
            questionsAnswered={game.gameState.questionsAnswered}
            round={game.currentRound}
            variant="compact"
          /> */}

          {/* Game Board */}
          <GameBoard
            game={game}
            variant="host"
            isHost={true}
            controlMessage={controlMessage}
            overrideMode={overrideMode}
            overridePoints={overridePoints}
            onOverridePointsChange={setOverridePoints}
            onCancelOverride={handleCancelOverride}
            onConfirmOverride={handleConfirmOverride}
            onSelectAnswer={handleSelectOverride}
            onNextQuestion={handleNextQuestion}
            onCompleteTossUpRound={() => completeTossUpRound(game.code)}
            onPauseTimer={handlePauseTimer}
            currentTeam={game.gameState.currentTurn}
            teams={game.teams}
            currentQuestion={game.questions[game.currentQuestionIndex]}
            questionsAnswered={game.gameState.questionsAnswered}
            round={game.currentRound}
          />

          {/* Host Controls - CLEAN VERSION */}
          <div className="bg-[#FEFEFC] rounded p-3 mt-2">
            <div className="text-center mb-2">
              <div className="text-sm text-slate-400 mb-2">Host Controls</div>
            </div>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button
                data-testid="force-next-question-button"
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
                  onClick={handleOverrideAnswer}
                  variant="secondary"
                  size="sm"
                  className="text-xs py-1 px-3"
                >
                  ✅ Override
                </Button>
              )}
              <Button
                data-testid="reset-game-button"
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
                  data-testid="skip-to-round-1-button"
                  onClick={() => skipToRound(game.code, 1, radioButtonRef)}
                  variant="secondary"
                  size="sm"
                  className="text-xs py-1 px-3"
                  >
                    Skip to R1
                  </Button>
                  <Button
                  data-testid="skip-to-round-2-button"
                  onClick={() => skipToRound(game.code, 2, radioButtonRef)}
                  variant="secondary"
                  size="sm"
                  className="text-xs py-1 px-3"
                  >
                    Skip to R2
                  </Button>
                  <Button
                  data-testid="skip-to-round-3-button"
                  onClick={() => skipToRound(game.code, 3, radioButtonRef)}
                  variant="secondary"
                  size="sm"
                  className="text-xs py-1 px-3"
                  >
                    Skip to R3
                  </Button>
                  <Button
                  data-testid="skip-to-lightning-round-button"
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
        </div>

        {/* Desktop: Right Team Panel with Question Data */}
        <div className="hidden md:block md:w-48 md:flex-shrink-0">
          <TeamPanel
            team={game.teams[1]}
            teamIndex={1}
            isActive={game.teams[1]?.active}
            showMembers={true}
            currentRound={game.currentRound}
            roundScore={game.teams[1].currentRoundScore}
            questionsAnswered={team2QuestionsAnswered}
            questionData={getTeamQuestionData("team2")}
            allTeams={game.teams}
            activeBorderColor="#264adcff"
            activeBackgroundColor="#d6e0ffff"
            players={game.players}
          />
        </div>
      </PageLayout>
    );
  }

  // Results Screen
  if (game?.status === "finished") {
    return (
      <PageLayout gameCode={game.code} timer={timer}>
        <GameResults
          teams={game.teams}
          onCreateNewGame={createGame}
          showCreateNewGame={true}
        />
      </PageLayout>
    );
  }

  // Fallback for any unexpected game state
  return (
    <PageLayout gameCode={game.code}>
      <AnimatedCard>
        <div className="glass-card p-8 text-center">
          <p className="text-xl font-bold mb-4">
            Unexpected Game State {game?.status}
          </p>
          <p className="text-slate-400 mb-4">
            The game is in an unexpected state. Please refresh the page or
            create a new game.
          </p>
          <Link to={ROUTES.HOSTHOME}>
            <Button variant="primary">Back to Home</Button>
          </Link>
        </div>
      </AnimatedCard>
    </PageLayout>
  );
};

export default HostGamePage;

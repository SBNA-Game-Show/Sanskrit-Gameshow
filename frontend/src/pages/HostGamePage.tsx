import React, { useState, useEffect, useRef, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import QuestionSelection from "../components/game/QuestionSelection";

// Import components
import CopyGameCode from "../components/game/CopyGameCode";
import PageLayout from "../components/layout/PageLayout";
import AnimatedCard from "../components/common/AnimatedCard";
import TeamPanel from "../components/game/TeamPanel";
import GameBoard from "../components/game/GameBoard";
import HostControls from "../components/game/HostControls";
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
import gameApi from "../services/gameApi";
import { SocketContext } from "store/socket-context";

// Import types and utils
import { Game, Question } from "../types";
import { getCurrentQuestion } from "../utils/gameHelper";
import { ROUTES } from "../utils/constants";

const role = localStorage.getItem("role");

// Helper function to randomly select questions immediately
const selectRandomQuestions = (questions: Question[]) => {
  const selectedIds: string[] = [];
  let tossUpId: string | null = null;

  // Separate Round 2 questions for Toss-Up and Round 2 selection
  const round2Questions = questions.filter((q) => q.round === 2);
  const shuffledRound2 = [...round2Questions].sort(() => Math.random() - 0.5);

  // Select 1 for Toss-Up
  const tossUp = shuffledRound2.slice(0, 1);
  if (tossUp[0]) {
    tossUpId = tossUp[0]._id;
  }

  // Select 6 for Round 2 (from the rest)
  const round2 = shuffledRound2.slice(1, 7);
  round2.forEach((q) => selectedIds.push(q._id));

  // Select for other rounds
  [1, 3, 4].forEach((roundNum) => {
    const roundQuestions = questions.filter((q) => q.round === roundNum);
    const required = roundNum === 4 ? 7 : 6;
    const shuffled = [...roundQuestions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, required);
    selected.forEach((q) => selectedIds.push(q._id));
  });

  return { selectedIds, tossUpId };
};

const HostGamePage: React.FC = () => {
  const [game, setGame] = useState<Game | null>(null);
  // Store ALL available questions here, so we can pass them to QuestionSelection even if game.questions is filtered
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);

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

  // New state for question selection flow
  const [showQuestionSelection, setShowQuestionSelection] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  const socketContext = useContext(SocketContext);
  if (!socketContext) {
    throw new Error("HostGamePage must be used within a SocketProvider");
  }
  const { socketRef } = socketContext;

  const radioButtonRef = useRef<HTMLFormElement>(null);

  const location = useLocation();

  const { connect, disconnect } = useSetupSocket(socketRef);
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

  // Updated createGame function for Random-First Flow
  const createGame = async () => {
    console.log(
      "🎮 Creating new single-attempt game with question tracking..."
    );
    setIsLoading(true);
    setControlMessage("");

    try {
      await gameApi.testConnection();

      // Create game with all questions initially
      const response = await gameApi.createGame({
        team1: team1Name.trim(),
        team2: team2Name.trim(),
      });

      const { game: newGame } = response;

      setAllQuestions(newGame.questions || []);

      // Automatically Randomize Questions
      const { selectedIds, tossUpId } = selectRandomQuestions(
        newGame.questions
      );

      // Set the questions immediately
      if (tossUpId) {
        await gameApi.setGameQuestions(newGame.code, selectedIds, tossUpId);
      }

      // Connect to socket (this will return the game with filtered questions)
      connect(newGame.code, true, setGame, setControlMessage);

      // Do not show selection screen by default
      setShowQuestionSelection(false);

      setControlMessage(
        `Game created successfully! Code: ${newGame.code}. Questions randomized.`
      );
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

  const handleQuestionsConfirmed = async (
    questionIds: string[],
    tossUpQuestionId: string | null
  ) => {
    setSelectedQuestionIds(questionIds);
    setShowQuestionSelection(false);

    if (game) {
      if (!tossUpQuestionId) {
        console.error("No toss-up question was selected.");
        setControlMessage("Error: You must select one toss-up question.");
        setShowQuestionSelection(true);
        return;
      }

      try {
        // Send selected question IDs and toss-up ID to backend
        await gameApi.setGameQuestions(
          game.code,
          questionIds,
          tossUpQuestionId
        );

        connect(game.code, true, setGame, setControlMessage);
        setControlMessage("Questions updated successfully!");
      } catch (error) {
        console.error("Error setting game questions:", error);
        setControlMessage("Failed to set questions. Please try again.");
      }
    }
  };

  const handleContinueToNextRound = () => {
    if (game && socketRef.current) {
      socketRef.current.emit("continue-to-next-round", { gameCode: game.code });
    }
  };

  const handleOverrideAnswer = () => {
    if (pendingOverride) {
      console.log(game);
      setOverrideMode(true);
      setControlMessage("");
      setOverridePoints("0");
    }
  };

  const handleOverride = (answerIndex?: number) => {
    if (game && pendingOverride && socketRef.current && currentQuestion) {
      let points = parseInt(overridePoints, 10) || 0;
      if (answerIndex !== undefined) {
        points = currentQuestion.answers[answerIndex]?.score || 0;
      }
      overrideAnswer(game.code, points, answerIndex);
    }
  };

  const handleCancelOverride = () => {
    setOverrideMode(false);
    setOverridePoints("0");
  };

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

  // Question Selection Screen - Modified to accept initial props
  if (showQuestionSelection && game) {
    // Determine current selections from the game object if not manually tracked yet
    const currentQuestionIds = game.questions.map((q) => q._id);
    const currentTossUpId = game.gameState.tossUpQuestion?._id || null;

    return (
      <PageLayout>
        <QuestionSelection
          questions={allQuestions.length > 0 ? allQuestions : game.questions}
          initialSelectedIds={currentQuestionIds}
          initialTossUpId={currentTossUpId}
          onConfirm={handleQuestionsConfirmed}
        />
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

              {/* New Edit Questions Button */}
              <div className="mb-6">
                <button
                  data-testid="edit-questions-button"
                  onClick={() => setShowQuestionSelection(true)}
                  className="text-sm text-gray-600 underline hover:text-purple-600 font-medium"
                >
                  Edit Selected Questions
                </button>
              </div>

              {!validation.canStart && (
                <div className="mb-4 p-4 bg-gray-200 border-yellow-500/50 rounded">
                  <p className="text-white text-sm">{validation.reason}</p>
                </div>
              )}

              <Button
                testid="host-start-game-button"
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
      <PageLayout gameCode={game.code} variant="game">
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
      <PageLayout gameCode={game.code} variant="game">
        {/* Mobile: Team panels container at bottom */}
        <div className="order-2 md:hidden w-full flex gap-2">
          <div className="w-1/2">
            <TeamPanel
              game={game}
              teamIndex={0}
              showMembers={true}
              activeBorderColor="#dc2626"
              activeBackgroundColor="#ffd6d6ff"
            />
          </div>
          <div className="w-1/2">
            <TeamPanel
              game={game}
              teamIndex={1}
              showMembers={true}
              activeBorderColor="#264adcff"
              activeBackgroundColor="#d6e0ffff"
            />
          </div>
        </div>

        {/* Desktop: Left Team Panel with Question Data */}
        <div className="hidden md:block md:w-48 md:flex-shrink-0">
          <TeamPanel
            game={game}
            teamIndex={0}
            showMembers={true}
            activeBorderColor="#dc2626"
            activeBackgroundColor="#ffd6d6ff"
          />
        </div>

        {/* Center Game Area */}
        <div className="order-1 md:order-none flex-1 flex flex-col overflow-y-auto">
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
            onOverride={handleOverride}
            onCompleteTossUpRound={() => completeTossUpRound(game.code)}
            currentTeam={game.gameState.currentTurn}
            teams={game.teams}
            currentQuestion={game.questions[game.currentQuestionIndex]}
            questionsAnswered={game.gameState.questionsAnswered}
            round={game.currentRound}
          />

          {/* Host Controls */}
          <HostControls
            game={game}
            role={role}
            pendingOverride={pendingOverride}
            overrideMode={overrideMode}
            onOverrideAnswer={handleOverrideAnswer}
          />
        </div>

        {/* Desktop: Right Team Panel with Question Data */}
        <div className="hidden md:block md:w-48 md:flex-shrink-0">
          <TeamPanel
            game={game}
            teamIndex={1}
            showMembers={true}
            activeBorderColor="#264adcff"
            activeBackgroundColor="#d6e0ffff"
          />
        </div>
      </PageLayout>
    );
  }

  // Results Screen
  if (game?.status === "finished") {
    return (
      <PageLayout gameCode={game.code}>
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

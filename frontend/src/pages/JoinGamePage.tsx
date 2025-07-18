// UI UPGRADE TO MATCH FAMILY FEUD STYLE
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout";
import PlayerList from "../components/game/PlayerList";
import PlayerStatus from "../components/game/PlayerStatus";
import BuzzerButton from "../components/game/BuzzerButton";
import AnswerInput from "../components/game/AnswerInput";
import Button from "../components/common/Button";
import GameBoard from "../components/game/GameBoard";
import GameResults from "../components/game/GameResults";
import TeamSelection from "../components/forms/TeamSelection";
import JoinGameForm from "../components/forms/JoinGameForm";
import TeamPanel from "../components/game/TeamPanel";
import { useSocket } from "../hooks/useSocket";
import gameApi from "../services/gameApi";
import { Game, Player, Team } from "../types";
import { ROUTES } from "../utils/constants";

const JoinGamePage: React.FC = () => {
  const [gameCode, setGameCode] = useState("");
  const [playerName] = useState(() => localStorage.getItem("username") || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [game, setGame] = useState<Game | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [answer, setAnswer] = useState("");
  const [hasBuzzed, setHasBuzzed] = useState(false);
  const [buzzFeedback, setBuzzFeedback] = useState("");
  const [roundAnswers, setRoundAnswers] = useState<{ teamId: string; score: number }[]>([]);
  const [roundWinner, setRoundWinner] = useState<string | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState<number[]>([]);

  const { socket } = useSocket();

  const {
    connect,
    playerJoinGame,
    joinTeam,
    buzzIn,
    submitAnswer,
    requestPlayersList,
  } = useSocket({
    onPlayerJoined: ({ player }) => {
      setGame((prev) => {
        if (!prev) return null;
        const alreadyExists = prev.players.some((p) => p.id === player.id);
        if (alreadyExists) return prev;
        return {
          ...prev,
          players: [...prev.players, player],
        };
      });
    },
    onRoundWinner: ({ winnerId, winnerName }) => {
      console.log("🏁 Round winner received:", winnerName);
      setRoundWinner(winnerName);
    
      if (!game) return;
    
      const currentQuestion = game.questions?.[game.currentQuestionIndex];
    
      if (currentQuestion?.answers) {
        const updatedAnswers = currentQuestion.answers.map((answer) => ({
          ...answer,
          revealed: !!answer.text?.trim(), // mark as revealed if text exists
        }));
    
        const updatedGame = {
          ...game,
          questions: game.questions.map((q, i) =>
            i === game.currentQuestionIndex ? { ...q, answers: updatedAnswers } : q
          ),
        };
    
        setGame(updatedGame); // <-- This was missing!
      }
    },
    
      
    
    onTeamUpdated: ({ game, playerId, teamId }) => {
      setGame(game);
      if (player && player.id === playerId) {
        setPlayer({ ...player, teamId });
      }
    },
    onGameStarted: ({ game }) => {
      setGame(game);
      const updatedPlayer = game.players.find((p: Player) => p.id === player?.id);
      if (updatedPlayer) setPlayer(updatedPlayer);
    },
    onPlayerBuzzed: ({ game, playerId, teamId }) => {
      setGame(game);
      if (player?.id === playerId) {
        setHasBuzzed(true);
      }
    },
    onAnswerRevealed: ({ game, teamId, score }) => {
      setGame(game);
      setRoundAnswers((prev) => {
        const updated = [...prev, { teamId, score }];
        if (updated.length === 2) {
          const winner =
            updated[0].score === updated[1].score
              ? "Tie"
              : updated[0].score > updated[1].score
              ? updated[0].teamId
              : updated[1].teamId;

          const winnerName =
            winner === "Tie"
              ? "Tie"
              : game.teams.find((t: Team) => t.id === winner)?.name || winner;

          setRoundWinner(winnerName);

          setTimeout(() => {
            setBuzzFeedback("");
            setHasBuzzed(false);
            setRoundAnswers([]);
            setRoundWinner(null);
            if (socket) {
              socket.emit("advanceToNextRound", { gameCode: game.code });
            }
          }, 4000);
        } else {
          setBuzzFeedback("Opponent team will now answer...");
        }
        return updated;
      });
      setAnswer("");
    },
    onNextQuestion: ({ game }) => {
      setGame(game);
      setHasBuzzed(false);
      setBuzzFeedback("");
      setRoundWinner(null);
      setRoundAnswers([]);
      setShowAnswers(false);
    },
    onTeamSwitched: ({ currentTeamId }) => {
      setGame((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          gameState: {
            ...(prev.gameState || {}),
            activeTeamId: currentTeamId,
            inputEnabled: true,
          },
        };
      });
      setHasBuzzed(false);
      setBuzzFeedback("");
    },
    onGameOver: ({ game }) => setGame(game),
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (game && player) {
      requestPlayersList(game.code);
      interval = setInterval(() => requestPlayersList(game.code), 3000);
    }
    return () => interval && clearInterval(interval);
  }, [game?.code, player?.id]);

  const joinGame = async () => {
    if (!gameCode.trim() || !playerName.trim()) {
      setError("Please enter both game code");
      return;
    }
    setIsLoading(true);
    try {
      const response = await gameApi.joinGame({
        gameCode: gameCode.toUpperCase(),
        playerName: playerName.trim(),
      });
      const { playerId, game: gameData } = response;
      setPlayer({ id: playerId, name: playerName, gameCode, connected: true });
      setGame(gameData);
      connect();
      playerJoinGame(gameCode.toUpperCase(), playerId);
    } catch (error: any) {
      setError(error.response?.data?.error || "Failed to join game");
    }
    setIsLoading(false);
  };

  const handleJoinTeam = (teamId: string) => {
    if (player && game) {
      setPlayer({ ...player, teamId });
      joinTeam(game.code, player.id, teamId);
    }
  };

  const handleBuzzIn = () => {
    if (player && game && !hasBuzzed && !game.buzzedTeamId) {
      buzzIn(game.code, player.id);
    }
  };

  const handleSubmitAnswer = () => {
    if (player && game && answer.trim()) {
      const myTeamId = player.teamId;
      const isMyTeamTurn = game.gameState.activeTeamId === myTeamId;
      const inputEnabled = game.gameState.inputEnabled;
      const canSubmit = isMyTeamTurn && inputEnabled;
      if (canSubmit) {
        submitAnswer(game.code, player.id, answer.trim());
        setAnswer("");
      }
    }
  };

  if (!player) {
    return (
      <PageLayout>
        <JoinGameForm
          gameCode={gameCode}
          onGameCodeChange={setGameCode}
          onJoinGame={joinGame}
          isLoading={isLoading}
          error={error}
          alreadyJoined={false}
        />
      </PageLayout>
    );
  }

  if (game?.status === "waiting") {
    return (
      <PageLayout gameCode={game.code}>
        <div className="max-w-4xl mx-auto space-y-6">
          <TeamSelection
            teams={game.teams}
            selectedTeamId={player.teamId}
            onSelectTeam={handleJoinTeam}
            playerName={player.name}
          />
          <PlayerList players={game.players} teams={game.teams} currentPlayerId={player.id} variant="waiting" />
        </div>
      </PageLayout>
    );
  }

  if (game?.status === "active") {
    const myTeam = game.teams.find((t) => t.id === player.teamId);
    const isMyTeamTurn = game.gameState.activeTeamId === player.teamId;
    const canSubmit = isMyTeamTurn && game.gameState.inputEnabled;

    return (
      <PageLayout gameCode={game.code} variant="game">
    <div className="flex flex-col lg:flex-row w-full h-full">
      {/* LEFT SIDE: Team 0 Panel */}
      <div className="w-full lg:w-1/5 p-4 bg-yellow-100 border-r">
        <TeamPanel
          playerName={player.name}
          team={game.teams[0]}
          teamIndex={0}
          isActive={game.gameState.activeTeamId === game.teams[0].id}
          isPlayerTeam={player?.teamId === game.teams[0].id}
          questionsAnswered={roundAnswers.length}
          questionPoints={roundAnswers.filter(r => r.teamId === game.teams[0].id).map(r => r.score)}
          currentRound={1}
          roundScore={game.teams[0].score}
        />
      </div>

      {/* CENTER: Game UI */}
      <div className="flex-1 p-4 bg-yellow-50">
        <GameBoard game={game} variant="player" />

        {!game.buzzedTeamId && (
          <div className="flex justify-center my-4">
            <BuzzerButton
              onBuzz={handleBuzzIn}
              disabled={hasBuzzed || !!game.buzzedTeamId}
              teamName={myTeam?.name}
            />
          </div>
        )}

        {game?.gameState?.activeTeamId && (
          <div className="max-w-2xl mx-auto mt-4">
            <AnswerInput
              answer={answer}
              onAnswerChange={setAnswer}
              onSubmit={handleSubmitAnswer}
              canSubmit={canSubmit}
              isMyTeam={isMyTeamTurn}
              teamName={myTeam?.name}
            />
          </div>
        )}

{roundWinner && (
  <div className="bg-green-100 border border-green-300 text-center py-4 px-6 rounded-xl shadow mt-4">
    <p className="text-green-600 text-xl font-semibold">
      {roundWinner === "Tie" ? "🤝 It's a tie!" : `🏆 ${roundWinner} wins this round!`}
    </p>
  </div>
)}

      </div>

      {/* RIGHT SIDE: Team 1 Panel */}
      <div className="w-full lg:w-1/5 p-4 bg-yellow-100 border-l">
        <TeamPanel
          playerName={player.name}
          team={game.teams[1]}
          teamIndex={1}
          isActive={game.gameState.activeTeamId === game.teams[1].id}
          isPlayerTeam={player?.teamId === game.teams[1].id}
          questionsAnswered={roundAnswers.length}
          questionPoints={roundAnswers.filter(r => r.teamId === game.teams[1].id).map(r => r.score)}
          currentRound={1}
          roundScore={game.teams[1].score}
        />
      </div>
    </div>
  </PageLayout>
    );
  }

  if (game?.status === "finished") {
    return (
      <PageLayout gameCode={game.code}>
        <GameResults teams={game.teams} />
      </PageLayout>
    );
  }

  if (!game || !game.status) {
    return (
      <PageLayout>
        <p className="text-center text-yellow-200">⏳ Loading game data...</p>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="text-center space-y-4">
        <p className="text-red-400 text-lg">🚨 Unexpected game state: <strong>{game.status}</strong></p>
        <Link to={ROUTES.PLAYERHOME}>
          <Button variant="primary">Go Home</Button>
        </Link>
      </div>
    </PageLayout>
  );
};

export default JoinGamePage;
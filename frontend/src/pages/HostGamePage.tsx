import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import io, { Socket } from "socket.io-client";

import PageLayout from "../components/layout/PageLayout";
import AnimatedCard from "../components/common/AnimatedCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import TeamPanel from "../components/game/TeamPanel";
import GameBoard from "../components/game/GameBoard";
import GameResults from "../components/game/GameResults";
import PlayerList from "../components/game/PlayerList";
import GameCreationForm from "../components/forms/GameCreationForm";
import Button from "../components/common/Button";

import { useTimer } from "../hooks/useTimer";
import gameApi from "../services/gameApi";
import { Game } from "../types";
import { getCurrentQuestion } from "../utils/gameHelper";
import { ROUTES } from "../utils/constants";

const HostGamePage: React.FC = () => {
  const [gameCode, setGameCode] = useState<string>("");
  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [controlMessage, setControlMessage] = useState<string>("");
  const [showAnswers, setShowAnswers] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const { timer } = useTimer(game?.status === "active");

  const setupSocket = useCallback((code: string) => {
    if (socketRef.current) socketRef.current.disconnect();
    const socket = io("http://localhost:5001", { forceNew: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("host-join", {
        gameCode: code,
        teams: [
          { name: "Team Red", members: [] },
          { name: "Team Blue", members: [] },
        ],
      });
    });

    socket.on("host-joined", (gameData) => {
      setGame(gameData);
      setControlMessage("Waiting for players to join...");
      socket.emit("get-players", { gameCode: code });
    });

    socket.on("player-joined", (data) => {
      setGame((prev) => prev ? { ...prev, players: [...prev.players, data.player] } : null);
    });

    socket.on("game-started", (data) => {
      setGame(data.game);
      setControlMessage(`Game started! ${data.activeTeam} goes first.`);
    });

    socket.on("team-updated", (data) => setGame(data.game));
    socket.on("answer-correct", (data) => {
      setGame(data.game);
      setControlMessage(`✅ ${data.playerName} answered correctly! +${data.pointsAwarded} points`);
    });

    socket.on("answer-incorrect", (data) => {
      setGame(data.game);
      setControlMessage(`❌ ${data.playerName} answered incorrectly.`);
    });

    socket.on("question-failed", (data) => {
      setGame(data.game);
      setControlMessage(`${data.teamName} failed the question.`);
    });

    socket.on("turn-changed", (data) => {
      setGame(data.game);
      setControlMessage(`Turn switched to ${data.teamName}`);
    });

    socket.on("next-question", (data) => {
      setGame(data.game);
      setControlMessage("Next question!");
    });

    socket.on("game-over", (data) => {
      setGame(data.game);
      setControlMessage("Game over!");
    });

    socket.on("players-list", (data) => {
      if (data.players) {
        setGame((prev) => prev ? { ...prev, players: data.players } : null);
      }
    });

    return socket;
  }, []);

  const createGame = async () => {
    setIsLoading(true);
    setControlMessage("");
    try {
      await gameApi.testConnection();
      const response = await gameApi.createGame();
      setGameCode(response.gameCode);
      setControlMessage(`Game created! Code: ${response.gameCode}`);
      setupSocket(response.gameCode);
    } catch {
      setControlMessage("Failed to create game. Check server.");
    }
    setIsLoading(false);
  };

  const handleStartGame = () => {
    if (gameCode && socketRef.current?.connected) {
      socketRef.current.emit("start-game", { gameCode });
    }
  };

  const handleForceNextQuestion = () => {
    if (gameCode && socketRef.current) {
      socketRef.current.emit("next-question", { gameCode });
    }
  };

  const handleResetGame = () => {
    if (gameCode && socketRef.current) {
      socketRef.current.emit("reset-game", { gameCode });
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (game && game.status === "waiting" && socketRef.current) {
      interval = setInterval(() => {
        socketRef.current?.emit("get-players", { gameCode });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [game?.status, gameCode]);

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const currentQuestion = game ? getCurrentQuestion(game) : null;

  if (!gameCode) {
    return (
      <PageLayout>
        <GameCreationForm onCreateGame={createGame} isLoading={isLoading} />
        {controlMessage && <div className="text-blue-400 mt-4 text-center">{controlMessage}</div>}
      </PageLayout>
    );
  }

  if (game && game.status === "waiting") {
    return (
      <PageLayout gameCode={gameCode}>
        <AnimatedCard>
          <div className="glass-card p-8 text-center">
            <h2 className="text-3xl font-bold mb-6">Game Setup</h2>
            <p className="text-lg text-slate-300 mb-2">Share code with players:</p>
            <div className="text-5xl font-mono bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text animate-pulse">
              {gameCode}
            </div>
            <Button onClick={handleStartGame} variant="success" size="xl" className="my-4" disabled={game.players.length < 2}>
              🎮 START GAME
            </Button>
            <PlayerList
              players={game.players}
              teams={game.teams}
              variant="waiting"
              onAssignTeam={(playerId, teamId) => {
                socketRef.current?.emit("assign-player-team", { gameCode, playerId, teamId });
              }}
            />
          </div>
        </AnimatedCard>
      </PageLayout>
    );
  }

  if (game?.status === "active" && currentQuestion) {
    return (
      <PageLayout gameCode={gameCode} timer={timer} variant="game">
        <div className="w-48">
          <TeamPanel team={game.teams[0]} teamIndex={0} isActive={game.teams[0].active} />
        </div>
        <div className="flex-1">
          <GameBoard game={game} variant="host" isHost={true} controlMessage={controlMessage} />
          <div className="glass-card p-3 mt-2">
            <div className="text-center mb-2">
              <div className="text-sm text-slate-400">Host Controls</div>
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleForceNextQuestion} variant="secondary" size="sm">⏭️ Force Next</Button>
              <Button onClick={handleResetGame} variant="secondary" size="sm">🔄 Reset</Button>
              <Button variant="secondary" onClick={() => setShowAnswers(true)}>
                Reveal All Answers
              </Button>
            </div>
          </div>
        </div>
        <div className="w-48">
          <TeamPanel team={game.teams[1]} teamIndex={1} isActive={game.teams[1].active} />
        </div>
      </PageLayout>
    );
  }

  if (game?.status === "finished") {
    return (
      <PageLayout gameCode={gameCode} timer={timer}>
        <GameResults teams={game.teams} onCreateNewGame={createGame} showCreateNewGame={true} />
      </PageLayout>
    );
  }

  return (
    <PageLayout gameCode={gameCode}>
      <AnimatedCard>
        <div className="glass-card p-8 text-center">
          <p className="text-xl font-bold">Unexpected Game State</p>
          <Link to={ROUTES.LOGIN}><Button variant="primary">Back to Home</Button></Link>
        </div>
      </AnimatedCard>
    </PageLayout>
  );
};

export default HostGamePage;
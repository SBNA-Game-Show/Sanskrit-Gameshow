import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import io, { Socket } from "socket.io-client";

// Import components
import PageLayout from "../components/layout/PageLayout";
import AnimatedCard from "../components/common/AnimatedCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import TeamPanel from "../components/game/TeamPanel";
import GameBoard from "../components/game/GameBoard";
import GameResults from "../components/game/GameResults";
import PlayerList from "../components/game/PlayerList";
import GameCreationForm from "../components/forms/GameCreationForm";
import Button from "../components/common/Button";

// Import hooks and services
import { useTimer, useCountdownTimer } from "../hooks/useTimer";
import gameApi from "../services/gameApi";

// Import types and utils
import { Game, Team } from "../types";
import { getCurrentQuestion, getGameWinner } from "../utils/gameHelper";
import { ROUTES } from "../utils/constants";

const HostGamePage: React.FC = () => {
  const [gameCode, setGameCode] = useState<string>("");
  const [game, setGame] = useState<Game | null>(null);
  const [gameState, setGameState] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlayerAnswer, setCurrentPlayerAnswer] = useState<string>("");
  const [controlMessage, setControlMessage] = useState<string>("");
  const [currentBuzzer, setCurrentBuzzer] = useState<any>(null);
  const socketRef = useRef<Socket | null>(null);

  const { timer } = useTimer(game?.status === "active");
  const {
    timeLeft: answerTimeLeft,
    start: startAnswerTimer,
    stop: stopAnswerTimer,
  } = useCountdownTimer(30, () => {}, () => setControlMessage("Time's up!"));

  const handleCorrectAnswer = () => {
    if (gameCode && socketRef.current && currentBuzzer) {
      socketRef.current.emit("host-mark-correct", {
        gameCode,
        playerId: currentBuzzer.playerId,
        teamId: currentBuzzer.teamId,
      });
    }
  };

  const handleIncorrectAnswer = () => {
    if (gameCode && socketRef.current && currentBuzzer) {
      socketRef.current.emit("host-mark-incorrect", {
        gameCode,
        playerId: currentBuzzer.playerId,
        teamId: currentBuzzer.teamId,
      });
    }
  };

  const handleAssignTeam = (playerId: string, teamId: string) => {
    if (!game?.code || !socketRef.current) return;
    socketRef.current.emit("assign-player-team", {
      gameCode: game.code,
      playerId,
      teamId,
    });
  };
  const handleStartGame = () => {
    console.log("Start Game clicked", socketRef.current?.connected, gameCode);
    if (gameCode && socketRef.current?.connected) {
      socketRef.current.emit("start-game", { gameCode });
    } else {
      setControlMessage("Cannot start game. Please check your connection.");
    }
  };
  
  const setupSocket = useCallback((gameCode: string) => {
    if (socketRef.current) socketRef.current.disconnect();
    const socket = io("http://localhost:5001", {
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 5000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      const defaultTeams = [
        { name: "Team Red", members: ["Captain Red", "", "", "", ""] },
        { name: "Team Blue", members: ["Captain Blue", "", "", "", ""] },
      ];
      socket.emit("host-join", { gameCode, teams: defaultTeams });
    });
    socket.on("requestPlayers", ({ gameCode }) => {
      const game = gameState; // Use the existing gameState instead of undefined getGame
      if (game) {
        socketRef.current?.emit("players-list", {
          players: game.players,
          teams: game.teams,
        });
      }
    });
    
    socket.on("host-joined", (gameData) => {
      setGame(gameData);
      setGameState(gameData);
      setControlMessage("Waiting for players to join...");
      socket.emit("get-players", { gameCode }); // FIXED: emit correct event

    });

    socket.on("player-joined", (data) => {
      if (data.player) {
        setGame((prev) => {
          if (!prev) return null;
          const exists = prev.players.some((p) => p.id === data.player.id);
          if (exists) {
            return {
              ...prev,
              players: prev.players.map((p) =>
                p.id === data.player.id ? { ...p, ...data.player } : p
              ),
            };
          }
          return { ...prev, players: [...prev.players, data.player] };
        });
      }
    });

    socket.on("players-list", (data) => {
      setGame((prevGame) =>
        prevGame
          ? {
              ...prevGame,
              players: [...data.players],
              teams: [...(data.teams || prevGame.teams)],
            }
          : null
      );
    });

    socket.on("gameUpdated", (data) => {
      if (data?.game) {
        setGame(data.game);
        setGameState(data.game);
      }
    });

    socket.on("team-updated", ({ game }) => {
      setGame(game);
      setGameState(game);
    });

    socket.on("player-buzzed", (data) => {
      if (!currentBuzzer) {
        setGame(data.game);
        setCurrentBuzzer({
          playerId: data.playerId,
          teamId: data.teamId,
          playerName: data.playerName,
          teamName: data.teamName,
          timestamp: data.timestamp,
        });
        startAnswerTimer(30);
      }
    });

    socket.on("wrong-answer", (data) => {
      setGame(data.game);
      stopAnswerTimer();
    });

    socket.on("answer-correct", (data) => {
      setGame(data.game);
      stopAnswerTimer();
    });

    socket.on("buzzer-cleared", (data) => {
      setGame(data.game);
      setCurrentBuzzer(null);
      setCurrentPlayerAnswer("");
      stopAnswerTimer();
    });

    socket.on("next-question", (data) => {
      setGame(data.game);
      setCurrentBuzzer(null);
      setCurrentPlayerAnswer("");
      stopAnswerTimer();
    });
  }, [currentBuzzer, startAnswerTimer, stopAnswerTimer]);

  useEffect(() => {
    if (gameCode && (!socketRef.current || !socketRef.current.connected)) {
      const interval = setInterval(() => setupSocket(gameCode), 5001);
      return () => clearInterval(interval);
    }
  }, [gameCode, setupSocket]);

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const createGame = async () => {
    setIsLoading(true);
    try {
      await gameApi.testConnection();
      const response = await gameApi.createGame();
      const { gameCode: newGameCode } = response;
      setGameCode(newGameCode);
      setupSocket(newGameCode);
    } catch (e) {
      setControlMessage("Error creating game. Server may be down.");
    }
    setIsLoading(false);
  };

  const currentQuestion = game ? getCurrentQuestion(game) : null;

  if (!gameCode) {
    return <PageLayout><GameCreationForm onCreateGame={createGame} isLoading={isLoading} /></PageLayout>;
  }

  if (game?.status === "waiting") {
    return (
      <PageLayout gameCode={gameCode}>
        <AnimatedCard>
          <div className="glass-card p-8 text-center max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Game Setup</h2>
            <p>Share code: <strong>{gameCode}</strong></p>
            <Button onClick={handleStartGame}>Start</Button>
            <div className="glass-card p-4 mt-4">
              <h3 className="text-lg font-semibold mb-2">👥 Joined Players</h3>
              {gameState?.players?.length ?? 0 > 0 ? (
                <ul>
                  {gameState?.players?.map((player: any) => (
                    <li key={player.id}>{player.name} - {gameState.teams.find((t: any) => t.id === player.teamId)?.name || "Unassigned"}</li>
                  ))}
                </ul>
              ) : <p>No players joined yet.</p>}
            </div>
            <PlayerList players={game.players} teams={game.teams} onAssignTeam={handleAssignTeam} />
          </div>
        </AnimatedCard>
      </PageLayout>
    );
  }

  if (game?.status === "finished") {
    return <PageLayout gameCode={gameCode}><GameResults teams={game.teams} onCreateNewGame={createGame} showCreateNewGame /></PageLayout>;
  }

  if (game?.status === "active" && currentQuestion) {
    return (
      <PageLayout gameCode={gameCode} timer={timer} variant="game">
        <TeamPanel team={game.teams[0]} teamIndex={0} isActive={game.teams[0]?.active} />
        <GameBoard
          game={game}
          currentBuzzer={currentBuzzer}
          answerTimeLeft={answerTimeLeft}
          //onNextQuestion={() => socketRef.current?.emit("next-question", { gameCode })}
          //onClearBuzzer={() => socketRef.current?.emit("clear-buzzer", { gameCode })}
          onCorrectAnswer={handleCorrectAnswer}
          onIncorrectAnswer={handleIncorrectAnswer}
          isHost={true}
          variant="host"
          controlMessage={controlMessage}
          playerAnswer={currentPlayerAnswer}
        />
        <TeamPanel team={game.teams[1]} teamIndex={1} isActive={game.teams[1]?.active} />
      </PageLayout>
    );
  }

  return <PageLayout gameCode={gameCode}><AnimatedCard><p>Game not ready</p></AnimatedCard></PageLayout>;
};

export default HostGamePage;

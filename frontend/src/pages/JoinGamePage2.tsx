// src/pages/JoinGamePage.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout";
import JoinGameForm from "../components/forms/JoinGameForm";
import TeamSelection from "../components/forms/TeamSelection";
import PlayerList from "../components/game/PlayerList";
import GameBoard from "../components/game/GameBoard";
import PlayerStatus from "../components/game/PlayerStatus";
import BuzzerButton from "../components/game/BuzzerButton";
import AnswerInput from "../components/game/AnswerInput";
import GameResults from "../components/game/GameResults";
import AnimatedCard from "../components/common/AnimatedCard";
import Button from "../components/common/Button";
import { useSocket } from "../hooks/useSocket";
import gameApi from "../services/gameApi";
import { Game, Player } from "../types";
import { ROUTES } from "../utils/constants";

const JoinGamePage: React.FC = () => {
  const [gameCode, setGameCode] = useState("");
  const playerName = localStorage.getItem("username") || "Anonymous";
  const [player, setPlayer] = useState<Player | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [answer, setAnswer] = useState("");
  const [hasBuzzed, setHasBuzzed] = useState(false);
  const [buzzFeedback, setBuzzFeedback] = useState("");
  const [roundAnswers, setRoundAnswers] = useState<{ teamId: string; score: number }[]>([]);
  const [roundWinner, setRoundWinner] = useState<string | null>(null);

  const {
    connect,
    playerJoinGame,
    joinTeam,
    buzzIn,
    submitAnswer,
    requestPlayersList,
    socket
  } = useSocket({
    onPlayerJoined: ({ player }) => setGame(prev => prev ? { ...prev, players: [...prev.players, player] } : null),
    onTeamUpdated: ({ game, playerId, teamId }) => {
      setGame(game);
      if (player && player.id === playerId) {
        setPlayer({
          id: player.id,
          name: player.name,
          gameCode: player.gameCode,
          connected: player.connected,
          socketId: player.socketId,
          teamId: teamId,
        });
      }
      
    },
    onGameStarted: ({ game }) => {
      setGame(game);
      const updatedPlayer = game.players.find((p: Player) => p.id === player?.id);
      if (updatedPlayer) setPlayer(updatedPlayer);
    },
    onPlayerBuzzed: ({ game, playerId }) => {
      if (!game) return;
      setGame(game);
    
      if (player?.id === playerId || player?.teamId === game.currentBuzzer?.teamId) {
        setHasBuzzed(true);
      }
    },
    onAnswerRevealed: ({ game, teamId, score }) => {
      setGame(game);
      setRoundAnswers(prev => {
        const updated = [...prev, { teamId, score }];
        if (updated.length === 2) {
          const winner = updated[0].score === updated[1].score ? "Tie" : (updated[0].score > updated[1].score ? updated[0].teamId : updated[1].teamId);
          setRoundWinner(winner);
          setTimeout(() => {
            if (socket) {
              socket.emit("advance-to-next-round", { gameCode: game.code, winnerTeamId: winner });
            }
            setRoundAnswers([]);
            setRoundWinner(null);
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
      setRoundAnswers([]);
      setRoundWinner(null);
    },
    onGameOver: ({ game }) => setGame(game),
  });

  const joinGame = async () => {
    try {
      const response = await gameApi.joinGame({ gameCode: gameCode.toUpperCase(), playerName });
      const { playerId, game: gameData } = response;
      const storedTeam = localStorage.getItem("team");
      localStorage.setItem("playerId", playerId);
      localStorage.setItem("gameCode", gameCode.toUpperCase());
      setPlayer({ id: playerId, name: playerName, gameCode, connected: true, teamId: storedTeam || undefined });
      setGame(gameData);
      connect();
      playerJoinGame(gameCode.toUpperCase(), playerId);
      if (storedTeam) joinTeam(gameData.code, playerId, storedTeam);
    } catch (e) {
      alert("Failed to join game");
    }
  };

  const handleJoinTeam = (teamId: string) => {
    if (player && game) {
      setPlayer({ ...player, teamId });
      localStorage.setItem("team", teamId);
      joinTeam(game.code, player.id, teamId);
    }
  };

  const handleBuzzIn = () => {
    if (player && game && !hasBuzzed && !game.currentBuzzer) {
      buzzIn(game.code, player.id);
    }
  };

  const handleSubmitAnswer = () => {
    if (player && game && answer.trim()) {
      submitAnswer(game.code, player.id, answer.trim());
    }
  };

  if (!player) {
    return (
      <PageLayout>
        <JoinGameForm 
          gameCode={gameCode} 
          onGameCodeChange={setGameCode} 
          onJoinGame={joinGame} 
          isLoading={false} 
          alreadyJoined={false} 
        />
      </PageLayout>
    );
  }

  if (game?.status === "waiting") {
    return (
      <PageLayout gameCode={game.code}>
        <TeamSelection teams={game.teams} selectedTeamId={player.teamId} onSelectTeam={handleJoinTeam} playerName={player.name} />
        <PlayerList players={game.players} teams={game.teams} currentPlayerId={player.id} variant="waiting" />
      </PageLayout>
    );
  }

  if (game?.status === "active") {
    const myTeam = game.teams.find(t => t.id === player.teamId);
    const canSubmit = game.currentBuzzer?.teamId === player.teamId && game.gameState.inputEnabled;

    return (
      <PageLayout gameCode={game.code} variant="game">
        <GameBoard game={game} variant="player" />
        <PlayerStatus playerName={player.name} team={myTeam || null} isActiveTeam={canSubmit} />
        {!game.currentBuzzer && (
          <BuzzerButton onBuzz={handleBuzzIn} disabled={hasBuzzed} teamName={myTeam?.name} />
        )}
        {game.currentBuzzer && (
          <AnswerInput
            answer={answer}
            onAnswerChange={setAnswer}
            onSubmit={handleSubmitAnswer}
            canSubmit={canSubmit}
            isMyTeam={game.currentBuzzer.teamId === player.teamId}
            teamName={myTeam?.name}
            strikes={myTeam?.strikes || 0}
          />
        )}
        {buzzFeedback && <p className="text-center text-yellow-300 mt-2">{buzzFeedback}</p>}
        {roundWinner && (
          <div className="glass-card bg-green-400/10 border border-green-500/50 p-4 mt-4 text-center">
            <p className="text-green-300 font-semibold text-lg">
              {roundWinner === "Tie" ? "🤝 It's a tie!" : `🏆 Team ${roundWinner} wins this round!`}
            </p>
          </div>
        )}
        <PlayerList players={game.players} teams={game.teams} currentPlayerId={player.id} variant="game" />
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

  return (
    <PageLayout>
      <p className="text-center">Loading or unexpected state.</p>
      <Link to={ROUTES.PLAYERHOME}><Button variant="primary">Go Home</Button></Link>
    </PageLayout>
  );
};

export default JoinGamePage;

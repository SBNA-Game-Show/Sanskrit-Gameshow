import React, { useState, useEffect, useContext } from "react";
import PageLayout from "../components/layout/PageLayout";
import AudienceJoinForm from "../components/forms/AudienceJoinForm";
import GameBoard from "../components/game/GameBoard";
import TeamPanel from "../components/game/TeamPanel";
import TurnIndicator from "../components/game/TurnIndicator";
import RoundSummaryComponent from "../components/game/RoundSummaryComponent";
import GameResults from "../components/game/GameResults";
import PlayerList from "../components/game/PlayerList";
import { useSetupSocket } from "../hooks/useSetupSocket";
import { useSocketAudienceEvents } from "../hooks/useSocketAudienceEvents";
import { useSocketActions } from "../hooks/useSocketActions";
import { SocketContext } from "store/socket-context";
import { Game, RoundData } from "../types";
import { getCurrentQuestion, getTeamName } from "../utils/gameHelper";

const AudienceGamePage: React.FC = () => {
  const [gameCode, setGameCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [game, setGame] = useState<Game | null>(null);
  const [message, setMessage] = useState<
    | { text: string; type: "info" | "success" | "error" }
    | null
  >(null);

  const socketContext = useContext(SocketContext);
  if (!socketContext) {
    throw new Error("AudienceGamePage must be used within a SocketProvider");
  }
  const { socketRef } = socketContext;

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

  const {connect, disconnect, isConnected} = useSetupSocket(socketRef);
  useSocketAudienceEvents(socketRef, game, isConnected, setGame, setMessage);
  const {audienceJoinGame, requestPlayersList} = useSocketActions(socketRef);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (game && game.status === "waiting") {
      requestPlayersList(game.code);
      interval = setInterval(() => {
        requestPlayersList(game.code);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [game, requestPlayersList]);

  const joinGame = async () => {
    if (!gameCode.trim()) {
      setError("Please enter a game code");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      connect(gameCode.toUpperCase());
      audienceJoinGame(gameCode.toUpperCase());
    } catch (err: any) {
      console.error(err);
      setError("Failed to join game");
    }
    setIsLoading(false);
  };

  const currentQuestion = game ? getCurrentQuestion(game) : null;

  if (!game) {
    return (
      <PageLayout>
        <AudienceJoinForm
          gameCode={gameCode}
          onGameCodeChange={setGameCode}
          onJoin={joinGame}
          isLoading={isLoading}
          error={error}
        />
      </PageLayout>
    );
  }

  if (game.status === "waiting") {
    return (
      <PageLayout gameCode={game.code}>
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-6 text-center mb-6">
            <p className="text-xl text-slate-300 mb-2">Waiting for the host to start…</p>
            <p className="text-sm text-slate-500">Game code: {game.code}</p>
          </div>
          {game.players.length > 0 && (
            <PlayerList players={game.players} teams={game.teams} variant="waiting" />
          )}
        </div>
      </PageLayout>
    );
  }

  if (game && game.status === "round-summary") {
    return (
      <PageLayout gameCode={game.code} variant="game">
        <div className="p-4">
          <RoundSummaryComponent
            game={game}
            teams={game.teams}
            isHost={false}
            isGameFinished={game.currentRound >= 4}
          />
        </div>
      </PageLayout>
    );
  }

  if (game.status === "finished") {
    return (
      <PageLayout gameCode={game.code}>
        <GameResults teams={game.teams} />
      </PageLayout>
    );
  }

  if (game.status === "active" && currentQuestion) {
    const team1Answered = game.gameState.questionsAnswered.team1 || 0;
    const team2Answered = game.gameState.questionsAnswered.team2 || 0;
    return (
      <PageLayout gameCode={game.code} variant="game">
        <div className="order-2 md:order-none w-full md:w-48 md:flex-shrink-0">
          <TeamPanel
            team={game.teams[0]}
            teamIndex={0}
            isActive={game.teams[0]?.active}
            showMembers={false}
            currentRound={game.currentRound}
            roundScore={game.teams[0].currentRoundScore}
            questionsAnswered={team1Answered}
            questionData={getTeamQuestionData("team1")}
            allTeams={game.teams}
            activeBorderColor="#dc2626"
            activeBackgroundColor="#ffd6d6ff"
          />
        </div>
        <div className="order-1 md:order-none flex-1 flex flex-col overflow-y-auto">
          <TurnIndicator
            currentTeam={game.gameState.currentTurn}
            teams={game.teams}
            currentQuestion={currentQuestion}
            questionsAnswered={game.gameState.questionsAnswered}
            round={game.currentRound}
            variant="compact"
          />
          <GameBoard
            game={game}
            variant="host"
            isHost={false}
          />
          {message && (
            <div className={`glass-card audience-message game-message ${message.type}`}>
              {message.text}
            </div>
          )}
        </div>
        <div className="order-3 md:order-none w-full md:w-48 md:flex-shrink-0">
          <TeamPanel
            team={game.teams[1]}
            teamIndex={1}
            isActive={game.teams[1]?.active}
            showMembers={false}
            currentRound={game.currentRound}
            roundScore={game.teams[1].currentRoundScore}
            questionsAnswered={team2Answered}
            questionData={getTeamQuestionData("team2")}
            allTeams={game.teams}
            activeBorderColor="#264adcff"
            activeBackgroundColor="#d6e0ffff"
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout gameCode={game.code}>
      <div className="glass-card p-8 text-center">
        <p className="text-xl font-bold mb-4">Unexpected Game State</p>
      </div>
    </PageLayout>
  );
};

export default AudienceGamePage;

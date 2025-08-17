import React, { useState, useEffect } from "react";
import PageLayout from "../components/layout/PageLayout";
import AudienceJoinForm from "../components/forms/AudienceJoinForm";
import GameBoard from "../components/game/GameBoard";
import TeamPanel from "../components/game/TeamPanel";
import TurnIndicator from "../components/game/TurnIndicator";
import RoundSummaryComponent from "../components/game/RoundSummaryComponent";
import GameResults from "../components/game/GameResults";
import PlayerList from "../components/game/PlayerList";
import { useSocket } from "../hooks/useSocket";
import { Game, RoundSummary, RoundData } from "../types";
import { getCurrentQuestion, getTeamName } from "../utils/gameHelper";

const AudienceGamePage: React.FC = () => {
  const [gameCode, setGameCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [game, setGame] = useState<Game | null>(null);
  const [roundSummary, setRoundSummary] = useState<RoundSummary | null>(null);
  const [message, setMessage] = useState<
    | { text: string; type: "info" | "success" | "error" }
    | null
  >(null);

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
      };
    }
    return game.gameState.questionData[teamKey];
  };

  const { connect, audienceJoinGame, requestPlayersList } = useSocket({
    onAudienceJoined: (data: any) => {
      setGame(data.game);
    },
    onGameStarted: (data: any) => {
      setGame(data.game);
      if (data.activeTeam) {
        const teamName = getTeamName(data.game, data.activeTeam);
        setMessage({
          text: `Game started! ${teamName} goes first.`,
          type: "info",
        });
      } else {
        setMessage({
          text: "Game started! Buzz in for the toss-up question.",
          type: "info",
        });
      }
    },
    onPlayerBuzzed: (data: any) => {
      setGame(data.game);
      setMessage({
        text: `🔔 ${data.teamName} buzzed in! ${data.playerName}, answer now!`,
        type: "info",
      });
    },
    onAnswerCorrect: (data: any) => {
      setGame(data.game);
      setMessage({
        text: `✅ ${data.teamName} answered "${data.submittedText}" correctly! +${data.pointsAwarded} points.`,
        type: "success",
      });
    },
    onAnswerIncorrect: (data: any) => {
      setGame(data.game);
      setMessage({
        text: `❌ ${data.teamName} answered "${data.submittedText}" incorrectly.`,
        type: "error",
      });
    },
    onAnswerOverridden: (data: any) => {
      setGame(data.game);
      setMessage({
        text: `✅ Host awarded ${data.pointsAwarded} points to ${data.teamName}.`,
        type: "success",
      });
    },
    onRemainingCardsRevealed: (data: any) => {
      setGame(data.game);
      // Keep the previous message rather than displaying a new one
    },
    onAnswersRevealed: (data: any) => {
      setGame(data.game);
      setMessage({ text: "All answers have been revealed!", type: "info" });
    },
    onTurnChanged: (data: any) => {
      setGame(data.game);
      setMessage({ text: `Turn switched to ${data.teamName}!`, type: "info" });
    },
    onNextQuestion: (data: any) => {
      setGame(data.game);
    },
    onQuestionComplete: (data: any) => {
      setGame(data.game);
    },
    onRoundComplete: (data: any) => {
      if (data.game) setGame(data.game);
      if (data.roundSummary) setRoundSummary(data.roundSummary);
    },
    onRoundStarted: (data: any) => {
      setGame(data.game);
      setRoundSummary(null);
      const teamName = getTeamName(data.game, data.activeTeam);
      setMessage({
        text: `Round ${data.round} started! ${teamName} goes first.`,
        type: "info",
      });
    },
    onGameOver: (data: any) => {
      setGame(data.game);
    },
    onPlayersListReceived: (data: any) => {
      if (game) {
        setGame((prev) => {
          if (!prev) return null;
          return { ...prev, players: data.players };
        });
      }
    },
  });

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
      connect();
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

  if (game.status === "round-summary" && roundSummary) {
    return (
      <PageLayout gameCode={game.code} variant="game">
        <div className="p-4">
          <RoundSummaryComponent
            roundSummary={roundSummary}
            teams={game.teams}
            isHost={false}
            isGameFinished={game.currentRound >= 3}
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

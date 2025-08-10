import { Game, Question, Team } from "../types";

// Generate random game code
export const generateGameCode = (): string => {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
};

// Get current question from game
export const getCurrentQuestion = (game: Game | null): Question | null => {
  if (!game) return null;
  if (game.currentRound === 0) {
    return game.gameState.tossUpQuestion!;
  }
  if (game.currentQuestionIndex < game.questions.length) {
    return game.questions[game.currentQuestionIndex];
  }
  return null;
};

// Format timer display
export const formatTimer = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

// Calculate game duration
export const calculateGameDuration = (startTime: number): string => {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  return formatTimer(elapsed);
};

// Get team by ID
export const getTeamById = (teams: Team[], teamId: string): Team | null => {
  return teams.find((team) => team.id === teamId) || null;
};

// Get active team
export const getActiveTeam = (teams: Team[]): Team | null => {
  return teams.find((team) => team.active) || null;
};

// Check if all answers are revealed
export const allAnswersRevealed = (question: Question): boolean => {
  return question.answers.every((answer) => answer.revealed);
};

// Get total possible points for a question
export const getTotalPossiblePoints = (
  question: Question,
  round: number
): number => {
  return question.answers.reduce(
    (total, answer) => total + answer.score * round,
    0
  );
};

// Get revealed points for a question
export const getRevealedPoints = (
  question: Question,
  round: number
): number => {
  return question.answers
    .filter((answer) => answer.revealed)
    .reduce((total, answer) => total + answer.score * round, 0);
};

// Determine game winner
export const getGameWinner = (teams: Team[]): Team => {
  return teams.reduce((winner, current) =>
    current.score > winner.score ? current : winner
  );
};

// Get team color classes
export const getTeamColorClasses = (teamIndex: number) => {
  const colors = [
    {
      primary: "text-orange-400",
      ring: "ring-orange-400",
      bg: "bg-gradient-to-r from-orange-600/20 to-red-600/20",
      border: "border-orange-400/30",
    },
    {
      primary: "text-blue-400",
      ring: "ring-blue-400",
      bg: "bg-gradient-to-r from-blue-600/20 to-purple-600/20",
      border: "border-blue-400/30",
    },
  ];

  return colors[teamIndex] || colors[0];
};

// Get total score from all regular rounds (ignoring toss-up)
export const getTeamRoundTotal = (team: Team): number => {
  return team.roundScores.reduce((sum, s) => sum + s, 0);
};

// Get team display name by key
export const getTeamName = (
  game: Game | null,
  teamKey: "team1" | "team2"
): string => {
  if (!game) return teamKey;
  const team = game.teams.find((t) => t.id.includes(teamKey));
  return team ? team.name : teamKey;
};

// Validate answer match
export const levenshtein = (a: string, b: string): number => {
  const matrix = [] as number[][];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

export const isAnswerMatch = (
  userAnswer: string,
  correctAnswer: string
): boolean => {
  const normalizedUser = userAnswer.toLowerCase().trim();
  const normalizedCorrect = correctAnswer.toLowerCase();

  const distance = levenshtein(normalizedUser, normalizedCorrect);
  const ratio = distance / Math.max(normalizedUser.length, normalizedCorrect.length);
  const allowed = Math.max(1, Math.floor(normalizedCorrect.length * 0.25));

  return distance <= allowed && ratio <= 0.25;
};

// Calculate points with round multiplier
export const calculatePoints = (basePoints: number, round: number): number => {
  return basePoints * round;
};

// Get next question index
export const getNextQuestionIndex = (
  currentIndex: number,
  totalQuestions: number
): number => {
  return Math.min(currentIndex + 1, totalQuestions - 1);
};

// Check if game should end
export const shouldEndGame = (
  currentQuestionIndex: number,
  totalQuestions: number
): boolean => {
  return currentQuestionIndex >= totalQuestions - 1;
};

// Get game statistics (REMOVED strikes-related stats)
export const getGameStats = (game: Game) => {
  const totalQuestions = game.questions.length;
  const maxPoints = Math.max(
    ...game.questions.flatMap((q) => q.answers.map((a) => a.score))
  );

  return {
    totalQuestions,
    maxPoints,
    currentRound: game.currentRound,
    questionsCompleted: game.currentQuestionIndex,
  };
};

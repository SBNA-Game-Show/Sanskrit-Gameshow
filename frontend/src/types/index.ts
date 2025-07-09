// Updated Game type interface in types.ts
// This ensures that optional properties are properly marked with ?

export interface Game {
  id: string;
  code: string;
  status: "waiting" | "active" | "finished";
  currentQuestionIndex: number;
  currentRound: number;
  questions: Question[];
  teams: Team[];
  players: Player[];
  hostId: string | null;
  createdAt: Date;
  currentBuzzer?: {
    playerId: string;
    playerName: string;
    teamId: string;
    teamName: string;
    timestamp: number;
  } | null;
  buzzerState: {
    isOpen: boolean;
    firstTeamBuzzed: string | null;
    currentAnsweringTeam: string | null;
    buzzTimestamp: number | null;
    answerTimeLimit: number;
    answerTimerActive: boolean;
    activeAnswers: {
      answer: string;
      score: number;
      foundBy: string;
    }[];
    remainingAnswers: {
      answer: string;
      score: number;
    }[];
  };
  // NEW: Game state tracking
  gameState: {
    activeTeamId: string | null;
    inputEnabled: boolean;
    lastBuzzingTeam: string | null; // Track who buzzed first for question
    waitingForOpponent: boolean; // True when waiting for opponent after strike
  };
}

// No change needed for these other interfaces, but included for reference
export interface Question {
  _id: string;
  round: number;
  question: string;
  questionCategory: string;
  answers: Answer[];
}

export interface Answer {
  _id?: string;
  answer: string;
  score: number;
  revealed: boolean;
  isCorrect?: boolean;
  rank?: number;
}

export interface Team {
  id: string;
  name: string;
  score: number;
  strikes: number;
  active: boolean;
  members: string[];
}

export interface Player {
  id: string;
  name: string;
  gameCode: string;
  connected: boolean;
  teamId?: string;
  socketId?: string;
}

// NEW: Socket event data types
export interface SocketEventData {
  game: Game;
  playerName?: string;
  teamName?: string;
  teamId?: string;
  playerId?: string;
  strikes?: number;
  pointsAwarded?: number;
  activeTeamName?: string;
  byHost?: boolean;
  answer?: Answer;
  timestamp?: number;
  reason?: string;
  message?: string;
}

// NEW: Wrong answer event specific type
export interface WrongAnswerEventData extends SocketEventData {
  game: Game;
  teamName: string;
  strikes: number;
  playerName: string;
}

// NEW: Player buzzed event specific type
export interface PlayerBuzzedEventData extends SocketEventData {
  game: Game;
  playerName: string;
  teamName: string;
  teamId: string;
  timestamp: number;
}

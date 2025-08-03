// Game utility functions

/**
 * Check if an answer matches the correct answer
 * @param {string} userAnswer - User's answer
 * @param {string} correctAnswer - Correct answer
 * @returns {boolean} - Whether the answers match
 */
function levenshtein(a, b) {
  const matrix = [];

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
}

function isAnswerMatch(userAnswer, correctAnswer) {
  const normalizedUser = userAnswer.toLowerCase().trim();
  const normalizedCorrect = correctAnswer.toLowerCase();

  const distance = levenshtein(normalizedUser, normalizedCorrect);
  const ratio = distance / Math.max(normalizedUser.length, normalizedCorrect.length);

  return distance <= 2 && ratio <= 0.25;
}

/**
 * Calculate points with round multiplier
 * @param {number} basePoints - Base points for the answer
 * @param {number} round - Current round number
 * @returns {number} - Total points awarded
 */
function calculatePoints(basePoints, round) {
  return basePoints * round;
}

/**
 * Check if all answers in a question are revealed
 * @param {Object} question - Question object
 * @returns {boolean} - Whether all answers are revealed
 */
function allAnswersRevealed(question) {
  return question.answers.every((answer) => answer.revealed);
}

/**
 * Get the team with the highest score
 * @param {Array} teams - Array of team objects
 * @returns {Object} - Winning team
 */
function getWinningTeam(teams) {
  return teams.reduce((winner, current) =>
    current.score > winner.score ? current : winner
  );
}

/**
 * Reset strikes for all teams
 * @param {Array} teams - Array of team objects
 */
function resetAllStrikes(teams) {
  teams.forEach((team) => {
    team.strikes = 0;
  });
}

/**
 * Switch active teams
 * @param {Array} teams - Array of team objects
 */
function switchActiveTeams(teams) {
  teams.forEach((team) => {
    team.active = !team.active;
  });
}

/**
 * Get active team
 * @param {Array} teams - Array of team objects
 * @returns {Object|null} - Active team or null
 */
function getActiveTeam(teams) {
  return teams.find((team) => team.active) || null;
}

/**
 * Validate game code format
 * @param {string} gameCode - Game code to validate
 * @returns {boolean} - Whether the game code is valid
 */
function isValidGameCode(gameCode) {
  return (
    typeof gameCode === "string" &&
    gameCode.length === 6 &&
    /^[A-Z0-9]+$/.test(gameCode)
  );
}

/**
 * Validate player name
 * @param {string} playerName - Player name to validate
 * @returns {boolean} - Whether the player name is valid
 */
function isValidPlayerName(playerName) {
  return (
    typeof playerName === "string" &&
    playerName.trim().length >= 2 &&
    playerName.trim().length <= 20
  );
}

/**
 * Get game progress percentage
 * @param {Object} game - Game object
 * @returns {number} - Progress percentage (0-100)
 */
function getGameProgress(game) {
  if (game.questions.length === 0) return 0;
  return Math.round((game.currentQuestionIndex / game.questions.length) * 100);
}

/**
 * Check if game should end (all questions completed)
 * @param {Object} game - Game object
 * @returns {boolean} - Whether the game should end
 */
function shouldEndGame(game) {
  return game.currentQuestionIndex >= game.questions.length;
}

export default {
  isAnswerMatch,
  calculatePoints,
  allAnswersRevealed,
  getWinningTeam,
  resetAllStrikes,
  switchActiveTeams,
  getActiveTeam,
  isValidGameCode,
  isValidPlayerName,
  getGameProgress,
  shouldEndGame,
};

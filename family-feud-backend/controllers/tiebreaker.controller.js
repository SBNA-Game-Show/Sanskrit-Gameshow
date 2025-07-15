let currentTieBreaker = null;

exports.setTiebreakerQuestion = (req, res) => {
  const { questionText, answers } = req.body;
  if (!questionText || !answers || !Array.isArray(answers)) {
    return res.status(400).json({ message: "Invalid format" });
  }

  currentTieBreaker = {
    questionText,
    answers,
    responses: {}, // store teamA and teamB responses
  };

  res.json({ message: "Tiebreaker set", question: currentTieBreaker });
};

exports.getTiebreaker = (req, res) => {
  if (!currentTieBreaker) {
    return res.status(404).json({ message: "No tiebreaker set" });
  }
  res.json({ questionText: currentTieBreaker.questionText });
};

exports.submitTiebreakerAnswer = (req, res) => {
  const { team, answer } = req.body;
  if (!currentTieBreaker || !team || !answer) {
    return res.status(400).json({ message: "Invalid submission" });
  }

  const matched = currentTieBreaker.answers.find(
    (a) => a.answerText.toLowerCase() === answer.toLowerCase()
  );

  currentTieBreaker.responses[team] = {
    answer,
    points: matched ? matched.points : 0,
  };

  res.json({ score: matched ? matched.points : 0 });
};

exports.getResult = (req, res) => {
  const { responses, questionText } = currentTieBreaker || {};
  if (!responses || !responses.teamA || !responses.teamB) {
    return res.status(400).json({ message: "Waiting for both teams" });
  }

  let winner = null;
  if (responses.teamA.points > responses.teamB.points) winner = "Team A";
  else if (responses.teamB.points > responses.teamA.points) winner = "Team B";
  else winner = "It's a tie!";

  res.json({
    questionText,
    responses,
    winner,
  });
};

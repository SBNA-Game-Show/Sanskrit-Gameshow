const TeamResponse = require('../models/Response');
const Question = require('../models/question');

exports.submitResponse = async (req, res) => {
  const team = req.user.role;
  const {questionId, answer } = req.body;

  try {
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ message: "Question not found" });

    const match = question.answers.find(a => a.answerText.toLowerCase() === answer.toLowerCase());
    const score = match ? match.points : 0;

    const newResponse = new TeamResponse({ team, questionId, answer, score });
    await newResponse.save();

    return res.status(200).json({ message: "Response saved", score });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getScores = async (req, res) => {
  try {
    const responses = await TeamResponse.find();
    const teamScores = responses.reduce((acc, curr) => {
      acc[curr.team] = (acc[curr.team] || 0) + curr.score;
      return acc;
    }, {});

    return res.json(teamScores);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

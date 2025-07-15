const Question = require('../models/question');

const getCurrentQuestion = async (req, res) => {
  try {
    const question = await Question.findOne(); // You can add .sort({ createdAt: -1 }) if needed
    if (!question) return res.status(404).json({ message: 'No question found' });

    res.json({
      id: question._id,
      question: question.question
    //   answers: question.answers // optional if you want to include
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching question' });
  }
};

module.exports = { getCurrentQuestion };

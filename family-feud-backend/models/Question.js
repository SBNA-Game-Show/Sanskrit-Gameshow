const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  answerText: { type: String, required: true },
  points: { type: Number, required: true }
});

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answers: [answerSchema]
});

module.exports = mongoose.model('Question', questionSchema);

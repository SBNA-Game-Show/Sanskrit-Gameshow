// mockData.js - Sample questions for the quiz game

const mockQuestions = [
  {
    id: 1,
    round: 1,
    category: "Literature",
    question: "Name a famous Shakespeare play",
    answers: [
      { text: "Romeo and Juliet", points: 50, revealed: false },
      { text: "Hamlet", points: 40, revealed: false },
      { text: "Macbeth", points: 30, revealed: false },
      { text: "A Midsummer Night's Dream", points: 20, revealed: false },
      { text: "Othello", points: 10, revealed: false },
      { text: "The Tempest", points: 5, revealed: false },
    ],
  }
];

module.exports = mockQuestions;

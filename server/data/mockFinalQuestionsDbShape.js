// server/data/mockFinalQuestionsDbShape.js
import { v4 as uuidv4 } from "uuid";

// Reusable helper for Input-style answers
const makeAns = (answer, score, rank) => ({
  _id: uuidv4(),
  answer,
  responseCount: Math.max(1, Math.floor((score ?? 0) / 2)),
  isCorrect: true,
  rank,
  score,
});

// INPUT question factory (Rounds 1–3 feed)
const qInput = (category, level, text, answers) => ({
  _id: uuidv4(),
  question: text,
  questionType: "Input",
  questionCategory: category,
  questionLevel: level, // "Beginner" | "Intermediate" | "Advanced"
  timesSkipped: 0,
  timesAnswered: 0,
  answers,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// MCQ question factory (Lightning feed)
const qMcq = (category, text, answers) => ({
  _id: uuidv4(),
  question: text,
  questionType: "MCQ",
  questionCategory: category,
  // no questionLevel required for MCQ in your pipeline
  timesSkipped: 0,
  timesAnswered: 0,
  // For MCQ, only `answer` and `score` are used by engine; add others if you like
  answers: answers.map((a, i) => ({
    _id: uuidv4(),
    answer: a.answer,
    score: a.score,
    rank: i + 1,
    isCorrect: true,
    responseCount: 1,
    revealed: false,
  })),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

/**
 * INPUT: exactly 19 total (6 Beginner, 7 Intermediate, 6 Advanced).
 * One Intermediate will be used as Toss-Up; the remaining 18 feed Rounds 1–3.
 */

// 6 Beginner
const beginner = [
  qInput("Grammar", "Beginner", "Name an object that tells time.", [
    makeAns("Clock", 10, 1), makeAns("Watch", 8, 2), makeAns("Phone", 6, 3),
  ]),
  qInput("Food & Drinks", "Beginner", "Name a popular breakfast food.", [
    makeAns("Eggs", 10, 1), makeAns("Cereal", 8, 2), makeAns("Toast", 6, 3),
  ]),
  qInput("Sports", "Beginner", "Name a sport played with a ball.", [
    makeAns("Soccer", 10, 1), makeAns("Basketball", 8, 2), makeAns("Tennis", 6, 3),
  ]),
  qInput("Animals", "Beginner", "Name a household pet.", [
    makeAns("Dog", 10, 1), makeAns("Cat", 8, 2), makeAns("Fish", 6, 3),
  ]),
  qInput("Colors", "Beginner", "Name a color on the rainbow.", [
    makeAns("Red", 10, 1), makeAns("Blue", 8, 2), makeAns("Green", 6, 3),
  ]),
  qInput("Geography", "Beginner", "Name a country in Europe.", [
    makeAns("France", 10, 1), makeAns("Germany", 8, 2), makeAns("Italy", 6, 3),
  ]),
];

// 7 Intermediate (one is used as the Toss-Up)
const intermediate = [
  qInput("Daily Life", "Intermediate", "Name something people do when they wake up.", [
    makeAns("Check phone", 10, 1), makeAns("Brush teeth", 8, 2), makeAns("Stretch", 6, 3),
  ]),
  qInput("Technology", "Intermediate", "Name a popular social media platform.", [
    makeAns("Facebook", 10, 1), makeAns("Instagram", 8, 2), makeAns("TikTok", 6, 3),
  ]),
  qInput("Movies", "Intermediate", "Name a superhero from Marvel or DC.", [
    makeAns("Spider-Man", 10, 1), makeAns("Batman", 8, 2), makeAns("Superman", 6, 3),
  ]),
  qInput("Science", "Intermediate", "Name a planet in our solar system.", [
    makeAns("Earth", 10, 1), makeAns("Mars", 8, 2), makeAns("Jupiter", 6, 3),
  ]),
  qInput("Music", "Intermediate", "Name a popular music genre.", [
    makeAns("Pop", 10, 1), makeAns("Rock", 8, 2), makeAns("Hip Hop", 6, 3),
  ]),
  qInput("Transportation", "Intermediate", "Name a mode of transportation.", [
    makeAns("Car", 10, 1), makeAns("Bus", 8, 2), makeAns("Train", 6, 3),
  ]),
  qInput("Board Games", "Intermediate", "Name a popular board game.", [
    makeAns("Monopoly", 10, 1), makeAns("Scrabble", 8, 2), makeAns("Chess", 6, 3),
  ]),
];

// 6 Advanced
const advanced = [
  qInput("Literature", "Advanced", "Name a famous Shakespeare play.", [
    makeAns("Romeo and Juliet", 10, 1), makeAns("Hamlet", 8, 2), makeAns("Macbeth", 6, 3),
  ]),
  qInput("History", "Advanced", "Name a famous historical monument.", [
    makeAns("Great Wall of China", 10, 1), makeAns("Taj Mahal", 8, 2), makeAns("Eiffel Tower", 6, 3),
  ]),
  qInput("Professions", "Advanced", "Name a common profession or job.", [
    makeAns("Teacher", 10, 1), makeAns("Doctor", 8, 2), makeAns("Engineer", 6, 3),
  ]),
  qInput("Weather", "Advanced", "Name a type of weather condition.", [
    makeAns("Sunny", 10, 1), makeAns("Rainy", 8, 2), makeAns("Cloudy", 6, 3),
  ]),
  qInput("Household", "Advanced", "Name a common household appliance.", [
    makeAns("Refrigerator", 10, 1), makeAns("Washing Machine", 8, 2), makeAns("Microwave", 6, 3),
  ]),
  qInput("Fruits", "Advanced", "Name a popular fruit.", [
    makeAns("Apple", 10, 1), makeAns("Banana", 8, 2), makeAns("Orange", 6, 3),
  ]),
];

export const inputQuestions = [...beginner, ...intermediate, ...advanced];

/**
 * MCQ: ~7 questions for Lightning Round (Round 4)
 * Only `answer` and `score` are required by your engine.
 */
export const mcqQuestions = [
  qMcq("General", "Which device is commonly used to browse the internet?", [
    { answer: "Smartphone", score: 5 },
    { answer: "Laptop", score: 4 },
    { answer: "Tablet", score: 3 },
    { answer: "Televison", score: 2},
    { answer: "Playstation", score: 1}
  ]),
  qMcq("Food", "Which of these is a dairy product?", [
    { answer: "Cheese", score: 5 },
    { answer: "Yogurt", score: 4 },
    { answer: "Butter", score: 3 },
    { answer: "Ice cream", score: 2}, 
    { answer: "Cream Cheese", score: 1}, 
  ]),
  qMcq("Animals", "Which animal is a mammal?", [
    { answer: "Dolphin", score: 5 },
    { answer: "Bat", score: 4 },
    { answer: "Elephant", score: 3 },
    { answer: "Tiger", score: 2 },
    { answer: "Bears", score: 1 },
  ]),
  qMcq("Geography", "Which of these is a continent?", [
    { answer: "Asia", score: 5 },
    { answer: "Africa", score: 4 },
    { answer: "Europe", score: 3 },
    { answer: "North America", score: 2 },
    { answer: "Australia", score: 1 },
  ]),
  qMcq("Science", "Which is a noble gas?", [
    { answer: "Neon", score: 5 },
    { answer: "Argon", score: 4 },
    { answer: "Helium", score: 3 },
    { answer: "Krypton", score: 2 },
    { answer: "Radon", score: 1 },
  ]),
  qMcq("Sports", "Which sport uses a racket?", [
    { answer: "Tennis", score: 5 },
    { answer: "Badminton", score: 4 },
    { answer: "Squash", score: 3 },
    { answer: "Racquetball", score: 2 },
    { answer: "Tabel Tenns", score: 1 },
  ]),
  qMcq("Music", "Which of these is a musical instrument?", [
    { answer: "Piano", score: 5 },
    { answer: "Guitar", score: 4 },
    { answer: "Violin", score: 3 },
    { answer: "Flute", score: 2 },
    { answer: "Harp", score: 1 },
  ]),
];

// Default export supports both import styles used elsewhere
export default { inputQuestions, mcqQuestions };

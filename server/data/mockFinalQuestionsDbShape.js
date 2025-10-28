// server/data/mockFinalQuestionsDbShape.js
import { v4 as uuidv4 } from 'uuid';

// Helper to make an answer in DB shape
const makeAns = (answer, score, rank) => ({
  _id: uuidv4(),
  answer,
  responseCount: Math.max(1, Math.floor(score / 2)), // arbitrary but consistent
  isCorrect: true,
  rank,
  score,
});

const q = (category, level, text, answers) => ({
  _id: uuidv4(),
  question: text,
  questionType: 'Input',
  questionCategory: category,          // e.g. "Grammar"
  questionLevel: level,                // "Beginner" | "Intermediate" | "Advanced"
  timesSkipped: 0,
  timesAnswered: 0,
  answers,                             // [{ _id, answer, responseCount, isCorrect, rank, score }]
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

/**
 * IMPORTANT:
 * Your DB path expects exactly 19 INPUT questions:
 * - 6 Beginner
 * - 7 Intermediate
 * - 6 Advanced
 * prepareGameQuestions() then picks ONE Intermediate as the toss-up and uses the other 18.
 * So we provide 19 questions here in that exact distribution.
 */

// 6 Beginner
const beginner = [
  q('Grammar', 'Beginner', 'Name an object that tells time.', [
    makeAns('Clock', 10, 1), makeAns('Watch', 8, 2), makeAns('Phone', 6, 3),
  ]),
  q('Food & Drinks', 'Beginner', 'Name a popular breakfast food.', [
    makeAns('Eggs', 10, 1), makeAns('Cereal', 8, 2), makeAns('Toast', 6, 3),
  ]),
  q('Sports', 'Beginner', 'Name a sport played with a ball.', [
    makeAns('Soccer', 10, 1), makeAns('Basketball', 8, 2), makeAns('Tennis', 6, 3),
  ]),
  q('Animals', 'Beginner', 'Name a household pet.', [
    makeAns('Dog', 10, 1), makeAns('Cat', 8, 2), makeAns('Fish', 6, 3),
  ]),
  q('Colors', 'Beginner', 'Name a color on the rainbow.', [
    makeAns('Red', 10, 1), makeAns('Blue', 8, 2), makeAns('Green', 6, 3),
  ]),
  q('Geography', 'Beginner', 'Name a country in Europe.', [
    makeAns('France', 10, 1), makeAns('Germany', 8, 2), makeAns('Italy', 6, 3),
  ]),
];

// 7 Intermediate (one of these will be used as the toss-up)
const intermediate = [
  q('Daily Life', 'Intermediate', 'Name something people do when they wake up.', [
    makeAns('Check phone', 10, 1), makeAns('Brush teeth', 8, 2), makeAns('Stretch', 6, 3),
  ]),
  q('Technology', 'Intermediate', 'Name a popular social media platform.', [
    makeAns('Facebook', 10, 1), makeAns('Instagram', 8, 2), makeAns('TikTok', 6, 3),
  ]),
  q('Movies', 'Intermediate', 'Name a superhero from Marvel or DC.', [
    makeAns('Spider-Man', 10, 1), makeAns('Batman', 8, 2), makeAns('Superman', 6, 3),
  ]),
  q('Science', 'Intermediate', 'Name a planet in our solar system.', [
    makeAns('Earth', 10, 1), makeAns('Mars', 8, 2), makeAns('Jupiter', 6, 3),
  ]),
  q('Music', 'Intermediate', 'Name a popular music genre.', [
    makeAns('Pop', 10, 1), makeAns('Rock', 8, 2), makeAns('Hip Hop', 6, 3),
  ]),
  q('Transportation', 'Intermediate', 'Name a mode of transportation.', [
    makeAns('Car', 10, 1), makeAns('Bus', 8, 2), makeAns('Train', 6, 3),
  ]),
  q('Board Games', 'Intermediate', 'Name a popular board game.', [
    makeAns('Monopoly', 10, 1), makeAns('Scrabble', 8, 2), makeAns('Chess', 6, 3),
  ]),
];

// 6 Advanced
const advanced = [
  q('Literature', 'Advanced', 'Name a famous Shakespeare play.', [
    makeAns('Romeo and Juliet', 10, 1), makeAns('Hamlet', 8, 2), makeAns('Macbeth', 6, 3),
  ]),
  q('History', 'Advanced', 'Name a famous historical monument.', [
    makeAns('Great Wall of China', 10, 1), makeAns('Taj Mahal', 8, 2), makeAns('Eiffel Tower', 6, 3),
  ]),
  q('Professions', 'Advanced', 'Name a common profession or job.', [
    makeAns('Teacher', 10, 1), makeAns('Doctor', 8, 2), makeAns('Engineer', 6, 3),
  ]),
  q('Weather', 'Advanced', 'Name a type of weather condition.', [
    makeAns('Sunny', 10, 1), makeAns('Rainy', 8, 2), makeAns('Cloudy', 6, 3),
  ]),
  q('Household', 'Advanced', 'Name a common household appliance.', [
    makeAns('Refrigerator', 10, 1), makeAns('Washing Machine', 8, 2), makeAns('Microwave', 6, 3),
  ]),
  q('Fruits', 'Advanced', 'Name a popular fruit.', [
    makeAns('Apple', 10, 1), makeAns('Banana', 8, 2), makeAns('Orange', 6, 3),
  ]),
];

const all19 = [...beginner, ...intermediate, ...advanced];

export default all19;

import { Counter, GameQuestion } from "../models/gameQuestion.model.js";
import { ApiError } from "../utils/ApiError.js";
import { QUESTION_LEVEL } from "../utils/constants.js";
import { SCHEMA_MODELS } from "../utils/enums.js";
import { getQuestions } from "./questionService.js";

function shuffleAnswers(array) {
  const arr = [...array]

  // Use Fisher-Yates shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

export async function prepareGameQuestions() {
  const { inputQuestions, mcqQuestions } = await getQuestions(SCHEMA_MODELS.FINALQUESTION);

  const questions = inputQuestions;

  if (!questions.length) {
    throw new ApiError(
      500,
      "No New questions found to load into game. All The questions were used in previous Game."
    );
  }

  // --- Toss-Up Logic ---
  const tossUpIndex = questions.findIndex(
    (q) => q.questionLevel === QUESTION_LEVEL.INTERMEDIATE
  );
  if (tossUpIndex === -1) {
    throw new ApiError(
      400,
      "No INTERMEDIATE-level question found for toss-up."
    );
  }
  const [tossUpQuestion] = questions.splice(tossUpIndex, 1);
  const updatedTossUpQuestion = {
    ...tossUpQuestion,
    round: 0,
    questionNumber: 1,
  };

  // --- Numbering + Team Assignment ---
  const groupSize = 3;
  const teams = ["team1", "team2"];
  const updatedInputQuestions = questions.map((q, idx) => {
    const groupIndex = Math.floor(idx / groupSize);
    const teamAssignment = teams[groupIndex % teams.length];
    const questionNumber = (idx % groupSize) + 1;
    let round;
    if (q.questionLevel === QUESTION_LEVEL.BEGINNER) round = 1;
    else if (q.questionLevel === QUESTION_LEVEL.INTERMEDIATE) round = 2;
    else round = 3;

    return {
      ...q,
      questionNumber,
      teamAssignment,
      round,
    };
  });

  // --- Add Round 4 Lightning Questions ---
  const updatedMcqQuestions = mcqQuestions.map((q, index) => ({
    ...q,
    answers: shuffleAnswers(q.answers),
    round: 4,
    questionNumber: index + 1,
    teamAssignment: "shared",
  }));

  console.log(updatedMcqQuestions)

  // --- Save into GameQuestion collection ---
  await GameQuestion.deleteMany();
  await GameQuestion.insertMany([...updatedInputQuestions, ...updatedMcqQuestions]);

  // --- Return combined questions ---
  return {
    updatedTossUpQuestion,
    updatedQuestions: [...updatedInputQuestions, ...updatedMcqQuestions],
  };
}
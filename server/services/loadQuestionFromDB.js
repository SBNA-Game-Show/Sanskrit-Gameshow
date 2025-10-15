import { Counter, GameQuestion } from "../models/gameQuestion.model.js";
import { ApiError } from "../utils/ApiError.js";
import { QUESTION_LEVEL } from "../utils/constants.js";
import { SCHEMA_MODELS } from "../utils/enums.js";
import { getQuestions } from "./questionService.js";

export async function prepareGameQuestions() {
  // ⬇️ Updated line: now destructure both sets
  const { inputQuestions, lightningQuestions } =
    await getQuestions(SCHEMA_MODELS.FINALQUESTION);
    console.log("⚡ Lightning Round Questions:", lightningQuestions.map(q => q.question));
console.log("⚡ Lightning fetched:", lightningQuestions?.length || 0);
if (lightningQuestions?.length) {
  console.log("⚡ First Lightning question:", lightningQuestions[0].question);
}


  const questions = inputQuestions;

  if (!questions.length) {
    throw new ApiError(
      500,
      "No New questions found to load into game. All The questions were used in previous Game."
    );
  }

  // --- Toss-Up Logic (unchanged) ---
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
    ...tossUpQuestion.toObject(),
    round: 0,
    questionNumber: 1,
  };

  // --- Numbering + Team Assignment (your original logic) ---
  const groupSize = 3;
  const teams = ["team1", "team2"];
  const updatedQuestions = questions.map((q, idx) => {
    const groupIndex = Math.floor(idx / groupSize);
    const teamAssignment = teams[groupIndex % teams.length];
    const questionNumber = (idx % groupSize) + 1;
    let round;
    if (q.questionLevel === QUESTION_LEVEL.BEGINNER) round = 1;
    else if (q.questionLevel === QUESTION_LEVEL.INTERMEDIATE) round = 2;
    else round = 3;

    return {
      ...q.toObject(),
      questionNumber,
      teamAssignment,
      round,
    };
  });

  // --- Add Round 4 Lightning Questions ---
  const lightningWithRound = lightningQuestions.map((q, index) => ({
    ...q.toObject(),
    round: 4,
    questionNumber: index + 1,
    teamAssignment: "shared",
  }));

  // ✅ Step 2 (optional): Handle ObjectId or UUID for question IDs
  const questionIDs = questions
    .map((q) => {
      if (q._id && typeof q._id === "object" && q._id.toString) {
        return q._id.toString(); // Convert ObjectId → string
      }
      return q._id;
    })
    .filter((id) => typeof id === "string" && id.trim() !== "");

  // --- Save into GameQuestion collection ---
  await GameQuestion.deleteMany();
  await GameQuestion.insertMany([...updatedQuestions, ...lightningWithRound]);

  // --- Return combined questions ---
  return {
    updatedTossUpQuestion,
    updatedQuestions: [...updatedQuestions, ...lightningWithRound],
  };
}

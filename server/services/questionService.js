import { ApiError } from "../utils/ApiError.js";
import { QUESTION_LEVEL, QUESTION_TYPE } from "../utils/constants.js";

/**
 * Fetches questions for all rounds from the given Mongo collection.
 * Handles both Input (rounds 1–3) and Lightning (round 4 / MCQ) types.
 */
async function getQuestions(collection) {
  try {
    // --- Round 1: Beginner Input Questions ---
    const beginnerInputQuestions = await collection.aggregate([
      { $match: { questionType: QUESTION_TYPE.INPUT, questionLevel: QUESTION_LEVEL.BEGINNER } },
      { $sample: { size: 6 } }
    ])

    // --- Round 2: Intermediate Input Questions ---
    const intermediateInputQuestions = await collection.aggregate([
      { $match: { questionType: QUESTION_TYPE.INPUT, questionLevel: QUESTION_LEVEL.INTERMEDIATE } },
      { $sample: { size: 7 } }
    ])

    // --- Round 3: Advanced Input Questions ---
    const advancedInputQuestions = await collection.aggregate([
      { $match: { questionType: QUESTION_TYPE.INPUT, questionLevel: QUESTION_LEVEL.ADVANCED } },
      { $sample: { size: 6 } }
    ])

    // --- Round 4 (Lightning / MCQ) ---
    const mcqQuestions = await collection.aggregate([
      { $match: { questionType: QUESTION_TYPE.MCQ } },
      { $sample: { size: 7 } }
    ])

    // --- Merge Input Rounds ---
    const inputQuestions = [
      ...beginnerInputQuestions,
      ...intermediateInputQuestions,
      ...advancedInputQuestions,
    ];

    // --- Validate ---
    if (inputQuestions.length < 26) {
      console.error("❌ Found only", inputQuestions.length, "input questions.");
      throw new ApiError(404, "Less than 26 questions in the DB. Game needs 26.");
    }

    return { inputQuestions, mcqQuestions };

  } catch (error) {
    console.error("❌ Error in getQuestions():", error);
    throw new ApiError(500, "Failed to fetch questions from DB: " + error.message);
  }
}

export { getQuestions };

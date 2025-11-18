import { ApiError } from "../utils/ApiError.js";
import { QUESTION_LEVEL, QUESTION_TYPE } from "../utils/constants.js";

/**
 * Fetches ALL questions from the database
 * so users can select which ones to use in the game
 */
async function getQuestions(collection) {
  try {
    // --- Fetch ALL questions of each type (no $sample) ---
    const beginnerInputQuestions = await collection
      .find({
        questionType: QUESTION_TYPE.INPUT,
        questionLevel: QUESTION_LEVEL.BEGINNER,
      })
      .lean();

    const intermediateInputQuestions = await collection
      .find({
        questionType: QUESTION_TYPE.INPUT,
        questionLevel: QUESTION_LEVEL.INTERMEDIATE,
      })
      .lean();

    const advancedInputQuestions = await collection
      .find({
        questionType: QUESTION_TYPE.INPUT,
        questionLevel: QUESTION_LEVEL.ADVANCED,
      })
      .lean();

    const mcqQuestions = await collection
      .find({
        questionType: QUESTION_TYPE.MCQ,
      })
      .lean();

    // --- Merge all input questions ---
    const inputQuestions = [
      ...beginnerInputQuestions,
      ...intermediateInputQuestions,
      ...advancedInputQuestions,
    ];

    console.log(
      `📚 Loaded ${inputQuestions.length} input questions and ${mcqQuestions.length} MCQ questions from DB`
    );

    return { inputQuestions, mcqQuestions };
  } catch (error) {
    console.error("❌ Error in getQuestions():", error);
    throw new ApiError(
      500,
      "Failed to fetch questions from DB: " + error.message
    );
  }
}

export { getQuestions };

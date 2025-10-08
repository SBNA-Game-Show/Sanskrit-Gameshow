import { ApiError } from "../utils/ApiError.js";
import { QUESTION_LEVEL, QUESTION_TYPE } from "../utils/constants.js";

/**
 * Fetches questions for all rounds from the given Mongo collection.
 * Handles both Input (rounds 1–3) and Lightning (round 4 / MCQ) types.
 */
async function getQuestions(collection) {
  try {
    // --- Round 1: Beginner Input Questions ---
    const beginnerInputQuestions = await collection.find({
      questionType: QUESTION_TYPE.INPUT,
      used: { $ne: true },
      questionLevel: QUESTION_LEVEL.BEGINNER,
    })
      .select("_id question questionCategory questionLevel questionType answers timestamps")
      .sort({ createdAt: 1 })
      .limit(6);

    // --- Round 2: Intermediate Input Questions ---
    const intermediateInputQuestions = await collection.find({
      questionType: QUESTION_TYPE.INPUT,
      used: { $ne: true },
      questionLevel: QUESTION_LEVEL.INTERMEDIATE,
    })
      .select("_id question questionCategory questionLevel questionType answers timestamps")
      .sort({ createdAt: 1 })
      .limit(7);

    // --- Round 3: Advanced Input Questions ---
    const advancedInputQuestions = await collection.find({
      questionType: QUESTION_TYPE.INPUT,
      used: { $ne: true },
      questionLevel: QUESTION_LEVEL.ADVANCED,
    })
      .select("_id question questionCategory questionLevel questionType answers timestamps")
      .sort({ createdAt: 1 })
      .limit(6);
// --- Round 4 (Lightning / MCQ) ---
const lightningQuestions = await collection
  .find({
    // match MCQ regardless of casing or missing round/isLightningRound fields
    questionType: { $in: [QUESTION_TYPE.MCQ, "MCQ", "Mcq", "mcq"] },
  })
  .select("_id question questionCategory questionLevel questionType answers")
  .sort({ createdAt: 1, _id: 1 })
  .limit(7);

    // 🧩 Debug output to confirm data fetch
    console.log("⚡ [DB] Lightning questions found:", lightningQuestions.length);
    console.log("⚡ [DB] Lightning titles:", lightningQuestions.map(q => q.question));

    // --- Merge Input Rounds ---
    const inputQuestions = [
      ...beginnerInputQuestions,
      ...intermediateInputQuestions,
      ...advancedInputQuestions,
    ];

    // --- Validate ---
    if (inputQuestions.length < 19) {
      console.error("❌ Found only", inputQuestions.length, "input questions.");
      throw new ApiError(404, "Less than 19 questions in the DB. Game needs 19.");
    }

    return { inputQuestions, lightningQuestions };

  } catch (error) {
    console.error("❌ Error in getQuestions():", error);
    throw new ApiError(500, "Failed to fetch questions from DB: " + error.message);
  }
}

export { getQuestions };

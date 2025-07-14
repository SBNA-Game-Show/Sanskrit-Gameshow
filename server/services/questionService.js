import { GameQuestion } from "../models/gameQuestion.model.js";
import { ApiError } from "../utils/ApiError.js";
import { QUESTION_TYPE } from "../utils/constants.js";

async function getQuestions(collection) {
  // Fetch all questions with full details including answers and timesSkipped,
  // sorted by newest first

  const inputQuestions = await collection
    .find({ questionType: QUESTION_TYPE.INPUT, used: { $ne: true } })
    .select(
      "_id question questionCategory questionLevel questionType answers timestamps"
    )
    .sort({ createdAt: 1 })
    .limit(18);

  // const mcqQuestions = await collection
  //   .find({ questionType: QUESTION_TYPE.MCQ })
  //   .select(
  //     "_id question questionCategory questionLevel questionType answers timestamps"
  //   )
  //   .sort({ createdAt: -1 })
  //   .limit(5);

  if (inputQuestions.length !== 18) {
    throw new ApiError(404, "Less than 18 questions in the DB. Game needs 18.");
  }

  return [...inputQuestions];
}

export { getQuestions };

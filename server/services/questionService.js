import { QUESTION_TYPE } from "../utils/constants.js";

async function getQuestions(collection) {
  // Fetch all questions with full details including answers and timesSkipped,
  // sorted by newest first

  const inputQuestions = await collection
    .find({ questionType: QUESTION_TYPE.INPUT })
    .select(
      "_id question questionCategory questionLevel questionType answers timestamps"
    )
    .sort({ createdAt: -1 })
    .limit(18);

  const mcqQuestions = await collection
    .find({ questionType: QUESTION_TYPE.MCQ })
    .select(
      "_id question questionCategory questionLevel questionType answers timestamps"
    )
    .sort({ createdAt: -1 })
    .limit(5);

  return [...mcqQuestions, ...inputQuestions];
}

export { getQuestions };

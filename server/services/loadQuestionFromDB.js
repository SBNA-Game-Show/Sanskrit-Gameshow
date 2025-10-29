import { GameQuestion } from "../models/gameQuestion.model.js";
import { ApiError } from "../utils/ApiError.js";
import { QUESTION_LEVEL, QUESTION_TYPE } from "../utils/constants.js";
import { SCHEMA_MODELS } from "../utils/enums.js";
import { getQuestions } from "./questionService.js";

/* Fisher–Yates */
function shuffleAnswers(array = []) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function prepareGameQuestions() {
  // ---------- MOCK MODE ----------
  if (process.env.USE_MOCK_QUESTIONS === "true") {
    // The mock file now exports: { inputQuestions: [...19 input...], mcqQuestions: [...7 mcq...] }
    const mod = await import("../data/mockFinalQuestionsDbShape.js");
    const inputQuestions = mod.default?.inputQuestions ?? mod.inputQuestions ?? [];
    const mcqQuestions   = mod.default?.mcqQuestions   ?? mod.mcqQuestions   ?? [];

    if (!Array.isArray(inputQuestions) || inputQuestions.length < 19) {
      throw new ApiError(400, "Mock must provide at least 19 INPUT questions (6/7/6 distribution).");
    }

    // --- Toss-Up: take one Intermediate
    const pool = [...inputQuestions];
    const tossUpIdx = pool.findIndex(q => q.questionLevel === "Intermediate");
    if (tossUpIdx === -1) {
      throw new ApiError(400, "No INTERMEDIATE-level question found for toss-up (mock).");
    }
    const [tossUpQuestion] = pool.splice(tossUpIdx, 1);
    const updatedTossUpQuestion = { ...tossUpQuestion, round: 0, questionNumber: 1 };

    // --- Rounds 1–3: team assignment & numbering (groups of 3)
    const teams = ["team1", "team2"];
    const groupSize = 3;

    const updatedInputQuestions = pool.map((q, idx) => {
      const groupIndex = Math.floor(idx / groupSize);
      const teamAssignment = teams[groupIndex % teams.length];
      const questionNumber = (idx % groupSize) + 1;
      let round;
      if (q.questionLevel === "Beginner") round = 1;
      else if (q.questionLevel === "Intermediate") round = 2;
      else round = 3;

      return {
        ...q,
        round,
        teamAssignment,
        questionNumber,
      };
    });

    // --- Round 4 (Lightning / MCQ)
    const updatedMcqQuestions = (mcqQuestions || []).map((q, i) => ({
      ...q,
      answers: shuffleAnswers(q.answers),
      round: 4,
      questionNumber: i + 1,
      teamAssignment: "shared",
    }));

    // In mock mode, do NOT touch the DB; just return shaped questions.
    return {
      updatedTossUpQuestion,
      updatedQuestions: [...updatedInputQuestions, ...updatedMcqQuestions],
    };
  }

  // ---------- DB MODE (Lightning) ----------
  const { inputQuestions, mcqQuestions } = await getQuestions(SCHEMA_MODELS.FINALQUESTION);

  if (!inputQuestions?.length) {
    throw new ApiError(500, "No new questions found to load into game.");
  }

  // --- Toss-Up (remove one Intermediate from inputs)
  const pool = [...inputQuestions];
  const tossUpIdx = pool.findIndex(q => q.questionLevel === QUESTION_LEVEL.INTERMEDIATE);
  if (tossUpIdx === -1) {
    throw new ApiError(400, "No INTERMEDIATE-level question found for toss-up.");
  }
  const [tossUpQuestion] = pool.splice(tossUpIdx, 1);
  const updatedTossUpQuestion = { ...tossUpQuestion, round: 0, questionNumber: 1 };

  // --- Rounds 1–3
  const teams = ["team1", "team2"];
  const groupSize = 3;

  const updatedInputQuestions = pool.map((q, idx) => {
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

  // --- Round 4 (Lightning / MCQ)
  const updatedMcqQuestions = (mcqQuestions || []).map((q, i) => ({
    ...q,
    answers: shuffleAnswers(q.answers),
    round: 4,
    questionNumber: i + 1,
    teamAssignment: "shared",
  }));

  // --- Persist R1–R4 to GameQuestion (toss-up stays in memory)
  await GameQuestion.deleteMany();
  await GameQuestion.insertMany([...updatedInputQuestions, ...updatedMcqQuestions]);

  return {
    updatedTossUpQuestion,
    updatedQuestions: [...updatedInputQuestions, ...updatedMcqQuestions],
  };
}

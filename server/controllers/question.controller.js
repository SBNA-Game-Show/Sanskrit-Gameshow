const getQuestion = asyncHandler(async (req, res) => {
  // Step:1  Check if the request is from an admin route
  if (req.isAdminRoute) {
    // Step:2   Fetch all questions with admin-level details (including answers and timesSkipped)
    const questions = await questionService.getQuestionForAdmin(
      SCHEMA_MODELS.FINAL
    );

    // Step:3  If no questions found, throw a 404 error
    if (questions.length === 0) {
      throw new ApiError(404, "No questions found");
    }
    // Step:4  Respond with success and the list of questions
    return res
      .status(200)
      .json(
        new ApiResponse(200, questions, "Questions Retrieved Successfully")
      );
  } else {
    // Step:1  Fetch questions for normal users (input + MCQ types, limited fields)
    const questions = await questionService.getQuestionsForUser(
      SCHEMA_MODELS.QUESTION,
      [QUESTION_TYPE.INPUT, QUESTION_TYPE.MCQ]
    );

    // Step:2  If no questions found, throw a 404 error
    if (questions.length === 0) {
      throw new ApiError(404, "No questions found");
    }

    // Step:3  Respond with success and the list of questions
    return res
      .status(200)
      .json(
        new ApiResponse(200, questions, "Questions Retrieved Successfully")
      );
  }
});

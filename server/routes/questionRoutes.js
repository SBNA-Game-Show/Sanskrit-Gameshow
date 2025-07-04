import { Router } from "express";
import { loadQuestions } from "../controllers/question.controller.js";

const adminRouter = Router();

// [ GET ] METHOD to pull from FinalQuestion Schema and load them into the gameQuestion Schema
adminRouter.route("/loadQuestions").get(loadQuestions);

export default adminRouter;

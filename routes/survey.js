import { Router } from "express";

import {
  createSurvey,
  updateSurvey,
  likeSurvey,
  commentSurvey,
  deleteSurvey,
  getSurvey,
  getSurveys,
  voteSurvey,
  likeCommentSurvey,
  deleteCommentSurvey,
  getComments,
} from "../controllers/survey.js";

const router = Router();

router.post("/create/:userId", createSurvey);
router.get("/user", getSurveys);
router.patch("/update/:surveyId", updateSurvey);
router.patch("/like/:surveyId", likeSurvey);
router.patch("/vote/:surveyId", voteSurvey);
router.get("/comments/:surveyId", getComments);
router.patch("/comment/:surveyId", commentSurvey);
router.patch("/comment/like/:surveyId", likeCommentSurvey);
router.patch("/comment/delete/:surveyId", deleteCommentSurvey);
router.get("/delete/:surveyId", deleteSurvey);
router.get("/:surveyId", getSurvey);

export default router;

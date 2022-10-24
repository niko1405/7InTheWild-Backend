import { Router } from "express";

import {
  createSurvey,
  updateSurvey,
  deleteSurvey,
  getSurveys,
  voteSurvey,
  getSurvey,
  searchSurvey,
  getSurveysSection,
} from "../controllers/dailySurvey.js";

const router = Router();

router.post("/create", createSurvey);
router.patch("/update/:surveyId", updateSurvey);
router.patch("/vote/:surveyId", voteSurvey);
router.patch("/search", searchSurvey);
router.delete("/delete/:surveyId", deleteSurvey);
router.get("/surveys", getSurveys);
router.get("/surveys/:section", getSurveysSection);
router.get("/:surveyId", getSurvey);

export default router;

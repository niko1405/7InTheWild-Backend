import { Router } from "express";
import { getNewsData } from "../controllers/news.js";

const router = Router();

router.get("/data", getNewsData);

export default router;

import { Router } from "express";
import {
  comment,
  getChat,
  searchChat,
  createChat,
  getChats,
  chatAction,
  removeLatestMessages,
} from "../controllers/chat.js";

const router = Router();

router.post("/comment/:chatId", comment);
router.post("/search", searchChat);
router.post("/create", createChat);
router.patch("/action", chatAction);
router.get("/user/:userId", getChats);
router.get("/latest-messages", removeLatestMessages);
router.get("/:chatId", getChat);

export default router;

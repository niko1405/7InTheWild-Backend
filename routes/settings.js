import { Router } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

import {
  changeLiveChatSettings,
  getLiveChatSettings,
  getNotifications,
  setNotifications,
} from "../controllers/settings.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/chat");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `${req.params.userId}&${uuidv4()}.${file.originalname.split(".")[1]}`
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.includes("image"))
    return cb("Invalid image format.", false);
  cb(null, true);
};

const upload = multer({ storage, fileFilter });

const router = Router();

router.get("/chat/:userId", getLiveChatSettings);
router.get("/notifications/:userId", getNotifications);
router.patch("/notifications/:userId", setNotifications);
router.patch(
  "/chat/:userId",
  upload.single("chatImage"),
  changeLiveChatSettings
);

export default router;

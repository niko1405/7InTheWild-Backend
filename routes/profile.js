import { Router } from "express";
import multer from "multer";
import { updateProfile } from "../controllers/profile.js";
import { v4 as uuidv4 } from "uuid";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/profile");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `${req.params.userId}&${uuidv4()}.${file.originalname.split(".")[1]}`
    );
  },
});

const upload = multer({ storage: storage });

const router = Router();

router.post("/upload/:userId", upload.single("profileImg"), updateProfile);

export default router;

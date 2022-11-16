import { Router } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

import {
  updateProfile,
  getProfile,
  setFavorit,
  getFavorits,
  searchProfiles,
} from "../controllers/profile.js";

const storage = multer.diskStorage({
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

router.get("/", getProfile);
router.patch("/search", searchProfiles);
router.get("/favorits", getFavorits);
router.patch("/favorit/:userId", setFavorit);
router.post("/upload/:userId", upload.single("profileImg"), updateProfile);

export default router;

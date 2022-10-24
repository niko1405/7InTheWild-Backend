import multer from "multer";

import { Router } from "express";
import {
  createPost,
  deleteImage,
  deletePost,
  getAvailableImages,
  getPost,
  getPosts,
  searchPosts,
  updatePost,
  uploadImage,
  getArchive,
  getRelatedPosts,
  getPostsByFilter,
} from "../controllers/post.js";
import { postValidator, validate } from "../middlewares/postValidator.js";
import { parseData } from "../middlewares/parseData.js";

const storage = multer.diskStorage({});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.includes("image"))
    return cb("Invalid image format.", false);
  cb(null, true);
};

const upload = multer({ storage, fileFilter });

const router = Router();

router.delete("/:postId", deletePost);
router.get("/related_posts/:postId", getRelatedPosts);
router.get("/filter", getPostsByFilter);
router.get("/posts", getPosts);
router.patch("/search", searchPosts);
router.patch("/delete-image", deleteImage);
router.get("/available-images", getAvailableImages);
router.get("/archive", getArchive);
router.get("/:slug", getPost);
router.post(
  "/create",
  upload.single("thumbnail"),
  parseData,
  postValidator,
  validate,
  createPost
);
router.patch(
  "/update/:postId",
  upload.single("thumbnail"),
  parseData,
  postValidator,
  validate,
  updatePost
);

router.post("/upload-image", upload.single("image"), uploadImage);

export default router;

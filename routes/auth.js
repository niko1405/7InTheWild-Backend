import { Router } from "express";

import {
  login,
  signup,
  changePassword,
  deleteAccount,
  changeUsername,
  googleSignIn,
  getUser,
  existUser,
  updateUser,
} from "../controllers/auth.js";

const router = Router();

router.post("/login", login);
router.post("/signup", signup);
router.post("/googleSignIn", googleSignIn);
router.get("/user/:userId", getUser);
router.patch("/user", existUser);
router.patch("/updateUser/:userId", updateUser);
router.post("/changePassword", changePassword);
router.get("/deleteAcc/:id", deleteAccount);
router.post("/changeUsername/:id", changeUsername);

export default router;

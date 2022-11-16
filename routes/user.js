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
  setPushToken,
  getPushToken,
  changeLocation,
  changeNotifications,
  getPremium,
} from "../controllers/user.js";

const router = Router();

router.post("/login", login);
router.post("/signup", signup);
router.post("/googleSignIn", googleSignIn);
router.get("/user/:userId", getUser);
router.get("/premium/:userId", getPremium);
router.patch("/user", existUser);
router.patch("/updateUser/:userId", updateUser);
router.post("/changePassword", changePassword);
router.get("/deleteAcc/:id", deleteAccount);
router.post("/changeUsername/:id", changeUsername);
router.patch("/token/:userId", setPushToken);
router.get("/token/:userId", getPushToken);
router.patch("/location/:userId", changeLocation);
router.patch("/notifications/:userId", changeNotifications);

export default router;

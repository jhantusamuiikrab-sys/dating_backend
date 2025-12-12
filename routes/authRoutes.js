import express from "express";
import {
  register,
  updateuser,
  login,
  forgetPassword,
  resetPassword,
  getPassword,
  createOrResetPin,
  logout,

} from "../controllers/authController.js";
import { fetchUser } from "../controllers/userOparationController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import upload from "../middleware/multerUpload.js";

const router = express.Router();

router.post("/register", register);
router.put("/update", upload.single("image"), authMiddleware, updateuser);
// router.post("/login", authMiddleware, login);
router.post("/login", login);
router.post("/logout",authMiddleware, logout);
router.get("/password", authMiddleware, getPassword);
router.get("/FetchUser", authMiddleware, fetchUser);


// Forget Password
router.post("/forgetPassword", forgetPassword);
router.post("/resetPassword/:token", resetPassword);

// createOrResetPin
router.post("/generatePin",authMiddleware,createOrResetPin);
//module.exports = router;
export default router;

import express from "express";
import {
  register,
  updateuser,
  login,
  getProfile,
  forgetPassword,
} from "../controllers/authController.js";
import { fetchUser } from "../controllers/userOparationController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import upload from "../middleware/multerUpload.js";

const router = express.Router();

router.post("/register", register);
router.put("/update", upload.single("image"), authMiddleware, updateuser);
// router.post("/login", authMiddleware, login);
router.post("/login", login);
router.get("/profile", authMiddleware, getProfile);
router.get("/FetchUser", authMiddleware, fetchUser);


// Forget Password
router.post("/forgetPassword", forgetPassword);

//module.exports = router;
export default router;

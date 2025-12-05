import express from "express";
const router = express.Router();
import {
  sendOtpForPhoneUpdate,
  verifyPhOtp,
} from "../controllers/otpController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
router.post("/sendOtp", authMiddleware, sendOtpForPhoneUpdate);
router.post("/verifyotp", authMiddleware, verifyPhOtp);

export default router;
import express from "express";
const router = express.Router();
import {
  sendOtpForEmailUpdate,
  sendOtpForPhoneUpdate,
  verifyEmailOtp,
  verifyPhOtp,
} from "../controllers/otpController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
router.post("/sendOtp", authMiddleware, sendOtpForPhoneUpdate);
router.post("/verifyotp", authMiddleware, verifyPhOtp);


// Send otp for email update
router.put("/sendOtpForEmailUpdate", authMiddleware, sendOtpForEmailUpdate);
router.put("/verifyEmail", authMiddleware, verifyEmailOtp);


export default router;
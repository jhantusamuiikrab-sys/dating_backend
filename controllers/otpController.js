import { sendSMS } from "../utils/smsService.js";
import Userinfo from "../models/Userinfo.js";

export const sendOtpForPhoneUpdate = async (req, res) => {
  try {
    const { newPhone } = req.body;
    const userId = req.user.id;
    const data = await Userinfo.findById(userId).select(
      "username otpAttemptCount"
    );
    const username = data?.username;
    if (!newPhone) {
      return res.status(400).json({ message: "Phone number required" });
    }
    const currentOtpAttemptCount = data?.otpAttemptCount || 0;
    if (currentOtpAttemptCount >= 5) {
      return res.status(429).json({
        message: "Daily OTP limit exceeded. Try again tomorrow.",
      });
    }
    const newOtpAttemptCount = currentOtpAttemptCount + 1;
    const otp = Math.floor(10000 + Math.random() * 90000);
    await Userinfo.findByIdAndUpdate(userId, {
      phoneno: newPhone,
      MobileOTP: otp,
      MobileOtpExpire: new Date(Date.now() + 10 * 60 * 1000),
      otpAttemptCount: newOtpAttemptCount,
    });
    await sendSMS(newPhone, "REGISOTP", username, "", otp, "", "");
    return res.json({
      message: "OTP sent successfully",
      attemptsUsed: currentOtpAttemptCount,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyPhOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.user.id;
    const data = await Userinfo.findById(userId).select(
      "MobileOtpExpire otpAttemptCount MobileOTP"
    );
    if (!data) {
      return res.json({ message: "User not found" });
    }
    if (data.MobileOTP !== Number(otp)) {
      return res.json({ message: "Invalid Otp" });
    }

    if (data.MobileOtpExpire < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }
    await Userinfo.findByIdAndUpdate(
      userId,
      {
        isMobVerified: true,
        MobileOTP: null,
        MobileOtpExpire: null,
      },
      { new: true }
    );
    return res.json({
      success: true,
      message: "Phone number verified successfully",
    });
  } catch (error) {
    console.log(error);
  }
};

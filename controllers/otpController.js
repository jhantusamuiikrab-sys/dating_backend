import { sendSMS } from "../utils/smsService.js";
import Userinfo from "../models/Userinfo.js";
import { sendEmail } from "../utils/emailService.js";

export const sendOtpForPhoneUpdate = async (req, res) => {
  try {
    const { newPhone } = req.body;
    const userId = req.user.id;
    const data = await Userinfo.findById(userId).select(
      "username MobileotpAttemptCount phoneno isMobVerified"
    );

    if (!newPhone) {
      return res.status(400).json({ message: "Phone number required" });
    }

    const currentDBPhone = String(data.phoneno).trim();
    const incomingNewPhone = String(newPhone).trim();

    if (currentDBPhone === incomingNewPhone) {
      // If the phone number is the same AND it's already verified, no action is needed.
      if (data.isMobVerified === true) {
        return res.status(400).json({
          message: "The new phone number is the same as the currently verified phone. No update needed.",
        });
      }
    }

    const username = data?.username;

    // Use the dedicated Mobile OTP attempt counter
    const currentOtpAttemptCount = data?.MobileOTPAttempt || 0; 
    
    if (currentOtpAttemptCount >= 5) {
      return res.status(429).json({
        message: "Daily OTP limit exceeded. Try again tomorrow.",
      });
    }

    // 3. OTP Generation and Database Update
    const newOtpAttemptCount = currentOtpAttemptCount + 1;
    const otp = Math.floor(10000 + Math.random() * 90000); // 5-digit OTP
    
    await Userinfo.findByIdAndUpdate(userId, {
      MobileOTP: otp,
      MobileOTPValidity: new Date(Date.now() + 10 * 60 * 1000), // OTP expires in 10 minutes
      MobileOTPAttempt: newOtpAttemptCount, 
      phoneno: newPhone,
    });
    
    // 4. Send SMS (assuming sendSMS is a successful synchronous/asynchronous function)
    await sendSMS(newPhone, "REGISOTP", username, "", otp, "", "");
    
    return res.json({
      message: "OTP sent successfully",
      attemptsUsed: newOtpAttemptCount,
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
        MobileOTPValidity: null,
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

export const sendOtpForEmailUpdate = async (req, res) => {
  try {
    const { newEmail } = req.body;
    const userId = req.user.id;

    const data = await Userinfo.findById(userId).select(
      "username email EmailotpAttemptCount isEmailVerified"
    );

    if (!newEmail) {
      return res.status(400).json({ message: "New email address required" });
    }

    const currentDBEmail = data?.email;
    const incomingNewEmail = newEmail;

    // If same email requested
    if (currentDBEmail === incomingNewEmail) {
      if (data.isEmailVerified === true) {
        return res.status(400).json({
          message:
            "The new email is the same as the currently verified email. No update needed.",
        });
      }
    }
    // OTP attempt limit check
    const currentOtpAttemptCount = data?.EmailOTPAttempt || 0;
    if (currentOtpAttemptCount >= 5) {
      return res.status(429).json({
        message: "Daily OTP limit exceeded. Try again tomorrow.",
      });
    }
    const username = data?.username;
    // Generate OTP
    const otp = Math.floor(10000 + Math.random() * 90000);

    // Update user
    await Userinfo.findByIdAndUpdate(userId, {
      EmailOTP: otp,
      EmailOTPValidity: new Date(Date.now() + 10 * 60 * 1000),
      EmailOTPAttempt: currentOtpAttemptCount + 1,
      email: newEmail,
      isEmailVerified: false,
    });
    // Send OTP email
    const { success, error } = await sendEmail({
      to: newEmail,
      RequestType: "EMAIL_OTP",
      username,
      otp,
    });

    if (!success) {
      console.error("Failed to send OTP email:", error);
      return res.status(500).json({
        error: "Failed to send OTP email. Internal server error.",
      });
    }

    return res.json({
      message: "OTP sent successfully to the new email address.",
      attemptsUsed: currentOtpAttemptCount + 1,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyEmailOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.user.id;
    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }
    const data = await Userinfo.findById(userId).select(
      "EmailOtpExpire EmailotpAttemptCount EmailOTP"
    );
    if (!data) {
      return res.status(404).json({ message: "User not found" });
    }
    if (data.EmailOTP !== Number(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (data.EmailOTPValidity < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }
    await Userinfo.findByIdAndUpdate(
      userId,
      {
        isEmailVerified: true,
        EmailOTP: null,
        EmailOTPValidity: null,
      },
      { new: true }
    );
    return res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

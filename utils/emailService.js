import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const sendEmail = async ({
  to,
  RequestType,
  username,
  otp,
  resetLink,
}) => {
  try {
    let subject = "";
    let html = "";
    console.log(to, RequestType, username, "", resetLink);
    // 🔥 TEMPLATE SELECTION (like SMS switch)
    switch (RequestType.trim().toUpperCase()) {
      case "EMAIL_OTP": {
        subject = "Your Email Verification OTP";
        html = `<p>Dear ${username},</p>
                <p>Your 5-digit verification code is: <b>${otp}</b></p>
                <p>Please enter this code to verify your email.</p>
                <p>- Team</p>`;
        break;
      }

      case "RESET_PASSWORD_LINK": {
        subject = "Reset Your Password";
        html = `<p>Hello ${username},</p>
                <p>You requested to reset your password.</p>
                <p>Click the link below to set a new password:</p>

                <a href="${resetLink}" 
                  style="padding:10px 18px; background:#4CAF50; color:white; 
                          text-decoration:none; border-radius:5px;">
                  Reset Password
                </a>

                <p>This link will expire in 10 minutes.</p>
                <p>If you did not request this, please ignore this email.</p>`;
        break;
      }

      default:
        return { success: false, error: "Invalid RequestType" };
    }

    // ✨ Create Email Transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // ✨ Mail details
    const mailOptions = {
      from: `"Support Team" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    // ✨ Send email
    const info = await transporter.sendMail(mailOptions);

    return { success: true, response: info.response };
  } catch (error) {
    return { success: false, error: error.message || error };
  }
};

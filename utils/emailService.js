import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const sendEmail = async ({
  to,
  RequestType,
  username,
  otp,
  password
}) => {
  try {
    let subject = "";
    let html = "";

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

      case "FORGOT_PASSWORD": {
        subject = "Password Recovery";
        html = `<p>Hello ${username},</p>
                <p>Your temporary password is: <b>${password}</b></p>
                <p>Please login and change your password immediately.</p>`;
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

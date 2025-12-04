import Userinfo from "../models/Userinfo.js";
import { sendSMS } from "../utils/smsService.js";
export const fetchUser = async (req, res) => {
  try {
    const Userdt = await Userinfo.findById(req.user.id).select("-Password");
    if (!Userdt) {
      return res.status(401).json({ msg: "User details not found" });
    }
    res.status(200).json({ userlog: Userdt });
  } catch (err) {
    console.error("Error fetching user details:", err.message);
    res.status(500).json({ error: "Server error while fetching user details" });
  }
};

export const sendOtpForPhoneUpdate  = async (req, res) => {
  try {
    const { newPhone } = req.body;
    const userId = req.user.id;
    const data = await Userinfo.findById(userId).select('username');
const username = data?.username;
    if (!newPhone) {
      return res.status(400).json({ message: "Phone number required" });
    }
    const otp = Math.floor(10000 + Math.random() * 90000);

    await Userinfo.findByIdAndUpdate(userId, {
      phoneno: newPhone,
      MobileOTP: otp,
      phoneOtpExpire: new Date(Date.now() + 5 * 60 * 1000),
    });
    await sendSMS(newPhone, "REGISOTP", username, "", otp,"", ""); 
    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.log(error);
  }
};

export const verifyPh = async (req, res)=>{
  try {
    
  } catch (error) {
    console.log(error)
  }
}
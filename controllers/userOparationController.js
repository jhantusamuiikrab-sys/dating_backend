import Userinfo from "../models/Userinfo.js";


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
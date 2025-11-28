import jwt from "jsonwebtoken";

//const jwt = require("jsonwebtoken");
export const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ msg: "No token, authorization denied" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    //console.log(req.user);    
    next();   
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};

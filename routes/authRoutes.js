import express from "express";
import {
  register,
  updateuser,
  login,
  getProfile,
} from "../controllers/authController.js";
import { fetchUser } from "../controllers/userOparationController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  singleUploadMiddleware,
} from "../helper/uploadImageController.js";


const router = express.Router();

router.post("/register", register);
router.put(
  "/update",
  authMiddleware,
  singleUploadMiddleware,
  
  updateuser
);
// router.post("/login", authMiddleware, login);
router.post("/login", login);
router.get("/profile", authMiddleware, getProfile);
router.get("/FetchUser", authMiddleware, fetchUser);

//module.exports = router;
export default router;

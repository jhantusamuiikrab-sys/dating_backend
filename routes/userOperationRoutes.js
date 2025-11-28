import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { createAlbum, deleteBatch, deleteImage, getAlbum } from "../controllers/userOparationController.js";
import upload from "../middleware/multerUpload.js";

const router = express.Router();

router.post("/createAlbum",upload.array("images"),authMiddleware,createAlbum);
router.get("/getAlbum",authMiddleware,getAlbum);
router.delete("/deleteAlbumImage",authMiddleware,deleteImage);
router.delete("/deleteAlbum",authMiddleware,deleteBatch);









export default router;

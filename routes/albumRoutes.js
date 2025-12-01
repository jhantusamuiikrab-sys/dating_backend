import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { createAlbum, deleteBatch, deleteImage, getAlbum, updateAlbumName, updateImage } from "../controllers/albumController.js";
import upload from "../middleware/multerUpload.js";

const router = express.Router();

router.post("/createAlbum",upload.array("images"),authMiddleware,createAlbum);
router.get("/getAlbum",authMiddleware,getAlbum);
router.delete("/deleteAlbumImage",authMiddleware,deleteImage);
router.delete("/deleteAlbum",authMiddleware,deleteBatch);
router.put("/updateAlbumImage",upload.single("image"),authMiddleware,updateImage);
router.put("/updateAlbumName",upload.none(),authMiddleware,updateAlbumName);


export default router;

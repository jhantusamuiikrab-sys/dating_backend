import { convertToWebp } from "../helper/imageConverter.js";
import Userinfo from "../models/Userinfo.js";
import fs from "fs";

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

export const createAlbum = async (req, res) => {
  try {
    const uploadedFiles = req.files;
    const userId = req.user.id;
    const { batchTitle } = req.body;

    if (!uploadedFiles || uploadedFiles.length === 0 || !batchTitle) {
      return res.status(400).json({ message: "Missing files or batchTitle." });
    }

    const user = await Userinfo.findById(userId);
    const username = user?.username;

    // Folder path
    const folderPath = `images/gallery/${username}/${batchTitle}`;
    fs.mkdirSync(folderPath, { recursive: true });

    const newImagePaths = [];

    // Convert and save each file as webp using helper
    for (const file of uploadedFiles) {
      const savePath = await convertToWebp(file.buffer, folderPath);
      const correctSavePath = savePath.replace(/\\/g, "/");
      newImagePaths.push(correctSavePath);
    }

    // Update existing batch
    const updatedDocument = await Userinfo.findOneAndUpdate(
      {
        _id: userId,
        "GalleryImage.title": batchTitle,
      },
      {
        $push: {
          "GalleryImage.$.paths": { $each: newImagePaths },
        },
      },
      { new: true }
    );

    // If no batch exists → create a new one
    if (!updatedDocument) {
      const newGalleryBatch = {
        title: batchTitle,
        paths: newImagePaths,
        uploadedAt: new Date(),
      };

      await Userinfo.findByIdAndUpdate(
        userId,
        {
          $push: { GalleryImage: newGalleryBatch },
        },
        { new: true }
      );

      return res.status(201).json({
        message: `Folder created & NEW batch added! (${uploadedFiles.length} images)`,
        newBatch: newGalleryBatch,
      });
    }

    // Existing batch updated
    return res.status(200).json({
      message: `${uploadedFiles.length} images added to EXISTING '${batchTitle}' batch!`,
      gallery: updatedDocument.GalleryImage,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getAlbum = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await Userinfo.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      gallery: user.GalleryImage,
    });
  } catch (error) {
    console.error("Fetch gallery error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { batchTitle, imagePath } = req.body;

    if (!batchTitle || !imagePath) {
      return res.status(400).json({
        message: "Missing batchTitle or imagePath",
      });
    }
    // CHECK: Batch & Image Exists in DB
    const user = await Userinfo.findOne({
      _id: userId,
      "GalleryImage.title": batchTitle,
      "GalleryImage.paths": imagePath,
    });

    if (!user) {
      return res.status(404).json({
        message: "Image path not found in database for this batch",
      });
    }
    // CHECK: File Exists on Disk
    let fileDeleted = false;
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      fileDeleted = true;
    }
    // REMOVE FROM DATABASE
    const updatedUser = await Userinfo.findOneAndUpdate(
      {
        _id: userId,
        "GalleryImage.title": batchTitle,
      },
      {
        $pull: { "GalleryImage.$.paths": imagePath },
      },
      { new: true }
    );

    return res.status(200).json({
      message: fileDeleted
        ? "Image deleted successfully"
        : "Image removed from database, but file was not found on disk",
      gallery: updatedUser.GalleryImage,
    });

  } catch (error) {
    console.error("Delete image error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteBatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { batchTitle } = req.body;

    if (!batchTitle) {
      return res.status(400).json({ message: "Missing batchTitle" });
    }

    const user = await Userinfo.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const username = user.username;

    // Check if batch exists in MongoDB
    const batchExists = user.GalleryImage.some(
      (batch) => batch.title === batchTitle
    );

    if (!batchExists) {
      return res.status(404).json({
        message: `Batch '${batchTitle}' not found in database`,
      });
    }

    // Folder path
    const folderPath = `images/gallery/${username}/${batchTitle}`;

    // Check if folder exists and delete
    let folderDeleted = false;
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
      folderDeleted = true;
    }

    // Remove batch from DB
    const updatedUser = await Userinfo.findByIdAndUpdate(
      userId,
      {
        $pull: { GalleryImage: { title: batchTitle } },
      },
      { new: true }
    );

    return res.status(200).json({
      message: folderDeleted
        ? `Batch '${batchTitle}' deleted from disk and database`
        : `Batch '${batchTitle}' deleted from database but folder not found on disk`,
      gallery: updatedUser.GalleryImage,
    });

  } catch (error) {
    console.error("Delete batch error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


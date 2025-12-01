import { convertToWebp } from "../helper/imageConverter.js";
import Userinfo from "../models/Userinfo.js";
import fs from "fs";
import path from 'path';
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

export const updateImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { batchTitle, oldImagePath } = req.body;
    const newFile = req.file; // Only 1 file uploaded

    if (!batchTitle || !oldImagePath || !newFile) {
      return res.status(400).json({
        message: "Missing batchTitle, oldImagePath or new image file",
      });
    }

    // Check batch & old image exists
    const user = await Userinfo.findOne({
      _id: userId,
      "GalleryImage.title": batchTitle,
      "GalleryImage.paths": oldImagePath,
    });

    if (!user) {
      return res.status(404).json({
        message: "Batch or image not found in database",
      });
    }

    const username = user.username;

    // Target folder
    const folderPath = `images/gallery/${username}/${batchTitle}`;

    // Ensure folder exists
    fs.mkdirSync(folderPath, { recursive: true });

    // Convert new image to webp and save in same batch folder
    const newSavePath = await convertToWebp(newFile.buffer, folderPath);
    const correctedPath = newSavePath.replace(/\\/g, "/");

    // Delete old file from disk
    if (fs.existsSync(oldImagePath)) {
      fs.unlinkSync(oldImagePath);
    }

    // Replace old path with new path in DB
    const updatedUser = await Userinfo.findOneAndUpdate(
      {
        _id: userId,
        "GalleryImage.title": batchTitle,
      },
      {
        $set: { "GalleryImage.$.paths.$[elem]": correctedPath },
      },
      {
        new: true,
        arrayFilters: [{ elem: oldImagePath }],
      }
    );

    return res.status(200).json({
      message: "Image updated successfully",
      newImagePath: correctedPath,
      gallery: updatedUser.GalleryImage,
    });
  } catch (error) {
    console.error("Update image error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateAlbumName = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldBatchTitle, newBatchTitle } = req.body;
    if (!oldBatchTitle || !newBatchTitle) {
      return res.status(400).json({
        message: "Both oldBatchTitle and newBatchTitle are required",
      });
    }

    const user = await Userinfo.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const username = user.username;

    // Check if old batch exists
    const oldBatch = user.GalleryImage.find((b) => b.title === oldBatchTitle);

    if (!oldBatch) {
      return res.status(404).json({
        message: `Batch '${oldBatchTitle}' not found`,
      });
    }

    // Prevent duplicate batch names
    const batchExists = user.GalleryImage.some(
      (b) => b.title === newBatchTitle
    );

    if (batchExists) {
      return res.status(400).json({
        message: `Batch '${newBatchTitle}' already exists`,
      });
    }

    // Paths on disk
    const oldFolder = path.join("images/gallery", username, oldBatchTitle);
    const newFolder = path.join("images/gallery", username, newBatchTitle);

    // Rename folder if exists
    if (fs.existsSync(oldFolder)) {
      fs.renameSync(oldFolder, newFolder);
    }

    // Replace paths inside MongoDB
    const updatedPaths = oldBatch.paths.map((p) =>
      p.replace(`/${oldBatchTitle}/`, `/${newBatchTitle}/`)
    );

    // Update DB
    const updatedUser = await Userinfo.findOneAndUpdate(
      {
        _id: userId,
        "GalleryImage.title": oldBatchTitle,
      },
      {
        $set: {
          "GalleryImage.$.title": newBatchTitle,
          "GalleryImage.$.paths": updatedPaths,
        },
      },
      { new: true }
    );

    return res.status(200).json({
      message: `Batch renamed from '${oldBatchTitle}' to '${newBatchTitle}'`,
      gallery: updatedUser.GalleryImage,
    });
  } catch (error) {
    console.error("Update batch title error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

import { convertToWebp } from "../utils/imageConverter.js";
import Userinfo from "../models/Userinfo.js";
import fs from "fs";
import path from 'path';


export const createAlbum = async (req, res) => {
  try {
    const uploadedFiles = req.files;
    const userId = req.user.id;
    const { albumTitle } = req.body;

    if (!uploadedFiles || uploadedFiles.length === 0 || !albumTitle) {
      return res.status(400).json({ message: "Missing files or albumTitle." });
    }

    const user = await Userinfo.findById(userId);
    const username = user?.username;

    // Folder path
    const folderPath = `images/gallery/${username}/${albumTitle}`;
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
        "GalleryImage.title": albumTitle,
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
        title: albumTitle,
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
      message: `${uploadedFiles.length} images added to EXISTING '${albumTitle}' batch!`,
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
    const { albumTitle, imagePath } = req.body;

    if (!albumTitle || !imagePath) {
      return res.status(400).json({
        message: "Missing albumTitle or imagePath",
      });
    }
    // CHECK: Batch & Image Exists in DB
    const user = await Userinfo.findOne({
      _id: userId,
      "GalleryImage.title": albumTitle,
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
        "GalleryImage.title": albumTitle,
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
    const { albumTitle } = req.body;

    if (!albumTitle) {
      return res.status(400).json({ message: "Missing albumTitle" });
    }

    const user = await Userinfo.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const username = user.username;

    // Check if batch exists in MongoDB
    const batchExists = user.GalleryImage.some(
      (batch) => batch.title === albumTitle
    );

    if (!batchExists) {
      return res.status(404).json({
        message: `Batch '${albumTitle}' not found in database`,
      });
    }

    // Folder path
    const folderPath = `images/gallery/${username}/${albumTitle}`;

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
        $pull: { GalleryImage: { title: albumTitle } },
      },
      { new: true }
    );

    return res.status(200).json({
      message: folderDeleted
        ? `Batch '${albumTitle}' deleted from disk and database`
        : `Batch '${albumTitle}' deleted from database but folder not found on disk`,
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
    const { albumTitle, oldImagePath } = req.body;
    const newFile = req.file; // Only 1 file uploaded

    if (!albumTitle || !oldImagePath || !newFile) {
      return res.status(400).json({
        message: "Missing albumTitle, oldImagePath or new image file",
      });
    }

    // Check batch & old image exists
    const user = await Userinfo.findOne({
      _id: userId,
      "GalleryImage.title": albumTitle,
      "GalleryImage.paths": oldImagePath,
    });

    if (!user) {
      return res.status(404).json({
        message: "Batch or image not found in database",
      });
    }

    const username = user.username;

    // Target folder
    const folderPath = `images/gallery/${username}/${albumTitle}`;

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
        "GalleryImage.title": albumTitle,
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
    const { oldalbumTitle, newalbumTitle } = req.body;
    if (!oldalbumTitle || !newalbumTitle) {
      return res.status(400).json({
        message: "Both oldalbumTitle and newalbumTitle are required",
      });
    }

    const user = await Userinfo.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const username = user.username;

    // Check if old batch exists
    const oldBatch = user.GalleryImage.find((b) => b.title === oldalbumTitle);

    if (!oldBatch) {
      return res.status(404).json({
        message: `Batch '${oldalbumTitle}' not found`,
      });
    }

    // Prevent duplicate batch names
    const batchExists = user.GalleryImage.some(
      (b) => b.title === newalbumTitle
    );

    if (batchExists) {
      return res.status(400).json({
        message: `Batch '${newalbumTitle}' already exists`,
      });
    }

    // Paths on disk
    const oldFolder = path.join("images/gallery", username, oldalbumTitle);
    const newFolder = path.join("images/gallery", username, newalbumTitle);

    // Rename folder if exists
    if (fs.existsSync(oldFolder)) {
      fs.renameSync(oldFolder, newFolder);
    }

    // Replace paths inside MongoDB
    const updatedPaths = oldBatch.paths.map((p) =>
      p.replace(`/${oldalbumTitle}/`, `/${newalbumTitle}/`)
    );

    // Update DB
    const updatedUser = await Userinfo.findOneAndUpdate(
      {
        _id: userId,
        "GalleryImage.title": oldalbumTitle,
      },
      {
        $set: {
          "GalleryImage.$.title": newalbumTitle,
          "GalleryImage.$.paths": updatedPaths,
        },
      },
      { new: true }
    );

    return res.status(200).json({
      message: `Batch renamed from '${oldalbumTitle}' to '${newalbumTitle}'`,
      gallery: updatedUser.GalleryImage,
    });
  } catch (error) {
    console.error("Update batch title error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

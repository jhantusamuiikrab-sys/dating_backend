import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileSize: 2 * 1024 * 1024, // MAX 2 MB
  limits: { files: 5 }, // max 5 images
});

export default upload;
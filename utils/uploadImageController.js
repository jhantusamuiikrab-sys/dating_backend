import multer from "multer";
import path from "path";



const singleStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images/profileImage/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + Date.now() + ext);
  },
});


const singleUpload = multer({
  storage: singleStorage,
  limits: { fileSize: 1000000 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG and PNG files are allowed!"), false);
    }
  },
});

export const singleUploadMiddleware = singleUpload.single("image");



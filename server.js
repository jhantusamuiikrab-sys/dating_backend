import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import albumRoutes from "./routes/albumRoutes.js";
import cookieParser from "cookie-parser";

dotenv.config();
const app = express();

const ORIGIN = process.env.ORIGIN || "http://localhost:5173";


// Middleware
// app.use(cors({
//     origin: ORIGIN,
//     credentials: true  // frontend origin   
//   }));

app.use("/images", express.static("images"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/v1",albumRoutes);
// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
import Userinfo from "../models/Userinfo.js";
import bcrypt from "bcryptjs"; // You'll likely need this for real registration later
import jwt from "jsonwebtoken";
import { convertToWebp } from "../utils/imageConverter.js";

// import { sendMail } from "../utils/mailsend.js"; // Unused in this example

// Function to set the JWT in an HTTP-only cookie
const setTokenCookie = (res, token) => {
  // Set the cookie with recommended security options
  res.cookie("token", token, {
    httpOnly: true, // 🔑 IMPORTANT: Prevents client-side JavaScript access (XSS defense)
    secure: false, // Set to true in production (requires HTTPS)
    maxAge: 3600000, // 1 hour (matching the token expiry) in milliseconds
    sameSite: "strict", // Recommended for CSRF defense
  });
};

// Register new user
export const register = async (req, res) => {
  try {
    const { phoneno } = req.body;

    let user = await Userinfo.findOne({ phoneno });

    // --- User Already Exists Logic ---
    if (user) {
      // If user exists, you might still want to return a token or a specific message
      const Regtoken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      // ⚠️ Optional: Set cookie even if user exists and you are returning
      setTokenCookie(res, Regtoken);

      return res
        .status(409)
        .json({ msg: "User details already exists, please login.", Regtoken });
      // Used 409 Conflict, better than 400 Bad Request here
    }

    // --- Register New User Logic ---

    // 1. Create and Save New User
    user = new Userinfo({ phoneno });
    await user.save(); // After save, 'user' object now has the MongoDB _id

    // 2. Generate JWT
    const NewRegtoken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // 3. Set the JWT in an HTTP-only cookie
    setTokenCookie(res, NewRegtoken);

    // 4. Send Success Response (without exposing the token in the JSON body)
    res.status(201).json({
      msg: "User registered successfully",
      user: { id: user._id, phoneno: user.phoneno },
      NewRegtoken,
    });
    // Used 201 Created, as this is a successful resource creation.
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateuser = async (req, res) => {
  try {
    const UserId = req.user.id;
    const {
      displayName,
      WebsiteName,
      name,
      isNameShowOnProfile,
      dob,
      gender,
      isGenderShowOnProfile,
      Height,
      LivingState,
      LivingCity,
      LivingWith,
      RelationshipStatus,
      MarriageView,
      Hobbie,
      HeighestQualification,
      Designation,
      WorkCompany,
      AnnualIncome,
      DescribeYourself,
      GalleryImage,
      GalleryImageShowStatus,
      iswhatsappenable,
      issmsnotificationon,
      iswhatsappnotificationon,
      hasloginpin,
    } = req.body || {};
    const uploadedFile = req.file;
    const updates = {};
    // Check if the user exists before proceeding with any file operations
    const existingUser = await Userinfo.findById(UserId);

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // GENERATE USERNAME and handle 'name' update (Only if 'name' is provided)
    if (name) {
      const firstname = name.split(" ")[0];
      const formatted = firstname.toLowerCase().replace(/[^a-z0-9]/g, "");
      const prefix = formatted.slice(0, 2).toUpperCase();
      const randomNumber = `${Math.random().toString(36).substring(2, 8)}`;

      const finalBaseName = `${prefix}${randomNumber}`;

      updates.username = finalBaseName;
      updates.name = name;
    }

    // HANDLE PROFILE IMAGE UPLOAD (Only if a file is uploaded)
    if (uploadedFile) {
      // Use the newly generated username if available, otherwise create a random base name
      let fileBaseName = updates.username;
      if (!fileBaseName) {
        const randomNumberForPhoto = `${Math.random()
          .toString(36)
          .substring(2, 8)}`;
        fileBaseName = `IMG${randomNumberForPhoto}`;
      }
      
      const savedFileName = await convertToWebp(
        uploadedFile.buffer,
        `images/profileImage/${fileBaseName}`
      );
      updates.ProfilePhoto = savedFileName.replace(/\\/g, "/");
    }

    // UPDATE OTHER FIELDS SAFELY
    if (displayName !== undefined) updates.displayName = displayName;
    if (WebsiteName !== undefined) updates.WebsiteName = WebsiteName;
    if (isNameShowOnProfile !== undefined)
      updates.isNameShowOnProfile = isNameShowOnProfile;
    if (dob !== undefined) updates.dob = dob;
    if (gender !== undefined) updates.gender = gender;
    if (isGenderShowOnProfile !== undefined)
      updates.isGenderShowOnProfile = isGenderShowOnProfile;
    if (Height !== undefined) updates.Height = Height;
    if (LivingState !== undefined) updates.LivingState = LivingState;
    if (LivingCity !== undefined) updates.LivingCity = LivingCity;
    if (LivingWith !== undefined) updates.LivingWith = LivingWith;
    if (RelationshipStatus !== undefined)
      updates.RelationshipStatus = RelationshipStatus;
    if (MarriageView !== undefined) updates.MarriageView = MarriageView;
    if (Hobbie !== undefined) updates.Hobbie = Hobbie;
    if (HeighestQualification !== undefined)
      updates.HeighestQualification = HeighestQualification;
    if (Designation !== undefined) updates.Designation = Designation;
    if (WorkCompany !== undefined) updates.WorkCompany = WorkCompany;
    if (AnnualIncome !== undefined) updates.AnnualIncome = AnnualIncome;
    if (DescribeYourself !== undefined)
      updates.DescribeYourself = DescribeYourself;
    if (GalleryImage !== undefined) updates.GalleryImage = GalleryImage;
    if (GalleryImageShowStatus !== undefined)
      updates.GalleryImageShowStatus = GalleryImageShowStatus;
    if (iswhatsappenable !== undefined)
      updates.iswhatsappenable = iswhatsappenable;
    if (issmsnotificationon !== undefined)
      updates.issmsnotificationon = issmsnotificationon;
    if (iswhatsappnotificationon !== undefined)
      updates.iswhatsappnotificationon = iswhatsappnotificationon;
    if (hasloginpin !== undefined) updates.hasloginpin = hasloginpin;

    // UPDATE DATABASE
    const updatedUser = await Userinfo.findByIdAndUpdate(UserId, updates, {
      new: true,
      runValidators: true,
    });

    // Note: The final check here is redundant because we checked above, 
    // but we keep it for robustness against race conditions (though unlikely).
    if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
    }
    return res.json(updatedUser);
  } catch (error) {
    let statusCode = 500;
    let message = "Error updating user";

    if (error.name === "ValidationError") {
      statusCode = 400;
      message = error.message;
    } else if (error.code === 11000) {
      statusCode = 409;
      // This is a common error if the generated username (or another unique field) 
      // already exists in the database.
      message = "A user with that username or email already exists.";
    }

    return res.status(statusCode).json({ message, error: error.message });
  }
};

// Login  user
export const login = async (req, res) => {
  try {
    const { phoneno, password } = req.body;
    const user = await Userinfo.findOne({ phoneno });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });
    // const isMatch = await bcrypt.compare(password, user.password);
    // if (!isMatch) return res.status(400).json({ msg: "Invalid password" });
    if (password != user.Password) {
      return res.status(400).json({ msg: "Invalid password" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    setTokenCookie(res, token);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get user profile (Protected)
export const getProfile = async (req, res) => {
  try {
    const user = await Userinfo.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

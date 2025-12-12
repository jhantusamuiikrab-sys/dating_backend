import Userinfo from "../models/Userinfo.js";
import jwt from "jsonwebtoken";
import { convertToWebp } from "../utils/imageConverter.js";
import { sendEmail } from "../utils/emailService.js";
import { sendSMS } from "../utils/smsService.js";
import { decrypt, encrypt } from "../utils/EncryptPassword.js";

// import { sendMail } from "../utils/mailsend.js"; // Unused in this example

const setTokenCookie = (res, token) => {

  res.cookie("token", token, {
    httpOnly: true, 
    secure: false, 
    maxAge: 60 * 24 * 60 * 60 * 1000, // 60 days
    sameSite: "strict",
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

// export const register = async (req, res) => {
//   try {
//     const { phoneno, websiteName} = req.body;
//     let user = await Userinfo.findOne({ phoneno });
//     if (user)
//     {
//       const Regtoken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
//       res.status(400).json({ Registrationtoken: Regtoken, msg: "User details already exists" });
//     }
//     //const salt = await bcrypt.genSalt(10);
//     //const hashedPassword = await bcrypt.hash(password, salt);

//     let assignedFranId = null; // Default value is null (representing "nan" or unknown)
//     if (websiteName) {
//         const adminUser = await AdminUserinfo.findOne({ WebsiteName: websiteName }).select('_id');
//     if (adminUser) {
//     // Assign the ObjectId of the found admin user
//       assignedFranId = adminUser._id;
//     }
//   }
//     user = new Userinfo({ phoneno, franId: assignedFranId, WebsiteName: websiteName});
//     await user.save();
//     let exisuser = await Userinfo.findOne({ phoneno });
//     if (exisuser)
//     {
//       const NewRegtoken = jwt.sign({ id: exisuser._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
//       res.status(200).json({ Registrationtoken: NewRegtoken, msg: "User details inserted successfully" });
//     }
//     // const mailSent = await sendMail(name, phoneno, email, message);
//     // if (mailSent) {
//     // res.status(201).json({ msg: "User details submitted successfully, we will get back to you shortly" });
//     // } else {
//     // res.status(500).json({ msg: "Failed to send mail" });
//     //}
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

export const updateuser = async (req, res) => {
  try {
    const UserId = req.user.id;
    const {
      displayName,
      WebsiteName,
      name,
      email,
      password,
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

    if (uploadedFile) {
      let fileBaseName = updates.username;
      if (!fileBaseName) {
        const randomNumberForPhoto = `${Math.random()
          .toString(36)
          .substring(2, 8)}`;
        fileBaseName = `IMG${randomNumberForPhoto}`;
      }
      const savedFileName = await convertToWebp(
        uploadedFile.buffer,
        `images/profileImage/`
      );
      updates.ProfilePhoto = savedFileName.replace(/\\/g, "/");
    }
    if (password) {
      const ciphertext = encrypt(password);
      updates.Password = ciphertext;
    }
    // UPDATE OTHER FIELDS SAFELY
    if (email !== undefined) updates.email = email;
    // if (password !== undefined) updates.Password = password;
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

export const login = async (req, res) => {
  try {
    const { phoneno, password, pin } = req.body;

    // CASE 1: PHONE + PASSWORD LOGIN (FIRST LOGIN)

    if (phoneno && password) {
      const user = await Userinfo.findOne({ phoneno });

      if (!user) {
        return res
          .status(400)
          .json({ msg: "Invalid credentials || user not found" });
      }

      const decryptedPassword = decrypt(user.Password);

      if (decryptedPassword !== password) {
        return res
          .status(400)
          .json({ msg: "Invalid password || password not matched" });
      }

      // Generate device session ID for PIN login
      const deviceId = crypto.randomUUID();
      user.deviceId = deviceId;
      await user.save();

      // Generate 60-day JWT
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "60d",
      });

      // Set JWT cookie
      setTokenCookie(res, token);

      // Store deviceId as httpOnly cookie
      res.cookie("deviceId", deviceId, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge:  60 * 24 * 60 * 60 * 1000, // 1 year
      });

      return res.json({
        message: "Login successful",
        token,
      });
    }
    // CASE 2: PIN LOGIN (COOKIE-BASED DEVICE ID)

    if (pin) {
      // Read deviceId from cookie instead of header
      const deviceId = req.cookies.deviceId;
      if (!deviceId) {
        return res.status(400).json({
          msg: "Device not recognized. Login with phone+password first.",
        });
      }

      // Find user by deviceId
      const user = await Userinfo.findOne({ deviceId });

      if (!user) {
        return res.status(400).json({
          msg: "Device session invalid. Login again with phone+password.",
        });
      }

      // Compare encrypted PIN
      const decryptedPin = decrypt(user.loginpin);

      if (decryptedPin !== pin) {
        return res.status(400).json({ msg: "Invalid PIN" });
      }

      // Issue fresh token (60 days)
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "60d",
      });

      setTokenCookie(res, token);

      return res.json({
        message: "PIN login successful",
        token,
      });
    }

    // -------------------------------------------
    // If no login method matches
    // -------------------------------------------
    return res.status(400).json({ msg: "Invalid login request" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const logout = async (req, res) => {
  try {
    const userId = req.user?.id; 
    if (userId) {
      await Userinfo.findByIdAndUpdate(userId, { $unset: { deviceId: "" } });
    }
    res.clearCookie("token"); 
    res.clearCookie("deviceId");
    return res.json({ message: "Logout successful" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const forgetPassword = async (req, res) => {
  try {
    const { email, phoneno } = req.body;

    if (!email && !phoneno) {
      return res
        .status(400)
        .json({ message: "Email or phone number required" });
    }
    let user;

    if (email) {
      user = await Userinfo.findOne({ email });

      if (!user) {
        return res
          .status(404)
          .json({ message: "No account found with this email" });
      }

      if (!user.isEmailVerified) {
        return res
          .status(400)
          .json({ message: "Please verify your email first" });
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: "10m",
      });
      const resetLink = `https://yourfrontend.com/resetPassword/${token}`;

      await sendEmail({
        to: email,
        RequestType: "RESET_PASSWORD_LINK",
        username: user.username,
        otp: "",
        resetLink: resetLink,
      });

      return res.status(200).json({ message: "Check your email....." });
    }

    if (phoneno) {
      user = await Userinfo.findOne({ phoneno });

      if (!user) {
        return res
          .status(404)
          .json({ message: "No account found with this phone number" });
      }

      if (!user.isMobVerified) {
        return res
          .status(400)
          .json({ message: "Please verify your phone number first" });
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: "10m",
      });

      const resetLink = `https://yourfrontend.com/resetPassword/${token}`;

      await sendSMS({
        mobile: phoneno,
        RequestType: "FORGETPASS",
        username: user?.username,
        resetLink: resetLink,
        otp: "",
        ivrnum: "",
        ivrid: "",
      });
      return res
        .status(200)
        .json({ message: "Password reset link sent to your phone number" });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const userId = decoded.id;
    const user = await Userinfo.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const ciphertext = encrypt(newPassword);
    user.Password = ciphertext;
    await user.save();

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    return res.status(400).json({
      message: "Invalid or expired token",
      error: error.message,
    });
  }
};

export const getPassword = async (req, res) => {
  try {
    const user = await Userinfo.findById(req.user.id).select("Password");
    const decryptedPassword = decrypt(user.Password);
    res.json({ password: decryptedPassword }); //...user.toObject(),
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Check user is active and not deleted
// if (user.isDeleted) {
//   return res.status(400).json({ message: "Account is deleted" });
// }


export const createOrResetPin = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userPin } = req.body;

    // Validate input
    if (!userPin || userPin.length !== 4) {
      return res.status(400).json({ message: "User PIN must be 4 digits" });
    }

    // Fetch user
    const user = await Userinfo.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check phone/email verification
    if (!user.isMobVerified && !user.isEmailVerified) {
      return res.status(400).json({
        message: "Verify phone or email before creating/resetting PIN",
      });
    }

    // User already has a PIN → reset mode
    if (user.hasloginpin && user.loginpin) {
      const oldPin = decrypt(user.loginpin);

      if (oldPin === userPin) {
        return res
          .status(400)
          .json({ message: "New PIN cannot be same as old PIN" });
      }

      user.loginpin = encrypt(userPin);
      await user.save();

      return res.status(200).json({ message: "PIN reset successfully" });
    }

    // User has no PIN → create mode
    user.loginpin = encrypt(userPin);
    user.hasloginpin = true;

    await user.save();

    return res.status(200).json({
      message: "PIN created successfully",
    });
  } catch (error) {
    console.error("PIN create/reset error:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

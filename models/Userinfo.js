import mongoose, { Schema } from "mongoose";
const PROFILETYPE_ENUM = ["Admin", "Normal"];
const UserinfoSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    displayName: { type: String }, //old code
    franId: { type: Schema.Types.ObjectId, ref: "AdminUserinfo" },
    WebsiteName: {
      type: String,
      required: [true, "WebsiteName is required"],
      default: " ",
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot exceed 50 characters"],
      default: "User",
    },
    isNameShowOnProfile: { type: Boolean, default: false },
    dob: { type: Date, required: [true, "DOB is required"], default: Date.now },
    age: { type: Number, min: 18 },
    gender: {
      type: String,
      enum: ["Man", "Woman", "Nonbinary", "None"], // restrict to allowed values
      required: [true, "Gender is required"],
      default: "None",
    },
    isGenderShowOnProfile: { type: Boolean, default: false },
    phoneno: {
      type: String,
      required: [true, "Phone Number is required"],
      trim: true,
      unique: true,
      match: [
        /^[6-9]\d{9}$/,
        "Please enter a valid 10-digit phone Number starting with 6, 7, 8, or 9",
      ],
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },
    Password: { type: String, trim: true },
    loginpin: { type: Number },
    Height: {
      type: String,
      required: [true, "Height is required"],
      default: " ",
    },
    LivingState: {
      type: String,
      required: [true, "State is required"],
      default: " ",
    },
    LivingCity: {
      type: String,
      required: [true, "City is required"],
      default: " ",
    },
    LivingWith: {
      type: String,
      required: [true, "Living With is required"],
      default: " ",
    },
    RelationshipStatus: {
      type: String,
      required: [true, "Relationship Status is required"],
      default: " ",
    },
    MarriageView: {
      type: String,
      required: [true, "Marriage View is required"],
      default: " ",
    },
    Hobbie: {
      type: String,
      required: [true, "Hobbie is required"],
      default: " ",
    },
    HeighestQualification: {
      type: String,
      required: [true, "Heighest Qualification is required"],
      default: " ",
    },
    Designation: {
      type: String,
      required: [true, "Designation is required"],
      default: " ",
    },
    WorkCompany: {
      type: String,
      required: [true, "Working Company is required"],
      default: " ",
    },
    AnnualIncome: {
      type: Number,
      required: [true, "Annual Income is required"],
      default: 0,
    },
    DescribeYourself: {
      type: String,
      required: [true, "Describe Yourself is required"],
      default: " ",
    },
    ProfilePhoto: {
      type: String,
      required: [true, "Profile Photo is required"],
      default: " ",
    },

    ProfileType: {
      type: String,
      enum: ["Basic", "Standard", "Premium", "Elite", "Ultimate"],
      default: "Basic",
      required: true,
    },

    ProfilePhotoIsApproved: { type: Boolean, default: false },
    isProfilePhotoShowStatus: { type: Number, default: 0 },
    GalleryImage: [
      // This array holds the batches (e.g., "Holiday 2025", "Work Project")
      {
        title: {
          type: String, // The title for the entire batch
          required: true,
          trim: true,
        },
        paths: {
          // This sub-array holds the paths for all images in this batch
          type: [String],
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    GalleryImageShowStatus: {
      type: Number,
      required: [true, "Gallery Image Show Status is required"],
      default: 0,
    },
    ProfileStatus: { type: Number, default: 0 },
    ProfileCategory: {
      type: String,
      enum: PROFILETYPE_ENUM,
      default: "Normal",
      required: true,
    },
    Registeron: { type: Date, default: Date.now },
    isCardPurchased: { type: Boolean, default: false },
    CardPlanType: { type: Number },
    CardLastRechargeon: { type: Date, default: Date.now },
    CardValidityInDays: { type: Number },
    CardExpireOn: { type: Date, default: Date.now },
    Lastloginon: { type: Date, default: Date.now },
    MobileOTP: { type: Number },
    isMobVerified: { type: Boolean, default: false },
    EmailOTP: { type: Number },
    isEmailVerified: { type: Boolean, default: false },
    iswhatsappenable: { type: Boolean, default: false },
    issmsnotificationon: { type: Boolean, default: false },
    iswhatsappnotificationon: { type: Boolean, default: false },
    hasloginpin: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Userinfo", UserinfoSchema);

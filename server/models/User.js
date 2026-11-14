const mongoose = require("mongoose");

const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Mandarin",
  "Hindi",
  "Arabic",
  "Portuguese",
  "Russian",
  "Japanese",
  "Other"
];

const INTERESTS = [
  "Surfing",
  "Yoga",
  "Photography",
  "Hiking",
  "Skiing",
  "Food & Dining",
  "Museums",
  "Nightlife",
  "Shopping",
  "Beach",
  "Adventure Sports",
  "Wildlife",
  "History",
  "Art",
  "Music",
  "Camping",
  "Swimming"
];

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    resetPasswordToken: { type: String, required: false, default: "" },
    resetPasswordExpires: { type: Date, required: false, default: null },
    name: { type: String, default: "" },
    college: { type: String, default: "" },
    residence: { type: String, default: "" },
    year: {
      type: String,
      enum: [
        "Freshman",
        "Sophomore",
        "Junior",
        "Senior",
        "Masters",
        "PhD"
      ],
      default: "Freshman"
    },
    bio: { type: String, default: "" },
    languages: {
      type: [String],
      enum: LANGUAGES,
      default: []
    },
    profilePic: { type: String, default: "https://api.dicebear.com/7.x/identicon/svg?seed=default" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

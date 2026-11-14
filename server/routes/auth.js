const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendWelcomeBackEmail, sendPasswordResetEmail } = require("../services/email");

// creates mini Express app (group of routes related to authentication)
const router = express.Router();

// Signup route - when server receives POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { signupName, signupEmail, signupPassword, signupConfirmPassword } = req.body;
    if (!signupName || !signupEmail || !signupPassword) return res.status(400).json({ message: "Name, email, and password required" });
    if (signupPassword.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
    if (signupPassword != signupConfirmPassword) return res.status(400).json({ message: "Passwords do not match" });

    const email = signupEmail.toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already in use" });

    const passwordHash = await bcrypt.hash(signupPassword, 12);

    const user = await User.create({ email, passwordHash, name: signupName });

    const token = jwt.sign(
      { sub: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      token,
      user: { id: user._id, email: user.email, name: user.name }
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Login route - when server receives POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { loginEmail, loginPassword } = req.body;
    if (!loginEmail || !loginPassword) return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email: loginEmail.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(loginPassword, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { sub: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // A mail delivery issue must not prevent a valid user from signing in.
    try {
      await sendWelcomeBackEmail(user);
    } catch (emailError) {
      console.error("Welcome-back email failed:", emailError.message);
    }

    return res.status(201).json({
      token,
      user
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Forgot Password (generate token) route - when server receives POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  const genericMessage = "If an account exists with this email, you will receive a password reset link that will expire within 30 mins.";

  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const user = email ? await User.findOne({ email }) : null;
    const resetToken = crypto.randomBytes(32).toString("hex");

    if (user) {
      user.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();

      try {
        await sendPasswordResetEmail(user, resetToken);
      } catch (emailError) {
        // Keep the response generic so this endpoint does not reveal account details.
        console.error("Password-reset email failed:", emailError.message);
      }
    }

    return res.status(200).json({ message: genericMessage });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Reset Password route - when server receives POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";

    if (!email || typeof token !== "string" || !token || typeof newPassword !== "string") {
      return res.status(400).json({ message: "Email, reset token, and new password are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      email,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired password reset link" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.resetPasswordToken = "";
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

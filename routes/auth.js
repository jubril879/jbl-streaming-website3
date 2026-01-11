import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/User.js";

const router = express.Router();

let transporter;
try {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER || "placeholder@gmail.com",
      pass: process.env.EMAIL_PASS || "placeholder",
    },
  });
  console.log("ℹ️ Nodemailer transporter initialized");
} catch (error) {
  console.error("❌ Nodemailer initialization error:", error.message);
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "user",
    });

    await user.save();

    const mailOptions = {
      from: `"CinemaHub" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Welcome to CinemaHub, ${user.name}!`,
      text: `Hi ${user.name},\n\nThanks for signing up to CinemaHub!\n\nEnjoy streaming.\n\n— CinemaHub Team`,
      html: `
        <h2>Welcome to CinemaHub, ${user.name}!</h2>
        <p>Thanks for signing up to CinemaHub!</p>
        <p>Enjoy streaming your favorite movies and shows.</p>
        <p>— CinemaHub Team</p>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("Welcome email sent to:", user.email);
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log(`User not found: ${email}`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log(`Invalid password for: ${email}`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined in environment variables");
      throw new Error("Internal configuration error");
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log(`Login successful for: ${email} (Role: ${user.role})`);
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});



// Forgot password - send reset code
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetCode = resetCode;
    user.resetCodeExpires = resetCodeExpires;
    await user.save();

    const mailOptions = {
      from: `"CinemaHub" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset Code - CinemaHub",
      text: `Hi ${user.name},\n\nYour password reset code is: ${resetCode}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\n— CinemaHub Team`,
      html: `
        <h2>Password Reset - CinemaHub</h2>
        <p>Hi ${user.name},</p>
        <p>Your password reset code is:</p>
        <h1 style="color: #3b82f6; font-size: 32px; letter-spacing: 4px;">${resetCode}</h1>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>— CinemaHub Team</p>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("Password reset email sent to:", user.email);
      res.json({ message: "Reset code sent to your email" });
    } catch (emailError) {
      console.error("Error sending reset email:", emailError);
      res.status(500).json({ message: "Failed to send reset email" });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Verify reset code
router.post("/verify-reset-code", async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.resetCode || !user.resetCodeExpires) {
      return res
        .status(400)
        .json({ message: "No reset code found. Please request a new one." });
    }

    if (user.resetCode !== code) {
      return res.status(400).json({ message: "Invalid reset code" });
    }

    if (new Date() > user.resetCodeExpires) {
      return res
        .status(400)
        .json({ message: "Reset code has expired. Please request a new one." });
    }

    res.json({ message: "Code verified successfully" });
  } catch (error) {
    console.error("Verify reset code error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Reset password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email, code, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.resetCode || !user.resetCodeExpires) {
      return res
        .status(400)
        .json({ message: "No reset code found. Please request a new one." });
    }

    if (user.resetCode !== code) {
      return res.status(400).json({ message: "Invalid reset code" });
    }

    if (new Date() > user.resetCodeExpires) {
      return res
        .status(400)
        .json({ message: "Reset code has expired. Please request a new one." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetCode = null;
    user.resetCodeExpires = null;
    await user.save();

    console.log(`Password reset successful for: ${email}`);
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;

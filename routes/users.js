import express from "express";
import User from "../models/User.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();


router.get("/profile", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


router.put("/profile", authenticate, async (req, res) => {
  try {
    const { name, email, phone, bio, profileImage } = req.body;

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: req.userId },
      });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase();
    if (phone) updateData.phone = phone.trim();
    if (bio) updateData.bio = bio.trim();
    if (profileImage) updateData.profileImage = profileImage;

    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


router.get("/watch-history", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("watchHistory");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user.watchHistory || []);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


router.post("/watch-history", authenticate, async (req, res) => {
  try {
    const { movieId, movieTitle, movieImage } = req.body;

    if (!movieId) {
      return res.status(400).json({ message: "MovieId is required" });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const watchEntry = {
      movieId: String(movieId),
      movieTitle: movieTitle || "Unknown",
      movieImage: movieImage || "",
      watchedAt: new Date(),
    };

    user.watchHistory = [watchEntry, ...(user.watchHistory || [])].slice(0, 20);
    await user.save();

    res.json(user.watchHistory);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;

import express from "express";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = express.Router();


router.get("/profile", auth, async (req, res) => {
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


router.put("/profile", auth, async (req, res) => {
  try {
    const { name, email, phone, bio, profileImage } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, email, phone, bio, profileImage },
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


router.get("/watch-history", auth, async (req, res) => {
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


router.post("/watch-history", auth, async (req, res) => {
  try {
    const { movieId, movieTitle, movieImage } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const watchEntry = {
      movieId,
      movieTitle,
      movieImage,
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

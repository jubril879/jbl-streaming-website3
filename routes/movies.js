import express from "express";
import Movie from "../models/Movie.js";
import { authenticate, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const {
      search,
      genre,
      year,
      rating,
      sortBy = "createdAt",
      order = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (genre) {
      query.genre = { $regex: genre, $options: "i" };
    }

    if (year) {
      query.year = parseInt(year);
    }

    if (rating) {
      query.rating = { $gte: parseFloat(rating) };
    }

    const sortOptions = {};
    const validSortFields = ["title", "year", "rating", "createdAt"];
    if (validSortFields.includes(sortBy)) {
      sortOptions[sortBy] = order === "asc" ? 1 : -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const movies = await Movie.find(query)
      .populate("uploadedBy", "name email")
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    const total = await Movie.countDocuments(query);

    res.json({
      movies,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalMovies: total,
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/featured", async (req, res) => {
  try {
    const featuredMovies = await Movie.find({ isFeatured: true })
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    res.json(featuredMovies);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id).populate(
      "uploadedBy",
      "name email"
    );
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }
    res.json(movie);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/", authenticate, adminOnly, async (req, res) => {
  try {
    const {
      title,
      genre,
      rating,
      year,
      description,
      poster,
      videoUrl,
      isFeatured,
    } = req.body;

    if (!title || !genre || !year || !poster || !videoUrl) {
      return res
        .status(400)
        .json({
          message: "Title, genre, year, poster, and videoUrl are required",
        });
    }

    const movie = new Movie({
      title,
      genre,
      rating: rating || 0,
      year,
      description,
      poster,
      videoUrl,
      isFeatured: isFeatured || false,
      uploadedBy: req.userId,
    });

    await movie.save();
    await movie.populate("uploadedBy", "name email");

    res.status(201).json({
      message: "Movie created successfully",
      movie,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.put("/:id", authenticate, adminOnly, async (req, res) => {
  try {
    const {
      title,
      genre,
      rating,
      year,
      description,
      poster,
      videoUrl,
      isFeatured,
    } = req.body;

    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      {
        title,
        genre,
        rating,
        year,
        description,
        poster,
        videoUrl,
        isFeatured,
        updatedAt: Date.now(),
      },
      { new: true }
    ).populate("uploadedBy", "name email");

    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    res.json({
      message: "Movie updated successfully",
      movie,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.delete("/:id", authenticate, adminOnly, async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);

    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    res.json({
      message: "Movie deleted successfully",
      movie,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;

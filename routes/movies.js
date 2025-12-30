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
      page,
      limit,
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

    let query_builder = Movie.find(query)
      .populate("uploadedBy", "name email")
      .sort(sortOptions);

    if (page && limit) {
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;
      query_builder = query_builder.skip(skip).limit(limitNum);
      const total = await Movie.countDocuments(query);
      const movies = await query_builder;
      return res.json({
        movies,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalMovies: total,
          hasNext: pageNum * limitNum < total,
          hasPrev: pageNum > 1,
        },
      });
    }

    const movies = await query_builder;
    res.json(movies);
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
      return res.status(400).json({
        message: "Title, genre, year, poster, and videoUrl are required",
      });
    }

    if (title.trim().length === 0) {
      return res.status(400).json({ message: "Title cannot be empty" });
    }

    if (rating && (rating < 0 || rating > 10)) {
      return res.status(400).json({ message: "Rating must be between 0 and 10" });
    }

    if (year && (year < 1800 || year > new Date().getFullYear() + 5)) {
      return res.status(400).json({ message: "Invalid year" });
    }

    const movie = new Movie({
      title: title.trim(),
      genre,
      rating: rating ? Number(rating) : 0,
      year: Number(year),
      description: description ? description.trim() : "",
      poster,
      videoUrl,
      isFeatured: Boolean(isFeatured),
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

    if (title && title.trim().length === 0) {
      return res.status(400).json({ message: "Title cannot be empty" });
    }

    if (rating && (rating < 0 || rating > 10)) {
      return res.status(400).json({ message: "Rating must be between 0 and 10" });
    }

    if (year && (year < 1800 || year > new Date().getFullYear() + 5)) {
      return res.status(400).json({ message: "Invalid year" });
    }

    const updateData = {};
    if (title) updateData.title = title.trim();
    if (genre) updateData.genre = genre;
    if (rating) updateData.rating = Number(rating);
    if (year) updateData.year = Number(year);
    if (description) updateData.description = description.trim();
    if (poster) updateData.poster = poster;
    if (videoUrl) updateData.videoUrl = videoUrl;
    if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);
    updateData.updatedAt = Date.now();

    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      updateData,
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

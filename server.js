import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import movieRoutes from "./routes/movies.js";
import userRoutes from "./routes/users.js";
import User from "./models/User.js";
import Movie from "./models/Movie.js";
import bcrypt from "bcryptjs";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("✅ MongoDB connected successfully");
    await createAdminUser();
    await createDemoUser();
    const movieCount = await Movie.countDocuments();
    console.log(`📊 Current movie count: ${movieCount}`);
    await createDefaultMovies();
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    console.error("Please ensure your MONGODB_URI is correct and your database is accessible.");
  });

app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/users", userRoutes);

app.get("/api/health", (req, res) => {
  res.json({ message: "Server is running", status: "ok" });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(err.status || 500).json({
    message: err.message || "Something went wrong",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

const createAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ email: "admin@cinemahub.com" });
    if (!adminExists) {
      console.log("Creating default admin user...");
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await User.create({
        name: "Admin",
        email: "admin@cinemahub.com",
        password: hashedPassword,
        role: "admin",
      });
      console.log("✅ Default admin user created");
    } else {
      console.log("ℹ️ Admin user already exists");
    }
  } catch (error) {
    console.error("❌ Admin user creation error:", error.message);
  }
};

const createDemoUser = async () => {
  try {
    const demoExists = await User.findOne({ email: "demo@test.com" });
    if (!demoExists) {
      console.log("Creating default demo user...");
      const hashedPassword = await bcrypt.hash("password123", 10);
      await User.create({
        name: "Demo User",
        email: "demo@test.com",
        password: hashedPassword,
        role: "user",
      });
      console.log("✅ Default demo user created");
    } else {
      console.log("ℹ️ Demo user already exists");
    }
  } catch (error) {
    console.error("❌ Demo user creation error:", error.message);
  }
};

const createDefaultMovies = async () => {
  try {
    console.log("Checking for default movies...");
    const admin = await User.findOne({ email: "admin@cinemahub.com" });
    if (!admin) {
      console.error("❌ ERROR: Admin user not found! Cannot seed movies because 'uploadedBy' is required.");
      return;
    }
    
    console.log(`Found admin user: ${admin._id}. Proceeding to seed movies...`);

    const defaultMovies = [
      {
        title: "Inception",
        genre: "Sci-Fi",
        rating: 8.8,
        year: 2010,
        description: "A skilled thief leads a team to pull off the impossible: stealing an idea from someone's mind while they dream.",
        poster: "https://via.placeholder.com/200x300?text=Inception",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        uploadedBy: admin._id,
        isFeatured: true,
      },
      {
        title: "Jules Verne’s Mysterious Island",
        genre: "Action",
        rating: 9.0,
        year: 2008,
        description: "When the menace known as the Joker wreaks havoc, Batman must accept one of the greatest tests.",
        poster: "https://via.placeholder.com/200x300?text=The+Dark+Knight",
        videoUrl: "https://www.youtube.com/watch?v=LTuOihyKVHs",
        uploadedBy: admin._id,
        isFeatured: true,
      },
      {
        title: "Tom's Midnight Garden",
        genre: "Sci-Fi",
        rating: 8.6,
        year: 2014,
        description: "A team of astronauts travels through a wormhole near Saturn to find a new home for humanity.",
        poster: "https://via.placeholder.com/200x300?text=Interstellar",
        videoUrl: "https://www.youtube.com/watch?v=mcBwcEyKBuc",
        uploadedBy: admin._id,
        isFeatured: true,
      },
      {
        title: "The Legend of the Blue Sea – Fantasy romance with Jun Ji-hyun",
        genre: "Crime",
        rating: 8.9,
        year: 1994,
        description: "The lives of two mob hitmen, a boxer, a gangster's wife, and a pair of diner bandits intertwine.",
        poster: "https://via.placeholder.com/200x300?text=Pulp+Fiction",
        videoUrl: "https://www.viki.com/tv32240c-the-legend-of-the-blue-sea",
        uploadedBy: admin._id,
        isFeatured: false,
      },
      {
        title: "The Hive ",
        genre: "Drama",
        rating: 9.3,
        year: 1994,
        description: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
        poster: "https://via.placeholder.com/200x300?text=Shawshank",
        videoUrl: "https://www.youtube.com/watch?v=Wzbpr7q_IVo",
        uploadedBy: admin._id,
        isFeatured: true,
      },
      {
        title: "Merry Men 2",
        genre: "Action",
        rating: 8.7,
        year: 1999,
        description: "A computer programmer discovers that reality as he knows it is a simulation.",
        poster: "https://via.placeholder.com/200x300?text=The+Matrix",
        videoUrl: "https://www.youtube.com/watch?v=LrltlyTbY24",
        uploadedBy: admin._id,
        isFeatured: true,
      },
      {
        title: "Gladiator",
        genre: "Action",
        rating: 8.5,
        year: 2000,
        description: "A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family and sent him into slavery.",
        poster: "https://via.placeholder.com/200x300?text=Gladiator",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        uploadedBy: admin._id,
        isFeatured: true,
      },
      {
        title: "The Prestige",
        genre: "Drama",
        rating: 8.5,
        year: 2006,
        description: "After a tragic accident, two stage magicians in 1890s London engage in a battle to create the ultimate illusion.",
        poster: "https://via.placeholder.com/200x300?text=The+Prestige",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        uploadedBy: admin._id,
        isFeatured: false,
      },
      {
        title: "1-5. Goldmines Channel ",
        genre: "Action",
        rating: 8.5,
        year: 2019,
        description: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
        poster: "https://via.placeholder.com/200x300?text=Parasite",
        videoUrl:"https:wwwyoutubecomchannelUCyoXW-Dse7fURq30EWl_CUA",
        uploadedBy: admin._id,
        isFeatured: true,
      },
      {
        title: "Django Unchained",
        genre: "Action",
        rating: 8.4,
        year: 2012,
        description: "With the help of a German bounty-hunter, a freed slave sets out to rescue his wife from a brutal plantation-owner in Mississippi.",
        poster: "https://via.placeholder.com/200x300?text=Django",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        uploadedBy: admin._id,
        isFeatured: false,
      },
      {
        title: "The Wolf of Wall Street",
        genre: "Biography",
        rating: 8.2,
        year: 2013,
        description: "Based on the true story of Jordan Belfort, from his rise to a wealthy stock-broker living the high life to his fall involving crime and corruption.",
        poster: "https://via.placeholder.com/200x300?text=Wolf+of+Wall+Street",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        uploadedBy: admin._id,
        isFeatured: true,
      },
      {
        title: "The Godfather",
        genre: "Crime",
        rating: 9.2,
        year: 1972,
        description: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
        poster: "https://via.placeholder.com/200x300?text=Godfather",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        uploadedBy: admin._id,
        isFeatured: true,
      },
      {
        title: "Avatar",
        genre: "Action",
        rating: 7.9,
        year: 2009,
        description: "A paraplegic Marine dispatched to the moon Pandora on a unique mission becomes torn between following his orders and protecting the world he feels is his home.",
        poster: "https://via.placeholder.com/200x300?text=Avatar",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        uploadedBy: admin._id,
        isFeatured: true,
      },
      {
        title: "Joker",
        genre: "Drama",
        rating: 8.4,
        year: 2019,
        description: "In Gotham City, mentally troubled comedian Arthur Fleck is disregarded and mistreated by society. He then embarks on a downward spiral of revolution and bloody crime.",
        poster: "https://via.placeholder.com/200x300?text=Joker",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        uploadedBy: admin._id,
        isFeatured: true,
      },
      {
        title: "The Lion King",
        genre: "Animation",
        rating: 8.5,
        year: 1994,
        description: "Lion prince Simba and his father are targeted by his bitter uncle, who wants to ascend the throne himself.",
        poster: "https://via.placeholder.com/200x300?text=Lion+King",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        uploadedBy: admin._id,
        isFeatured: false,
      },
      {
        title: "Spiderman: No Way Home",
        genre: "Action",
        rating: 8.2,
        year: 2021,
        description: "With Spider-Man's identity now revealed, Peter asks Doctor Strange for help. When a spell goes wrong, dangerous foes from other worlds start to appear.",
        poster: "https://via.placeholder.com/200x300?text=Spiderman",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        uploadedBy: admin._id,
        isFeatured: true,
      },
      {
        title: "Titanic",
        genre: "Romance",
        rating: 7.9,
        year: 1997,
        description: "A seventeen-year-old aristocrat falls in love with a kind but poor artist aboard the luxurious, ill-fated R.M.S. Titanic.",
        poster: "https://via.placeholder.com/200x300?text=Titanic",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        uploadedBy: admin._id,
        isFeatured: false,
      },
      {
        title: "Avengers: Endgame",
        genre: "Action",
        rating: 8.4,
        year: 2019,
        description: "After the devastating events of Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more.",
        poster: "https://via.placeholder.com/200x300?text=Endgame",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        uploadedBy: admin._id,
        isFeatured: true,
      },
      {
        title: "Forrest Gump",
        genre: "Drama",
        rating: 8.8,
        year: 1994,
        description: "The presidencies of Kennedy and Johnson, the Vietnam War, the Watergate scandal and other historical events unfold from the perspective of an Alabama man with an IQ of 75.",
        poster: "https://via.placeholder.com/200x300?text=Forrest+Gump",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        uploadedBy: admin._id,
        isFeatured: true,
      },
    ];

    for (const movieData of defaultMovies) {
      const movieExists = await Movie.findOne({ title: movieData.title });
      if (!movieExists) {
        await Movie.create(movieData);
        console.log(`✅ Added missing movie: ${movieData.title}`);
      }
    }
    console.log("ℹ️ Default movies check complete");
  } catch (error) {
    console.error("❌ Default movies creation error:", error.message);
  }
};

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});

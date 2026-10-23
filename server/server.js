const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const Bookmark = require("./models/Bookmark");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Movie website backend is running!",
  });
});

// Database health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "success",
    message: "Backend is working correctly!",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Get the logged-in user's bookmarks
app.get("/api/bookmarks", authMiddleware, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({
      userId: req.user.uid,
    }).sort({ createdAt: -1 });

    res.json({ bookmarks });
  } catch (error) {
    console.error("Fetch bookmarks error:", error.message);
    res.status(500).json({ message: "Could not fetch bookmarks." });
  }
});

// Add a movie or TV series to bookmarks
app.post("/api/bookmarks", authMiddleware, async (req, res) => {
  try {
    const { tmdbId, mediaType, title, posterPath } = req.body;

    if (
      !Number.isInteger(tmdbId) ||
      tmdbId <= 0 ||
      !["movie", "tv"].includes(mediaType) ||
      typeof title !== "string" ||
      !title.trim()
    ) {
      return res.status(400).json({
        message: "Valid tmdbId, mediaType, and title are required.",
      });
    }

    const bookmark = await Bookmark.findOneAndUpdate(
      {
        userId: req.user.uid,
        tmdbId,
        mediaType,
      },
      {
        $setOnInsert: {
          userId: req.user.uid,
          tmdbId,
          mediaType,
          title: title.trim(),
          posterPath: typeof posterPath === "string" ? posterPath : null,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      message: "Bookmark saved successfully.",
      bookmark,
    });
  } catch (error) {
    console.error("Add bookmark error:", error.message);
    res.status(500).json({ message: "Could not save bookmark." });
  }
});

// Remove a bookmark belonging to the logged-in user
app.delete(
  "/api/bookmarks/:mediaType/:tmdbId",
  authMiddleware,
  async (req, res) => {
    try {
      const { mediaType } = req.params;
      const tmdbId = Number(req.params.tmdbId);

      if (
        !["movie", "tv"].includes(mediaType) ||
        !Number.isInteger(tmdbId) ||
        tmdbId <= 0
      ) {
        return res.status(400).json({
          message: "Invalid media type or TMDB ID.",
        });
      }

      const result = await Bookmark.deleteOne({
        userId: req.user.uid,
        tmdbId,
        mediaType,
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          message: "Bookmark not found.",
        });
      }

      res.json({ message: "Bookmark removed successfully." });
    } catch (error) {
      console.error("Remove bookmark error:", error.message);
      res.status(500).json({ message: "Could not remove bookmark." });
    }
  },
);

// Connect to MongoDB before starting the server
async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from the .env file");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();

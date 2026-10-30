const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
require("dotenv").config();

const Bookmark = require("./models/Bookmark");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// TMDB image proxy (image.tmdb.org is blocked by some ISPs too)
const IMAGE_SIZES = new Set([
  "w92",
  "w154",
  "w185",
  "w300",
  "w342",
  "w500",
  "w780",
  "w1280",
  "original",
]);

app.get("/api/tmdb-image/:size/:file", async (req, res) => {
  const { size, file } = req.params;

  if (!IMAGE_SIZES.has(size) || !/^[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$/i.test(file)) {
    return res.status(400).json({ message: "Invalid image request." });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(`https://image.tmdb.org/t/p/${size}/${file}`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      return res.status(response.status).end();
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    res.set({
      "Content-Type": response.headers.get("content-type") || "image/jpeg",
      "Cache-Control": "public, max-age=604800",
      "Cross-Origin-Resource-Policy": "cross-origin",
    });

    return res.send(buffer);
  } catch (error) {
    console.error("TMDB image proxy error:", error.message);
    return res.status(502).json({ message: "Unable to load image." });
  } finally {
    clearTimeout(timeout);
  }
});

// TMDB API Proxy
app.use("/api/tmdb", async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({
      message: "Method not allowed.",
    });
  }

  const ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;

  if (!ACCESS_TOKEN) {
    return res.status(500).json({
      message: "TMDB access token is not configured on the server.",
    });
  }

  try {
    const tmdbPath = req.path;

    // Allow only the TMDB endpoints used by Vellora
    const allowedEndpoints = [
      /^\/trending\/(movie|tv)\/week$/,
      /^\/search\/(movie|tv|multi)$/,
      /^\/discover\/movie$/,
      /^\/tv\/\d+\/season\/\d+$/,
      /^\/(movie|tv)\/\d+$/,
      /^\/(movie|tv)\/\d+\/(similar|credits|videos|watch\/providers)$/,
    ];

    if (!allowedEndpoints.some((pattern) => pattern.test(tmdbPath))) {
      return res.status(404).json({
        message: "TMDB endpoint not allowed.",
      });
    }

    const tmdbUrl = new URL(`https://api.themoviedb.org/3${tmdbPath}`);

    // Forward supported query parameters
    Object.entries(req.query).forEach(([key, value]) => {
      if (
        typeof value === "string" &&
        key !== "api_key" &&
        key !== "access_token"
      ) {
        tmdbUrl.searchParams.set(key, value);
      }
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(tmdbUrl.toString(), {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
        signal: controller.signal,
      });

      const data = await response.json();

      return res.status(response.status).json(data);
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error("TMDB proxy error:", error.message);

    if (error.name === "AbortError") {
      return res.status(504).json({
        message: "TMDB request timed out.",
      });
    }

    return res.status(502).json({
      message: "Unable to connect to TMDB.",
    });
  }
});

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

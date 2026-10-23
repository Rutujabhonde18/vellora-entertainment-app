const mongoose = require("mongoose");

const bookmarkSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    tmdbId: {
      type: Number,
      required: true,
    },
    mediaType: {
      type: String,
      enum: ["movie", "tv"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    posterPath: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

// A user can bookmark a title only once.
bookmarkSchema.index({ userId: 1, tmdbId: 1, mediaType: 1 }, { unique: true });

module.exports = mongoose.model("Bookmark", bookmarkSchema);

import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  addBookmark,
  getBookmarks,
  removeBookmark,
} from "../services/bookmarks";
import { getImageUrl } from "../services/tmdb";

// Convert a title into a URL-friendly slug
function createSlug(title = "") {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function MovieCard({
  id,
  title,
  name,
  year,
  release_date,
  first_air_date,
  image,
  posterUrl,
  poster_path,
  mediaType = "movie",
  media_type,
  genre = "",
}) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [serverBookmarks, setServerBookmarks] = useState([]);
  const [loadedUserId, setLoadedUserId] = useState(null);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [error, setError] = useState("");

  // Get the movie or TV show's display information
  const cardTitle = title || name || "Untitled";
  const cardMediaType = media_type || mediaType || "movie";
  const tmdbId = Number(id);

  const poster = image || posterUrl || getImageUrl(poster_path, "w500");

  const releaseYear =
    year ||
    (release_date || first_air_date
      ? (release_date || first_air_date).slice(0, 4)
      : "");

  // Load bookmarks for the logged-in user
  useEffect(() => {
    let active = true;

    setServerBookmarks([]);
    setLoadedUserId(null);
    setError("");

    if (authLoading || !user) return;

    async function loadUserBookmarks() {
      try {
        const data = await getBookmarks();

        if (active) {
          setServerBookmarks(data.bookmarks || []);
          setLoadedUserId(user.uid);
        }
      } catch (err) {
        if (active) setError(err.message || "Could not load bookmarks.");
      }
    }

    loadUserBookmarks();

    return () => {
      active = false;
    };
  }, [user, authLoading]);

  // Bookmarks belong to the logged-in user, so nothing is bookmarked when logged out
  const isBookmarked = user
    ? loadedUserId === user.uid &&
      serverBookmarks.some(
        (bookmark) =>
          Number(bookmark.tmdbId) === tmdbId &&
          bookmark.mediaType === cardMediaType,
      )
    : false;

  // Prepare bookmark data
  const item = {
    id,
    tmdbId,
    title: cardTitle,
    year: releaseYear,
    image: poster,
    posterPath: poster_path || null,
    mediaType: cardMediaType,
    genre,
  };

  // Navigate to the movie or TV show details page
  const openDetails = () => {
    navigate(
      cardMediaType === "tv"
        ? `/tv-series/${id ?? createSlug(cardTitle)}`
        : `/movies/${id ?? createSlug(cardTitle)}`,
    );
  };

  // Add or remove a bookmark
  const handleBookmark = async (event) => {
    event.stopPropagation();
    setError("");

    if (authLoading) return;

    if (!user) {
      setError("Please log in to save bookmarks.");
      return;
    }

    if (loadedUserId !== user.uid) {
      setError("Your bookmarks are still loading. Please try again.");
      return;
    }

    if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
      setError("This item has an invalid TMDB ID.");
      return;
    }

    try {
      setBookmarkLoading(true);

      if (isBookmarked) {
        // Remove the bookmark from the backend and update the UI
        await removeBookmark(cardMediaType, tmdbId);

        setServerBookmarks((current) =>
          current.filter(
            (bookmark) =>
              !(
                Number(bookmark.tmdbId) === tmdbId &&
                bookmark.mediaType === cardMediaType
              ),
          ),
        );
      } else {
        // Save the bookmark to the backend
        const data = await addBookmark({
          tmdbId,
          mediaType: cardMediaType,
          title: cardTitle,
          posterPath: poster_path || null,
        });

        setServerBookmarks((current) => {
          const exists = current.some(
            (bookmark) =>
              Number(bookmark.tmdbId) === tmdbId &&
              bookmark.mediaType === cardMediaType,
          );

          return exists ? current : [data.bookmark, ...current];
        });
      }
    } catch (err) {
      setError(err.message || "Could not update bookmark.");
    } finally {
      setBookmarkLoading(false);
    }
  };

  return (
    <article className="group min-w-0">
      <div
        role="link"
        tabIndex={0}
        onClick={openDetails}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openDetails();
          }
        }}
        className="relative cursor-pointer overflow-hidden rounded-xl border border-slate-800 bg-slate-900"
      >
        {poster ? (
          <img
            src={poster}
            alt={`${cardTitle} poster`}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
            className="aspect-3/3 w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex aspect-3/3 w-full items-center justify-center bg-[#172033] p-4 text-center text-sm text-slate-400">
            No poster available
          </div>
        )}

        {/* Bookmark button */}
        <button
          type="button"
          aria-label={
            isBookmarked
              ? `Remove ${cardTitle} bookmark`
              : `Bookmark ${cardTitle}`
          }
          aria-pressed={isBookmarked}
          disabled={
            bookmarkLoading ||
            authLoading ||
            (!!user && loadedUserId !== user.uid)
          }
          onClick={handleBookmark}
          className={`absolute right-2 top-2 rounded-full p-2 transition cursor-pointer ${
            isBookmarked
              ? "bg-violet-600 text-white"
              : "bg-black/70 text-white hover:bg-violet-600 active:scale-95"
          } disabled:cursor-wait disabled:opacity-60`}
        >
          <Bookmark size={17} fill={isBookmarked ? "currentColor" : "none"} />
        </button>
      </div>

      <h3
        onClick={openDetails}
        className="mt-2 cursor-pointer truncate text-sm font-semibold hover:text-violet-400"
      >
        {cardTitle}
      </h3>

      <p className="mt-1 text-xs text-slate-400">
        {releaseYear || "Year unavailable"}
      </p>

      {/* Display bookmark errors */}
      {error && (
        <p role="status" className="mt-2 text-xs text-red-400">
          {error}
        </p>
      )}
    </article>
  );
}

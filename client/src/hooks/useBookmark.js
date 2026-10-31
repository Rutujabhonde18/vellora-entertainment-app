import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  addBookmark,
  getBookmarks,
  removeBookmark,
} from "../services/bookmarks";

// Save or remove one movie / TV show in the user's backend bookmarks,
// so the details pages and the Bookmarks page always show the same data.
export default function useBookmark({ tmdbId, mediaType, title, posterPath }) {
  const { user, loading: authLoading } = useAuth();

  // Remember which user the list belongs to, so it is ignored after logout
  const [loaded, setLoaded] = useState({ uid: null, list: [] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const numericId = Number(tmdbId);

  // Load the logged-in user's bookmarks (the request is shared and cached)
  useEffect(() => {
    let active = true;

    if (authLoading || !user) return;

    getBookmarks()
      .then((data) => {
        if (active) setLoaded({ uid: user.uid, list: data.bookmarks || [] });
      })
      .catch((err) => {
        if (active) setError(err.message || "Could not load bookmarks.");
      });

    return () => {
      active = false;
    };
  }, [user, authLoading]);

  const isLoaded = Boolean(user) && loaded.uid === user.uid;
  const bookmarks = isLoaded ? loaded.list : [];
  const setBookmarks = (update) =>
    setLoaded((current) => ({ ...current, list: update(current.list) }));

  const isBookmarked = Boolean(
    bookmarks.some(
      (item) =>
        Number(item.tmdbId) === numericId && item.mediaType === mediaType,
    ),
  );

  // Add or remove the bookmark
  const toggle = async () => {
    setError("");

    if (authLoading) return;

    if (!user) {
      setError("Please log in to save bookmarks.");
      return;
    }

    if (!isLoaded) {
      setError("Your bookmarks are still loading. Please try again.");
      return;
    }

    if (!Number.isInteger(numericId) || numericId <= 0 || !title) return;

    try {
      setBusy(true);

      if (isBookmarked) {
        await removeBookmark(mediaType, numericId);
        setBookmarks((current) =>
          current.filter(
            (item) =>
              !(
                Number(item.tmdbId) === numericId &&
                item.mediaType === mediaType
              ),
          ),
        );
      } else {
        const data = await addBookmark({
          tmdbId: numericId,
          mediaType,
          title,
          posterPath: posterPath || null,
        });
        setBookmarks((current) => [data.bookmark, ...current]);
      }
    } catch (err) {
      setError(err.message || "Could not update bookmark.");
    } finally {
      setBusy(false);
    }
  };

  return { isBookmarked, toggle, busy, error };
}

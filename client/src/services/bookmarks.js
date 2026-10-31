import { auth } from "../firebase";

// Backend API URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Send authenticated requests to manage bookmarks
async function bookmarkRequest(path, options = {}) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please log in to manage your bookmarks.");
  }

  // Get Firebase authentication token
  const idToken = await user.getIdToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
      ...options.headers,
    },
  });

  const data = await response.json();

  // Handle API errors
  if (!response.ok) {
    throw new Error(data.message || "Bookmark request failed.");
  }

  return data;
}

// Share one bookmarks request between all components.
// Every MovieCard asks for the bookmark list, so without this a page with
// 20 cards sent 20 identical requests to the server.
const CACHE_TTL_MS = 60 * 1000;
let bookmarksCache = { uid: null, promise: null, time: 0 };

function clearBookmarksCache() {
  bookmarksCache = { uid: null, promise: null, time: 0 };
}

// Fetch all bookmarks (pass { force: true } to skip the shared cache)
export function getBookmarks({ force = false } = {}) {
  const uid = auth.currentUser?.uid || null;
  const fresh =
    bookmarksCache.promise &&
    bookmarksCache.uid === uid &&
    Date.now() - bookmarksCache.time < CACHE_TTL_MS;

  if (!force && fresh) return bookmarksCache.promise;

  const promise = bookmarkRequest("/api/bookmarks");
  bookmarksCache = { uid, promise, time: Date.now() };

  // Do not keep failed requests in the cache
  promise.catch(() => {
    if (bookmarksCache.promise === promise) clearBookmarksCache();
  });

  return promise;
}

// Add a new bookmark
export async function addBookmark(item) {
  const data = await bookmarkRequest("/api/bookmarks", {
    method: "POST",
    body: JSON.stringify(item),
  });
  clearBookmarksCache();
  return data;
}

// Remove a bookmark
export async function removeBookmark(mediaType, tmdbId) {
  const data = await bookmarkRequest(`/api/bookmarks/${mediaType}/${tmdbId}`, {
    method: "DELETE",
  });
  clearBookmarksCache();
  return data;
}

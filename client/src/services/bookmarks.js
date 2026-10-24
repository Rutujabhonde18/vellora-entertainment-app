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

// Fetch all bookmarks
export function getBookmarks() {
  return bookmarkRequest("/api/bookmarks");
}

// Add a new bookmark
export function addBookmark(item) {
  return bookmarkRequest("/api/bookmarks", {
    method: "POST",
    body: JSON.stringify(item),
  });
}

// Remove a bookmark
export function removeBookmark(mediaType, tmdbId) {
  return bookmarkRequest(`/api/bookmarks/${mediaType}/${tmdbId}`, {
    method: "DELETE",
  });
}

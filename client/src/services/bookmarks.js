
import { auth } from "../firebase";

const API_BASE_URL = "http://localhost:5000";

async function bookmarkRequest(path, options = {}) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please log in to manage your bookmarks.");
  }

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

  if (!response.ok) {
    throw new Error(data.message || "Bookmark request failed.");
  }

  return data;
}

export function getBookmarks() {
  return bookmarkRequest("/api/bookmarks");
}

export function addBookmark(item) {
  return bookmarkRequest("/api/bookmarks", {
    method: "POST",
    body: JSON.stringify(item),
  });
}

export function removeBookmark(mediaType, tmdbId) {
  return bookmarkRequest(
    `/api/bookmarks/${mediaType}/${tmdbId}`,
    { method: "DELETE" }
  );
}

import { createSlice } from "@reduxjs/toolkit";

// Load saved bookmarks from localStorage
const savedBookmarks = JSON.parse(
  localStorage.getItem("entertainment-bookmarks") || "[]",
);

// Create the bookmarks slice
const bookmarkSlice = createSlice({
  name: "bookmarks",
  initialState: savedBookmarks,
  reducers: {
    // Add or remove a bookmark
    toggleBookmark: (state, action) => {
      const item = action.payload;

      const existingIndex = state.findIndex(
        (bookmark) =>
          bookmark.title === item.title &&
          bookmark.mediaType === item.mediaType,
      );

      if (existingIndex >= 0) {
        state.splice(existingIndex, 1);
      } else {
        state.push(item);
      }
    },
  },
});

// Export the action and reducer
export const { toggleBookmark } = bookmarkSlice.actions;
export default bookmarkSlice.reducer;

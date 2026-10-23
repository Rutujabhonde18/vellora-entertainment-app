import { createSlice } from "@reduxjs/toolkit";

const savedBookmarks = JSON.parse(
  localStorage.getItem("entertainment-bookmarks") || "[]",
);

const bookmarkSlice = createSlice({
  name: "bookmarks",
  initialState: savedBookmarks,
  reducers: {
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

export const { toggleBookmark } = bookmarkSlice.actions;
export default bookmarkSlice.reducer;

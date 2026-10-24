import { configureStore } from "@reduxjs/toolkit";
import bookmarkReducer from "./bookmarkSlice";

// Configure the Redux store
export const store = configureStore({
  reducer: {
    bookmarks: bookmarkReducer,
  },
});

// Save bookmarks to localStorage whenever the store updates
store.subscribe(() => {
  localStorage.setItem(
    "entertainment-bookmarks",
    JSON.stringify(store.getState().bookmarks),
  );
});

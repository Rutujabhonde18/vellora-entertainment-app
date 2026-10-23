import { configureStore } from "@reduxjs/toolkit";
import bookmarkReducer from "./bookmarkSlice";

export const store = configureStore({
  reducer: {
    bookmarks: bookmarkReducer,
  },
});

store.subscribe(() => {
  localStorage.setItem(
    "entertainment-bookmarks",
    JSON.stringify(store.getState().bookmarks),
  );
});

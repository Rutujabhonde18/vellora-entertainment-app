import { useEffect, useState } from "react";
import { Bookmark, Film, Tv } from "lucide-react";
import SearchBar from "../components/SearchBar";
import MovieCard from "../components/MovieCard";
import { getBookmarks } from "../services/bookmarks";
import { getMovieDetails, getTVDetails, getImageUrl } from "../services/tmdb";

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load bookmarks when the page opens
  useEffect(() => {
    let active = true;

    async function loadBookmarks() {
      try {
        setLoading(true);
        setError("");

        // Fetch saved bookmarks from the backend
        const response = await getBookmarks({ force: true });
        const saved = response.bookmarks || [];

        // Display saved items immediately using backend data
        const initialBookmarks = saved.map((item) => ({
          ...item,
          image: item.posterPath ? getImageUrl(item.posterPath) : "",
        }));

        if (active) {
          setBookmarks(initialBookmarks);
          setLoading(false);
        }

        // Find bookmarks with missing titles or poster images
        const missingDetails = saved.filter(
          (item) => !item.title || !item.posterPath,
        );

        // Fetch missing movie or TV series details
        const updatedItems = await Promise.all(
          missingDetails.map(async (item) => {
            try {
              const details =
                item.mediaType === "tv"
                  ? await getTVDetails(item.tmdbId)
                  : await getMovieDetails(item.tmdbId);

              const posterPath = item.posterPath || details.poster_path || null;

              // Update the bookmark with complete details
              return {
                ...item,
                title:
                  item.title || details.title || details.name || "Untitled",
                posterPath,
                image: getImageUrl(posterPath),
              };
            } catch (err) {
              console.error("Bookmark details failed:", err);
              return null;
            }
          }),
        );

        // Update existing bookmarks with the fetched details
        if (active && updatedItems.some(Boolean)) {
          setBookmarks((current) =>
            current.map((item) => {
              const updated = updatedItems.find(
                (result) =>
                  result &&
                  result.mediaType === item.mediaType &&
                  String(result.tmdbId) === String(item.tmdbId),
              );

              return updated ? { ...item, ...updated } : item;
            }),
          );
        }
      } catch (err) {
        // Display an error if bookmarks cannot be loaded
        if (active) {
          setError(err.message || "Unable to load bookmarks.");
        }
      } finally {
        // Stop the loading state when the request finishes
        if (active) {
          setLoading(false);
        }
      }
    }

    loadBookmarks();

    // Prevent state updates after the component unmounts
    return () => {
      active = false;
    };
  }, []);

  // Separate bookmarked movies and TV series
  const movies = bookmarks.filter((item) => item.mediaType === "movie");
  const shows = bookmarks.filter((item) => item.mediaType === "tv");

  // Render bookmark cards in a responsive grid
  const renderCards = (items) => (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((item) => (
        <div key={`${item.mediaType}-${item.tmdbId}`} className="relative">
          <MovieCard
            {...item}
            id={item.tmdbId}
            image={item.image}
            posterPath={item.posterPath}
          />
        </div>
      ))}
    </div>
  );

  // Show loading message while bookmarks are being fetched
  if (loading) {
    return (
      <div className="min-h-screen p-8 text-center text-slate-400">
        Loading your bookmarks...
      </div>
    );
  }

  // Show an error message if loading fails
  if (error) {
    return (
      <div className="min-h-screen p-8 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Search bar for desktop screens */}
      <div className="hidden md:block">
        <SearchBar />
      </div>

      {/* Show an empty state when there are no bookmarks */}
      {bookmarks.length === 0 ? (
        <div className="mt-15 px-5 py-16 text-center">
          <Bookmark size={42} className="mx-auto mb-4 text-violet-400" />
          <h2 className="text-xl font-semibold">Your collection is empty</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
            Browse Movies or TV Series and tap the bookmark icon on anything you
            want to save.
          </p>
        </div>
      ) : (
        <>
          {/* Display bookmarked movies */}
          {movies.length > 0 && (
            <section className="mt-0 p-5 md:mt-20">
              <div className="mb-5 flex items-center gap-2">
                <Film size={20} className="text-violet-400" />
                <h2 className="text-xl font-semibold lg:text-3xl">
                  Bookmarked Movies
                </h2>
                <span className="mt-1 text-lg text-slate-400">
                  ({movies.length})
                </span>
              </div>
              {renderCards(movies)}
            </section>
          )}

          {/* Display bookmarked TV series */}
          {shows.length > 0 && (
            <section className="p-5">
              <div className="mb-5 flex items-center gap-2">
                <Tv size={20} className="text-violet-400" />
                <h2 className="text-xl font-semibold lg:text-3xl">
                  Bookmarked TV Series
                </h2>
                <span className="mt-1 text-lg text-slate-400">
                  ({shows.length})
                </span>
              </div>
              {renderCards(shows)}
            </section>
          )}
        </>
      )}
    </div>
  );
}

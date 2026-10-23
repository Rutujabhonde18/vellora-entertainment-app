
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import MovieCard from "../components/MovieCard";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const searchMedia = async () => {
      const searchQuery = query.trim();

      if (!searchQuery) {
        setResults([]);
        setLoading(false);
        setError("");
        return;
      }

      if (!API_KEY) {
        setError("TMDB API key is missing. Check your .env file.");
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const url = new URL(
          "https://api.themoviedb.org/3/search/multi"
        );
        url.searchParams.set("api_key", API_KEY);
        url.searchParams.set("query", searchQuery);
        url.searchParams.set("include_adult", "false");

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            "Could not fetch search results. Please try again."
          );
        }

        const data = await response.json();

        const media = (data.results || [])
          .filter(
            (item) =>
              (item.media_type === "movie" ||
                item.media_type === "tv") &&
              item.poster_path
          )
          .map((item) => ({
            ...item,
            title: item.title || item.name || "Untitled",
            mediaType: item.media_type,
            posterUrl: `${IMAGE_BASE_URL}${item.poster_path}`,
          }));

        setResults(media);
      } catch (err) {
        setError(err.message || "Something went wrong.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    searchMedia();
  }, [query]);

  const movies = results.filter(
    (item) => item.mediaType === "movie"
  );

  const shows = results.filter(
    (item) => item.mediaType === "tv"
  );

  return (
    <div className="min-h-screen bg-[#080d1a] text-white">
      <div className="hidden md:block">
        <SearchBar />
      </div>

      <div className="mt-0 p-6 md:mt-20 md:p-8">
        <p className="mb-8 text-sm text-slate-400">
          {query.trim() ? (
            <>
              Results for:{" "}
              <span className="font-semibold text-violet-400">
                {query}
              </span>
            </>
          ) : (
            "Enter a title to search for movies and TV series."
          )}
        </p>

        {loading ? (
          <p className="py-10 text-center text-slate-400">
            Searching movies and TV series...
          </p>
        ) : error ? (
          <div className="rounded-xl border border-red-500/30 bg-[#172033] p-6 text-center">
            <p className="text-red-300">{error}</p>
          </div>
        ) : results.length === 0 && query.trim() ? (
          <div className="rounded-xl border border-slate-700/70 bg-[#172033] p-8 text-center">
            <h2 className="text-xl font-semibold">
              No results found
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Try another movie or TV series title.
            </p>
          </div>
        ) : (
          <>
            {movies.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-5 text-2xl font-bold">
                  Movies
                </h2>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                  {movies.map((item) => (
                    <MovieCard
                      key={`movie-${item.id}`}
                      {...item}
                    />
                  ))}
                </div>
              </section>
            )}

            {shows.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-5 text-xl font-bold">
                  TV Series
                </h2>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                  {shows.map((item) => (
                    <MovieCard
                      key={`tv-${item.id}`}
                      {...item}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResults;

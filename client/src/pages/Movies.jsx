import { useEffect, useState } from "react";
import SearchBar from "../components/SearchBar";
import MovieCard from "../components/MovieCard";
import { getTrendingMovies, getImageUrl } from "../services/tmdb";

const genres = ["All", "Action", "Drama", "Sci-Fi"];

export default function Movies() {
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMovies() {
      try {
        setLoading(true);
        setError("");

        const data = await getTrendingMovies();

        // Remove duplicate movie IDs before rendering.
        const uniqueMovies = Array.from(
          new Map((data || []).map((movie) => [movie.id, movie])).values(),
        );

        setMovies(uniqueMovies);
      } catch (err) {
        console.error("Movies TMDB error:", err);
        setError("Could not load movies. Please check your TMDB setup.");
      } finally {
        setLoading(false);
      }
    }

    loadMovies();
  }, []);

  const filteredMovies =
    selectedGenre === "All"
      ? movies
      : movies.filter((movie) =>
          movie.genre_ids?.some((id) => {
            if (selectedGenre === "Action") return id === 28;
            if (selectedGenre === "Drama") return id === 18;
            if (selectedGenre === "Sci-Fi") return id === 878;
            return false;
          }),
        );

  return (
    <div className="min-h-screen">
      <div className="hidden md:block">
        <SearchBar />
      </div>

      <div className="mb-8 mt-0 px-5 md:mt-25">
        <h1 className="mt-5 text-3xl font-semibold sm:text-4xl">Movies</h1>

        <p className="mt-2 text-sm text-slate-400">
          Explore movies across different genres and discover stories worth
          watching.
        </p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2 px-5">
        {genres.map((genre) => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={`cursor-pointer rounded-full px-3 py-1 text-sm font-medium transition ${
              selectedGenre === genre
                ? "bg-violet-600 text-white"
                : "border border-slate-700 bg-slate-900 text-slate-300 hover:border-violet-500"
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="px-5 py-12 text-center text-slate-400">
          Loading movies...
        </p>
      ) : error ? (
        <p className="px-5 py-12 text-center text-red-400">{error}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 px-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filteredMovies.map((movie) => (
              <MovieCard
                key={`movie-${movie.id}`}
                id={movie.id}
                title={movie.title}
                year={movie.release_date?.slice(0, 4)}
                genre="Movie"
                image={getImageUrl(movie.poster_path)}
                mediaType="movie"
              />
            ))}
          </div>

          {filteredMovies.length === 0 && (
            <p className="py-12 text-center text-slate-400">
              No movies found in this genre.
            </p>
          )}
        </>
      )}
    </div>
  );
}

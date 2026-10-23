import { useEffect, useState } from "react";
import SearchBar from "../components/SearchBar";
import MovieCard from "../components/MovieCard";
import { getTrendingTV, getImageUrl } from "../services/tmdb";

const genres = [
  { name: "All", id: null },
  { name: "Action", id: 10759 },
  { name: "Crime", id: 80 },
  { name: "Drama", id: 18 },
  { name: "Fantasy", id: 10765 },
  { name: "Mystery", id: 9648 },
  { name: "Sci-Fi", id: 10765 },
];

export default function TVSeries() {
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchShows() {
      try {
        setLoading(true);
        setError("");

        const data = await getTrendingTV();

        const uniqueShows = Array.from(
          new Map(
            (Array.isArray(data) ? data : []).map((show) => [show.id, show]),
          ).values(),
        );

        if (!cancelled) {
          setShows(uniqueShows);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Unable to load TV series. Please try again.");
          console.error("TV series error:", err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchShows();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedGenreId = genres.find(
    (genre) => genre.name === selectedGenre,
  )?.id;

  const filteredShows =
    selectedGenre === "All"
      ? shows
      : shows.filter((show) => show.genre_ids?.includes(selectedGenreId));

  return (
    <div className="min-h-screen">
      <div className="hidden md:block">
        <SearchBar />
      </div>

      <div className="mb-8 mt-0 px-5 md:mt-25">
        <h1 className="mt-5 text-3xl font-semibold sm:text-4xl">TV Series</h1>

        <p className="mt-3 text-sm text-slate-400">
          Discover unforgettable characters, exciting mysteries, and series to
          binge-watch.
        </p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2 px-5">
        {genres.map((genre) => (
          <button
            key={genre.name}
            onClick={() => setSelectedGenre(genre.name)}
            className={`rounded-full px-4 py-1 text-sm font-medium transition ${
              selectedGenre === genre.name
                ? "bg-violet-600 text-white"
                : "border border-slate-700 bg-slate-900 text-slate-300 hover:border-violet-500"
            }`}
          >
            {genre.name}
          </button>
        ))}
      </div>

      {loading && (
        <p className="py-12 text-center text-slate-400">Loading TV series...</p>
      )}

      {error && <p className="py-12 text-center text-red-400">{error}</p>}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 px-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filteredShows.map((show) => (
              <MovieCard
                key={`tv-${show.id}`}
                id={show.id}
                title={show.name}
                year={show.first_air_date?.slice(0, 4)}
                genre="TV Series"
                image={getImageUrl(show.poster_path)}
                mediaType="tv"
              />
            ))}
          </div>

          {filteredShows.length === 0 && (
            <p className="py-12 text-center text-slate-400">
              No TV series found in this genre.
            </p>
          )}
        </>
      )}
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import SearchBar from "../components/SearchBar";
import MovieCard from "../components/MovieCard";
import {
  getTrendingMovies,
  getTrendingTV,
  getImageUrl,
} from "../services/tmdb";

function MovieSection({ title, items, loading, error, mediaType, onSeeAll }) {
  // Remove duplicate IDs before rendering cards.
  const uniqueItems = Array.from(
    new Map(items.map((item) => [item.id, item])).values(),
  );

  return (
    <section className="mx-5 mb-10">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>

        <button
          onClick={onSeeAll}
          className="cursor-pointer text-lg text-violet-400 hover:text-violet-300 active:underline active:scale-95"
        >
          See all
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading {title.toLowerCase()}...</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : uniqueItems.length === 0 ? (
        <p className="text-gray-400">No titles found.</p>
      ) : (
        <div className="flex gap-5 overflow-x-hidden pb-4">
          {uniqueItems.map((item) => (
            <div
              key={`${mediaType}-${item.id}`}
              className="w-40 shrink-0 sm:w-48"
            >
              <MovieCard
                id={item.id}
                title={mediaType === "movie" ? item.title : item.name}
                year={(mediaType === "movie"
                  ? item.release_date
                  : item.first_air_date
                )?.slice(0, 4)}
                genre={mediaType === "movie" ? "Movie" : "TV Series"}
                image={getImageUrl(item.poster_path)}
                mediaType={mediaType}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const Home = () => {
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bannerIndex, setBannerIndex] = useState(0);

  useEffect(() => {
    async function loadTrending() {
      try {
        setLoading(true);
        setError("");

        const [movieData, tvData] = await Promise.all([
          getTrendingMovies(),
          getTrendingTV(),
        ]);

        // Also remove duplicates from the source arrays.
        const uniqueMovies = Array.from(
          new Map(movieData.map((item) => [item.id, item])).values(),
        );

        const uniqueShows = Array.from(
          new Map(tvData.map((item) => [item.id, item])).values(),
        );

        setMovies(uniqueMovies);
        setShows(uniqueShows);

        setBannerIndex(
          uniqueMovies.length > 0
            ? Math.floor(Math.random() * uniqueMovies.length)
            : 0,
        );
      } catch (err) {
        console.error("TMDB error:", err);
        setError(
          "Could not load trending titles. Please check your TMDB setup.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadTrending();
  }, []);

  const bannerMovie = movies[bannerIndex] || movies[0];

  const bannerTitle = bannerMovie?.title || "Discover Movies";
  const bannerOverview =
    bannerMovie?.overview || "Explore trending movies and TV shows.";
  const bannerImage = getImageUrl(bannerMovie?.backdrop_path, "original");

  return (
    <div>
      <div className="hidden md:block">
        <SearchBar />
      </div>

      <section className="relative mt-0 mb-5 flex min-h-96 items-end overflow-hidden bg-slate-900 p-6 md:mt-15 sm:p-10">
        {bannerImage && (
          <img
            key={bannerMovie?.id}
            src={bannerImage}
            alt={bannerTitle}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
          />
        )}

        <div className="pointer-events-none absolute inset-0 z-0 bg-linear-to-r from-[#080d1a] via-[#080d1a]/80 to-transparent" />

        <div className="relative z-10 max-w-lg">
          <h1 className="text-3xl font-semibold sm:text-5xl">{bannerTitle}</h1>

          <p className="mt-3 text-sm leading-6 text-slate-200">
            {bannerOverview}
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/movies")}
              className="mt-5 cursor-pointer rounded-full border-2 border-violet-700 bg-violet-600 px-5 py-2.5 text-sm font-semibold hover:bg-violet-500 active:scale-95"
            >
              Explore Movies
            </button>

            <button
              onClick={() => {
                if (bannerMovie?.id) {
                  navigate(`/movies/${bannerMovie.id}`);
                }
              }}
              disabled={!bannerMovie?.id}
              className="mt-5 cursor-pointer rounded-full border-2 border-slate-600 px-5 py-2.5 text-sm font-semibold hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              More Info
            </button>
          </div>
        </div>
      </section>

      <MovieSection
        title="Trending Movies"
        items={movies}
        loading={loading}
        error={error}
        mediaType="movie"
        onSeeAll={() => navigate("/movies")}
      />

      <MovieSection
        title="Trending TV Series"
        items={shows}
        loading={loading}
        error={error}
        mediaType="tv"
        onSeeAll={() => navigate("/tv-series")}
      />
    </div>
  );
};

export default Home;

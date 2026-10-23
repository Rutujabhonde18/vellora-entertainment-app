import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Play,
  Bookmark,
  Star,
  Clock3,
  CalendarDays,
  Users,
  X,
  ExternalLink,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import SearchBar from "../components/SearchBar";
import MovieCard from "../components/MovieCard";
import { toggleBookmark } from "../redux/bookmarkSlice";
import {
  getMovieDetails,
  getMovieCredits,
  getImageUrl,
  getSimilarMovies,
  getMovieVideos,
  getMovieWatchProviders,
} from "../services/tmdb";

const PROFILE_BASE_URL = "https://image.tmdb.org/t/p/w185";
const BACKDROP_BASE_URL = "https://image.tmdb.org/t/p/w1280";

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const bookmarks = useSelector((state) => state.bookmarks);

  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showWatchModal, setShowWatchModal] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);
  const [trailer, setTrailer] = useState(null);
  const [watchProviders, setWatchProviders] = useState(null);
  const [watchError, setWatchError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMovie() {
      try {
        setLoading(true);
        setError("");
        setMovie(null);
        setCast([]);
        setSimilarMovies([]);

        const data = await getMovieDetails(id);

        if (!active) return;

        setMovie({
          ...data,
          id: data.id,
          title: data.title,
          year: data.release_date?.slice(0, 4),
          image: getImageUrl(data.poster_path),
          rating: Number(data.vote_average || 0).toFixed(1),
          genres: data.genres || [],
          mediaType: "movie",
        });

        const results = await Promise.allSettled([
          getMovieCredits(id),
          getSimilarMovies(id),
        ]);

        if (!active) return;

        if (results[0].status === "fulfilled") {
          setCast((results[0].value.cast || []).slice(0, 12));
        } else {
          console.error("Movie cast error:", results[0].reason);
        }

        if (results[1].status === "fulfilled") {
          const unique = Array.from(
            new Map(
              (results[1].value || []).map((item) => [item.id, item]),
            ).values(),
          );
          setSimilarMovies(unique);
        } else {
          console.error("Similar movies error:", results[1].reason);
        }
      } catch (err) {
        console.error("Movie details error:", err);
        if (active) {
          setError("Could not load movie details. Please try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMovie();

    return () => {
      active = false;
    };
  }, [id]);

  async function openWatchOptions() {
    setShowWatchModal(true);
    setWatchLoading(true);
    setWatchError("");
    setTrailer(null);
    setWatchProviders(null);

    try {
      const [videosResult, providersResult] = await Promise.allSettled([
        getMovieVideos(id),
        getMovieWatchProviders(id, "IN"),
      ]);

      if (videosResult.status === "fulfilled") {
        const videos = videosResult.value || [];

        const selectedTrailer =
          videos.find(
            (video) =>
              video.site === "YouTube" &&
              video.type === "Trailer" &&
              video.official,
          ) ||
          videos.find(
            (video) => video.site === "YouTube" && video.type === "Trailer",
          ) ||
          videos.find(
            (video) => video.site === "YouTube" && video.type === "Teaser",
          );

        setTrailer(selectedTrailer || null);
      }

      if (providersResult.status === "fulfilled") {
        setWatchProviders(providersResult.value);
      }

      if (
        videosResult.status === "rejected" &&
        providersResult.status === "rejected"
      ) {
        setWatchError("Watch information is temporarily unavailable.");
      }
    } catch (err) {
      console.error("Watch options error:", err);
      setWatchError("Could not load watch options. Please try again.");
    } finally {
      setWatchLoading(false);
    }
  }

  const isBookmarked = movie
    ? bookmarks.some(
        (item) =>
          String(item.id) === String(movie.id) && item.mediaType === "movie",
      )
    : false;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080d1a] p-8 text-white">
        <p className="animate-pulse text-slate-300">Loading movie details...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-[#080d1a] p-8 text-white">
        <h1 className="text-2xl font-bold">{error || "Movie not found"}</h1>
        <button
          onClick={() => navigate("/movies")}
          className="mt-5 rounded-full bg-violet-600 px-5 py-2"
        >
          Back to Movies
        </button>
      </div>
    );
  }

  const providerGroups = [
    ["Stream", watchProviders?.flatrate],
    ["Rent", watchProviders?.rent],
    ["Buy", watchProviders?.buy],
  ];

  const hasProviders = providerGroups.some(
    ([, providers]) => providers?.length > 0,
  );

  return (
    <div className="min-h-screen overflow-hidden bg-[#080d1a] pb-12 text-white">
      <div className="hidden md:block">
        <SearchBar />
      </div>

      {/* Cinematic hero */}
      <section className="relative isolate min-h-560px overflow-hidden md:mt-16">
        {movie.backdrop_path && (
          <img
            src={`${BACKDROP_BASE_URL}${movie.backdrop_path}`}
            alt=""
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          />
        )}

        <div className="absolute inset-0 -z-10 bg-linear-to-r from-[#080d1a] via-[#080d1a]/90 to-[#080d1a]/45" />
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-[#080d1a] via-transparent to-[#080d1a]/30" />

        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
            {movie.image && (
              <img
                src={movie.image}
                alt={movie.title}
                className="h-80 w-auto rounded-xl shadow-2xl shadow-black/50 lg:w-64"
              />
            )}

            <div className="max-w-3xl">
              <h1 className="text-xl font-semibold sm:text-5xl lg:text-5xl">
                {movie.title}
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-slate-300">
                {movie.year && (
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={16} />
                    {movie.year}
                  </span>
                )}

                {movie.runtime > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Clock3 size={16} />
                    {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                  </span>
                )}

                {Number(movie.vote_average) > 0 && (
                  <span className="flex items-center gap-1.5 font-semibold text-yellow-400">
                    <Star size={17} fill="currentColor" />
                    {movie.rating}
                    <span className="font-normal text-slate-400">/ 10</span>
                  </span>
                )}
              </div>

              {movie.genres?.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {movie.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="rounded-full border border-violet-300/30 bg-violet-500/15 px-3 py-1.5 text-xs font-medium text-violet-100"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              {movie.tagline && (
                <p className="mt-5 italic text-slate-300">“{movie.tagline}”</p>
              )}

              <h2 className="mt-6 text-xl font-bold">Overview</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                {movie.overview || "No overview is available for this movie."}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  onClick={openWatchOptions}
                  className="flex cursor-pointer items-center gap-2 rounded-full bg-violet-600 px-4 py-3 text-sm font-semibold transition hover:bg-violet-500"
                >
                  <Play size={18} fill="currentColor" />
                  Watch Now
                </button>

                <button
                  onClick={() =>
                    dispatch(
                      toggleBookmark({
                        id: movie.id,
                        title: movie.title,
                        year: movie.year,
                        genre: movie.genres.map((g) => g.name).join(", "),
                        image: movie.image,
                        rating: movie.rating,
                        overview: movie.overview,
                        mediaType: "movie",
                      }),
                    )
                  }
                  className="flex cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-black/20 px-4 py-3 text-sm font-semibold transition hover:border-violet-400 hover:bg-white/10"
                >
                  <Bookmark
                    size={18}
                    fill={isBookmarked ? "currentColor" : "none"}
                  />
                  {isBookmarked ? "Remove Bookmark" : "Add to Bookmark"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cast */}
      <section className="mx-auto max-w-7xl px-5">
        <div className="mb-5 flex items-center gap-3">
          <Users className="text-violet-400" size={23} />
          <h2 className="text-2xl font-bold">Top Cast</h2>
        </div>

        {cast.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-5">
            {cast.map((person) => (
              <div
                key={person.cast_id ?? `${person.id}-${person.credit_id}`}
                className="w-32 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#111a2b] transition hover:-translate-y-1 hover:border-violet-400/50 sm:w-36"
              >
                {person.profile_path ? (
                  <img
                    src={`${PROFILE_BASE_URL}${person.profile_path}`}
                    alt={person.name}
                    loading="lazy"
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center bg-slate-800 text-3xl text-slate-500">
                    <Users size={32} />
                  </div>
                )}

                <div className="p-3">
                  <p className="line-clamp-2 text-sm font-semibold">
                    {person.name}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                    {person.character || "Cast member"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            Cast information is not available for this title.
          </p>
        )}
      </section>

      {/* Similar movies */}
      <section className="mx-auto mt-10 max-w-7xl px-5 sm:px-8">
        <h2 className="mb-5 text-2xl font-bold">You May Also Like</h2>

        {similarMovies.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {similarMovies.map((item) => (
              <div key={`similar-${item.id}`} className="min-w-0">
                <MovieCard
                  id={item.id}
                  title={item.title}
                  year={item.release_date?.slice(0, 4)}
                  genre="Movie"
                  image={getImageUrl(item.poster_path)}
                  mediaType="movie"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            No similar movies are available right now.
          </p>
        )}
      </section>

      {/* Watch options modal */}
      {showWatchModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setShowWatchModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Watch options for ${movie.title}`}
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-[#111a2b] p-5 shadow-2xl sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Watch {movie.title}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Trailers and streaming options in India
                </p>
              </div>

              <button
                onClick={() => setShowWatchModal(false)}
                aria-label="Close watch options"
                className="rounded-full p-2 text-slate-300 hover:bg-white/10"
              >
                <X size={22} />
              </button>
            </div>

            {watchLoading ? (
              <p className="animate-pulse py-8 text-slate-300">
                Loading watch options...
              </p>
            ) : (
              <>
                {watchError && (
                  <p className="mb-4 text-sm text-amber-300">{watchError}</p>
                )}

                <section>
                  <h3 className="mb-3 text-lg font-semibold">
                    Official trailer
                  </h3>

                  {trailer ? (
                    <div className="aspect-video overflow-hidden rounded-xl bg-black">
                      <iframe
                        title={`${movie.title} trailer`}
                        src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(
                          trailer.key,
                        )}`}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <p className="rounded-xl bg-white/5 p-4 text-sm text-slate-400">
                      No YouTube trailer is available in TMDB for this movie.
                    </p>
                  )}
                </section>

                <section className="mt-7">
                  <h3 className="mb-3 text-lg font-semibold">Where to watch</h3>

                  {hasProviders ? (
                    <div className="space-y-5">
                      {providerGroups.map(([heading, providers]) =>
                        providers?.length ? (
                          <div key={heading}>
                            <h4 className="mb-2 text-sm font-medium text-slate-400">
                              {heading}
                            </h4>

                            <div className="flex flex-wrap gap-3">
                              {providers.map((provider) => (
                                <div
                                  key={provider.provider_id}
                                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2"
                                >
                                  {provider.logo_path && (
                                    <img
                                      src={getImageUrl(
                                        provider.logo_path,
                                        "w92",
                                      )}
                                      alt=""
                                      className="h-9 w-9 rounded-lg object-cover"
                                    />
                                  )}

                                  <span className="text-sm">
                                    {provider.provider_name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null,
                      )}

                      {watchProviders?.link && (
                        <a
                          href={watchProviders.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold hover:bg-violet-500"
                        >
                          View streaming options
                          <ExternalLink size={16} />
                        </a>
                      )}

                      <p className="text-xs leading-5 text-slate-500">
                        Availability and prices can change. Provider information
                        is supplied by TMDB and JustWatch.
                      </p>
                    </div>
                  ) : (
                    <p className="rounded-xl bg-white/5 p-4 text-sm text-slate-400">
                      No streaming providers are currently listed for this movie
                      in India. Check again later.
                    </p>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

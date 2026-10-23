import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Play,
  Bookmark,
  Star,
  CalendarDays,
  Clock3,
  X,
  ExternalLink,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import SearchBar from "../components/SearchBar";
import MovieCard from "../components/MovieCard";
import {
  getTVDetails,
  getTVCredits,
  getSimilarTV,
  getImageUrl,
  getTVVideos,
  getTVWatchProviders,
} from "../services/tmdb";
import { toggleBookmark } from "../redux/bookmarkSlice";

export default function TVDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [season, setSeason] = useState(1);
  const [show, setShow] = useState(null);
  const [cast, setCast] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [showAllEpisodes, setShowAllEpisodes] = useState(false);
  const [similarShows, setSimilarShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [error, setError] = useState("");

  // Watch Now state
  const [watchModalOpen, setWatchModalOpen] = useState(false);
  const [trailer, setTrailer] = useState(null);
  const [watchProviders, setWatchProviders] = useState(null);
  const [watchLoading, setWatchLoading] = useState(false);
  const [watchError, setWatchError] = useState("");

  const bookmarks = useSelector((state) => state.bookmarks);

  // Load series details, cast and similar series.
  useEffect(() => {
    let cancelled = false;

    async function loadShow() {
      setLoading(true);
      setError("");
      setShow(null);
      setCast([]);
      setSimilarShows([]);

      try {
        const [detailsResult, creditsResult, similarResult] =
          await Promise.allSettled([
            getTVDetails(id),
            getTVCredits(id),
            getSimilarTV(id),
          ]);

        if (cancelled) return;

        if (detailsResult.status !== "fulfilled") {
          throw detailsResult.reason;
        }

        const details = detailsResult.value;
        setShow(details);

        setSeason(
          details.seasons?.some((item) => item.season_number === 1)
            ? 1
            : (details.seasons?.find((item) => item.season_number > 0)
                ?.season_number ?? 1),
        );

        if (creditsResult.status === "fulfilled") {
          setCast(creditsResult.value.cast?.slice(0, 12) || []);
        }

        if (similarResult.status === "fulfilled") {
          const uniqueShows = Array.from(
            new Map(
              (similarResult.value || [])
                .filter((item) => item.id !== details.id)
                .map((item) => [item.id, item]),
            ).values(),
          );

          setSimilarShows(uniqueShows);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("TV details error:", err);
          setError("Could not load this TV series. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadShow();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Load episodes for the selected season.
  useEffect(() => {
    if (!show || String(show.id) !== String(id)) return;

    let cancelled = false;

    async function loadEpisodes() {
      setEpisodesLoading(true);
      setEpisodes([]);
      setShowAllEpisodes(false);

      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/tv/${id}/season/${season}?language=en-US`,
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_TMDB_ACCESS_TOKEN}`,
              accept: "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error("Could not load episodes.");
        }

        const data = await response.json();

        if (!cancelled) {
          setEpisodes(data.episodes || []);
        }
      } catch (err) {
        console.error("Episode loading error:", err);

        if (!cancelled) setEpisodes([]);
      } finally {
        if (!cancelled) setEpisodesLoading(false);
      }
    }

    loadEpisodes();

    return () => {
      cancelled = true;
    };
  }, [id, season, show]);

  // Load trailer and India watch providers when Watch Now is clicked.
  async function handleWatchNow() {
    setWatchModalOpen(true);
    setWatchLoading(true);
    setWatchError("");
    setTrailer(null);
    setWatchProviders(null);

    try {
      const [videosResult, providersResult] = await Promise.allSettled([
        getTVVideos(id),
        getTVWatchProviders(id, "IN"),
      ]);

      if (videosResult.status === "fulfilled") {
        const videos = videosResult.value || [];

        const youtubeVideos = videos.filter(
          (video) => video.site === "YouTube" && video.key,
        );

        const selectedTrailer =
          youtubeVideos.find(
            (video) => video.type === "Trailer" && video.official === true,
          ) ||
          youtubeVideos.find((video) => video.type === "Trailer") ||
          youtubeVideos.find((video) => video.type === "Teaser") ||
          null;

        setTrailer(selectedTrailer);
      }

      if (providersResult.status === "fulfilled") {
        setWatchProviders(providersResult.value);
      }

      if (
        videosResult.status === "rejected" &&
        providersResult.status === "rejected"
      ) {
        setWatchError(
          "We couldn't load viewing options right now. Please try again.",
        );
      }
    } catch (err) {
      console.error("Watch options error:", err);
      setWatchError("Could not load viewing options. Please try again.");
    } finally {
      setWatchLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080d1a] text-white">
        <SearchBar />
        <p className="p-8 text-slate-400">Loading TV series...</p>
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="min-h-screen bg-[#080d1a] text-white">
        <SearchBar />
        <div className="p-8">
          <h1 className="text-2xl font-bold">TV series not found</h1>
          <p className="mt-2 text-slate-400">
            {error || "This TV series could not be found."}
          </p>
          <button
            onClick={() => navigate("/tv-series")}
            className="mt-4 rounded-full bg-violet-600 px-5 py-2 font-semibold hover:bg-violet-500"
          >
            Back to TV Series
          </button>
        </div>
      </div>
    );
  }

  const title = show.name || "Untitled TV Series";
  const year = show.first_air_date?.slice(0, 4);
  const rating =
    typeof show.vote_average === "number"
      ? show.vote_average.toFixed(1)
      : "N/A";
  const image = getImageUrl(show.poster_path);
  const backdrop = getImageUrl(show.backdrop_path, "w1280");

  const isBookmarked = bookmarks.some(
    (item) => String(item.id) === String(show.id) && item.mediaType === "tv",
  );

  const bookmarkItem = {
    id: show.id,
    title,
    name: title,
    mediaType: "tv",
    image,
    year,
    rating,
    genre: "TV Series",
  };

  const availableSeasons =
    show.seasons?.filter((item) => item.season_number > 0) || [];

  const providerGroups = [
    { label: "Stream", providers: watchProviders?.flatrate || [] },
    { label: "Rent", providers: watchProviders?.rent || [] },
    { label: "Buy", providers: watchProviders?.buy || [] },
  ].filter((group) => group.providers.length > 0);

  return (
    <div className="min-h-screen bg-[#080d1a] text-white">
      <div className="hidden md:block">
        <SearchBar />
      </div>

      {/* Cinematic series hero */}
      <section className="relative isolate overflow-hidden bg-[#101827]">
        {backdrop && (
          <img
            src={backdrop}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center opacity-30"
          />
        )}

        <div className="absolute inset-0 bg-linear-to-r from-[#080d1a] via-[#080d1a]/90 to-[#080d1a]/50" />
        <div className="absolute inset-0 bg-linear-to-t from-[#080d1a] via-transparent to-[#080d1a]/20" />

        <div className="relative mx-auto flex max-w-7xl flex-col gap-7 px-5 py-2 sm:px-8 md:flex-row md:items-center md:py-5 sm:mt-5 lg:mt-10">
          {image ? (
            <img
              src={image}
              alt={title}
              className="sm:w-80 h-80 lg:h-96 self-center rounded-xl shadow-2xl ring-1 ring-white/10 lg:w-auto md:self-auto"
            />
          ) : (
            <div className="flex h-64 w-44 items-center justify-center rounded-xl bg-slate-800 text-slate-400 sm:w-52 md:w-60">
              No poster available
            </div>
          )}

          <div className="max-w-3xl lg:mt-10">
            <h1 className="text-3xl font-semibold sm:text-5xl lg:text-5xl">
              {title}
            </h1>

            {show.tagline && (
              <p className="mt-3 italic text-slate-300">“{show.tagline}”</p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-slate-300">
              {year && (
                <span className="flex items-center gap-2">
                  <CalendarDays size={16} />
                  {year}
                </span>
              )}

              <span className="flex items-center gap-1.5 font-semibold text-yellow-400">
                <Star size={17} fill="currentColor" />
                {rating}
                <span className="font-normal text-slate-400">/ 10</span>
              </span>

              <span className="rounded-full border border-slate-600 px-3 py-1">
                TV Series
              </span>

              <span>
                {show.number_of_seasons ?? availableSeasons.length} seasons
              </span>

              <span>{show.number_of_episodes ?? 0} episodes</span>

              {show.status && (
                <span className="rounded-full bg-white/10 px-3 py-1">
                  {show.status}
                </span>
              )}
            </div>

            {show.genres?.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {show.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="rounded-full border border-violet-400/40 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-200"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              {show.overview || "No description is available for this series."}
            </p>

            {show.networks?.length > 0 && (
              <p className="mt-3 text-sm text-slate-400">
                Network:{" "}
                {show.networks.map((network) => network.name).join(", ")}
              </p>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={handleWatchNow}
                className="flex items-center cursor-pointer gap-2 rounded-full bg-violet-600 px-4 py-3 text-sm font-bold transition hover:bg-violet-500 active:scale-95"
              >
                <Play size={18} fill="currentColor" />
                Watch Now
              </button>

              <button
                onClick={() => dispatch(toggleBookmark(bookmarkItem))}
                className="flex items-center cursor-pointer gap-2 rounded-full border border-slate-600 bg-black/20 px-4 py-3 text-sm font-semibold transition hover:border-violet-400 hover:bg-violet-500/10 active:scale-95"
              >
                <Bookmark
                  size={18}
                  fill={isBookmarked ? "currentColor" : "none"}
                />
                {isBookmarked ? "Remove Bookmark" : "Add to Bookmark"}
              </button>
            </div>

            {availableSeasons.length > 0 && (
              <div className="mt-8">
                <h2 className="mb-3 text-lg font-semibold">Select Season</h2>

                <div className="flex flex-wrap gap-2">
                  {availableSeasons.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSeason(item.season_number)}
                      className={`rounded-full cursor-pointer px-4 py-2 text-sm font-semibold transition active:scale-95 ${
                        season === item.season_number
                          ? "bg-violet-600 text-white"
                          : "border border-slate-700 text-slate-300 hover:border-violet-500"
                      }`}
                    >
                      Season {item.season_number}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Cast */}
      {cast.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 sm:px-8">
          <h2 className="mb-5 text-2xl font-bold">Top Cast</h2>

          <div className="flex gap-4 overflow-x-auto pb-4">
            {cast.map((person) => (
              <div key={person.id} className="w-28 shrink-0 sm:w-32">
                {person.profile_path ? (
                  <img
                    src={getImageUrl(person.profile_path, "w185")}
                    alt={person.name}
                    loading="lazy"
                    className="h-36 w-full rounded-xl object-cover sm:h-40"
                  />
                ) : (
                  <div className="flex h-36 items-center justify-center rounded-xl bg-slate-800 text-xs text-slate-400 sm:h-40">
                    No photo
                  </div>
                )}

                <p className="mt-2 line-clamp-2 text-sm font-semibold">
                  {person.name}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                  {person.character || "Cast member"}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Episodes */}
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">Season {season} Episodes</h2>
          <span className="text-sm text-slate-400">
            {episodes.length} episodes listed
          </span>
        </div>

        {episodesLoading ? (
          <p className="text-slate-400">Loading episodes...</p>
        ) : episodes.length === 0 ? (
          <p className="rounded-xl border border-slate-800 bg-[#101827] p-5 text-slate-400">
            No episodes available for this season.
          </p>
        ) : (
          <div className="space-y-4">
            {(showAllEpisodes ? episodes : episodes.slice(0, 3)).map(
              (episode) => (
                <article
                  key={episode.id}
                  className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-[#101827] p-4 transition hover:border-slate-700 sm:flex-row"
                >
                  {episode.still_path ? (
                    <img
                      src={getImageUrl(episode.still_path, "w500")}
                      alt={episode.name || "Episode still"}
                      loading="lazy"
                      className="w-full rounded-lg object-cover sm:w-56 sm:self-start"
                    />
                  ) : (
                    <div className="flex h-32 w-full items-center justify-center rounded-lg bg-slate-800 text-sm text-slate-400 sm:w-56">
                      No episode image
                    </div>
                  )}

                  <div className="flex-1">
                    <h3 className="text-base font-bold sm:text-lg">
                      Episode {episode.episode_number}: {episode.name}
                    </h3>

                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400 sm:text-sm">
                      {episode.air_date && (
                        <span className="flex items-center gap-1.5">
                          <CalendarDays size={14} />
                          {episode.air_date}
                        </span>
                      )}

                      {episode.runtime && (
                        <span className="flex items-center gap-1.5">
                          <Clock3 size={14} />
                          {episode.runtime} minutes
                        </span>
                      )}

                      {typeof episode.vote_average === "number" &&
                        episode.vote_average > 0 && (
                          <span className="flex items-center gap-1.5 text-yellow-400">
                            <Star size={14} fill="currentColor" />
                            {episode.vote_average.toFixed(1)}
                          </span>
                        )}
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {episode.overview || "No episode description available."}
                    </p>
                  </div>
                </article>
              ),
            )}
          </div>
        )}

        {!episodesLoading && episodes.length > 3 && (
          <button
            onClick={() => setShowAllEpisodes((previous) => !previous)}
            className="mt-5 rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-300 transition hover:border-violet-500 hover:text-white"
          >
            {showAllEpisodes ? "View Less" : "View More"}
          </button>
        )}
      </section>

      {/* Similar series */}
      {similarShows.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pb-12 sm:px-8">
          <h2 className="mb-6 text-2xl font-bold">Similar TV Series</h2>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {similarShows.slice(0, 12).map((item) => (
              <MovieCard
                key={`tv-${item.id}`}
                id={item.id}
                title={item.name}
                year={item.first_air_date?.slice(0, 4)}
                genre="TV Series"
                image={getImageUrl(item.poster_path)}
                mediaType="tv"
              />
            ))}
          </div>
        </section>
      )}

      {/* Watch Now modal */}
      {watchModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setWatchModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="watch-modal-title"
            className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-700 bg-[#101827] p-5 shadow-2xl sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={() => setWatchModalOpen(false)}
              aria-label="Close watch options"
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <X size={21} />
            </button>

            <h2 id="watch-modal-title" className="pr-10 text-2xl font-bold">
              Watch {title}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Trailer and viewing options available in India
            </p>

            {watchLoading ? (
              <p className="py-10 text-center text-slate-300">
                Loading watch options...
              </p>
            ) : (
              <div className="mt-6 space-y-7">
                {watchError && (
                  <p className="rounded-lg bg-red-500/10 p-4 text-sm text-red-300">
                    {watchError}
                  </p>
                )}

                {trailer && (
                  <section>
                    <h3 className="mb-3 text-lg font-semibold">
                      Official Trailer
                    </h3>
                    <div className="aspect-video overflow-hidden rounded-xl bg-black">
                      <iframe
                        className="h-full w-full"
                        src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(trailer.key)}`}
                        title={`${title} trailer`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Trailer provided by YouTube.
                    </p>
                  </section>
                )}

                {providerGroups.length > 0 && (
                  <section>
                    <h3 className="mb-3 text-lg font-semibold">
                      Where to Watch in India
                    </h3>

                    <div className="space-y-5">
                      {providerGroups.map((group) => (
                        <div key={group.label}>
                          <p className="mb-2 text-sm font-medium text-slate-400">
                            {group.label}
                          </p>
                          <div className="flex flex-wrap gap-3">
                            {group.providers.map((provider) => (
                              <div
                                key={`${group.label}-${provider.provider_id}`}
                                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-black/20 px-3 py-2"
                              >
                                {provider.logo_path && (
                                  <img
                                    src={getImageUrl(provider.logo_path, "w92")}
                                    alt=""
                                    className="h-8 w-8 rounded-lg object-cover"
                                    loading="lazy"
                                  />
                                )}
                                <span className="text-sm font-medium">
                                  {provider.provider_name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {watchProviders?.link && (
                      <a
                        href={watchProviders.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-3 text-sm font-bold transition hover:bg-violet-500"
                      >
                        View Streaming Options
                        <ExternalLink size={16} />
                      </a>
                    )}

                    <p className="mt-3 text-xs leading-5 text-slate-400">
                      Availability may change. Check the provider's page for
                      current details.
                    </p>
                  </section>
                )}

                {!trailer && providerGroups.length === 0 && (
                  <p className="rounded-xl border border-slate-700 bg-black/20 p-5 text-sm leading-6 text-slate-300">
                    No trailer or streaming providers are currently listed for
                    this series in TMDB. You can try searching for the series on
                    a streaming service.
                  </p>
                )}

                {!trailer && providerGroups.length > 0 && (
                  <p className="text-sm text-slate-400">
                    No trailer is currently listed for this series.
                  </p>
                )}

                {trailer && providerGroups.length === 0 && (
                  <p className="text-sm text-slate-400">
                    No streaming providers are currently listed for India.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

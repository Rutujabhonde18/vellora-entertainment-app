import { useState } from "react";
import { Search, Sparkles, X, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { discoverMoviesByGenre, getImageUrl } from "../services/tmdb";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hey movie lover! 🍿 How are you feeling today? Pick a mood and I'll recommend movies for you!",
    },
  ]);
  const navigate = useNavigate();

  // Movie genres for each mood
  const moods = [
    { label: "Happy 😊", genres: [35, 10751] },
    { label: "Sad 😔", genres: [18, 35] },
    { label: "Thrilled 🔥", genres: [28, 53, 9648] },
    { label: "Romantic ❤️", genres: [10749, 35] },
    { label: "Scared 👻", genres: [27, 9648] },
    { label: "Mind-blown 🤯", genres: [878, 9648] },
  ];

  const [loading, setLoading] = useState(false);

  // Navigate to search results
  const handleSearch = (e) => {
    e.preventDefault();
    const searchQuery = query.trim();
    if (!searchQuery) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  // Fetch movie recommendations based on the selected mood
  const chooseMood = async (mood) => {
    if (loading) return;

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: mood.label },
      { sender: "bot", text: "Finding movies that match your mood... 🍿" },
    ]);
    setLoading(true);

    try {
      const results = await Promise.all(
        mood.genres.map((genre) => discoverMoviesByGenre(genre)),
      );

      // Remove duplicate movies and sort by popularity
      const uniqueMovies = new Map();

      results.flat().forEach((movie) => {
        if (!uniqueMovies.has(movie.id)) {
          uniqueMovies.set(movie.id, movie);
        }
      });

      const movies = Array.from(uniqueMovies.values())
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 6);

      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          sender: "bot",
          text: movies.length
            ? "Here are some movies for your mood! Tap a poster to see its details."
            : "I couldn't find movies for that mood. Try another one!",
          movies,
        },
      ]);
    } catch (error) {
      console.error("MoodFlix error:", error);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          sender: "bot",
          text: "I couldn't load recommendations. Check your TMDB token and internet connection, then try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Generate a movie poster URL
  const imageUrl = (path) => getImageUrl(path, "w342") || null;

  return (
    <div className="relative flex w-full min-w-0 items-center gap-3 bg-transparent px-0 py-0 md:fixed md:left-64 md:right-0 md:top-0 md:z-40 md:w-auto md:border-b md:border-slate-700/70 md:bg-[#080d1a] md:px-5 md:py-4">
      <form
        onSubmit={handleSearch}
        className="flex min-w-0 flex-1 items-center rounded-full border border-slate-700 bg-[#172033] px-3 py-2.5 focus-within:border-violet-500 md:px-4 md:py-3"
      >
        <Search size={19} className="shrink-0 text-slate-400" />

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for movies, TV series..."
          aria-label="Search movies and TV series"
          className="ml-3 w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
        />
      </form>

      {/* Toggle the MoodFlix chatbot */}
      <button
        type="button"
        onClick={() => setChatOpen((open) => !open)}
        aria-label="Open MoodFlix chatbot"
        title="MoodFlix — Find movies by mood"
        className="flex cursor-pointer shrink-0 items-center gap-2 rounded-full bg-violet-600 px-3 py-3 text-white shadow-lg transition hover:bg-violet-500 sm:px-4"
      >
        <Sparkles size={18} />
      </button>

      {/* Chatbot window */}
      {chatOpen && (
        <div className="fixed bottom-4 right-3 z-100 flex h-[min(650px,80vh)] w-[min(390px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#101827] shadow-2xl sm:bottom-6 sm:right-6">
          <div className="flex items-center justify-between border-b border-slate-700 bg-violet-600/15 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-violet-600 p-2">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="font-bold text-white">MoodFlix</h2>
                <p className="text-xs text-slate-400">
                  Your personal movie buddy
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              aria-label="Close chatbot"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Display chatbot messages and recommendations */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[95%] rounded-xl p-3 ${
                    message.sender === "user"
                      ? "bg-violet-600 text-white"
                      : "border border-slate-700 bg-[#080d1a] text-slate-200"
                  }`}
                >
                  <p className="text-sm leading-5">{message.text}</p>

                  {message.movies && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {message.movies.map((movie) => (
                        <button
                          key={movie.id}
                          type="button"
                          onClick={() => {
                            setChatOpen(false);
                            navigate(`/movies/${movie.id}`);
                          }}
                          className="overflow-hidden rounded-lg border border-slate-700 text-left transition hover:border-violet-400"
                        >
                          {imageUrl(movie.poster_path) ? (
                            <img
                              src={imageUrl(movie.poster_path)}
                              alt={movie.title}
                              loading="lazy"
                              className="aspect-2/3 w-full object-cover"
                            />
                          ) : (
                            <div className="flex aspect-2/3 items-center justify-center bg-slate-800 text-xs text-slate-400">
                              No poster
                            </div>
                          )}
                          <div className="p-2">
                            <p className="line-clamp-2 text-xs font-semibold text-white">
                              {movie.title}
                            </p>
                            <p className="mt-1 text-xs text-yellow-400">
                              ★ {movie.vote_average?.toFixed(1) || "N/A"}
                            </p>
                            <p className="text-xs text-slate-400">
                              {movie.release_date?.slice(0, 4) ||
                                "Year unknown"}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <p className="text-xs text-violet-300">
                Finding recommendations...
              </p>
            )}
          </div>

          {/* Let users select their current mood */}
          <div className="border-t border-slate-700 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-300">
              How are you feeling?
            </p>
            <div className="flex flex-wrap gap-2">
              {moods.map((mood) => (
                <button
                  key={mood.label}
                  type="button"
                  disabled={loading}
                  onClick={() => chooseMood(mood)}
                  className="rounded-full border border-slate-700 px-3 py-2 text-xs text-slate-200 transition hover:border-violet-500 hover:bg-violet-500/10 disabled:opacity-50"
                >
                  {mood.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;

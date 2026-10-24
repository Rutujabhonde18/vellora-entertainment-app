import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Sparkles, Film } from "lucide-react";
import { searchMovies, searchTV, getImageUrl } from "../services/tmdb";

// Available moods and their related movie genres
const moods = [
  {
    label: "Happy 😊",
    value: "happy",
    genres: [35, 10751],
    message: "Let's keep the good vibes going!",
  },
  {
    label: "Sad 😔",
    value: "sad",
    genres: [35, 18],
    message: "Let's find something comforting.",
  },
  {
    label: "Thrilled 😈",
    value: "thrilled",
    genres: [28, 53, 9648],
    message: "Ready for some suspense and action?",
  },
  {
    label: "Romantic ❤️",
    value: "romantic",
    genres: [10749, 35],
    message: "Time for a little romance!",
  },
  {
    label: "Scared 👻",
    value: "scared",
    genres: [27, 9648],
    message: "How about a spooky movie night?",
  },
  {
    label: "Mind-blown 🤯",
    value: "mindblown",
    genres: [878, 9648, 53],
    message: "Let's find something that makes you think.",
  },
];

export default function MoodChatbot() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hey movie lover! 🍿 How are you feeling today? Choose a mood and I'll find something to watch.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  // Fetch movie recommendations based on the selected mood
  async function chooseMood(mood) {
    if (loading) return;

    setMessages((previous) => [
      ...previous,
      { sender: "user", text: mood.label },
      { sender: "bot", text: mood.message },
    ]);
    setLoading(true);

    try {
      const [movieResults, tvResults] = await Promise.allSettled([
        searchMovies(""),
        searchTV(""),
      ]);

      // Fetch popular movies matching the selected genres
      const token = import.meta.env.VITE_TMDB_ACCESS_TOKEN;
      const headers = {
        Authorization: `Bearer ${token}`,
        accept: "application/json",
      };

      const requests = mood.genres.map((genre) =>
        fetch(
          `https://api.themoviedb.org/3/discover/movie?with_genres=${genre}&sort_by=popularity.desc&vote_count.gte=100&language=en-US&page=1&region=IN`,
          { headers },
        ).then((response) => {
          if (!response.ok) throw new Error("Could not fetch recommendations.");
          return response.json();
        }),
      );

      const genreResults = await Promise.allSettled(requests);
      const movies = genreResults
        .filter((result) => result.status === "fulfilled")
        .flatMap((result) => result.value.results || []);

      // Remove duplicate movies and sort by popularity
      const uniqueMovies = Array.from(
        new Map(movies.map((movie) => [movie.id, movie])).values(),
      )
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 6);

      // Prepare movie data for display
      const recommendations = uniqueMovies.map((movie) => ({
        ...movie,
        mediaType: "movie",
        displayTitle: movie.title,
        displayYear: movie.release_date?.slice(0, 4),
      }));

      // Add recommendations or a fallback message to the chat
      if (recommendations.length === 0) {
        setMessages((previous) => [
          ...previous,
          {
            sender: "bot",
            text: "I couldn't find recommendations right now. Please try another mood.",
          },
        ]);
      } else {
        setMessages((previous) => [
          ...previous,
          {
            sender: "bot",
            text: `Here are ${recommendations.length} movies for your ${mood.label.replace(/ [^\s]+$/, "")} mood! Pick one to explore.`,
            recommendations,
          },
        ]);
      }
    } catch (error) {
      console.error("Mood recommendation error:", error);
      setMessages((previous) => [
        ...previous,
        {
          sender: "bot",
          text: "Something went wrong while finding movies. Please check your connection and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-6 sm:px-8">
      {/* Return to the previous page */}
      <button
        onClick={() => navigate(-1)}
        className="mb-5 flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
      >
        <ArrowLeft size={18} />
        Go Back
      </button>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#101827] shadow-2xl">
        {/* Chatbot header */}
        <div className="flex items-center gap-3 border-b border-slate-800 bg-violet-600/15 p-5">
          <div className="rounded-full bg-violet-600 p-3">
            <Sparkles size={23} />
          </div>
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">MoodFlix</h1>
            <p className="text-sm text-slate-400">
              Your personal mood-based movie buddy
            </p>
          </div>
        </div>

        {/* Display chat messages and movie recommendations */}
        <div className="flex min-h-420px flex-col gap-5 p-4 sm:p-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-full rounded-2xl p-4 sm:max-w-[90%] ${
                  message.sender === "user"
                    ? "bg-violet-600 text-white"
                    : "border border-slate-700 bg-[#080d1a] text-slate-200"
                }`}
              >
                <p className="text-sm leading-6">{message.text}</p>

                {/* Render recommended movies as clickable cards */}
                {message.recommendations && (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {message.recommendations.map((movie) => (
                      <button
                        key={movie.id}
                        onClick={() => navigate(`/movies/${movie.id}`)}
                        className="group overflow-hidden rounded-xl border border-slate-700 text-left transition hover:border-violet-400"
                      >
                        {movie.poster_path ? (
                          <img
                            src={getImageUrl(movie.poster_path, "w342")}
                            alt={movie.displayTitle}
                            loading="lazy"
                            className="aspect-2/3 w-full object-cover transition group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="flex aspect-2/3 items-center justify-center bg-slate-800">
                            <Film size={30} />
                          </div>
                        )}

                        <div className="p-2">
                          <p className="line-clamp-2 text-sm font-semibold">
                            {movie.displayTitle}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {movie.displayYear || "Year unknown"}
                          </p>
                          <p className="mt-1 text-xs text-yellow-400">
                            ★ {movie.vote_average?.toFixed(1) || "N/A"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Show a loading message while recommendations are fetched */}
          {loading && (
            <div className="self-start rounded-xl border border-slate-700 bg-[#080d1a] p-4 text-sm text-slate-400">
              Finding your next favourite movie...
            </div>
          )}
        </div>

        {/* Let users select their current mood */}
        <div className="border-t border-slate-800 p-4 sm:p-6">
          <p className="mb-3 text-sm font-semibold text-slate-300">
            How are you feeling?
          </p>

          <div className="flex flex-wrap gap-2">
            {moods.map((mood) => (
              <button
                key={mood.value}
                onClick={() => chooseMood(mood)}
                disabled={loading}
                className="rounded-full border border-slate-700 px-4 py-2 text-sm transition hover:border-violet-500 hover:bg-violet-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mood.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

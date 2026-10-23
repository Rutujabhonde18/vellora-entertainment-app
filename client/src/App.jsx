import { Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Movies from "./pages/Movies";
import TVSeries from "./pages/TVSeries";
import MovieDetails from "./pages/MovieDetails";
import TVDetails from "./pages/TVDetails";
import Bookmarks from "./pages/Bokmark";
import SearchResults from "./pages/SearchResults";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { AuthProvider } from "./context/AuthContext";
import MoodChatbot from "./pages/MoodChatbot";

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#080d1a] text-white">
        <Sidebar />

        <main className="min-h-screen pb-10 pt-16 md:ml-64 md:pt-0">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/movies/:id" element={<MovieDetails />} />
            <Route path="/tv-series" element={<TVSeries />} />
            <Route path="/tv-series/:id" element={<TVDetails />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/mood-chatbot" element={<MoodChatbot />} />
            <Route
              path="*"
              element={
                <div className="py-10 text-slate-400">Page not found.</div>
              }
            />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;

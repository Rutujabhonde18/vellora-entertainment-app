import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  LogIn,
  UserPlus,
  ChevronDown,
  ChevronUp,
  UserRound,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const AccountMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  const handleNavigation = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    setError("");
    setLoggingOut(true);

    try {
      await logout();
      setIsOpen(false);
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      setError("Could not log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  const displayName = user?.displayName || user?.email || "My account";

  return (
    <div className="mt-auto border-t border-slate-700 pt-3">
      <button
        type="button"
        onClick={() => {
          setIsOpen((open) => !open);
          setError("");
        }}
        className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-[#080d1a]"
        aria-expanded={isOpen}
      >
        {loading ? (
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-700" />
        ) : user ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500 font-bold">
            {displayName.charAt(0).toUpperCase() || <UserRound size={20} />}
          </div>
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-violet-500 text-violet-400">
            <Plus size={20} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          {loading ? (
            <p className="text-sm text-slate-400">Checking account...</p>
          ) : user ? (
            <>
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="truncate text-xs text-slate-400">{user.email}</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold">Create account</p>
              <p className="text-xs text-slate-400">Sign in to your account</p>
            </>
          )}
        </div>

        {isOpen ? (
          <ChevronDown size={16} className="text-slate-400" />
        ) : (
          <ChevronUp size={16} className="text-slate-400" />
        )}
      </button>

      {isOpen && !loading && (
        <div className="mt-1 space-y-1 rounded-xl bg-[#080d1a] p-2">
          {!user ? (
            <>
              <button
                type="button"
                onClick={() => handleNavigation("/signup")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <UserPlus size={17} />
                Create account
              </button>

              <button
                type="button"
                onClick={() => handleNavigation("/login")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <LogIn size={17} />
                Login
              </button>
            </>
          ) : (
            <>
              <div className="px-3 py-2 text-xs text-slate-400">
                Signed in as {user.email}
              </div>

              <button
                type="button"
                disabled={loggingOut}
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-60"
              >
                <LogOut size={17} />
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </>
          )}

          {error && (
            <p role="alert" className="px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AccountMenu;

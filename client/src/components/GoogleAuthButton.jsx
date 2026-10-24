import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";

export default function GoogleAuthButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Handle Google sign-in
  const handleGoogleLogin = async () => {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/");
    } catch (err) {
      // Display an appropriate message for authentication errors
      if (err.code === "auth/popup-closed-by-user") {
        setError("Google sign-in was cancelled.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Your browser blocked the popup. Allow popups and try again.");
      } else if (err.code === "auth/unauthorized-domain") {
        setError("This website domain is not authorized in Firebase.");
      } else if (err.code === "auth/account-exists-with-different-credential") {
        setError(
          "An account with this email already uses another sign-in method. Log in with that method first.",
        );
      } else if (err.code === "auth/operation-not-allowed") {
        setError(
          "Enable Google sign-in in your Firebase Authentication settings.",
        );
      } else {
        setError("Google sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-5">
      <div className="relative mb-5 flex items-center">
        <div className="flex-grow border-t border-slate-700" />
        <span className="px-3 text-xs text-slate-500">OR CONTINUE WITH</span>
        <div className="flex-grow border-t border-slate-700" />
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-slate-700 bg-[#101827] py-3 text-sm font-semibold text-white transition hover:border-violet-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {!loading && (
          <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
            <path
              fill="#EA4335"
              d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.3 0 24 0 14.6 0 6.5 5.4 3 13.2l7.8 6.1C12.7 13.6 17.9 9.5 24 9.5Z"
            />
            <path
              fill="#4285F4"
              d="M46.1 24.5c0-1.6-.2-3.2-.5-4.7H24v9h12.4c-.6 3-2.3 5.5-4.8 7.2l7.7 6C43.7 37.8 46.1 31.6 46.1 24.5Z"
            />
            <path
              fill="#FBBC05"
              d="M10.8 28.7a14.4 14.4 0 0 1 0-9.4L3 13.2a24 24 0 0 0 0 21.6l7.8-6.1Z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.5 0 12-2.1 16-6l-7.7-6c-2.1 1.4-4.8 2.3-8.3 2.3-6.1 0-11.3-4.1-13.2-9.7L3 34.8C6.5 42.6 14.6 48 24 48Z"
            />
          </svg>
        )}
        {loading ? "Connecting to Google..." : "Continue with Google"}
      </button>

      {/* Display sign-in errors */}
      {error && (
        <p role="alert" className="mt-3 text-center text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

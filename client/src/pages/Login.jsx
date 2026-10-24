import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Play, Mail, Lock, Eye, EyeOff } from "lucide-react";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase";
import GoogleAuthButton from "../components/GoogleAuthButton";

// Validate login form fields
const loginSchema = Yup.object({
  email: Yup.string()
    .trim()
    .email("Enter a valid email address")
    .required("Email address is required"),
  password: Yup.string().required("Password is required"),
});

// Convert Firebase error codes into user-friendly messages
function getLoginErrorMessage(code) {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Check your internet connection.";
    default:
      return "Login failed. Please try again.";
  }
}

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();

  // Handle form validation and login submission
  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: loginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError("");
      setMessage("");

      try {
        // Set login persistence based on the Remember me option
        const persistence = rememberMe
          ? browserLocalPersistence
          : browserSessionPersistence;

        await setPersistence(auth, persistence);

        // Authenticate the user with Firebase
        await signInWithEmailAndPassword(
          auth,
          values.email.trim(),
          values.password,
        );

        navigate("/");
      } catch (err) {
        setError(getLoginErrorMessage(err.code));
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Send a password reset email
  const handleForgotPassword = async () => {
    if (resetLoading || formik.isSubmitting) return;

    setError("");
    setMessage("");

    const email = formik.values.email.trim();

    if (!email) {
      setError("Enter your email address first, then click Forgot password.");
      return;
    }

    // Validate the email before requesting a password reset
    try {
      await Yup.string().email().validate(email);
    } catch {
      setError("Please enter a valid email address.");
      return;
    }

    setResetLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(
        "If an account exists for this email, a password reset email has been sent.",
      );
    } catch (err) {
      if (
        err.code === "auth/invalid-email" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/network-request-failed") {
        setError("Network error. Check your internet connection.");
      } else {
        setError("Could not send the reset email. Please try again.");
      }
    } finally {
      setResetLoading(false);
    }
  };

  // Clear messages and update the form when a field changes
  const handleFieldChange = (event) => {
    setError("");
    setMessage("");
    formik.handleChange(event);
  };

  return (
    <div className="lg:h-screen md:h-full lg:mt-0 mt-16 w-full overflow-hidden bg-[#080d1a]">
      <div className="grid h-full w-full grid-cols-1 md:grid-cols-2">
        {/* Welcome panel displayed on desktop */}
        <div
          className="relative hidden h-full items-center justify-center overflow-hidden bg-cover bg-center text-center md:flex"
          style={{
            backgroundImage:
              "linear-gradient(rgba(5,10,24,0.55), rgba(5,10,24,0.70)), url('https://t3.ftcdn.net/jpg/10/02/32/70/360_F_1002327034_O5CKGOuUf4xScJ8pvRlWtDi4j9R2qnh0.jpg')",
          }}
        >
          <div className="absolute inset-0 bg-linear-to-br from-violet-900/20 to-[#080d1a]/40" />

          <div className="relative z-10 px-6">
            <div className="mx-auto flex w-46 items-center justify-center">
              <img
                src="/velooralogo.png"
                alt="Velora logo"
                className="h-full w-full object-contain"
              />
            </div>

            <p className="text-lg mt-3 font-semibold">Welcome back!</p>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-300">
              Log in to continue your journey.
            </p>
          </div>
        </div>

        {/* Login form */}
        <div className="flex h-full items-center justify-center overflow-y-auto px-6 py-6 sm:px-10 md:px-12">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h2 className="text-3xl font-semibold">Login to Your Account</h2>
              <p className="mt-2 text-sm text-slate-400">
                Enter your credentials to access your account
              </p>
            </div>

            <form
              onSubmit={formik.handleSubmit}
              noValidate
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Email Address
                </label>

                <div
                  className={`flex items-center gap-3 rounded-lg border bg-[#101827] px-3 py-3 focus-within:border-violet-500 ${
                    formik.touched.email && formik.errors.email
                      ? "border-red-500"
                      : "border-slate-700"
                  }`}
                >
                  <Mail size={17} className="shrink-0 text-slate-500" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formik.values.email}
                    onChange={handleFieldChange}
                    onBlur={formik.handleBlur}
                    placeholder="Enter your email"
                    aria-invalid={Boolean(
                      formik.touched.email && formik.errors.email,
                    )}
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  />
                </div>

                {/* Show email validation errors */}
                {formik.touched.email && formik.errors.email && (
                  <p className="mt-1 text-xs text-red-400">
                    {formik.errors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Password
                </label>

                <div
                  className={`flex items-center gap-3 rounded-lg border bg-[#101827] px-3 py-3 focus-within:border-violet-500 ${
                    formik.touched.password && formik.errors.password
                      ? "border-red-500"
                      : "border-slate-700"
                  }`}
                >
                  <Lock size={17} className="shrink-0 text-slate-500" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={formik.values.password}
                    onChange={handleFieldChange}
                    onBlur={formik.handleBlur}
                    placeholder="Enter your password"
                    aria-invalid={Boolean(
                      formik.touched.password && formik.errors.password,
                    )}
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  />

                  {/* Toggle password visibility */}
                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="cursor-pointer text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                {/* Show password validation errors */}
                {formik.touched.password && formik.errors.password && (
                  <p className="mt-1 text-xs text-red-400">
                    {formik.errors.password}
                  </p>
                )}
              </div>

              {/* Remember login and reset password options */}
              <div className="flex items-center justify-between gap-3 text-xs">
                <label className="flex cursor-pointer items-center gap-2 text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="accent-violet-600"
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetLoading || formik.isSubmitting}
                  className="cursor-pointer font-medium text-violet-400 hover:text-violet-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resetLoading ? "Sending..." : "Forgot password?"}
                </button>
              </div>

              {/* Display login and password reset messages */}
              {error && (
                <p role="alert" className="text-sm text-red-400">
                  {error}
                </p>
              )}

              {message && (
                <p role="status" className="text-sm text-green-400">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={formik.isSubmitting || resetLoading}
                className="w-full cursor-pointer rounded-lg bg-linear-to-r from-violet-600 to-violet-500 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:from-violet-500 hover:to-violet-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {formik.isSubmitting ? "Logging in..." : "Login"}
              </button>
            </form>

            {/* Google sign-in option */}
            <GoogleAuthButton />

            <p className="mt-7 text-center text-sm text-slate-400">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-semibold text-violet-400 hover:text-violet-300"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Play, Mail, Lock, Eye, EyeOff, UserRound } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../firebase";
import GoogleAuthButton from "../components/GoogleAuthButton";

const signupSchema = Yup.object({
  name: Yup.string()
    .trim()
    .min(2, "Name must contain at least 2 characters")
    .required("Full name is required"),
  email: Yup.string()
    .trim()
    .email("Enter a valid email address")
    .required("Email address is required"),
  password: Yup.string()
    .min(6, "Password must contain at least 6 characters")
    .required("Password is required"),
});

function getFirebaseErrorMessage(code) {
  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Please log in.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Please choose a stronger password.";
    case "auth/operation-not-allowed":
      return "Email/password signup is not enabled in Firebase.";
    case "auth/network-request-failed":
      return "Network error. Check your internet and try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    default:
      return "Account creation failed. Please try again.";
  }
}

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
    },
    validationSchema: signupSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError("");

      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          values.email.trim(),
          values.password,
        );

        try {
          await updateProfile(userCredential.user, {
            displayName: values.name.trim(),
          });
        } catch (profileError) {
          console.error(
            "Could not update the user's display name:",
            profileError,
          );
          setError(
            "Your account was created, but your profile name could not be saved. You can still log in.",
          );
          return;
        }

        navigate("/");
      } catch (err) {
        setError(getFirebaseErrorMessage(err.code));
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleFieldChange = (event) => {
    setError("");
    formik.handleChange(event);
  };

  return (
    <div className="lg:h-screen md:h-full lg:mt-0 mt-16 w-full overflow-hidden bg-[#080d1a]">
      <div className="grid h-full w-full grid-cols-1 md:grid-cols-2">
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
            <p className="mt-3 text-lg font-semibold">Join Entertainment</p>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-300">
              Your next favorite movie or series is just a click away. Create
              your account and start exploring.
            </p>
          </div>
        </div>

        <div className="flex h-full items-center justify-center overflow-y-auto px-6 py-6 sm:px-10 md:px-12">
          <div className="w-full max-w-sm">
            <div className="mb-7">
              <h2 className="text-3xl font-semibold">Create Your Account</h2>
              <p className="mt-2 text-sm text-slate-400">
                Join us and start exploring
              </p>
            </div>

            <form
              onSubmit={formik.handleSubmit}
              noValidate
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Full Name
                </label>

                <div
                  className={`flex items-center gap-3 rounded-lg border bg-[#101827] px-3 py-3 focus-within:border-violet-500 ${
                    formik.touched.name && formik.errors.name
                      ? "border-red-500"
                      : "border-slate-700"
                  }`}
                >
                  <UserRound size={17} className="shrink-0 text-slate-500" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={formik.values.name}
                    onChange={handleFieldChange}
                    onBlur={formik.handleBlur}
                    placeholder="Enter your name"
                    aria-invalid={Boolean(
                      formik.touched.name && formik.errors.name,
                    )}
                    aria-describedby={
                      formik.touched.name && formik.errors.name
                        ? "name-error"
                        : undefined
                    }
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  />
                </div>

                {formik.touched.name && formik.errors.name && (
                  <p id="name-error" className="mt-1 text-xs text-red-400">
                    {formik.errors.name}
                  </p>
                )}
              </div>

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
                    aria-describedby={
                      formik.touched.email && formik.errors.email
                        ? "email-error"
                        : undefined
                    }
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  />
                </div>

                {formik.touched.email && formik.errors.email && (
                  <p id="email-error" className="mt-1 text-xs text-red-400">
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
                    autoComplete="new-password"
                    value={formik.values.password}
                    onChange={handleFieldChange}
                    onBlur={formik.handleBlur}
                    placeholder="Create a password"
                    aria-invalid={Boolean(
                      formik.touched.password && formik.errors.password,
                    )}
                    aria-describedby={
                      formik.touched.password && formik.errors.password
                        ? "password-error"
                        : undefined
                    }
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  />

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

                {formik.touched.password && formik.errors.password && (
                  <p id="password-error" className="mt-1 text-xs text-red-400">
                    {formik.errors.password}
                  </p>
                )}

                <p className="mt-2 text-xs text-slate-500">
                  Use at least 6 characters.
                </p>
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="w-full cursor-pointer rounded-lg bg-linear-to-r from-violet-600 to-violet-500 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:from-violet-500 hover:to-violet-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {formik.isSubmitting ? "Creating account..." : "Sign Up"}
              </button>
            </form>

            <GoogleAuthButton />

            <p className="mt-7 text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-violet-400 hover:text-violet-300"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyA0gZrHb-BOdhW1eqtBsx4zMGs34yWiFtE",
  authDomain: "moviewebsite-4a5f9.firebaseapp.com",
  projectId: "moviewebsite-4a5f9",
  storageBucket: "moviewebsite-4a5f9.firebasestorage.app",
  messagingSenderId: "716051001962",
  appId: "1:716051001962:web:0540eb77a96f8b8430d013",
  measurementId: "G-96M5J9Z450",
};

// Initialize the Firebase app
const app = initializeApp(firebaseConfig);

// Set up Firebase Authentication
export const auth = getAuth(app);

export default app;

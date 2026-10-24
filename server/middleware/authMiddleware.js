const path = require("path");
const fs = require("fs");

const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

// Load the Firebase service-account JSON from Render Secret Files
const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  path.join(__dirname, "../firebase-service-account.json");

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(
    `Firebase service account file not found at: ${serviceAccountPath}`,
  );
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

const firebaseApp =
  getApps().length === 0
    ? initializeApp({
        credential: cert(serviceAccount),
      })
    : getApps()[0];

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required. Please log in.",
      });
    }

    const idToken = authHeader.split(" ")[1];
    const decodedToken = await getAuth(firebaseApp).verifyIdToken(idToken);

    req.user = {
      uid: decodedToken.uid,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    return res.status(401).json({
      message: "Invalid or expired authentication token.",
    });
  }
}

module.exports = authMiddleware;

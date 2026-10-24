# Velora Entertainment App

Velora is a movie and TV entertainment web application where users can discover trending content, explore movies and TV series, search for titles, and save their favorites to a personal bookmark collection.

## 🌐 Live Demo

- **Frontend:** https://vellora-entertainment-app.vercel.app
- **Backend:** https://vellora-backend-76ex.onrender.com

## ✨ Features

- 🎬 **Discover Movies:** Browse and explore movie content.
- 📺 **Explore TV Series:** Discover trending and popular TV shows.
- 🔎 **Search:** Find movies and TV series.
- 🔐 **Authentication:** Sign in and create accounts using Firebase Authentication.
- 🔖 **Personal Bookmarks:** Save and remove movies or TV series from your collection.
- 👤 **User-Specific Data:** Each authenticated user can access their own bookmarks.
- 📱 **Responsive UI:** Browse the application across different screen sizes.
- ☁️ **Cloud Deployment:** Frontend hosted on Vercel and backend hosted on Render.

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- React Router
- Lucide React
- Firebase Authentication

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- Firebase Admin SDK
- TMDB API

### Deployment
- Vercel — Frontend
- Render — Backend
- MongoDB Atlas — Database
- Firebase — Authentication

## 🏗️ Project Structure

```text
velora-entertainment-app/
├── server/
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   └── Bookmark.js
│   ├── package.json
│   └── server.js
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── firebase.js
├── public/
├── .gitignore
├── package.json
└── README.md
```

*Note: The structure above is illustrative. Adjust it to match your actual repository.*

## ⚙️ Getting Started

### Prerequisites

Make sure you have installed:

- Node.js and npm
- A MongoDB database or MongoDB Atlas account
- A Firebase project with Authentication configured
- A TMDB API key

### 1. Clone the Repository

```bash
git clone https://github.com/Rutujabhonde18/vellora-entertainment-app.git
cd vellora-entertainment-app
```

### 2. Install Frontend Dependencies

From the project root:

```bash
npm install
```

### 3. Configure Frontend Environment Variables

Create a `.env` file in the project root and configure the variables used by your application.

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_TMDB_API_KEY=your_tmdb_api_key
```

Configure your Firebase client settings using the variable names expected by your existing `src/firebase.js` file.

**Important:** Never commit real API keys, credentials, or private service-account files to GitHub.

### 4. Configure the Backend

Move into the server directory:

```bash
cd server
npm install
```

Create a `server/.env` file:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

Use the actual path to your Firebase service-account JSON file. In production, configure the service-account file and environment variables securely through your hosting provider.

### 5. Start the Backend

From the `server` directory:

```bash
npm start
```

The backend should start at:

```text
http://localhost:5000
```

### 6. Start the Frontend

Open another terminal, return to the project root, and run:

```bash
npm run dev
```

Open the local URL displayed by Vite, usually:

```text
http://localhost:5173
```

## 🔌 API Endpoints

The backend exposes the following bookmark endpoints:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Backend status message |
| GET | `/api/health` | Backend and database health status |
| GET | `/api/bookmarks` | Fetch the authenticated user's bookmarks |
| POST | `/api/bookmarks` | Save a movie or TV series |
| DELETE | `/api/bookmarks/:mediaType/:tmdbId` | Remove a bookmark belonging to the authenticated user |

Bookmark endpoints require a valid Firebase ID token in the request header:

```http
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

The backend verifies the token and uses the authenticated user's UID to scope bookmark operations.

## 🔐 Security

- Firebase Admin SDK verifies authentication tokens on bookmark routes.
- Bookmark queries are scoped to the authenticated user's UID.
- MongoDB stores bookmark information.
- Environment variables and service-account credentials should remain private.
- Production deployments should use HTTPS and appropriately restricted database network access.

## 🚀 Deployment

### Frontend — Vercel

Set the production environment variable:

```env
VITE_API_BASE_URL=https://vellora-backend-76ex.onrender.com
```

Configure the remaining frontend variables required by your project, then deploy the frontend through Vercel.

### Backend — Render

Configure the backend service with:

- **Root directory:** `server`
- **Build command:** `npm install`
- **Start command:** `npm start`

Add the required environment variables and securely configure the Firebase service-account secret file. Ensure MongoDB Atlas allows connections from the backend hosting environment.

## 🔮 Future Improvements

- Personalized movie and TV recommendations
- Movie and TV genre filters
- Improved loading states and caching
- Pagination or infinite scrolling
- User profile management
- Automated testing and CI/CD

## 👩‍💻 Author

**Rutuja Bhonde**

GitHub: [Rutujabhonde18](https://github.com/Rutujabhonde18)

---

If you find this project interesting, feel free to explore the repository and try the live application.

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const ACCESS_TOKEN = import.meta.env.VITE_TMDB_ACCESS_TOKEN;

const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/";
const CACHE_DURATION = 6 * 60 * 60 * 1000;
const REQUEST_TIMEOUT = 12000;
const MAX_RETRIES = 2;

// Read valid cached data from localStorage
function readCache(key) {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const entry = JSON.parse(cached);

    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      localStorage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

// Save data to localStorage with a timestamp
function writeCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
  } catch (error) {
    console.warn("Could not save TMDB cache:", error);
  }
}

// Fetch data with a timeout and retry failed requests
async function requestWithRetry(url, options = {}) {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`TMDB request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, 500 * (attempt + 1)),
        );
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
}

// Fetch data and use cached data if the request fails
async function fetchCached(key, fetcher) {
  try {
    const data = await fetcher();
    writeCache(key, data);
    return data;
  } catch (error) {
    const cached = readCache(key);

    if (cached !== null) {
      console.warn(`TMDB unavailable; using cached data for ${key}.`);
      return cached;
    }

    throw error;
  }
}

// Make authenticated requests to the TMDB API
async function tmdbFetch(endpoint) {
  const url = `${BASE_URL}${endpoint}`;

  return fetchCached(`tmdb:${endpoint}`, () =>
    requestWithRetry(url, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    }),
  );
}

// Generate a full image URL from an image path
export function getImageUrl(path, size = "w500") {
  return path ? `${IMAGE_BASE_URL}${size}${path}` : "";
}

// Fetch trending movies or TV shows from multiple pages
async function getTrending(type) {
  const pages = [1, 2, 3];

  return fetchCached(`tmdb:trending:${type}:week`, async () => {
    const results = [];

    for (const page of pages) {
      const url =
        `${BASE_URL}/trending/${type}/week` +
        `?api_key=${API_KEY}&page=${page}`;

      const data = await requestWithRetry(url, {
        headers: { accept: "application/json" },
      });

      results.push(...(data.results || []));
    }

    return results;
  });
}

// Get trending movies
export function getTrendingMovies() {
  return getTrending("movie");
}

// Get trending TV shows
export function getTrendingTV() {
  return getTrending("tv");
}

// Search for movies by title
export async function searchMovies(query) {
  const data = await tmdbFetch(
    `/search/movie?query=${encodeURIComponent(query)}`,
  );
  return data.results || [];
}

// Search for TV shows by title
export async function searchTV(query) {
  const data = await tmdbFetch(`/search/tv?query=${encodeURIComponent(query)}`);
  return data.results || [];
}

// Get movie details by ID
export function getMovieDetails(id) {
  return tmdbFetch(`/movie/${id}`);
}

// Get TV show details by ID
export function getTVDetails(id) {
  return tmdbFetch(`/tv/${id}`);
}

// Get similar movies
export async function getSimilarMovies(id) {
  const data = await tmdbFetch(`/movie/${id}/similar`);
  return data.results || [];
}

// Get movie cast and crew
export function getMovieCredits(id) {
  return tmdbFetch(`/movie/${id}/credits`);
}

// Get TV show cast and crew
export function getTVCredits(id) {
  return tmdbFetch(`/tv/${id}/credits`);
}

// Get similar TV shows
export async function getSimilarTV(id) {
  const data = await tmdbFetch(`/tv/${id}/similar`);
  return data.results || [];
}

// Get movie trailers and videos
export async function getMovieVideos(id) {
  const data = await tmdbFetch(`/movie/${id}/videos`);
  return data.results || [];
}

// Get TV series trailers and videos
export async function getTVVideos(id) {
  const data = await tmdbFetch(`/tv/${id}/videos`);
  return data.results || [];
}

// Get streaming providers for a movie by region
export async function getMovieWatchProviders(id, region = "IN") {
  const data = await tmdbFetch(`/movie/${id}/watch/providers`);
  return data.results?.[region] || null;
}

// Get streaming providers for a TV series by region
export async function getTVWatchProviders(id, region = "IN") {
  const data = await tmdbFetch(`/tv/${id}/watch/providers`);
  return data.results?.[region] || null;
}

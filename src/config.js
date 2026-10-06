const defaultApiUrl = process.env.NODE_ENV === "production" ? "" : "http://localhost:5001";

// In Vercel production the API is served from this same deployment at /api.
export const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || defaultApiUrl).replace(/\/$/, "");

/**
 * Helper to dynamically determine the backend API base URL.
 * Routes to localhost:5000 when running locally, and directly to Render in production.
 * This bypasses Vercel next.config rewrites configuration dependency.
 */
export const getApiUrl = (path) => {
    let baseUrl = "http://localhost:5000";
    if (typeof window !== "undefined") {
        if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
            baseUrl = "https://identitybridge.onrender.com";
        }
    }
    // Clean potential double slashes
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
};

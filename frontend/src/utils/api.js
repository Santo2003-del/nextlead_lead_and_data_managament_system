/**
 * ── Axios API Client ────────────────────────────────────────────
 * 
 * Centralized HTTP client for all frontend API calls.
 * 
 * Features:
 *   - Auto-attaches JWT Bearer token from localStorage
 *   - Auto-redirects to /login on 401 (token expired/invalid)
 *   - Retry logic with exponential backoff for network failures
 *   - 60 second timeout for large imports/exports
 *   - Does NOT retry auth failures (401/403) — only network errors
 */

import axios from 'axios';

// ── Create axios instance with base configuration ─────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL || '/api',
  timeout: 60000, // 60s — large imports and exports need time
});

// ── Request Interceptor: Attach JWT Token ─────────────────────
// Reads the token from localStorage and adds it to every request.
api.interceptors.request.use(cfg => {
  try {
    const token = localStorage.getItem('token');
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
  } catch {
    // localStorage may throw in incognito/restricted environments
  }
  return cfg;
});

// ── Response Interceptor: Handle 401 + Retry Logic ────────────
// On 401: clear storage and redirect to login
// On network error: retry up to 2 times with exponential backoff
api.interceptors.response.use(
  r => r,
  async (err) => {
    const config = err.config;

    // ── Auth failure — redirect to login ──────────────────
    if (err.response?.status === 401) {
      try { localStorage.clear(); } catch {}
      window.location.href = '/login';
      return Promise.reject(err);
    }

    // ── Network/timeout retry logic ──────────────────────
    // Only retry on network errors or 5xx server errors
    // Never retry on 4xx client errors (bad request, forbidden, etc.)
    const isRetryable = (
      !err.response ||                          // Network error (no response)
      err.code === 'ECONNABORTED' ||            // Timeout
      (err.response?.status >= 500 && err.response?.status < 600)  // Server error
    );

    if (isRetryable && (!config._retryCount || config._retryCount < 2)) {
      config._retryCount = (config._retryCount || 0) + 1;
      
      // Exponential backoff: 1s, 2s
      const delay = config._retryCount * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return api(config);
    }

    return Promise.reject(err);
  }
);

export default api;

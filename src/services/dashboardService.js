import { swr } from './cache';

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://crmbackend-5d2o.onrender.com/api";

async function request(path) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "ngrok-skip-browser-warning": "true",
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    throw new Error("Your session has expired. Please log in again.");
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.message || body.error || `API error: ${response.status}`);
  }

  return body;
}

export const dashboardService = {
  getDashboard: () => request("/dashboard"),

  // Used by Dashboard.jsx: shows cached data instantly, then replaces it with fresh data.
  getDashboardSWR: ({ force = false, onData } = {}) =>
    swr("dashboard", () => request("/dashboard"), { ttl: 10000, force, onData }),
};

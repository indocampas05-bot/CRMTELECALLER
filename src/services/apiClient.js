// CRM-APP (TELECALLERS)/src/services/apiClient.js
// Shared fetch wrapper used by demoService.js (and available to any other
// service that wants a single place for base URL, auth header, and error
// handling). Mirrors the same request() pattern already used in
// callService.js / telecallerService.js so behavior stays consistent
// across the app.
const API_BASE = import.meta.env.VITE_API_BASE || 'https://crmbackend-5d2o.onrender.com/api';
const getToken = () => localStorage.getItem('token');
export const request = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...options.headers,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired. Please login again.');
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const err = new Error(error.message || error.error || `API error: ${response.status}`);
    err.data = error;
    throw err;
  }
  if (response.status === 204) return null;
  return response.json();
};
export default request;
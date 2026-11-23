// CRM-APP (TELECALLERS)/src/services/authService.js
const API_BASE = import.meta.env.VITE_API_BASE || 'https://crmbackend-5d2o.onrender.com/api';
const getToken = () => localStorage.getItem('token');

const apiCall = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...options.headers,
  };
  // never send an old/stale token with the login request itself
  const isLogin = endpoint.startsWith('/auth/login');
  if (token && !isLogin) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    // removed credentials: 'include' - backend uses
    // app.cors.allowed-origins=* (wildcard), and browsers reject
    // wildcard-origin + credentials:'include' combos outright.
    // Auth is via the Authorization header (JWT) above, not cookies.
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || `API error: ${response.status}`);
  }
  return response.json();
};

export const authService = {
  login: (username, password) => apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: (username || '').trim(), password }),
  }),
  register: (userData) => apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  logout: async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { success: true };
  },
  validateToken: () => {
    const token = getToken();
    if (!token) return Promise.reject('No token');
    return apiCall('/auth/validate', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

export default authService;


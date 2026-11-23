import { request } from './apiClient';
export const demoService = {
  getAll: () => request('/demos'),
  getById: (id) => request(`/demos/${encodeURIComponent(id)}`),
  create: (data) => request('/demos', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/demos/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  cancel: (id) => request(`/demos/${encodeURIComponent(id)}/cancel`, { method: 'PATCH' }),
  remove: (id) => request(`/demos/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  googleStatus: () => request('/google-meet/status'),
  googleConnectUrl: () => request('/google-meet/connect-url'),
  createMeeting: async () => {
    const token = localStorage.getItem('token');
    const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/+$/, '');
    const response = await fetch(`${API_BASE}/google-meet/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.message || `Google Meet API error: ${response.status}`);
      error.data = data;
      throw error;
    }
    return data;
  },
};
export default demoService;
const API_BASE_URL =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8080/api';

const getToken = () =>
  localStorage.getItem('token') ||
  localStorage.getItem('jwtToken') ||
  localStorage.getItem('accessToken');

const request = async (url, options = {}) => {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `HTTP ${response.status}`);
  }

  return response.status === 204 ? null : response.json();
};

export default {
  getNotifications: () => request('/notifications'),
  getUnreadCount: () => request('/notifications/unread-count'),
  markAsRead: (id) => request(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PUT' }),
  markAllAsRead: () => request('/notifications/read-all', { method: 'PUT' })
};

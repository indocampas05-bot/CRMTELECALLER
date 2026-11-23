const API_BASE =
  import.meta.env.VITE_API_BASE ||
  'https://crmbackend-5d2o.onrender.com/api';
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...(options.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(
    `${API_BASE}${endpoint}`,
    {
      ...options,
      headers,
    }
  );
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error(
      'Session expired. Please login again.'
    );
  }
  if (response.status === 403) {
    throw new Error(
      'You do not have permission to perform this action.'
    );
  }
  if (!response.ok) {
    const data =
      await response
        .json()
        .catch(() => ({}));
    throw new Error(
      data.message ||
      data.error ||
      `API error: ${response.status}`
    );
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
};
const leavePermissionService = {
  getMine: () =>
    request(
      '/leave-permissions/mine'
    ),
  getSummary: () =>
    request(
      '/leave-permissions/summary'
    ),
  create: (data) =>
    request(
      '/leave-permissions',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
  update: (id, data) =>
    request(
      `/leave-permissions/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    ),
  remove: (id) =>
    request(
      `/leave-permissions/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      }
    ),
};
export default leavePermissionService;
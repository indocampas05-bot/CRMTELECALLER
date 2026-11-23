const API_BASE =
  import.meta.env.VITE_API_BASE ||
  'https://crmbackend-5d2o.onrender.com/api';

const request = async (path) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (response.status === 401 || response.status === 403) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || body.error || 'You do not have permission to access reports.');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Report request failed (${response.status})`);
  }

  return response.json();
};

export const reportService = {
  getMyReport: (period = 'MONTH') =>
    request(`/reports/mine?period=${encodeURIComponent(period)}`),

  getOverallReport: (period = 'MONTH') =>
    request(`/reports/overall?period=${encodeURIComponent(period)}`),

  getTelecallerReports: (period = 'MONTH') =>
    request(`/reports/telecallers?period=${encodeURIComponent(period)}`),

  getTelecallerReport: (username, period = 'MONTH') =>
    request(`/reports/telecallers/${encodeURIComponent(username)}?period=${encodeURIComponent(period)}`),
};

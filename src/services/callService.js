// CRM-APP (TELECALLERS)/src/services/callService.js
const API_BASE = import.meta.env.VITE_API_BASE || 'https://scanning-unused-dash.ngrok-free.dev/api';
const getToken = () => localStorage.getItem('token');
const request = async (endpoint, options = {}) => {
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
    throw new Error(error.message || error.error || `API error: ${response.status}`);
  }
  return response.json();
};
export const callService = {
  // Create
  create: (data) => request('/calls', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  // Update
  update: (id, data) => request(`/calls/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  updateStatus: (id, status) => request(`/calls/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  updateOutcome: (id, outcome) => request(`/calls/${id}/outcome`, {
    method: 'PATCH',
    body: JSON.stringify({ outcome }),
  }),
  // Get
  getById: (id) => request(`/calls/${id}`),
  getByLead: (leadId) => request(`/calls/lead/${leadId}`),
  getMyCalls: () => request('/calls/agent'),
  getAgentCalls: (username) => request(`/calls/agent/${username}`),
  getStats: () => request('/calls/stats'),
  getAllStats: () => request('/calls/stats/all'),
  getByDateRange: (start, end) => request(`/calls/date-range?start=${start}&end=${end}`),
  // Delete
  delete: (id) => request(`/calls/${id}`, {
    method: 'DELETE',
  }),
  deleteByLead: (leadId) => request(`/calls/lead/${leadId}`, {
    method: 'DELETE',
  }),
};
export default callService;

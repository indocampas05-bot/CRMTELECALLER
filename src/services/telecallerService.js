// CRM-APP (TELECALLERS)/src/services/telecallerService.js
const API_BASE = import.meta.env.VITE_API_BASE || 'https://crmbackend-5d2o.onrender.com/api';
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
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || `API error: ${response.status}`);
  }
  return response.json();
};
export const telecallerService = {
  getMe: () => request('/telecallers/me'),
  getAll: () => request('/telecallers'),
  getById: (id) => request(`/telecallers/${id}`),
  getByEmployeeId: (empId) => request(`/telecallers/employee/${empId}`),
  getByUsername: (username) => request(`/telecallers/username/${username}`),
  
  create: (data) => {
    const { id, employeeId, ...cleanData } = data;
    return request('/telecallers', {
      method: 'POST',
      body: JSON.stringify(cleanData),
    });
  },
  
  update: (id, data) => {
    const { id: _, employeeId, ...cleanData } = data;
    return request(`/telecallers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cleanData),
    });
  },
  
  delete: (id) => request(`/telecallers/${id}`, {
    method: 'DELETE',
  }),
  
  resetPassword: (id, newPassword) => request(`/telecallers/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  }),
  
  toggleStatus: (id) => request(`/telecallers/${id}/toggle-status`, {
    method: 'PATCH',
  }),
};
export default telecallerService;
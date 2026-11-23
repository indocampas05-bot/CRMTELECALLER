const API_BASE = import.meta.env.VITE_API_BASE || 'https://crmbackend-5d2o.onrender.com/api';

const getToken = () => localStorage.getItem('token');

const request = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || `API error: ${response.status}`);
  }
  return response.json();
};

export const bridgeService = {
  // Get all active devices
  getDevices: () => request('/bridge/devices'),
  
  // Register a device
  registerDevice: (deviceId, username) => 
    request('/bridge/register', {
      method: 'POST',
      body: JSON.stringify({ deviceId, username }),
    }),
  
  // Unregister a device
  unregisterDevice: (deviceId) => 
    request('/bridge/unregister', {
      method: 'POST',
      body: JSON.stringify({ deviceId }),
    }),
};

export default bridgeService;
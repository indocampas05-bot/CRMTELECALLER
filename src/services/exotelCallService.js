// FILE: src/services/exotelCallService.js
const API_BASE = import.meta.env.VITE_API_BASE || 'https://crmbackend-5d2o.onrender.com/api';

function authHeaders(extra = {}) {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export const exotelCallService = {
  call: async ({ leadId, leadName, leadMobile, agentUsername }) => {
    const res = await fetch(`${API_BASE}/exotel/call`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ leadId, leadName, leadMobile, agentUsername }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || `Call failed: ${res.status}`);
    }
    return res.json();
  },
};

export default exotelCallService;
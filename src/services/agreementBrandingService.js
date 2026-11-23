// src/services/agreementBrandingService.js
// Read-only: the letterpad / logo / footer that the Super Admin uploads on the
// Quotations page (GET /api/quotation-branding). Agreements reuse the same branding,
// so there is only ONE place to upload it.

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  'https://crmbackend-5d2o.onrender.com/api';

const headers = () => {
  const token = localStorage.getItem('token');
  return {
    Accept: 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const agreementBrandingService = {
  // -> { hasLogo, hasLetterpad, logoDataUrl, letterpadDataUrl, phone, website, address, showBrandText }
  get: async () => {
    const res = await fetch(`${API_BASE}/quotation-branding`, { headers: headers() });
    if (!res.ok) throw new Error(`Branding API error: ${res.status}`);
    return res.json();
  },
};

export default agreementBrandingService;
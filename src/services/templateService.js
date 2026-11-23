// src/services/templateService.js
const API_BASE = import.meta.env.VITE_API_BASE || 'https://scanning-unused-dash.ngrok-free.dev/api';
const getToken = () => localStorage.getItem('token');
const authHeaders = (extra = {}) => {
  const token = getToken();
  return {
    'ngrok-skip-browser-warning': 'true',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
};
const handle = async (response) => {
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired. Please login again.');
  }
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || err.error || `API error: ${response.status}`);
  }
  return response;
};
export const templateService = {
  list: async () => {
    const res = await fetch(`${API_BASE}/quotation-templates`, { headers: authHeaders() });
    return (await handle(res)).json();
  },
  get: async (id) => {
    const res = await fetch(`${API_BASE}/quotation-templates/${encodeURIComponent(id)}`, { headers: authHeaders() });
    return (await handle(res)).json();
  },
  createBlank: async (name) => {
    const query = name ? `?name=${encodeURIComponent(name)}` : '';
    const res = await fetch(`${API_BASE}/quotation-templates/blank${query}`, {
      method: 'POST',
      headers: authHeaders(),
    });
    return (await handle(res)).json();
  },
  upload: async (file, name) => {
    const form = new FormData();
    form.append('file', file);
    if (name) form.append('name', name);
    const res = await fetch(`${API_BASE}/quotation-templates`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    });
    return (await handle(res)).json();
  },
  saveFields: async (id, fields) => {
    const res = await fetch(`${API_BASE}/quotation-templates/${encodeURIComponent(id)}/fields`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ fields }),
    });
    return (await handle(res)).json();
  },
  saveDesign: async (id, { name, design, fields }) => {
    const res = await fetch(`${API_BASE}/quotation-templates/${encodeURIComponent(id)}/design`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ name, design, fields }),
    });
    return (await handle(res)).json();
  },
  remove: async (id) => {
    const res = await fetch(`${API_BASE}/quotation-templates/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return (await handle(res)).json();
  },
  previewUrl: async (id) => {
    const res = await fetch(`${API_BASE}/quotation-templates/${encodeURIComponent(id)}/preview`, { headers: authHeaders() });
    await handle(res);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },
};
export default templateService;
const API_BASE = import.meta.env.VITE_API_BASE || 'https://scanning-unused-dash.ngrok-free.dev/api';
const getToken = () => localStorage.getItem('token');
const authHeaders = (extra = {}) => {
  const token = getToken();
  return {
    'ngrok-skip-browser-warning': 'true', // FIX: was missing — needed so ngrok returns JSON, not its HTML warning page
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
const request = async (path, method = 'GET', body) => {
  const headers = authHeaders(body === undefined ? {} : { 'Content-Type': 'application/json' });
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return (await handle(res)).json();
};

export const quotationService = {
  getAll: () => request('/quotations'),
  getAdminAll: (status = '') => request(`/quotations/admin${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  get: (id) => request(`/quotations/${encodeURIComponent(id)}`),
  create: (payload) => request('/quotations', 'POST', payload),
  update: (id, payload) => request(`/quotations/${encodeURIComponent(id)}`, 'PUT', payload),
  submit: (id) => request(`/quotations/${encodeURIComponent(id)}/submit`, 'POST', {}),
  approve: (id, remark = '') => request(`/quotations/${encodeURIComponent(id)}/approve`, 'POST', { remark }),
  reject: (id, reason) => request(`/quotations/${encodeURIComponent(id)}/reject`, 'POST', { reason }),
  requestRevision: (id, reason) => request(`/quotations/${encodeURIComponent(id)}/revision`, 'POST', { reason }),
  markSent: (id, channel) => request(`/quotations/${encodeURIComponent(id)}/mark-sent`, 'POST', { channel }),
  remove: (id) => request(`/quotations/${encodeURIComponent(id)}`, 'DELETE'),
  downloadPdfBlob: async (id) => {
    const res = await fetch(`${API_BASE}/quotations/${encodeURIComponent(id)}/pdf`, { headers: authHeaders() });
    await handle(res);
    return res.blob();
  },
};
export default quotationService;
// src/services/paymentAdminService.js
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
const request = async (path, method = 'GET', body) => {
  const headers = authHeaders(body === undefined ? {} : { 'Content-Type': 'application/json' });
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return (await handle(res)).json();
};

export const paymentAdminService = {
  getAll: () => request('/payments/admin'),
  get: (id) => request(`/payments/admin/${encodeURIComponent(id)}`),
  update: (id, payload) => request(`/payments/admin/${encodeURIComponent(id)}`, 'PUT', payload),
  addPaymentRecord: (id, payload) => request(`/payments/admin/${encodeURIComponent(id)}/payment-records`, 'POST', payload),
  updatePaymentRecord: (id, recordId, payload) => request(`/payments/admin/${encodeURIComponent(id)}/payment-records/${encodeURIComponent(recordId)}`, 'PUT', payload),
  uploadQr: async (file) => { const fd = new FormData(); fd.append('file', file); const res = await fetch(`${API_BASE}/payments/admin/qr`, { method: 'POST', headers: authHeaders(), body: fd }); return (await handle(res)).json(); },
  getSharedQrUrl: () => `${API_BASE}/payments/qr`,
  getSharedQr: () => request('/payments/qr/data'),
  getInvoice: (id) => request(`/payments/admin/${encodeURIComponent(id)}/invoice`),
  updateInvoice: (id, payload) => request(`/payments/admin/${encodeURIComponent(id)}/invoice`, 'PUT', payload),
  verify: (id) => request(`/payments/admin/${encodeURIComponent(id)}/verify`, 'POST', {}),
  generateInvoice: (id, recordId) => request(`/payments/admin/${encodeURIComponent(id)}/generate-invoice${recordId ? `?recordId=${encodeURIComponent(recordId)}` : ''}`, 'POST', {}),
  sendToTelecaller: (id) => request(`/payments/admin/${encodeURIComponent(id)}/send-to-telecaller`, 'POST', {}),

  downloadInvoiceRecordBlob: async (id, recordId) => { const res = await fetch(`${API_BASE}/payments/admin/${encodeURIComponent(id)}/payment-records/${encodeURIComponent(recordId)}/invoice/pdf`, { headers: authHeaders() }); await handle(res); return res.blob(); },

  downloadInvoiceBlob: async (id) => {
    const res = await fetch(`${API_BASE}/payments/admin/${encodeURIComponent(id)}/invoice/pdf`, { headers: authHeaders() });
    await handle(res);
    return res.blob();
  },
  downloadInvoiceExcelBlob: async (id) => {
    const res = await fetch(`${API_BASE}/payments/admin/${encodeURIComponent(id)}/invoice/excel`, { headers: authHeaders() });
    await handle(res);
    return res.blob();
  },
};
export default paymentAdminService;
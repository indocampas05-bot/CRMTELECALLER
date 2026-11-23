// src/services/paymentService.js
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

export const paymentService = {
  // Telecaller: own payment records
  getAll: () => request('/payments'),
  get: (id) => request(`/payments/${encodeURIComponent(id)}`),
  create: (payload) => request('/payments', 'POST', payload),
  update: (id, payload) => request(`/payments/${encodeURIComponent(id)}`, 'PUT', payload),
  addPaymentRecord: (id, payload) => request(`/payments/${encodeURIComponent(id)}/payment-records`, 'POST', payload),
  sendPaymentDetails: (id, channel) => request(`/payments/${encodeURIComponent(id)}/send`, 'POST', { channel }),
  // the invoice exactly as the Super Admin generated / edited it
  getInvoice: (id) => request(`/payments/${encodeURIComponent(id)}/invoice`),
  sendInvoiceToClient: (id, channel) => request(`/payments/${encodeURIComponent(id)}/send-invoice`, 'POST', { channel }),

  getSharedQrUrl: () => `${API_BASE}/payments/qr`,
  getSharedQr: () => request('/payments/qr/data'),

  // Lead search, used to pick which client a payment belongs to
  searchLeads: (search) => request(`/telecaller/leads?search=${encodeURIComponent(search || '')}&size=15`),

  // All leads/clients assigned to the current telecaller, for the Payment page's client list.
  // Backed by the same paginated /telecaller/leads endpoint; fetched in large pages since the
  // Payment page itself does client-side search/filter/paging over the merged client+payment rows.
  listAllClients: () => request('/telecaller/leads?size=500&sort=school,asc'),

  downloadInvoiceRecordBlob: async (id, recordId) => { const res = await fetch(`${API_BASE}/payments/${encodeURIComponent(id)}/payment-records/${encodeURIComponent(recordId)}/invoice/pdf`, { headers: authHeaders() }); await handle(res); return res.blob(); },

  downloadInvoiceBlob: async (id) => {
    const res = await fetch(`${API_BASE}/payments/${encodeURIComponent(id)}/invoice/pdf`, { headers: authHeaders() });
    await handle(res);
    return res.blob();
  },
};
export default paymentService;
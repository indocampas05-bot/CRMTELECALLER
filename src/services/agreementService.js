// src/services/agreementService.js
const API_BASE = import.meta.env.VITE_API_BASE || 'https://crmbackend-5d2o.onrender.com/api';
const REQUEST_TIMEOUT = 30000;

const auth = (json = true) => {
  const token = localStorage.getItem('token');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    Accept: 'application/json',
    'ngrok-skip-browser-warning': 'true',
  };
};

async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  const isForm = options.body instanceof FormData;

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { ...auth(!isForm), ...(options.headers || {}) },
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      let error = {};
      try { error = text ? JSON.parse(text) : {}; } catch { error = { message: text }; }
      throw new Error(error.message || `API error: ${response.status}`);
    }

    if (response.status === 204) return null;
    const text = await response.text();
    if (!text) return null;
    try { return JSON.parse(text); } catch { return { message: text }; }
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('Request timed out. Please try again.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

const query = (params = {}) => {
  const value = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')),
  ).toString();
  return value ? `?${value}` : '';
};

/**
 * Convert Spring Page response to content array.
 * Also supports APIs that directly return an array.
 * (This was missing from the telecaller file — it's what caused
 * "pageContent is not defined".)
 */
const pageContent = (value) =>
  Array.isArray(value) ? value : value?.content || [];

export const agreementService = {
  list: (params = {}) => request(`/agreements${query(params)}`),
  get: (id) => request(`/agreements/${encodeURIComponent(id)}`),
  create: (data) => request('/agreements', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/agreements/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  previewAgreement: (data) => request('/agreements/preview', { method: 'POST', body: JSON.stringify(data) }),
  submit: (id) => request(`/agreements/${encodeURIComponent(id)}/submit`, { method: 'POST' }),
  approve: (id, remark = '') => request(`/agreements/${encodeURIComponent(id)}/approve`, { method: 'POST', body: JSON.stringify({ remark }) }),
  reject: (id, reason = '') => request(`/agreements/${encodeURIComponent(id)}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  send: (id, channel = 'WhatsApp') => request(`/agreements/${encodeURIComponent(id)}/send`, { method: 'POST', body: JSON.stringify({ channel }) }),
  remove: (id) => request(`/agreements/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // ============================================================
  // AGREEMENT TEMPLATES
  // ============================================================
  templates: () => request('/agreement-templates'),

  // Added — this is what caused "agreementService.templatesByType is not a function"
  templatesByType: (type) => request(`/agreement-templates${query({ type })}`),

  createTemplate: (data) => request('/agreement-templates', { method: 'POST', body: JSON.stringify(data) }),
  updateTemplateHtml: (id, contentHtml) => request(`/agreement-templates/${encodeURIComponent(id)}/html`, { method: 'PUT', body: JSON.stringify({ contentHtml }) }),
  renameTemplate: (id, name) => request(`/agreement-templates/${encodeURIComponent(id)}/name`, { method: 'PUT', body: JSON.stringify({ name }) }),
  archiveTemplate: (id) => request(`/agreement-templates/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // ============================================================
  // AGREEMENT PLANS
  // ============================================================
  // Added — the New Agreement form calls this right alongside
  // templatesByType(), so it would have thrown next.
  plans: (type) => request(`/agreement-plans${query({ type })}`),

  // ============================================================
  // TELECALLER LEADS
  // ============================================================
  leads: () =>
    request('/telecaller/leads?size=1000&sort=createdAt,desc')
      .then(pageContent),

  pdfBlobUrl: async (id) => {
    const response = await fetch(`${API_BASE}/agreements/${encodeURIComponent(id)}/pdf`, { headers: auth(false) });
    if (!response.ok) throw new Error(`Unable to load PDF: ${response.status}`);
    return URL.createObjectURL(await response.blob());
  },
};

export default agreementService;
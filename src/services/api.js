// src/services/api.js

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  'https://crmbackend-5d2o.onrender.com/api';

/**
 * Generic API request function with authentication
 */
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      body:
        options.body && typeof options.body === 'object'
          ? JSON.stringify(options.body)
          : options.body,
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      window.location.href = '/login';

      throw new Error('Session expired. Please login again.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      throw new Error(
        errorData.message ||
          errorData.error ||
          `API error: ${response.status}`
      );
    }

    // Handle empty response
    const contentType = response.headers.get('content-type');

    if (!contentType || !contentType.includes('application/json')) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

/**
 * API Service
 */
export const api = {
  // =========================================================
  // AUTHENTICATION
  // =========================================================

  auth: {
    login: (credentials) =>
      request('/auth/login', {
        method: 'POST',
        body: credentials,
      }),

    register: (userData) =>
      request('/auth/register', {
        method: 'POST',
        body: userData,
      }),

    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    },

    getCurrentUser: () => {
      const user = localStorage.getItem('user');

      return user ? JSON.parse(user) : null;
    },

    isAuthenticated: () => {
      return localStorage.getItem('token') !== null;
    },
  },

  // =========================================================
  // DASHBOARD
  // =========================================================

  dashboard: {
    getStats: () => request('/dashboard/stats'),

    getTodaySummary: () =>
      request('/dashboard/today-summary'),

    getRecentCalls: () =>
      request('/dashboard/recent-calls'),

    getPerformance: (period = 'today') =>
      request(
        `/dashboard/performance?period=${encodeURIComponent(period)}`
      ),
      
  },

  // =========================================================
  // LEADS
  // =========================================================

  leads: {
    getAll: (params = {}) =>
      request(`/leads?${new URLSearchParams(params)}`),

    getById: (id) =>
      request(`/leads/${id}`),

    getByLeadId: (leadId) =>
      request(`/leads/leadId/${leadId}`),

    create: (data) =>
      request('/leads', {
        method: 'POST',
        body: data,
      }),

    update: (id, data) =>
      request(`/leads/${id}`, {
        method: 'PUT',
        body: data,
      }),

    delete: (id) =>
      request(`/leads/${id}`, {
        method: 'DELETE',
      }),

    getByStatus: (status) =>
      request(`/leads/status/${encodeURIComponent(status)}`),

    getByCampaign: (campaign) =>
      request(`/leads/campaign/${encodeURIComponent(campaign)}`),

    getByAssignedTo: (assignedTo) =>
      request(`/leads/assigned/${encodeURIComponent(assignedTo)}`),

    getStats: () =>
      request('/leads/stats'),
  },

  // =========================================================
  // CLIENTS
  // =========================================================

  clients: {
    getAll: () =>
      request('/clients'),

    getById: (id) =>
      request(`/clients/${id}`),

    create: (data) =>
      request('/clients', {
        method: 'POST',
        body: data,
      }),

    update: (id, data) =>
      request(`/clients/${id}`, {
        method: 'PUT',
        body: data,
      }),

    delete: (id) =>
      request(`/clients/${id}`, {
        method: 'DELETE',
      }),

    getStats: () =>
      request('/clients/stats'),
  },

  // =========================================================
  // REPORTS
  // =========================================================

  reports: {
    getAll: (params = {}) =>
      request(`/reports?${new URLSearchParams(params)}`),

    getById: (id) =>
      request(`/reports/${id}`),

    generate: (data) =>
      request('/reports', {
        method: 'POST',
        body: data,
      }),

    download: (id, format = 'pdf') =>
      request(
        `/reports/${id}/download?format=${encodeURIComponent(format)}`
      ),
  },

  // =========================================================
  // FOLLOW-UPS
  // =========================================================

  followups: {
    getAll: () =>
      request('/followups'),

    getById: (id) =>
      request(`/followups/${id}`),

    create: (data) =>
      request('/followups', {
        method: 'POST',
        body: data,
      }),

    update: (id, data) =>
      request(`/followups/${id}`, {
        method: 'PUT',
        body: data,
      }),

    delete: (id) =>
      request(`/followups/${id}`, {
        method: 'DELETE',
      }),

    getByLead: (leadId) =>
      request(`/followups/lead/${leadId}`),

    getToday: () =>
      request('/followups/today'),
  },

  // =========================================================
  // QUOTATIONS
  // =========================================================

  quotations: {
    getAll: () =>
      request('/quotations'),

    getById: (id) =>
      request(`/quotations/${id}`),

    create: (data) =>
      request('/quotations', {
        method: 'POST',
        body: data,
      }),

    update: (id, data) =>
      request(`/quotations/${id}`, {
        method: 'PUT',
        body: data,
      }),

    delete: (id) =>
      request(`/quotations/${id}`, {
        method: 'DELETE',
      }),

    getByLead: (leadId) =>
      request(`/quotations/lead/${leadId}`),

    getStats: () =>
      request('/quotations/stats'),
  },

  // =========================================================
  // AGREEMENTS
  // =========================================================

  agreements: {
    getAll: () =>
      request('/agreements'),

    getById: (id) =>
      request(`/agreements/${id}`),

    create: (data) =>
      request('/agreements', {
        method: 'POST',
        body: data,
      }),

    update: (id, data) =>
      request(`/agreements/${id}`, {
        method: 'PUT',
        body: data,
      }),

    delete: (id) =>
      request(`/agreements/${id}`, {
        method: 'DELETE',
      }),

    getByLead: (leadId) =>
      request(`/agreements/lead/${leadId}`),

    getStats: () =>
      request('/agreements/stats'),
  },

  // =========================================================
  // CALLS
  // =========================================================

  calls: {
    getAll: () =>
      request('/calls'),

    getById: (id) =>
      request(`/calls/${id}`),

    getByLead: (leadId) =>
      request(`/calls/lead/${leadId}`),

    getNext: () =>
      request('/calls/next'),

    saveDisposition: (data) =>
      request('/calls/disposition', {
        method: 'POST',
        body: data,
      }),
getMyCalls: () => request('/calls/agent'),
    getStats: () =>
      request('/calls/stats'),

    getToday: () =>
      request('/calls/today'),

    startCall: (leadId) =>
      request(`/calls/start/${leadId}`, {
        method: 'POST',
      }),

    endCall: (callId, data) =>
      request(`/calls/end/${callId}`, {
        method: 'PUT',
        body: data,
      }),
  },

  // =========================================================
  // USERS
  // =========================================================

  users: {
    getAll: () =>
      request('/users'),

    getById: (id) =>
      request(`/users/${id}`),

    create: (data) =>
      request('/users', {
        method: 'POST',
        body: data,
      }),

    update: (id, data) =>
      request(`/users/${id}`, {
        method: 'PUT',
        body: data,
      }),

    delete: (id) =>
      request(`/users/${id}`, {
        method: 'DELETE',
      }),

    getProfile: () =>
      request('/users/profile'),

    updateProfile: (data) =>
      request('/users/profile', {
        method: 'PUT',
        body: data,
      }),
  },

  // =========================================================
  // SETTINGS
  // =========================================================

  settings: {
    getAll: () =>
      request('/settings'),

    update: (data) =>
      request('/settings', {
        method: 'PUT',
        body: data,
      }),

    getByKey: (key) =>
      request(`/settings/${key}`),
  },

  // =========================================================
  // CALENDAR
  // =========================================================

  calendar: {
    /**
     * Telecaller calendar:
     * - Own assigned events
     * - Own follow-ups
     * - Public holidays
     */
    getEvents: (from, to) =>
      request(
        `/calendar?from=${encodeURIComponent(
          from
        )}&to=${encodeURIComponent(to)}`
      ),

    /**
     * Alternative events endpoint.
     * Use only if backend supports /calendar/events.
     */
    getEventsByRange: (from, to) =>
      request(
        `/calendar/events?from=${encodeURIComponent(
          from
        )}&to=${encodeURIComponent(to)}`
      ),

    /**
     * Create event.
     * Usually restricted to SUPER_ADMIN/ADMIN depending
     * on backend security rules.
     */
    create: (data) =>
      request('/calendar', {
        method: 'POST',
        body: data,
      }),

    /**
     * Update event
     */
    update: (id, data) =>
      request(`/calendar/${id}`, {
        method: 'PUT',
        body: data,
      }),

    /**
     * Delete event
     */
    remove: (id) =>
      request(`/calendar/${id}`, {
        method: 'DELETE',
      }),

    /**
     * Get telecaller list for Super Admin assignment.
     */
    getTelecallers: () =>
      request('/calendar/telecallers'),
  },

  // =========================================================
  // UPLOAD
  // =========================================================

  upload: {
    file: (file) => {
      const formData = new FormData();

      formData.append('file', file);

      return fetch(`${API_BASE}/upload`, {
        method: 'POST',

        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'ngrok-skip-browser-warning': 'true',
        },

        body: formData,
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));

          throw new Error(
            error.message ||
              error.error ||
              'Upload failed'
          );
        }

        return res.json();
      });
    },

    leads: (file) => {
      const formData = new FormData();

      formData.append('file', file);

      return fetch(`${API_BASE}/upload/leads`, {
        method: 'POST',

        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'ngrok-skip-browser-warning': 'true',
        },

        body: formData,
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));

          throw new Error(
            error.message ||
              error.error ||
              'Upload failed'
          );
        }

        return res.json();
      });
    },
  },
};

// =========================================================
// HELPER FUNCTIONS
// =========================================================

export const handleApiError = (error) => {
  const message =
    error?.message ||
    'An unexpected error occurred';

  console.error('API Error:', error);

  return {
    message,
    success: false,
  };
};

export const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};

export const getUser = () => {
  const user = localStorage.getItem('user');

  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  window.location.href = '/login';
};

export default api;

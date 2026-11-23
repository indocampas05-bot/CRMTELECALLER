// src/services/leadService.js

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  'https://scanning-unused-dash.ngrok-free.dev/api';

const getToken = () => localStorage.getItem('token');

const apiCall = async (endpoint, options = {}) => {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    // removed credentials: 'include' - your backend uses
    // app.cors.allowed-origins=* (wildcard), and browsers reject
    // wildcard-origin + credentials:'include' combos outright.
    // We authenticate via the Authorization header (JWT) above,
    // not cookies, so credentials:'include' isn't needed anyway.
  });

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    window.location.href = '/login';

    throw new Error('Session expired. Please login again.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    throw new Error(
      error.message ||
      error.error ||
      `API error: ${response.status}`
    );
  }

  return response.json();
};

export const leadService = {

  // ============================================================
  // ALL LEADS
  // ============================================================

  getLeads: (
    page = 0,
    size = 10,
    search = '',
    category = '',
    status = '',
    assignedTo = ''
  ) => {

    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });

    if (search) {
      params.append('search', search);
    }

    if (
      category &&
      category !== 'All Categories'
    ) {
      params.append('category', category);
    }

    if (
      status &&
      status !== 'All Status'
    ) {
      params.append('status', status);
    }

    // NOTE:
    // Backend ignores assignedTo for telecaller security.
    // We keep this for existing frontend compatibility.
    if (
      assignedTo &&
      assignedTo !== 'All Agents'
    ) {
      params.append('assignedTo', assignedTo);
    }

    return apiCall(`/telecaller/leads?${params.toString()}`);
  },


  // ============================================================
  // TELECALLER - MY DISTRICTS
  // ============================================================

  getMyDistricts: () => {
    return apiCall('/leads/my-districts');
  },


  // ============================================================
  // TELECALLER - LEADS OF MY DISTRICT
  // ============================================================

  getMyLeadsByDistrict: (district) => {

    if (!district) {
      return Promise.reject(
        new Error('District is required')
      );
    }

    return apiCall(
      `/leads/my-districts/${encodeURIComponent(district)}`
    );
  },


  // ============================================================
  // LEADS BY DISTRICT
  // ============================================================

  getLeadsByDistrict: (district) => {

    return apiCall(
      `/leads/district/${encodeURIComponent(district)}`
    );
  },


  // ============================================================
  // GET SINGLE LEAD
  // ============================================================

  getLead: (id) => {

    if (!id) {
      return Promise.reject(
        new Error('Lead ID is required')
      );
    }

    return apiCall(
      `/leads/${encodeURIComponent(id)}`
    );
  },


  // ============================================================
  // GET COMPLETE LEAD ACTIVITY HISTORY
  // ============================================================

  getLeadHistory: (leadId) => {

    if (!leadId) {
      return Promise.reject(
        new Error('Lead ID is required')
      );
    }

    return apiCall(
      `/leads/${encodeURIComponent(leadId)}/history`
    );
  },


  // ============================================================
  // RECORD CLIENT ACTIVITY
  // ============================================================

  addActivity: (leadId, activityData) => {

    if (!leadId) {
      return Promise.reject(
        new Error('Lead ID is required')
      );
    }

    return apiCall(
      `/leads/${encodeURIComponent(leadId)}/activity`,
      {
        method: 'POST',
        body: JSON.stringify(activityData),
      }
    );
  },


  // ============================================================
  // CREATE LEAD
  // ============================================================

  createLead: (leadData) => {

    return apiCall('/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  },


  // ============================================================
  // UPDATE LEAD
  // ============================================================

  updateLead: (id, leadData) => {

    return apiCall(
      `/leads/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(leadData),
      }
    );
  },


  // ============================================================
  // DELETE LEAD
  // ============================================================

  deleteLead: (id) => {

    return apiCall(
      `/leads/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      }
    );
  },


  // ============================================================
  // DELETE MULTIPLE LEADS
  // ============================================================

  deleteMultipleLeads: (ids) => {

    return apiCall('/leads/batch', {
      method: 'DELETE',
      body: JSON.stringify(ids),
    });
  },


  // ============================================================
  // STATISTICS
  // ============================================================

  getStats: () => {
    return apiCall('/leads/stats');
  },

  getCampaignStats: () => {
    return apiCall('/leads/campaigns/stats');
  },

  getCategoryStats: () => {
    return apiCall('/leads/categories/stats');
  },

};


// ============================================================
// AUTH SERVICE
// ============================================================

export const authService = {

  login: (username, password) => {

    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
      }),
    });
  },


  register: (userData) => {

    return apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },


  logout: () => {

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    window.location.href = '/login';
  },


  validateToken: () => {

    const token = getToken();

    if (!token) {
      return Promise.reject(
        new Error('No token')
      );
    }

    return apiCall('/auth/validate', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

};


export default leadService;

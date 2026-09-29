// ==========================================================================
// CampusFlow – Central API Client
// Handles HTTP requests, JWT token attachment, base URLs, and response formatting
// ==========================================================================

// Cloud or local API Base URL configuration
const RAW_BACKEND_URL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
const API_BASE_URL = RAW_BACKEND_URL ? `${RAW_BACKEND_URL}/api` : '/api';

export const apiClient = {
  getToken() {
    return localStorage.getItem('oist_jwt_token') || '';
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('oist_jwt_token', token);
    } else {
      localStorage.removeItem('oist_jwt_token');
    }
  },

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers = {
      ...(options.headers || {})
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const contentType = response.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new Error((data && data.message) || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.warn(`[API Client] Request to ${endpoint} failed:`, error.message);
      throw error;
    }
  },

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  },

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  },

  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  },

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
};

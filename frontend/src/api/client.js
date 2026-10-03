// ==========================================================================
// CSE Department ERP – Central API Client
// Handles JWT authentication, centralized error handling, and environment URLs
// ==========================================================================

const RAW_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  ''
).replace(/\/$/, '');

// If empty in dev, Vite proxy forwards /api to http://localhost:5000/api
export const API_BASE_URL = RAW_BASE_URL
  ? (RAW_BASE_URL.endsWith('/api') ? RAW_BASE_URL : `${RAW_BASE_URL}/api`)
  : '/api';

export class ApiError extends Error {
  constructor(message, status = 500, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

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

  getRefreshToken() {
    return localStorage.getItem('oist_refresh_token') || '';
  },

  setRefreshToken(token) {
    if (token) {
      localStorage.setItem('oist_refresh_token', token);
    } else {
      localStorage.removeItem('oist_refresh_token');
    }
  },

  clearSession() {
    localStorage.removeItem('oist_jwt_token');
    localStorage.removeItem('oist_refresh_token');
    localStorage.removeItem('oist_user');
    localStorage.removeItem('oist_role');
    localStorage.removeItem('oist_auth');
  },

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers = {
      ...(options.headers || {})
    };

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      let data;
      if (options.responseType === 'blob' || contentType.includes('application/pdf') || contentType.includes('spreadsheetml') || contentType.includes('excel') || contentType.includes('octet-stream')) {
        data = await response.blob();
      } else if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        if (response.status === 401) {
          // Check if session expired
          if (endpoint !== '/auth/login' && endpoint !== '/auth/register') {
            this.clearSession();
            window.dispatchEvent(new CustomEvent('erp:auth:unauthorized', { detail: { status: 401 } }));
          }
        } else if (response.status === 403) {
          window.dispatchEvent(new CustomEvent('erp:auth:forbidden', { detail: { message: data?.message } }));
        }

        const errorMessage = data?.message || data?.error || `Request failed with status ${response.status}`;
        throw new ApiError(errorMessage, response.status, data);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new ApiError('Request timed out. Please check your connection and try again.', 408);
      }
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(error.message || 'Unable to connect to CSE ERP server.', 0);
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

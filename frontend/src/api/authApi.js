// ==========================================================================
// Authentication API Module
// Real endpoints for Login, Student/Teacher Registration, Me, OTP, Refresh
// ==========================================================================

import { apiClient } from './client';

export const authApi = {
  // Login with email, password, and authoritative role verification
  async login({ email, password, role }) {
    const res = await apiClient.post('/auth/login', { email, password, role });
    if (res?.token) {
      apiClient.setToken(res.token);
    }
    if (res?.refreshToken) {
      apiClient.setRefreshToken(res.refreshToken);
    }
    return res;
  },

  // Student Self-Registration (Strictly 'student' role, no privileged selection)
  async registerStudent({
    name,
    email,
    password,
    enrollment_no,
    year,
    semester,
    section,
    batch,
    phone
  }) {
    return apiClient.post('/auth/register', {
      role: 'student',
      name,
      email,
      password,
      enrollment_no,
      year,
      semester: Number(semester),
      section: (section || 'A').toUpperCase(),
      batch: batch || '2022-2026',
      phone
    });
  },

  // Teacher Self-Registration (Strictly 'faculty' role, no privileged selection)
  async registerTeacher({
    name,
    email,
    password,
    designation,
    specialization,
    phone
  }) {
    return apiClient.post('/auth/register', {
      role: 'faculty',
      name,
      email,
      password,
      designation: designation || 'Assistant Professor',
      specialization: specialization || 'Computer Science & Engineering',
      phone
    });
  },

  // Fetch current authenticated user session
  async getMe() {
    return apiClient.get('/auth/me');
  },

  // Refresh access token
  async refreshToken() {
    const refreshToken = apiClient.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token available');
    const res = await apiClient.post('/auth/refresh', { refreshToken });
    if (res?.token) {
      apiClient.setToken(res.token);
    }
    return res;
  },

  // Send password reset OTP
  async forgotPassword(email) {
    return apiClient.post('/auth/forgot-password', { email });
  },

  // Verify OTP and set new password
  async verifyOtp({ email, otp, newPassword }) {
    return apiClient.post('/auth/verify-otp', { email, otp, newPassword });
  },

  // Logout session
  async logout() {
    try {
      await apiClient.post('/auth/logout', {});
    } catch {
      // ignore
    } finally {
      apiClient.clearSession();
    }
  }
};

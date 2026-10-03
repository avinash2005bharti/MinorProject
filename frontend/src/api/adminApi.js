// ==========================================================================
// Admin API Module
// Real endpoints for User Management, Identity & RBAC, Analytics, HODs, Logs
// ==========================================================================

import { apiClient } from './client';

export const adminApi = {
  // 1. User Directory & RBAC
  getUsers(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.append('q', params.q);
    if (params.role) searchParams.append('role', params.role);
    if (params.status) searchParams.append('status', params.status);
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);

    const query = searchParams.toString();
    return apiClient.get(`/admin/users${query ? `?${query}` : ''}`);
  },

  createUser(userData) {
    return apiClient.post('/admin/users', userData);
  },

  getUserById(id) {
    return apiClient.get(`/admin/users/${id}`);
  },

  updateUser(id, data) {
    return apiClient.put(`/admin/users/${id}`, data);
  },

  updateUserStatus(id, status) {
    return apiClient.patch(`/admin/users/${id}/status`, { status });
  },

  resetUserPassword(id) {
    return apiClient.post(`/admin/users/${id}/reset-password`);
  },

  // 2. HOD Assignment & Revocation
  assignHod(teacher_id, department_id) {
    return apiClient.post('/admin/hod/assign', { teacher_id, department_id });
  },

  removeHod(department_id, teacher_id) {
    return apiClient.post('/admin/hod/remove', { department_id, teacher_id });
  },

  // 3. Department Analytics & Workload
  getAnalytics() {
    return apiClient.get('/admin/analytics');
  },

  getFacultyWorkload() {
    return apiClient.get('/admin/faculty-workload');
  },

  getLogs(limit = 50) {
    return apiClient.get(`/admin/logs?limit=${limit}`);
  },

  // 4. AI & System Settings
  getAiConfig() {
    return apiClient.get('/admin/ai-config');
  },

  updateAiConfig(data) {
    return apiClient.put('/admin/ai-config', data);
  }
};

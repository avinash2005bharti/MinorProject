// ==========================================================================
// Dashboard API Module
// Real endpoints for Role-specific Dashboards
// ==========================================================================

import { apiClient } from './client';

export const dashboardApi = {
  getStudentDashboard() {
    return apiClient.get('/dashboard/student');
  },

  getTeacherDashboard() {
    return apiClient.get('/dashboard/teacher');
  },

  getTgDashboard(params = {}) {
    return apiClient.get('/dashboard/tg', { params });
  },

  getHodDashboard() {
    return apiClient.get('/dashboard/hod');
  },

  getAdminDashboard() {
    return apiClient.get('/dashboard/admin');
  }
};

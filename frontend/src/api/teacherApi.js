// ==========================================================================
// Teacher / Faculty API Module
// Real endpoints for Faculty Directory, Workload, Profiles & Management
// ==========================================================================

import { apiClient } from './client';

export const teacherApi = {
  // Get all faculty with search and filter
  getFaculty(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const qs = query.toString();
    return apiClient.get(`/faculty${qs ? `?${qs}` : ''}`);
  },

  getFacultyById(id) {
    return apiClient.get(`/faculty/${id}`);
  },

  createFaculty(data) {
    return apiClient.post('/faculty', data);
  },

  updateFaculty(id, data) {
    return apiClient.put(`/faculty/${id}`, data);
  },

  deleteFaculty(id) {
    return apiClient.delete(`/faculty/${id}`);
  },

  appointTg(id, data = {}) {
    return apiClient.post(`/faculty/${id}/appoint-tg`, data);
  },

  revokeTg(id) {
    return apiClient.post(`/faculty/${id}/revoke-tg`);
  }
};

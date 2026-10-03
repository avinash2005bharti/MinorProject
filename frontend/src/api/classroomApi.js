// ============================================================================
// Classroom & Lab Management API
// ============================================================================

import { apiClient } from './client';

export const classroomApi = {
  getClassrooms(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/classrooms${query ? `?${query}` : ''}`);
  },

  createClassroom(data) {
    return apiClient.post('/classrooms', data);
  },

  updateClassroom(id, data) {
    return apiClient.put(`/classrooms/${id}`, data);
  },

  deleteClassroom(id) {
    return apiClient.delete(`/classrooms/${id}`);
  }
};

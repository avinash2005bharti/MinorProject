// ==========================================================================
// Student API Module
// Real endpoints for Student Directory, Profiles, Creation & Management
// ==========================================================================

import { apiClient } from './client';

export const studentApi = {
  // Get all students with search, filters (year, sem, section, batch), pagination
  getStudents(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const qs = query.toString();
    return apiClient.get(`/students${qs ? `?${qs}` : ''}`);
  },

  getStudentById(id) {
    return apiClient.get(`/students/${id}`);
  },

  createStudent(data) {
    return apiClient.post('/students', data);
  },

  updateStudent(id, data) {
    return apiClient.put(`/students/${id}`, data);
  },

  deleteStudent(id) {
    return apiClient.delete(`/students/${id}`);
  }
};

// ==========================================================================
// Academic Structure API Module
// Real endpoints for Department Hierarchy, Subjects, and Sections
// ==========================================================================

import { apiClient } from './client';

export const academicApi = {
  // CSE Hierarchy: 1st-4th Year -> Semesters 1-8 -> Sections & Subjects
  getHierarchy() {
    return apiClient.get('/academic/hierarchy');
  },

  // Subjects
  getSubjects(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/academic/subjects${query ? `?${query}` : ''}`);
  },

  createSubject(data) {
    return apiClient.post('/academic/subjects', data);
  },

  updateSubject(id, data) {
    return apiClient.put(`/academic/subjects/${id}`, data);
  },

  deleteSubject(id) {
    return apiClient.delete(`/academic/subjects/${id}`);
  },

  // Sections
  getSections(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/academic/sections${query ? `?${query}` : ''}`);
  },

  createSection(data) {
    return apiClient.post('/academic/sections', data);
  },

  deleteSection(id) {
    return apiClient.delete(`/academic/sections/${id}`);
  }
};

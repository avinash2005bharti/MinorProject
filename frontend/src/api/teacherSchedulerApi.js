// ==========================================================================
// Teacher Scheduler API Module
// Real endpoints for Teacher Absence Reporting, AI Substitution Analysis,
// Approval & Application
// ==========================================================================

import { apiClient } from './client';

export const teacherSchedulerApi = {
  // 1. Report teacher absence
  reportAbsence(teacherId, data) {
    return apiClient.post(`/teacher-scheduler/teachers/${teacherId}/absence`, data);
  },

  // 2. AI Scheduler Analysis & Substitution Proposals
  analyzeAbsence(data) {
    return apiClient.post('/teacher-scheduler/analyze', data);
  },

  proposeSubstitutions(data) {
    return apiClient.post('/teacher-scheduler/propose', data);
  },

  // 3. Apply Approved Substitutions
  applySubstitutions(data) {
    return apiClient.post('/teacher-scheduler/apply', data);
  },

  // 4. Conflicts
  getConflicts() {
    return apiClient.get('/teacher-scheduler/conflicts');
  },

  // 5. Substitutions history
  getTeacherSubstitutions(teacherId) {
    return apiClient.get(`/teacher-scheduler/teachers/${teacherId}/substitutions`);
  },

  approveSubstitution(id) {
    return apiClient.post(`/teacher-scheduler/substitutions/${id}/approve`, {});
  },

  rejectSubstitution(id) {
    return apiClient.post(`/teacher-scheduler/substitutions/${id}/reject`, {});
  }
};

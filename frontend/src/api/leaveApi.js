// ============================================================================
// Leave & Faculty Availability API
// Real endpoints for Teacher Leave Toggles, Today's Leaves,
// Affected Classes, and AI-Powered Substitution Proposals
// ============================================================================

import { apiClient } from './client';

export const leaveApi = {
  // Get all leaves active today
  getTodayLeaves() {
    return apiClient.get('/leaves/today');
  },

  // Get department faculty availability status (🟢 Available / 🔴 On Leave)
  getFacultyAvailability() {
    return apiClient.get('/teachers/availability');
  },

  // Quick toggle teacher leave status for today
  toggleLeave(teacherId, data = {}) {
    return apiClient.post(`/teachers/${teacherId}/leave-toggle`, data);
  },

  // Get teacher's affected timetable classes for today
  getAffectedClasses(teacherId, date = '') {
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    return apiClient.get(`/teachers/${teacherId}/affected-classes${qs}`);
  },

  // Propose AI-based substitute teachers for a slot
  proposeSubstitutes(teacherId, slotId, date = '') {
    return apiClient.post(`/teachers/${teacherId}/propose-substitutes`, { slotId, date });
  },

  // HOD approves AI substitution and updates timetable
  applySubstitute(data) {
    return apiClient.post('/leaves/apply-substitute', data);
  },

  // Standard leave submission
  applyLeave(data) {
    return apiClient.post('/leaves', data);
  },

  // Approve or reject formal leave application
  updateLeaveStatus(leaveId, status, rejectionReason = '') {
    return apiClient.put(`/leaves/${leaveId}/status`, { status, rejectionReason });
  }
};

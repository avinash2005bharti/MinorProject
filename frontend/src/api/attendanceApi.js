// ==========================================================================
// Attendance API Module
// Real endpoints for Marking Attendance, Student Stats, Overrides, QR Sessions
// ==========================================================================

import { apiClient } from './client';

export const attendanceApi = {
  // Mark single student attendance
  markAttendance(data) {
    return apiClient.post('/attendance/mark', data);
  },

  // Bulk roll call
  bulkMarkAttendance(data) {
    return apiClient.post('/attendance/bulk', data);
  },

  // Get student attendance stats
  getStudentStats(studentId) {
    return apiClient.get(studentId ? `/attendance/stats/${studentId}` : '/attendance/stats');
  },

  // Get class-wide attendance report
  getClassReport(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/attendance/report${query ? `?${query}` : ''}`);
  },

  // Manual HOD/Admin/Faculty Override
  overrideAttendance(studentRoll, newPercentage, reason) {
    return apiClient.post('/attendance/override', { studentRoll, newPercentage, reason });
  },

  // Generate QR session
  generateQrSession(data) {
    return apiClient.post('/attendance/qr/generate', data);
  },

  // Scan QR session
  scanQrSession(data) {
    return apiClient.post('/attendance/qr/scan', data);
  }
};

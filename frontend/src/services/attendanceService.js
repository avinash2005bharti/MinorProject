// ==========================================================================
// CampusFlow – Attendance Service
// Handles section-wise automated propagation, recalculation, and query tracking
// Directly connected to real backend attendance APIs
// ==========================================================================

import { attendanceApi } from '../api/attendanceApi';

export const attendanceService = {
  // Recalculates student's overall attendance %
  calculatePercentage(attended, total) {
    if (!total || total === 0) return 0;
    return Math.round((attended / total) * 100);
  },

  // Determines badge color and label for attendance percentage
  getStatusThreshold(percentage) {
    if (percentage >= 75) {
      return {
        label: 'Safe Status',
        sublabel: 'Above 75% required threshold',
        badgeClass: 'badge-emerald',
        color: '#059669',
        isSafe: true
      };
    } else if (percentage >= 65) {
      return {
        label: 'Borderline Warning',
        sublabel: 'Warning: 65% – 75% range',
        badgeClass: 'badge-amber',
        color: '#D97706',
        isSafe: false
      };
    } else {
      return {
        label: 'Critical Shortage',
        sublabel: 'Critical shortage (< 65%)',
        badgeClass: 'badge-rose',
        color: '#E11D48',
        isSafe: false
      };
    }
  },

  // Real Backend API Integrations (Zero mock fallback)
  async fetchStudentAttendance(studentId) {
    return attendanceApi.getStudentStats(studentId);
  },

  async markAttendanceApi(data) {
    return attendanceApi.markAttendance(data);
  },

  async bulkRollCallApi(data) {
    return attendanceApi.bulkMarkAttendance(data);
  },

  async overrideAttendanceApi(studentRoll, newPercentage, reason) {
    return attendanceApi.overrideAttendance(studentRoll, newPercentage, reason);
  },

  async generateQrApi(data) {
    return attendanceApi.generateQrSession(data);
  },

  async scanQrApi(sessionId, token, rollNo) {
    return attendanceApi.scanQrSession({ sessionId, token, rollNo });
  }
};

// ==========================================================================
// Request & Leave API Module
// Real endpoints for Student Requests, Leaves, Attendance Considerations & Queries
// ==========================================================================

import { apiClient } from './client';

export const requestApi = {
  // Fetch all requests with status and type filters
  getAllRequests(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const qs = query.toString();
    return apiClient.get(`/requests${qs ? `?${qs}` : ''}`);
  },

  // 1. Attendance Consideration
  submitAttendanceConsideration(formData) {
    return apiClient.post('/requests/attendance/consideration', formData);
  },

  tgReviewAttendanceConsideration(id, recommendation) {
    return apiClient.put(`/requests/attendance/consideration/${id}/tg-review`, { recommendation });
  },

  hodApproveAttendanceConsideration(id) {
    return apiClient.put(`/requests/attendance/consideration/${id}/hod-approve`, {});
  },

  hodRejectAttendanceConsideration(id, reason = 'Rejected by HOD') {
    return apiClient.put(`/requests/attendance/consideration/${id}/hod-reject`, { reason });
  },

  // 2. Attendance Query (Dispute)
  submitAttendanceQuery(formData) {
    return apiClient.post('/requests/attendance/query', formData);
  },

  tgReviewAttendanceQuery(id) {
    return apiClient.put(`/requests/attendance/query/${id}/tg-review`, {});
  },

  hodApproveAttendanceQuery(id) {
    return apiClient.put(`/requests/attendance/query/${id}/hod-approve`, {});
  },

  // 3. Leave Requests
  applyLeave(formData) {
    return apiClient.post('/requests/leave', formData);
  },

  tgReviewLeave(id, approved = true) {
    return apiClient.put(`/requests/leave/${id}/tg-review`, { approved });
  },

  hodApproveLeave(id) {
    return apiClient.put(`/requests/leave/${id}/hod-approve`, {});
  },

  hodRejectLeave(id, reason = 'Rejected by HOD') {
    return apiClient.put(`/requests/leave/${id}/hod-reject`, { reason });
  }
};

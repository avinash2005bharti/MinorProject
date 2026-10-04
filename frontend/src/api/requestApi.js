// ==========================================================================
// Request & Leave API Module
// Real endpoints for Student Requests, Leaves, Attendance Considerations & Queries
// ==========================================================================

import { apiClient } from './client';

const ensureFormData = (data) => {
  if (data instanceof FormData) return data;
  const file = (data.supportingDoc instanceof File ? data.supportingDoc : null)
    || (data.file instanceof File ? data.file : null)
    || (data.proofDocument instanceof File ? data.proofDocument : null);

  if (!file) {
    // If supportingDoc was just a string filename without an actual File, clean it
    const cleanData = { ...data };
    if (typeof cleanData.supportingDoc === 'string') {
      delete cleanData.supportingDoc;
    }
    return cleanData;
  }

  const fd = new FormData();
  Object.entries(data).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      if (key === 'file' || key === 'proofDocument' || key === 'supportingDoc') {
        if (val instanceof File) {
          fd.append('supportingDoc', val);
        }
      } else {
        fd.append(key, val);
      }
    }
  });
  return fd;
};

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
    return apiClient.post('/requests/attendance/consideration', ensureFormData(formData));
  },

  tgReviewAttendanceConsideration(id, recommendation) {
    return apiClient.put(`/requests/attendance/consideration/${id}/tg-review`, { recommendation });
  },

  tgRejectAttendanceConsideration(id, reason = 'Rejected by TG') {
    return apiClient.put(`/requests/attendance/consideration/${id}/tg-reject`, { reason });
  },

  hodApproveAttendanceConsideration(id) {
    return apiClient.put(`/requests/attendance/consideration/${id}/hod-approve`, {});
  },

  hodRejectAttendanceConsideration(id, reason = 'Rejected by HOD') {
    return apiClient.put(`/requests/attendance/consideration/${id}/hod-reject`, { reason });
  },

  // 2. Attendance Query (Dispute)
  submitAttendanceQuery(formData) {
    return apiClient.post('/requests/attendance/query', ensureFormData(formData));
  },

  tgReviewAttendanceQuery(id, reviewNote) {
    return apiClient.put(`/requests/attendance/query/${id}/tg-review`, { reviewNote });
  },

  tgRejectAttendanceQuery(id, reason = 'Rejected by TG') {
    return apiClient.put(`/requests/attendance/query/${id}/tg-reject`, { reason });
  },

  hodApproveAttendanceQuery(id) {
    return apiClient.put(`/requests/attendance/query/${id}/hod-approve`, {});
  },

  hodRejectAttendanceQuery(id, reason = 'Rejected by HOD') {
    return apiClient.put(`/requests/attendance/query/${id}/hod-reject`, { reason });
  },

  // 3. Leave Requests
  applyLeave(formData) {
    return apiClient.post('/requests/leave', ensureFormData(formData));
  },

  tgReviewLeave(id, approved = true, comments) {
    return apiClient.put(`/requests/leave/${id}/tg-review`, { approved, comments });
  },

  tgRejectLeave(id, reason = 'Rejected by TG') {
    return apiClient.put(`/requests/leave/${id}/tg-reject`, { reason });
  },

  hodApproveLeave(id, comments) {
    return apiClient.put(`/requests/leave/${id}/hod-approve`, { comments });
  },

  hodRejectLeave(id, reason = 'Rejected by HOD') {
    return apiClient.put(`/requests/leave/${id}/hod-reject`, { reason });
  },

  // 4. Google Live Sheet Integration
  getGoogleSheetConfig() {
    return apiClient.get('/requests/google-sheet/config');
  },

  saveGoogleSheetConfig(config) {
    return apiClient.post('/requests/google-sheet/config', config);
  },

  syncAllToGoogleSheet(params = {}) {
    return apiClient.post('/requests/google-sheet/sync-all', params);
  },

  testGoogleSheetConnection(webhookUrl) {
    return apiClient.post('/requests/google-sheet/test', { webhookUrl });
  }
};

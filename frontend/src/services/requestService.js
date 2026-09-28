// ==========================================================================
// CampusFlow – Request Service
// Handles filtering, status tracking, and clearance lifecycle
// ==========================================================================

import { apiClient } from './api';

export const requestService = {
  getStatusDisplay(status) {
    switch (status) {
      case 'pending_tg':
        return { label: 'Pending TG Review', badgeClass: 'badge-amber', stepIndex: 1 };
      case 'pending_hod':
        return { label: 'Pending HOD Clearance', badgeClass: 'badge-amber', stepIndex: 2 };
      case 'pending_hod_direct':
        return { label: 'Direct HOD Clearance (TG Unavailable)', badgeClass: 'badge-rose', stepIndex: 2 };
      case 'processing_agent':
        return { label: 'Agent Processing', badgeClass: 'badge-indigo', stepIndex: 3 };
      case 'completed':
      case 'approved':
        return { label: 'Approved & Synced', badgeClass: 'badge-emerald', stepIndex: 4 };
      case 'rejected':
        return { label: 'Rejected', badgeClass: 'badge-rose', stepIndex: 4 };
      default:
        return { label: status, badgeClass: 'badge-slate', stepIndex: 0 };
    }
  },

  // Backend API calls
  async fetchAllRequestsApi(status) {
    const query = status ? `?status=${status}` : '';
    return apiClient.get(`/requests${query}`);
  },

  async submitAttendanceConsiderationApi(formData) {
    return apiClient.post('/requests/attendance/consideration', formData);
  },

  async tgReviewAttendanceConsiderationApi(id, recommendation) {
    return apiClient.put(`/requests/attendance/consideration/${id}/tg-review`, { recommendation });
  },

  async hodApproveAttendanceConsiderationApi(id) {
    return apiClient.put(`/requests/attendance/consideration/${id}/hod-approve`, {});
  },

  async submitAttendanceQueryApi(formData) {
    return apiClient.post('/requests/attendance/query', formData);
  },

  async tgReviewAttendanceQueryApi(id) {
    return apiClient.put(`/requests/attendance/query/${id}/tg-review`, {});
  },

  async hodApproveAttendanceQueryApi(id) {
    return apiClient.put(`/requests/attendance/query/${id}/hod-approve`, {});
  }
};

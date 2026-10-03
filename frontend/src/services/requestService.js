// ==========================================================================
// CampusFlow – Request Service
// Handles filtering, status tracking, and clearance lifecycle
// Directly connected to real backend request endpoints
// ==========================================================================

import { requestApi } from '../api/requestApi';

export const requestService = {
  getStatusDisplay(status) {
    switch (status) {
      case 'pending_tg':
        return { label: 'Pending TG Review', badgeClass: 'badge-amber', stepIndex: 1 };
      case 'pending_hod':
        return { label: 'Pending HOD Clearance', badgeClass: 'badge-amber', stepIndex: 2 };
      case 'pending_hod_direct':
        return { label: 'Direct HOD Clearance (TG Bypassed)', badgeClass: 'badge-rose', stepIndex: 2 };
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

  // Real Backend API calls
  async fetchAllRequestsApi(status) {
    const res = await requestApi.getAllRequests(status ? { status } : {});
    return res;
  },

  async submitAttendanceConsiderationApi(formData) {
    return requestApi.submitAttendanceConsideration(formData);
  },

  async tgReviewAttendanceConsiderationApi(id, recommendation) {
    return requestApi.tgReviewAttendanceConsideration(id, recommendation);
  },

  async hodApproveAttendanceConsiderationApi(id) {
    return requestApi.hodApproveAttendanceConsideration(id);
  },

  async hodRejectAttendanceConsiderationApi(id, reason = 'Rejected by HOD') {
    return requestApi.hodRejectAttendanceConsideration(id, reason);
  },

  async submitAttendanceQueryApi(formData) {
    return requestApi.submitAttendanceQuery(formData);
  },

  async tgReviewAttendanceQueryApi(id) {
    return requestApi.tgReviewAttendanceQuery(id);
  },

  async hodApproveAttendanceQueryApi(id) {
    return requestApi.hodApproveAttendanceQuery(id);
  }
};

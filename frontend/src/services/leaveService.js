// ==========================================================================
// CampusFlow – Leave Service
// Directly connected to real backend leave and request endpoints
// ==========================================================================

import { requestApi } from '../api/requestApi';

export const leaveService = {
  getLeaveTypeBadge(type) {
    switch (type?.toLowerCase()) {
      case 'medical':
        return { label: 'Medical Leave', class: 'badge-emerald' };
      case 'duty':
      case 'on-duty':
        return { label: 'On-Duty (OD)', class: 'badge-indigo' };
      case 'personal':
      default:
        return { label: 'Personal Leave', class: 'badge-amber' };
    }
  },

  async applyLeaveApi(formData) {
    return requestApi.applyLeave(formData);
  },

  async tgReviewLeaveApi(leaveId, approved = true) {
    return requestApi.tgReviewLeave(leaveId, approved);
  },

  async hodApproveLeaveApi(leaveId) {
    return requestApi.hodApproveLeave(leaveId);
  },

  async hodRejectLeaveApi(leaveId, reason = 'Rejected by HOD') {
    return requestApi.hodRejectLeave(leaveId, reason);
  }
};

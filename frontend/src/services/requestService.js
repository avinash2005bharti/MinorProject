// ==========================================================================
// CampusFlow – Request Service
// Handles filtering, status tracking, and clearance lifecycle
// ==========================================================================

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
  }
};

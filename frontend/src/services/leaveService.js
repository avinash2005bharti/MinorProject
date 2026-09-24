// ==========================================================================
// CampusFlow – Leave Service
// Handles leave submission, TG availability telemetry, and direct HOD routing
// ==========================================================================

export const leaveService = {
  // Routes leave request based on mentor availability
  evaluateLeaveRouting(isTgAvailable) {
    if (isTgAvailable) {
      return {
        nextStatus: 'pending_tg',
        nextActor: 'Prof. K. Sen (TG)',
        routingNote: 'Standard 3-stage clearance pipeline active: Student → TG Review → HOD Clearance.',
        isFallback: false
      };
    } else {
      return {
        nextStatus: 'pending_hod_direct',
        nextActor: 'Dr. S. Roy (HOD Direct Clearance)',
        routingNote: 'Autonomous fallback routing: Mentor is currently marked unavailable/on leave. Routed directly to HOD to prevent clearance delays.',
        isFallback: true
      };
    }
  },

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
  }
};

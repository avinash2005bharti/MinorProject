import React from 'react';

export default function ApprovalStatus({ status }) {
  let label = 'Pending';
  let badgeClass = 'badge-slate';

  switch (status) {
    case 'pending_tg':
      label = 'TG Review';
      badgeClass = 'badge-indigo';
      break;
    case 'pending_hod':
      label = 'Pending HOD';
      badgeClass = 'badge-amber';
      break;
    case 'pending_hod_direct':
      label = 'Direct HOD Clearance';
      badgeClass = 'badge-rose';
      break;
    case 'processing_agent':
      label = 'Agent Syncing';
      badgeClass = 'badge-indigo';
      break;
    case 'completed':
    case 'approved':
      label = 'Approved';
      badgeClass = 'badge-emerald';
      break;
    case 'rejected':
      label = 'Rejected';
      badgeClass = 'badge-rose';
      break;
    default:
      label = status;
      badgeClass = 'badge-slate';
  }

  return <span className={`badge ${badgeClass}`}>{label}</span>;
}

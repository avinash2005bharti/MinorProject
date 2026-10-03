import React from 'react';

export default function ApprovalStatus({ status }) {
  const norm = String(status || '').trim().toLowerCase();
  let label = status || 'Pending';
  let badgeClass = 'badge-slate';

  switch (norm) {
    case 'pending_tg':
      label = 'TG Review';
      badgeClass = 'badge-indigo';
      break;
    case 'recommended_by_tg':
      label = 'Recommended by TG';
      badgeClass = 'badge-indigo';
      break;
    case 'pending_hod':
    case 'pending':
      label = 'Pending Review';
      badgeClass = 'badge-amber';
      break;
    case 'pending_hod_direct':
      label = 'Direct HOD Clearance';
      badgeClass = 'badge-rose';
      break;
    case 'processing_agent':
    case 'processing':
      label = 'Agent Syncing';
      badgeClass = 'badge-indigo';
      break;
    case 'completed':
    case 'approved':
    case 'approved_by_hod':
      label = 'Approved';
      badgeClass = 'badge-emerald';
      break;
    case 'rejected':
      label = 'Rejected';
      badgeClass = 'badge-rose';
      break;
    default:
      label = status || 'Pending';
      badgeClass = 'badge-slate';
  }

  return <span className={`badge ${badgeClass}`}>{label}</span>;
}

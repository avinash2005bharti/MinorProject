import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import RequestCard from '../../components/RequestCard';
import { Compass, Filter, Zap, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function HodRequestsCentral() {
  const {
    attendanceRequests,
    leaveRequests,
    attendanceQueries,
    hodApproveAttendanceConsideration,
    hodRejectAttendanceConsideration,
    hodApproveLeave,
    hodRejectLeave,
    hodApproveAttendanceQuery
  } = useERP();

  const [filter, setFilter] = useState('all');

  const allRequests = [
    ...attendanceRequests.map((r) => ({ ...r, type: 'attendance_consideration' })),
    ...leaveRequests.map((l) => ({ ...l, type: 'leave_request' })),
    ...attendanceQueries.map((q) => ({
      ...q,
      title: `Attendance Query: ${q.subjectName || q.subject || 'Dispute'}`,
      type: 'attendance_query'
    }))
  ];

  const isAccepted = (status) => {
    const s = String(status || '').toLowerCase();
    return s === 'approved' || s === 'completed' || s === 'approved_by_hod';
  };

  const isAwaitingHod = (status) => {
    const s = String(status || '').toLowerCase();
    return s === 'pending_hod' || s === 'pending_hod_direct' || s === 'recommended_by_tg';
  };

  const isPendingTg = (status) => {
    const s = String(status || '').toLowerCase();
    return s === 'pending' || s === 'pending_tg';
  };

  const filtered = allRequests.filter((r) => {
    if (filter === 'pending') return isAwaitingHod(r.status);
    if (filter === 'bypass') return isPendingTg(r.status);
    if (filter === 'leaves') return r.type === 'leave_request';
    if (filter === 'considerations') return r.type === 'attendance_consideration';
    if (filter === 'approved') return isAccepted(r.status);
    return true;
  });

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Department Requests & Approvals Central
            </h1>
            <span className="badge badge-indigo">HOD Digital Sign-off</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Central repository of attendance considerations, student leave applications, and attendance dispute queries with direct TG bypass authority
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '2px' }}>
          {[
            { id: 'all', label: `All Requests (${allRequests.length})` },
            { id: 'pending', label: `Awaiting HOD Sign-off (${allRequests.filter((r) => isAwaitingHod(r.status)).length})` },
            { id: 'bypass', label: `⚡ In TG Queue / Direct Bypass (${allRequests.filter((r) => isPendingTg(r.status)).length})` },
            { id: 'leaves', label: `Leave Applications (${allRequests.filter((r) => r.type === 'leave_request').length})` },
            { id: 'considerations', label: `Considerations (${allRequests.filter((r) => r.type === 'attendance_consideration').length})` },
            { id: 'approved', label: `Cleared & Synced (${allRequests.filter((r) => isAccepted(r.status)).length})` }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="btn btn-sm"
              style={{
                backgroundColor: filter === f.id ? 'var(--primary)' : '#FFFFFF',
                color: filter === f.id ? '#FFFFFF' : 'var(--text-secondary)',
                border: filter === f.id ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                fontSize: '12px',
                fontWeight: filter === f.id ? 700 : 500,
                boxShadow: filter === f.id ? '0 2px 6px rgba(29, 78, 216, 0.2)' : 'var(--shadow-sm)'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List with Interactive Actions enabled */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filtered.length === 0 ? (
            <div className="card text-center p-8 text-slate-400 text-xs">
              No requests match the selected filter.
            </div>
          ) : (
            filtered.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                showActions={req.status !== 'completed' && req.status !== 'approved' && req.status !== 'rejected'}
                role="hod"
                onApprove={() => {
                  if (req.type === 'attendance_consideration') {
                    hodApproveAttendanceConsideration(req.id, req.status === 'pending_tg');
                  } else if (req.type === 'leave_request' || req.leaveType) {
                    hodApproveLeave(req.id, req.status === 'pending_tg');
                  } else {
                    hodApproveAttendanceQuery(req.id);
                  }
                }}
                onReject={() => {
                  if (req.type === 'attendance_consideration') {
                    hodRejectAttendanceConsideration(req.id);
                  } else if (req.type === 'leave_request' || req.leaveType) {
                    hodRejectLeave(req.id);
                  }
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

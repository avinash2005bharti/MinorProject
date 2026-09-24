import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import RequestCard from '../../components/RequestCard';
import { Compass, Filter } from 'lucide-react';

export default function HodRequestsCentral() {
  const { attendanceRequests, leaveRequests, attendanceQueries } = useERP();
  const [filter, setFilter] = useState('all');

  const allRequests = [
    ...attendanceRequests,
    ...leaveRequests,
    ...attendanceQueries.map((q) => ({
      ...q,
      title: `Attendance Query: ${q.subject}`,
      type: 'attendance_query'
    }))
  ];

  const filtered = allRequests.filter((r) => {
    if (filter === 'pending') return r.status.includes('pending');
    if (filter === 'approved') return r.status === 'completed' || r.status === 'approved';
    if (filter === 'direct') return r.tgUnavailable || r.status === 'pending_hod_direct';
    return true;
  });

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Department Requests & Approvals Central
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Central repository of attendance considerations, queries, and leave applications
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '2px' }}>
          {[
            { id: 'all', label: `All Requests (${allRequests.length})` },
            { id: 'pending', label: `Pending HOD Action (${allRequests.filter((r) => r.status.includes('pending')).length})` },
            { id: 'direct', label: `Direct Fallback Route (${allRequests.filter((r) => r.tgUnavailable || r.status === 'pending_hod_direct').length})` },
            { id: 'approved', label: `Cleared & Synced (${allRequests.filter((r) => r.status === 'completed' || r.status === 'approved').length})` }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="btn btn-sm"
              style={{
                backgroundColor: filter === f.id ? 'var(--primary)' : 'var(--surface-low)',
                color: filter === f.id ? '#FFFFFF' : 'var(--text-secondary)',
                fontSize: '12px'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filtered.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              showActions={false}
              role="hod"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import RequestCard from '../../components/RequestCard';
import { FileText, AlertTriangle, CheckCircle2, Calendar, User, Clock } from 'lucide-react';

export default function HodLeaveApproval() {
  const { leaveRequests, hodApproveLeave, hodRejectLeave } = useERP();
  const [tab, setTab] = useState('pending'); // pending | approved

  const isAccepted = (status) => {
    const s = String(status || '').toLowerCase();
    return s === 'approved' || s === 'completed';
  };

  const pendingLeaves = leaveRequests.filter(l => !isAccepted(l.status) && String(l.status || '').toLowerCase() !== 'rejected');
  const approvedLeaves = leaveRequests.filter(l => isAccepted(l.status));
  const directFallbackLeaves = pendingLeaves.filter((l) => l.tgUnavailable || l.status === 'pending_hod_direct');

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Leave Management & Clearance
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Digital sign-off on 3-tier and direct-routed student leaves with authoritative approval ledger
          </p>
        </div>

        {/* Tab switchers */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--surface-high)',
            borderRadius: 'var(--radius-full)',
            padding: '4px',
            gap: '4px',
            maxWidth: '460px'
          }}
        >
          <button
            onClick={() => setTab('pending')}
            style={{
              flex: 1,
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '12px',
              fontWeight: tab === 'pending' ? 700 : 500,
              backgroundColor: tab === 'pending' ? '#FFFFFF' : 'transparent',
              color: tab === 'pending' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: tab === 'pending' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Awaiting Clearance ({pendingLeaves.length})
          </button>

          <button
            onClick={() => setTab('approved')}
            style={{
              flex: 1,
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '12px',
              fontWeight: tab === 'approved' ? 700 : 500,
              backgroundColor: tab === 'approved' ? '#FFFFFF' : 'transparent',
              color: tab === 'approved' ? 'var(--secondary)' : 'var(--text-secondary)',
              boxShadow: tab === 'approved' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px'
            }}
            id="tab-hod-approved-leaves"
          >
            <CheckCircle2 size={14} color={tab === 'approved' ? 'var(--secondary)' : 'currentColor'} />
            <span>Accepted Leaves ({approvedLeaves.length})</span>
          </button>
        </div>

        {/* Direct Routing Highlight Banner if in pending tab */}
        {tab === 'pending' && directFallbackLeaves.length > 0 && (
          <div
            style={{
              backgroundColor: 'var(--tertiary-container)',
              padding: '1rem',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid #FDE68A',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <AlertTriangle size={20} color="var(--tertiary)" style={{ flexShrink: 0 }} />
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--on-tertiary-container)' }}>
                Direct HOD Clearance Queue ({directFallbackLeaves.length} items)
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--on-tertiary-container)', opacity: 0.9 }}>
                These leave applications were routed directly to you because the mentor/TG was marked on leave/unavailable.
              </p>
            </div>
          </div>
        )}

        {/* TAB 1: PENDING LEAVES */}
        {tab === 'pending' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {pendingLeaves.length === 0 ? (
              <div className="card text-center" style={{ padding: '2.5rem', color: 'var(--text-secondary)' }}>
                <FileText size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>No records found.</h3>
                <p style={{ fontSize: '13px', margin: '0.25rem 0 0' }}>No student leave applications awaiting clearance.</p>
              </div>
            ) : (
              pendingLeaves.map((req) => (
                <RequestCard
                  key={req.id}
                  request={req}
                  showActions={req.status !== 'completed' && req.status !== 'approved' && req.status !== 'rejected'}
                  role="hod"
                  onApprove={() => hodApproveLeave(req.id, req.status === 'pending_tg')}
                  onReject={() => hodRejectLeave(req.id)}
                />
              ))
            )}
          </div>
        )}

        {/* TAB 2: ACCEPTED / APPROVED LEAVES LIST */}
        {tab === 'approved' && (
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Accepted Student Leaves Ledger
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Officially sanctioned leaves synchronized with department attendance registers
                </span>
              </div>
              <span className="badge badge-emerald" style={{ fontSize: '12px', padding: '0.35rem 0.75rem' }}>
                {approvedLeaves.length} Sanctioned Leaves
              </span>
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--surface-low)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Student Name</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Roll / Enrollment</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Leave Type</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Duration & Dates</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Reason</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedLeaves.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <CheckCircle2 size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No approved leaves yet</div>
                        <div style={{ fontSize: '12px', marginTop: '2px' }}>
                          Approved student leave applications will appear here automatically.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    approvedLeaves.map((lv, idx) => (
                      <tr
                        key={lv.id || idx}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(248, 250, 252, 0.5)'
                        }}
                      >
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                            {lv.studentName || 'Student'}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Section {lv.section || 'A'} • Sem {lv.semester || 5}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {lv.rollNo || lv.enrollmentNo || '—'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className="badge badge-emerald" style={{ fontSize: '11px' }}>
                            {lv.leaveType || 'Casual'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                            <span>{lv.dateRangeLabel || lv.dates || '—'}</span>
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Total: {lv.totalDays || 1} day(s)
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', maxWidth: '240px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {lv.reason || 'Personal reasons approved'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                            <CheckCircle2 size={12} />
                            <span>Approved by HOD</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import RequestCard from '../../components/RequestCard';
import { FileText, CheckCircle2, UserCheck, AlertTriangle } from 'lucide-react';

export default function TgRequests() {
  const {
    attendanceRequests,
    leaveRequests,
    attendanceQueries,
    tgReviewAttendanceConsideration,
    tgReviewAttendanceQuery,
    tgReviewLeave,
    tgAvailable
  } = useERP();

  const [activeTab, setActiveTab] = useState('attendance');

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Student Requests & Mentorship Approvals
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              1st-tier verification pipeline before forwarding to Head of Department
            </p>
          </div>

          {!tgAvailable && (
            <span className="badge badge-rose">
              <AlertTriangle size={14} />
              <span>TG Marked Unavailable: Leaves Auto-Bypass to HOD</span>
            </span>
          )}
        </div>

        {/* Request Category Tabs */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--surface-high)',
            borderRadius: 'var(--radius-full)',
            padding: '4px',
            gap: '4px',
            overflowX: 'auto'
          }}
        >
          {[
            { id: 'attendance', label: `Attendance Considerations (${attendanceRequests.length})` },
            { id: 'queries', label: `Attendance Queries (${attendanceQueries.length})` },
            { id: 'leave', label: `Leave Applications (${leaveRequests.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: activeTab === tab.id ? 700 : 500,
                backgroundColor: activeTab === tab.id ? '#FFFFFF' : 'transparent',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Requests List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {activeTab === 'attendance' && (
            attendanceRequests.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                showActions={req.status === 'pending_tg'}
                role="tg"
                onRecommend={() => tgReviewAttendanceConsideration(req.id, 'Verified by Mentor Prof. K. Sen: Valid duty certificate. Strongly recommended.')}
              />
            ))
          )}

          {activeTab === 'queries' && (
            attendanceQueries.map((q) => (
              <RequestCard
                key={q.id}
                request={{
                  ...q,
                  title: `Attendance Query: ${q.subject}`,
                  dateRangeLabel: q.date
                }}
                showActions={q.status === 'pending_tg'}
                role="tg"
                onRecommend={() => tgReviewAttendanceQuery(q.id)}
              />
            ))
          )}

          {activeTab === 'leave' && (
            leaveRequests.map((lv) => (
              <RequestCard
                key={lv.id}
                request={lv}
                showActions={lv.status === 'pending_tg'}
                role="tg"
                onRecommend={() => tgReviewLeave(lv.id, true)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

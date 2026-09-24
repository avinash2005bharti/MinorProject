import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import RequestCard from '../../components/RequestCard';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Sparkles,
  Bot,
  Layers,
  Calendar,
  User,
  ArrowRight,
  FileText,
  Clock
} from 'lucide-react';

export default function HodAttendanceApproval() {
  const {
    attendanceRequests,
    attendanceQueries,
    hodApproveAttendanceConsideration,
    hodApproveAttendanceQuery
  } = useERP();

  const [activeTab, setActiveTab] = useState('considerations');

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Attendance Consideration & Clearance
              </h1>
              <span className="badge badge-emerald">Autonomous Agent Linked</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Approving attendance consideration automatically synchronizes section schedules & recalculates metrics
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.85rem',
              backgroundColor: 'var(--primary-container)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--primary)',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            <Bot size={16} />
            <span>Attendance Agent: Online & Ready</span>
          </div>
        </div>

        {/* Informative Architectural Flow Banner */}
        <div
          style={{
            backgroundColor: 'var(--surface-low)',
            padding: '1rem',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Autonomous Attendance Agent Architecture
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>HOD Approval</span>
            <ArrowRight size={13} />
            <span className="badge badge-indigo">Attendance Agent Activates</span>
            <ArrowRight size={13} />
            <span>Identify Affected Dates</span>
            <ArrowRight size={13} />
            <span>Query Student Section (CSE-3A)</span>
            <ArrowRight size={13} />
            <span>Auto-Update Classes</span>
            <ArrowRight size={13} />
            <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>Recalculate %</span>
            <ArrowRight size={13} />
            <span>Notify Student & Teachers</span>
          </div>
        </div>

        {/* Tab switchers */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--surface-high)',
            borderRadius: 'var(--radius-full)',
            padding: '4px',
            gap: '4px'
          }}
        >
          <button
            onClick={() => setActiveTab('considerations')}
            style={{
              flex: 1,
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '12px',
              fontWeight: activeTab === 'considerations' ? 700 : 500,
              backgroundColor: activeTab === 'considerations' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'considerations' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'considerations' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Attendance Considerations ({attendanceRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('queries')}
            style={{
              flex: 1,
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '12px',
              fontWeight: activeTab === 'queries' ? 700 : 500,
              backgroundColor: activeTab === 'queries' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'queries' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'queries' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Attendance Correction Queries ({attendanceQueries.length})
          </button>
        </div>

        {/* Detailed Consideration Cards */}
        {activeTab === 'considerations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {attendanceRequests.map((req) => {
              const isPendingHod = req.status === 'pending_hod' || req.status === 'pending_tg';
              const isCompleted = req.status === 'completed';

              return (
                <div key={req.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Top Bar with Student Info & Status */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: 'var(--radius-xl)',
                          backgroundColor: 'var(--primary-fixed)',
                          color: 'var(--on-primary-fixed)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <User size={22} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {req.studentName}
                          </h3>
                          <span className="badge badge-indigo">{req.section}</span>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Roll No: {req.rollNo} • {req.department} • Semester {req.semester}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`badge ${isCompleted ? 'badge-emerald' : 'badge-amber'}`}>
                        {isCompleted ? 'Approved & Synced' : req.status === 'pending_hod' ? 'Awaiting HOD Approval' : 'Awaiting TG Review'}
                      </span>
                    </div>
                  </div>

                  {/* Period, Reason & Metric Projections */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '0.75rem' }} className="sm:grid-cols-3">
                    <div style={{ backgroundColor: 'var(--surface-low)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                        Requested Period
                      </span>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {req.dateRangeLabel}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>6 affected lectures</span>
                    </div>

                    <div style={{ backgroundColor: 'var(--surface-low)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                        Current Attendance
                      </span>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--error)', marginTop: '2px' }}>
                        {isCompleted ? 84 : req.currentAttendance}%
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--error)' }}>
                        {isCompleted ? 'Raised to Safe Status' : 'Warning Shortage (<75%)'}
                      </span>
                    </div>

                    <div style={{ backgroundColor: 'var(--primary-container)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                        Expected After Agent Sync
                      </span>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--secondary)', marginTop: '2px' }}>
                        84%
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--secondary)' }}>Safe Threshold Guaranteed</span>
                    </div>
                  </div>

                  {/* Reason & TG Recommendation */}
                  <div style={{ backgroundColor: 'var(--surface-low)', padding: '0.85rem', borderRadius: 'var(--radius-lg)', fontSize: '13px' }}>
                    <div style={{ marginBottom: '4px' }}>
                      <strong>Reason: </strong>
                      <span style={{ color: 'var(--text-secondary)' }}>{req.reason}</span>
                    </div>
                    {req.tgRecommendation && (
                      <div style={{ color: 'var(--primary)', fontWeight: 500, marginTop: '4px' }}>
                        <strong>TG Recommendation: </strong>
                        <span>{req.tgRecommendation}</span>
                      </div>
                    )}
                  </div>

                  {/* Section-Wise Affected Classes Discovery Table (Matching Feature 7) */}
                  <div style={{ backgroundColor: 'var(--surface-low)', padding: '0.85rem', borderRadius: 'var(--radius-xl)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Layers size={15} color="var(--primary)" />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Identified Affected Classes across Section {req.section}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        No teacher manual edit needed
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '0.4rem' }} className="sm:grid-cols-2 lg:grid-cols-3">
                      {req.affectedClasses?.map((cls, idx) => (
                        <div
                          key={idx}
                          style={{
                            backgroundColor: '#FFFFFF',
                            padding: '0.5rem 0.75rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '11px'
                          }}
                        >
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cls.subject}</div>
                          <div style={{ color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                            <span>{cls.date} • {cls.period}</span>
                            <span style={{ color: isCompleted ? 'var(--secondary)' : 'var(--tertiary)', fontWeight: 600 }}>
                              {isCompleted ? 'Credited' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.25rem' }}>
                    {isCompleted ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)', fontSize: '13px', fontWeight: 600 }}>
                        <CheckCircle2 size={18} />
                        <span>Autonomous Update Propagated Across Section {req.section}</span>
                      </div>
                    ) : (
                      <>
                        <button className="btn btn-outline" style={{ color: 'var(--error)' }}>
                          Reject Application
                        </button>

                        <button
                          onClick={() => hodApproveAttendanceConsideration(req.id)}
                          className="btn btn-primary"
                          style={{
                            backgroundColor: 'var(--secondary)',
                            borderRadius: 'var(--radius-xl)',
                            boxShadow: 'var(--shadow-sm)'
                          }}
                        >
                          <Sparkles size={16} />
                          <span>Approve (Trigger Attendance Agent)</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Queries Tab */}
        {activeTab === 'queries' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {attendanceQueries.map((q) => (
              <RequestCard
                key={q.id}
                request={{
                  ...q,
                  title: `Attendance Query: ${q.subject}`,
                  dateRangeLabel: q.date
                }}
                showActions={q.status !== 'completed'}
                role="hod"
                onApprove={() => hodApproveAttendanceQuery(q.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

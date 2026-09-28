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
  Clock,
  ShieldCheck,
  Zap,
  AlertTriangle
} from 'lucide-react';

export default function HodAttendanceApproval() {
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

  const [activeTab, setActiveTab] = useState('considerations');

  const pendingConsiderationsCount = attendanceRequests.filter(
    (r) => r.status === 'pending_hod' || r.status === 'pending_tg'
  ).length;

  const pendingLeavesCount = leaveRequests.filter(
    (l) => l.status === 'pending_hod' || l.status === 'pending_hod_direct' || l.status === 'pending_tg'
  ).length;

  const pendingQueriesCount = attendanceQueries.filter((q) => q.status !== 'completed').length;

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Department Approvals & Clearance Center
              </h1>
              <span className="badge badge-emerald">Direct HOD Override Active</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Authorize student attendance considerations, dispute queries, and leave applications with direct TG bypass authority
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
            <span>Autonomous Attendance & Leave Agent: Online</span>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Autonomous Clearance & HOD Direct Access Protocol
            </span>
            <span className="badge badge-indigo text-[10px]">TG Bypass Capable</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Student Submits</span>
            <ArrowRight size={13} />
            <span className="badge badge-amber">TG Review Queue</span>
            <ArrowRight size={13} />
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>⚡ HOD Direct Bypass Override</span>
            <ArrowRight size={13} />
            <span className="badge badge-indigo">Attendance Agent Synchronizes</span>
            <ArrowRight size={13} />
            <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>Ledger Updated</span>
            <ArrowRight size={13} />
            <span>Notifications Dispatched</span>
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
            Attendance Considerations ({pendingConsiderationsCount} pending / {attendanceRequests.length})
          </button>

          <button
            onClick={() => setActiveTab('leaves')}
            style={{
              flex: 1,
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '12px',
              fontWeight: activeTab === 'leaves' ? 700 : 500,
              backgroundColor: activeTab === 'leaves' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'leaves' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'leaves' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Student Leave Applications ({pendingLeavesCount} pending / {leaveRequests.length})
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
            Attendance Correction Queries ({pendingQueriesCount} pending)
          </button>
        </div>

        {/* 1. ATTENDANCE CONSIDERATIONS TAB */}
        {activeTab === 'considerations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {attendanceRequests.length === 0 ? (
              <div className="card text-center p-8 text-slate-400 text-xs">
                No attendance consideration requests submitted yet.
              </div>
            ) : (
              attendanceRequests.map((req) => {
                const isPendingTg = req.status === 'pending_tg';
                const isPendingHod = req.status === 'pending_hod' || req.status === 'pending_hod_direct';
                const isCompleted = req.status === 'completed' || req.status === 'approved';
                const isRejected = req.status === 'rejected';

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
                            Roll No: {req.rollNo} • {req.department || 'CSE'} • Semester {req.semester || 5}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isCompleted && (
                          <span className="badge badge-emerald">
                            {req.tgBypassed ? 'Approved (TG Bypassed)' : 'Approved & Synced'}
                          </span>
                        )}
                        {isRejected && <span className="badge badge-rose">Rejected by HOD</span>}
                        {isPendingTg && (
                          <span className="badge badge-amber" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                            In TG Queue (HOD Direct Bypass Available)
                          </span>
                        )}
                        {isPendingHod && <span className="badge badge-amber">Awaiting HOD Final Sign-off</span>}
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
                        <div style={{ fontSize: '18px', fontWeight: 800, color: isCompleted ? 'var(--secondary)' : 'var(--error)', marginTop: '2px' }}>
                          {isCompleted ? 84 : req.currentAttendance || 72}%
                        </div>
                        <span style={{ fontSize: '11px', color: isCompleted ? 'var(--secondary)' : 'var(--error)' }}>
                          {isCompleted ? 'Raised to Statutory Safe Standing' : 'Warning Shortage (<75%)'}
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
                      {req.tgRecommendation ? (
                        <div style={{ color: 'var(--primary)', fontWeight: 500, marginTop: '4px' }}>
                          <strong>TG Recommendation: </strong>
                          <span>{req.tgRecommendation}</span>
                        </div>
                      ) : (
                        <div style={{ color: '#B45309', fontSize: '12px', marginTop: '4px' }}>
                          <em>Mentor/TG has not reviewed yet. As HOD, you can bypass TG and directly consider this request below.</em>
                        </div>
                      )}
                    </div>

                    {/* Section-Wise Affected Classes Discovery Table */}
                    <div style={{ backgroundColor: 'var(--surface-low)', padding: '0.85rem', borderRadius: 'var(--radius-xl)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Layers size={15} color="var(--primary)" />
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Identified Affected Classes across Section {req.section}
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Autonomous agent credit
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
                      ) : isRejected ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--error)', fontSize: '13px', fontWeight: 600 }}>
                          <XCircle size={18} />
                          <span>Application Rejected</span>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => hodRejectAttendanceConsideration(req.id)}
                            className="btn btn-outline"
                            style={{ color: 'var(--error)' }}
                            id={`btn-hod-reject-att-${req.id}`}
                          >
                            Reject Application
                          </button>

                          {/* DIRECT BYPASS BUTTON IF IN TG QUEUE */}
                          {isPendingTg && (
                            <button
                              onClick={() => hodApproveAttendanceConsideration(req.id, true)}
                              className="btn btn-primary"
                              style={{
                                backgroundColor: 'var(--primary)',
                                borderRadius: 'var(--radius-xl)',
                                boxShadow: 'var(--shadow-sm)'
                              }}
                              id={`btn-hod-bypass-consideration-${req.id}`}
                              title="Bypass TG review and directly authorize attendance consideration"
                            >
                              <Zap size={16} />
                              <span>Direct Approve & Consider (Bypass TG)</span>
                            </button>
                          )}

                          {/* STANDARD APPROVE IF ALREADY VERIFIED OR ESCALATED */}
                          {!isPendingTg && (
                            <button
                              onClick={() => hodApproveAttendanceConsideration(req.id)}
                              className="btn btn-primary"
                              style={{
                                backgroundColor: 'var(--secondary)',
                                borderRadius: 'var(--radius-xl)',
                                boxShadow: 'var(--shadow-sm)'
                              }}
                              id={`btn-hod-approve-att-${req.id}`}
                            >
                              <Sparkles size={16} />
                              <span>Approve (Trigger Attendance Agent)</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 2. STUDENT LEAVE APPLICATIONS TAB */}
        {activeTab === 'leaves' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {leaveRequests.length === 0 ? (
              <div className="card text-center p-8 text-slate-400 text-xs">
                No leave applications in department records.
              </div>
            ) : (
              leaveRequests.map((lv) => {
                const isPendingTg = lv.status === 'pending_tg';
                const isPendingHod = lv.status === 'pending_hod' || lv.status === 'pending_hod_direct';
                const isCompleted = lv.status === 'completed' || lv.status === 'approved';
                const isRejected = lv.status === 'rejected';

                return (
                  <div key={lv.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: 'var(--radius-xl)',
                            backgroundColor: 'var(--secondary-fixed)',
                            color: 'var(--on-secondary-fixed)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <FileText size={22} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {lv.title || `${lv.leaveType} Leave Application`}
                            </h3>
                            <span className="badge badge-emerald">{lv.leaveType}</span>
                            {lv.tgBypassed && (
                              <span className="badge badge-indigo text-[10px]">TG Bypassed</span>
                            )}
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            Student: <strong>{lv.studentName}</strong> ({lv.rollNo}) • Section: <strong>{lv.section}</strong> • ID: #{lv.id}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isCompleted && (
                          <span className="badge badge-emerald">
                            {lv.tgBypassed ? 'Directly Granted (TG Bypassed)' : 'Approved & Granted'}
                          </span>
                        )}
                        {isRejected && <span className="badge badge-rose">Rejected by HOD</span>}
                        {isPendingTg && (
                          <span className="badge badge-amber" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                            Awaiting TG Review (HOD Direct Bypass Available)
                          </span>
                        )}
                        {isPendingHod && <span className="badge badge-amber">Awaiting HOD Final Sign-off</span>}
                      </div>
                    </div>

                    {/* Dates & Reason */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '0.75rem' }} className="sm:grid-cols-2">
                      <div style={{ backgroundColor: 'var(--surface-low)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                          Leave Duration & Timing
                        </span>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Calendar size={15} color="var(--primary)" />
                          <span>{lv.dateRangeLabel}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Applied: {lv.appliedAt || 'Recent'}
                        </span>
                      </div>

                      <div style={{ backgroundColor: 'var(--surface-low)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                          Clearance Routing Note
                        </span>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {isPendingTg
                            ? 'Currently in TG verification queue. HOD can click Direct Grant to bypass mentor delay.'
                            : isPendingHod
                            ? 'TG verification completed. Awaiting HOD digital signature.'
                            : 'Clearance finalized.'}
                        </div>
                      </div>
                    </div>

                    <div style={{ backgroundColor: 'var(--surface-low)', padding: '0.85rem', borderRadius: 'var(--radius-lg)', fontSize: '13px' }}>
                      <strong>Application Reason: </strong>
                      <span style={{ color: 'var(--text-secondary)' }}>{lv.reason}</span>
                    </div>

                    {/* Action buttons for Leave */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.25rem' }}>
                      {isCompleted ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)', fontSize: '13px', fontWeight: 600 }}>
                          <CheckCircle2 size={18} />
                          <span>Leave Granted & Recorded in Department Ledger</span>
                        </div>
                      ) : isRejected ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--error)', fontSize: '13px', fontWeight: 600 }}>
                          <XCircle size={18} />
                          <span>Leave Application Rejected</span>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => hodRejectLeave(lv.id)}
                            className="btn btn-outline"
                            style={{ color: 'var(--error)' }}
                            id={`btn-hod-reject-leave-${lv.id}`}
                          >
                            Reject Application
                          </button>

                          {/* DIRECT BYPASS BUTTON IF WAITING FOR TG */}
                          {isPendingTg && (
                            <button
                              onClick={() => hodApproveLeave(lv.id, true)}
                              className="btn btn-primary"
                              style={{
                                backgroundColor: 'var(--primary)',
                                borderRadius: 'var(--radius-xl)',
                                boxShadow: 'var(--shadow-sm)'
                              }}
                              id={`btn-hod-bypass-leave-${lv.id}`}
                              title="Bypass TG mentor review and directly grant leave clearance"
                            >
                              <Zap size={16} />
                              <span>Direct Grant Leave (Bypass TG)</span>
                            </button>
                          )}

                          {/* STANDARD APPROVE IF ALREADY IN HOD QUEUE */}
                          {!isPendingTg && (
                            <button
                              onClick={() => hodApproveLeave(lv.id)}
                              className="btn btn-primary"
                              style={{
                                backgroundColor: 'var(--secondary)',
                                borderRadius: 'var(--radius-xl)',
                                boxShadow: 'var(--shadow-sm)'
                              }}
                              id={`btn-hod-approve-leave-${lv.id}`}
                            >
                              <ShieldCheck size={16} />
                              <span>Grant Leave Approval</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 3. QUERIES TAB */}
        {activeTab === 'queries' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {attendanceQueries.length === 0 ? (
              <div className="card text-center p-8 text-slate-400 text-xs">
                No attendance correction queries registered.
              </div>
            ) : (
              attendanceQueries.map((q) => (
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
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

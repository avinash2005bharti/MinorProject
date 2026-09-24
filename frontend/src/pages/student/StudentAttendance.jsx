import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import AttendanceProgress from '../../components/AttendanceProgress';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileQuestion,
  Sparkles,
  PlusCircle,
  FileText,
  Upload,
  ArrowRight,
  ShieldCheck,
  X
} from 'lucide-react';

export default function StudentAttendance() {
  const { currentUser, subjects, submitAttendanceConsideration, submitAttendanceQuery } = useERP();

  // Modals state
  const [considerationModalOpen, setConsiderationModalOpen] = useState(false);
  const [queryModalOpen, setQueryModalOpen] = useState(false);
  const [selectedClassForQuery, setSelectedClassForQuery] = useState(null);

  // Consideration form
  const [startDate, setStartDate] = useState('2025-09-10');
  const [endDate, setEndDate] = useState('2025-09-15');
  const [reason, setReason] = useState('Official representation in National Inter-College Hackathon (Team OIST)');
  const [supportingDoc, setSupportingDoc] = useState('SIH_Duty_Verification_Signed.pdf');
  const [description, setDescription] = useState('Participated in Grand Finale from 10 Sept to 15 Sept under Dr. Rajesh Verma guidance. Verified by Sports/Academic cell.');

  // Query form
  const [queryReason, setQueryReason] = useState('Marked absent even though I attended the lecture and committed my lab practical assignment on Git.');
  const [queryDoc, setQueryDoc] = useState('github_commit_and_notes.png');

  // Handle submit consideration
  const handleConsiderationSubmit = (e) => {
    e.preventDefault();
    submitAttendanceConsideration({
      startDate,
      endDate,
      dateRangeLabel: `${startDate} to ${endDate}`,
      reason,
      supportingDoc,
      description
    });
    setConsiderationModalOpen(false);
  };

  // Handle open query modal
  const handleOpenQueryModal = (classItem) => {
    setSelectedClassForQuery(classItem);
    setQueryModalOpen(true);
  };

  // Handle submit query
  const handleQuerySubmit = (e) => {
    e.preventDefault();
    submitAttendanceQuery({
      subject: selectedClassForQuery?.subject || 'Data Structures & Algorithms',
      date: selectedClassForQuery?.date || '12 Sept 2025',
      period: selectedClassForQuery?.period || 'Period 2',
      reason: queryReason,
      supportingDoc: queryDoc
    });
    setQueryModalOpen(false);
  };

  // Mock class sessions list
  const classSessions = [
    { id: 'sess-1', date: '12 Sept 2025', subject: 'Data Structures & Algorithms', code: 'CS301', period: 'Period 2 (10:30 AM - 11:30 AM)', faculty: 'Dr. Rajesh Verma', status: 'absent', queryEligible: true },
    { id: 'sess-2', date: '11 Sept 2025', subject: 'Database Management Systems', code: 'CS302', period: 'Period 1 (09:00 AM - 10:00 AM)', faculty: 'Prof. Anita Sharma', status: currentUser.attendance >= 80 ? 'present' : 'absent', autoUpdated: currentUser.attendance >= 80 },
    { id: 'sess-3', date: '10 Sept 2025', subject: 'Operating Systems', code: 'CS303', period: 'Period 3 (11:15 AM - 12:15 PM)', faculty: 'Dr. Meenakshi S.', status: currentUser.attendance >= 80 ? 'present' : 'absent', autoUpdated: currentUser.attendance >= 80 },
    { id: 'sess-4', date: '09 Sept 2025', subject: 'Computer Networks', code: 'CS304', period: 'Period 2 (10:00 AM - 11:00 AM)', faculty: 'Prof. Amit K.', status: 'present' },
    { id: 'sess-5', date: '08 Sept 2025', subject: 'Software Engineering', code: 'CS305', period: 'Period 1 (09:00 AM - 10:00 AM)', faculty: 'Prof. K. Sen', status: 'present' }
  ];

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Header with Title and "Request Consideration" Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
              My Attendance & Audit
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Real-time synchronization across Section {currentUser.section}
            </p>
          </div>

          <button
            onClick={() => setConsiderationModalOpen(true)}
            className="btn btn-primary"
            style={{ borderRadius: 'var(--radius-full)', padding: '0.65rem 1.25rem' }}
          >
            <Sparkles size={16} />
            <span>Request Consideration (OD)</span>
          </button>
        </div>

        {/* Hero Attendance Gauge Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-xl)',
                  backgroundColor: 'var(--primary-container)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Aggregate Attendance Standing
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Semester 6 • Total Classes Held: 109
                </span>
              </div>
            </div>

            {currentUser.attendance >= 75 ? (
              <span className="badge badge-emerald">Eligible for End-Sem Exams</span>
            ) : (
              <span className="badge badge-rose">Shortage Alert (Action Needed)</span>
            )}
          </div>

          <AttendanceProgress percentage={currentUser.attendance} />

          {/* Banner explaining auto-sync if updated */}
          {currentUser.attendance >= 80 && (
            <div
              style={{
                backgroundColor: 'var(--secondary-container)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                fontSize: '12px',
                color: 'var(--on-secondary-container)'
              }}
            >
              <Sparkles size={16} style={{ flexShrink: 0 }} />
              <div>
                <strong>Autonomous Attendance Agent Applied Credit:</strong> 6 lectures for 10-15 Sept were credited following HOD approval. Attendance recalculated from 72% → {currentUser.attendance}%.
              </div>
            </div>
          )}
        </div>

        {/* Subject-Wise Attendance Breakdown */}
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            Subject-Wise Attendance Breakdown
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '0.75rem' }} className="sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((sub) => {
              const pct = Math.round((sub.attended / sub.totalHeld) * 100);
              return (
                <div key={sub.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.04em' }}>
                        {sub.code}
                      </span>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {sub.name}
                      </h4>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub.faculty}</span>
                    </div>

                    <span
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '18px',
                        fontWeight: 800,
                        color: pct >= 75 ? 'var(--secondary)' : 'var(--error)'
                      }}
                    >
                      {pct}%
                    </span>
                  </div>

                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--surface-high)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        backgroundColor: pct >= 75 ? 'var(--secondary)' : 'var(--error)',
                        borderRadius: 'var(--radius-full)'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <span>Attended: {sub.attended} / {sub.totalHeld}</span>
                    <span>{pct >= 75 ? 'Safe' : 'Shortage'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Class Sessions Log (With "Raise Query" Trigger) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Recent Class Sessions & Roll Calls
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Marked absent by mistake? Raise a digital attendance query directly below.
              </p>
            </div>
            <span className="badge badge-slate">{classSessions.length} sessions logged</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {classSessions.map((session) => (
              <div
                key={session.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  backgroundColor: 'var(--surface-low)',
                  borderRadius: 'var(--radius-xl)',
                  gap: '0.75rem',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '220px', flex: 1 }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: session.status === 'present' ? 'var(--secondary-container)' : 'var(--error-container)',
                      color: session.status === 'present' ? 'var(--on-secondary-container)' : 'var(--on-error-container)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {session.status === 'present' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {session.subject}
                      </h4>
                      {session.autoUpdated && (
                        <span className="badge badge-indigo" style={{ fontSize: '10px' }}>
                          Auto-Credited by Agent
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>
                      {session.date} • {session.period} • {session.faculty}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={`badge ${session.status === 'present' ? 'badge-emerald' : 'badge-rose'}`}>
                    {session.status === 'present' ? 'Present' : 'Absent'}
                  </span>

                  {session.status === 'absent' && (
                    <button
                      onClick={() => handleOpenQueryModal(session)}
                      className="btn btn-sm btn-primary"
                      style={{ fontSize: '11px', padding: '0.3rem 0.65rem' }}
                    >
                      <FileQuestion size={13} />
                      <span>Raise Attendance Query</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ======================================================================
          MODAL 1: Request Attendance Consideration (OD / Sports / Hackathon)
          ====================================================================== */}
      {considerationModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--primary-container)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Request Attendance Consideration
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    For Hackathons, On-Duty Sports, and Institutional Duties
                  </p>
                </div>
              </div>

              <button onClick={() => setConsiderationModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConsiderationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Consideration</label>
                <input
                  type="text"
                  className="input-field"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Smart India Hackathon participation"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description & Event Details</label>
                <textarea
                  className="input-field"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Supporting Document (OD Certificate / Invitation)</label>
                <div
                  style={{
                    border: '1.5px dashed var(--border-subtle)',
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-lg)',
                    textAlign: 'center',
                    backgroundColor: 'var(--surface-low)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontSize: '12px',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <Upload size={16} />
                  <span>Attached: <strong>{supportingDoc}</strong> (1.2 MB)</span>
                </div>
              </div>

              {/* Simulation projection box */}
              <div style={{ backgroundColor: 'var(--primary-container)', padding: '0.85rem', borderRadius: 'var(--radius-xl)', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Projected Attendance Impact</span>
                  <span className="badge badge-emerald">Safe Status</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Current: 72%</span>
                  <ArrowRight size={12} color="var(--primary)" />
                  <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>Projected: 84% after HOD approval</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setConsiderationModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Submit to Mentor (TG)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================
          MODAL 2: Student Attendance Query Modal (Wrong Attendance)
          ====================================================================== */}
      {queryModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--error-container)',
                    color: 'var(--error)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <FileQuestion size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Raise Attendance Correction Query
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Rectify mistaken absent marking with digital proof
                  </p>
                </div>
              </div>

              <button onClick={() => setQueryModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleQuerySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ backgroundColor: 'var(--surface-low)', padding: '0.75rem', borderRadius: 'var(--radius-lg)', fontSize: '12px' }}>
                <div><strong>Subject:</strong> {selectedClassForQuery?.subject}</div>
                <div><strong>Date:</strong> {selectedClassForQuery?.date} ({selectedClassForQuery?.period})</div>
                <div><strong>Faculty:</strong> {selectedClassForQuery?.faculty}</div>
                <div style={{ color: 'var(--error)', marginTop: '2px' }}><strong>Current Status:</strong> Absent</div>
              </div>

              <div className="form-group">
                <label className="form-label">Explanation / Discrepancy Reason</label>
                <textarea
                  className="input-field"
                  value={queryReason}
                  onChange={(e) => setQueryReason(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Supporting Proof (Screenshot / Lab Submission Slip)</label>
                <div
                  style={{
                    border: '1.5px dashed var(--border-subtle)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-lg)',
                    textAlign: 'center',
                    backgroundColor: 'var(--surface-low)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontSize: '12px',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <Upload size={16} />
                  <span>Attached: <strong>{queryDoc}</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setQueryModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Submit Query to TG & HOD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

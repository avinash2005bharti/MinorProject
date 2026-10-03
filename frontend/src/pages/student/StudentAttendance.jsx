import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import AttendanceProgress from '../../components/AttendanceProgress';
import { attendanceApi } from '../../api/attendanceApi';
import { requestApi } from '../../api/requestApi';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  FileText,
  Upload,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  X
} from 'lucide-react';

export default function StudentAttendance() {
  const { currentUser, addToast } = useERP();

  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [considerationModalOpen, setConsiderationModalOpen] = useState(false);
  const [queryModalOpen, setQueryModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  // Consideration Form
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [title, setTitle] = useState('Official Duty / Event Representation');
  const [reason, setReason] = useState('Smart India Hackathon Finalist representation.');
  const [submittingConsideration, setSubmittingConsideration] = useState(false);

  // Query Form
  const [queryReason, setQueryReason] = useState('');
  const [submittingQuery, setSubmittingQuery] = useState(false);

  const fetchAttendanceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await attendanceApi.getStudentStats();
      if (res) {
        setStats(res);
        setSessions(res.sessions || res.records || res.history || []);
      }
    } catch (err) {
      setError(err.message || 'Unable to load attendance records from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const percentage = stats?.percentage !== undefined ? stats.percentage : (stats?.overallPercentage || 0);
  const totalClasses = stats?.totalClasses || stats?.total || 0;
  const attendedClasses = stats?.attendedClasses || stats?.attended || 0;

  const handleConsiderationSubmit = async (e) => {
    e.preventDefault();
    setSubmittingConsideration(true);
    try {
      await requestApi.submitAttendanceConsideration({
        title,
        startDate,
        endDate,
        dateRangeLabel: `${startDate} to ${endDate}`,
        reason
      });
      addToast('Consideration Submitted', 'Forwarded to your Mentor / TG for review.', 'success');
      setConsiderationModalOpen(false);
      fetchAttendanceData();
    } catch (err) {
      addToast('Submission Failed', err.message || 'Error lodging consideration.', 'error');
    } finally {
      setSubmittingConsideration(false);
    }
  };

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    if (!queryReason.trim()) {
      addToast('Reason Required', 'Please provide a reason for the attendance dispute.', 'warning');
      return;
    }
    setSubmittingQuery(true);
    try {
      await requestApi.submitAttendanceQuery({
        subjectId: selectedSession?.subjectId || selectedSession?.subject?.id || null,
        subject: selectedSession?.subject?.name || selectedSession?.subject || 'Lecture',
        date: selectedSession?.date || new Date().toISOString().split('T')[0],
        period: selectedSession?.period ? `Period ${selectedSession.period}` : 'Class Period',
        reason: queryReason
      });
      addToast('Dispute Lodged', 'Attendance query forwarded to mentor & HOD for correction approval.', 'success');
      setQueryModalOpen(false);
      setQueryReason('');
      fetchAttendanceData();
    } catch (err) {
      addToast('Dispute Failed', err.message || 'Error submitting query.', 'error');
    } finally {
      setSubmittingQuery(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
              My Attendance & Academic Standing
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Relational attendance records for {currentUser.name} (Section {currentUser.section || 'A'})
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setConsiderationModalOpen(true)}
              className="btn btn-primary"
              style={{ borderRadius: 'var(--radius-full)', padding: '0.65rem 1.25rem' }}
              id="btn-attendance-request-od"
            >
              <Sparkles size={16} />
              <span>Request Consideration (OD)</span>
            </button>

            <button
              onClick={fetchAttendanceData}
              disabled={loading}
              className="btn btn-outline text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Loading / Error states */}
        {loading && (
          <div className="p-8 text-center text-slate-500 card flex flex-col items-center justify-center gap-2">
            <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }} />
            <span className="text-xs font-semibold">Loading Attendance Records from Database...</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={fetchAttendanceData} className="btn btn-sm btn-primary text-xs">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
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
                      Total Sessions Recorded: {totalClasses} • Present: {attendedClasses}
                    </span>
                  </div>
                </div>

                <span className={`badge ${percentage >= 75 ? 'badge-emerald' : 'badge-rose'}`}>
                  {percentage >= 75 ? 'Examination Eligible' : 'Shortage Alert'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontSize: '36px', fontWeight: 800, color: percentage >= 75 ? '#059669' : '#E11D48' }}>
                  {percentage}%
                </span>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  (Statutory minimum threshold: 75%)
                </span>
              </div>

              <AttendanceProgress percentage={percentage} showDetails={false} />
            </div>

            {/* Subject-Wise Attendance Breakdown */}
            {stats?.subjectWise && stats.subjectWise.length > 0 && (
              <div className="card">
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                  Subject-Wise Attendance Ledger
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {stats.subjectWise.map((sub, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col gap-1.5 shadow-xs">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 truncate" title={sub.subjectName}>
                          {sub.subjectName || sub.subjectCode}
                        </span>
                        <span className={`font-bold ${sub.percentage >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {sub.percentage}%
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Attended: {sub.present} / {sub.total} classes
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Recorded Sessions Ledger */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Recorded Sessions History</h3>
                </div>
                <span className="badge badge-slate text-xs">{sessions.length} Recorded Entries</span>
              </div>

              {sessions.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl">
                  No attendance records found.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table" style={{ width: '100%', fontSize: '12px' }}>
                    <thead>
                      <tr className="text-slate-500 text-left border-b border-slate-200">
                        <th className="pb-2 font-bold">Date</th>
                        <th className="pb-2 font-bold">Subject</th>
                        <th className="pb-2 font-bold">Period / Slot</th>
                        <th className="pb-2 font-bold">Status</th>
                        <th className="pb-2 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sessions.map((sess, idx) => {
                        const isAbsent = (sess.status || '').toLowerCase() === 'absent';
                        return (
                          <tr key={sess.id || idx} className="hover:bg-slate-50/50">
                            <td className="py-2.5 text-slate-800 font-semibold">{sess.date}</td>
                            <td className="py-2.5 font-bold text-slate-900">
                              {sess.subject?.name || sess.subject || 'Lecture'}
                            </td>
                            <td className="py-2.5 text-slate-500">
                              {sess.period ? `Period ${sess.period}` : 'Regular Slot'}
                            </td>
                            <td className="py-2.5">
                              <span className={`badge ${!isAbsent ? 'badge-emerald' : 'badge-rose'} text-[10px]`}>
                                {sess.status}
                              </span>
                            </td>
                            <td className="py-2.5 text-right">
                              {isAbsent && (
                                <button
                                  onClick={() => {
                                    setSelectedSession(sess);
                                    setQueryModalOpen(true);
                                  }}
                                  className="btn btn-sm btn-outline text-xs py-0.5 px-2 text-rose-600 border-rose-200 hover:bg-rose-50"
                                >
                                  Dispute Query
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Consideration (Duty) Modal */}
      {considerationModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '520px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} className="text-blue-600" />
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Request Attendance Consideration (OD)
                </h3>
              </div>
              <button onClick={() => setConsiderationModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConsiderationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>Title / Event Name *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Smart India Hackathon Finalist"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>End Date *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>Detailed Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input-field"
                  placeholder="Explain event participation and institutional representation..."
                />
              </div>

              <button
                type="submit"
                disabled={submittingConsideration}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', fontWeight: 700 }}
              >
                {submittingConsideration ? 'Submitting to Mentor...' : 'Submit Consideration Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Query Dispute Modal */}
      {queryModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '460px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HelpCircle size={20} className="text-rose-600" />
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Dispute Absent Attendance
                </h3>
              </div>
              <button onClick={() => setQueryModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 1rem' }}>
              Session on <strong>{selectedSession?.date}</strong> for <strong>{selectedSession?.subject?.name || selectedSession?.subject}</strong>.
            </p>

            <form onSubmit={handleQuerySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>Dispute Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={queryReason}
                  onChange={(e) => setQueryReason(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Attended lecture and submitted lab practical. Roll call was missed..."
                />
              </div>

              <button
                type="submit"
                disabled={submittingQuery}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', fontWeight: 700 }}
              >
                {submittingQuery ? 'Submitting Dispute...' : 'Submit Dispute Query to HOD'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

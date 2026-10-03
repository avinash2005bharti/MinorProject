import React, { useEffect, useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Link } from 'react-router-dom';
import QuickActions from '../../components/QuickActions';
import QuickDisplay from '../../components/QuickDisplay';
import { dashboardApi } from '../../api/dashboardApi';
import { leaveApi } from '../../api';
import {
  Calendar,
  CheckSquare,
  Clock,
  BookOpen,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Bot,
  Users,
  AlertCircle,
  RefreshCw,
  Layers,
  CheckCircle2,
  XCircle,
  Send,
  UserCheck,
  AlertTriangle,
  GraduationCap
} from 'lucide-react';

export default function TeacherDashboard() {
  const {
    currentUser,
    tgReviewAttendanceConsideration,
    tgReviewLeave,
    addToast
  } = useERP();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'teaching', 'tg'
  const [actionProcessing, setActionProcessing] = useState(null);
  const [menteeSearch, setMenteeSearch] = useState('');
  const [isOnLeave, setIsOnLeave] = useState(false);
  const [affectedClasses, setAffectedClasses] = useState([]);
  const [togglingLeave, setTogglingLeave] = useState(false);

  const fetchTeacherData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getTeacherDashboard();
      if (res?.data) {
        setDashboard(res.data);
        const onLeave = Boolean(res.data.isOnLeaveToday || res.data.teacher?.isOnLeave || false);
        setIsOnLeave(onLeave);
        const tId = res.data.teacher?.id || currentUser?.id;
        if (tId) {
          try {
            const affRes = await leaveApi.getAffectedClasses(tId);
            setAffectedClasses(affRes?.affectedClasses || affRes?.data || []);
          } catch (e) {
            console.warn('Could not load affected classes:', e);
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Unable to load teacher data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLeave = async () => {
    const teacherId = dashboard?.teacher?.id || currentUser?.id;
    if (!teacherId) return;
    setTogglingLeave(true);
    try {
      const nextStatus = !isOnLeave;
      await leaveApi.toggleLeave(teacherId, {
        onLeave: nextStatus,
        reason: nextStatus ? 'Marked on leave via teacher dashboard' : ''
      });
      setIsOnLeave(nextStatus);
      addToast(
        nextStatus ? 'Status: On Leave' : 'Status: Available',
        nextStatus
          ? 'You are now marked ON LEAVE for today. HOD can review affected classes.'
          : 'You are now marked AVAILABLE for today.',
        nextStatus ? 'warning' : 'success'
      );
      if (nextStatus) {
        const affRes = await leaveApi.getAffectedClasses(teacherId);
        setAffectedClasses(affRes?.affectedClasses || affRes?.data || []);
      } else {
        setAffectedClasses([]);
      }
      fetchTeacherData();
    } catch (err) {
      addToast('Leave Toggle Failed', err.message || 'Unable to update status', 'error');
    } finally {
      setTogglingLeave(false);
    }
  };

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const teacher = dashboard?.teacher || currentUser || {};
  const todayClasses = dashboard?.todayClasses || [];
  const assignedSubjects = teacher?.assignedSubjects || [];

  // TG = Faculty + TG Dashboard integration check
  const isAppointedTg = Boolean(
    dashboard?.isAppointedTg ||
    dashboard?.tgData ||
    currentUser?.isTG ||
    currentUser?.isTg ||
    (currentUser?.mentorGroups && currentUser?.mentorGroups.length > 0) ||
    (currentUser?.designation || '').toLowerCase().includes('(tg)') ||
    (teacher?.designation || '').toLowerCase().includes('(tg)')
  );

  const tgData = dashboard?.tgData || {};
  const tgMentees = tgData.mentees || [];
  const tgPendingLeaves = tgData.pendingLeaves || [];
  const tgPendingAttendance = tgData.pendingAttendance || [];
  const totalTgPending = (tgPendingLeaves.length + tgPendingAttendance.length) || (dashboard?.pendingApprovalsCount || 0);

  // TG 1-Click Action Handlers
  const handleRecommendLeave = async (id) => {
    setActionProcessing(id);
    try {
      await tgReviewLeave(id, true);
      addToast('Leave Recommended', 'Student leave request recommended and forwarded to HOD.', 'success');
      fetchTeacherData();
    } catch (err) {
      addToast('Review Failed', err.message || 'Failed to review leave.', 'error');
    } finally {
      setActionProcessing(null);
    }
  };

  const handleRecommendAttendance = async (id) => {
    setActionProcessing(id);
    try {
      await tgReviewAttendanceConsideration(id, 'Recommended by TG: Verified student attendance credit.');
      addToast('Attendance Recommended', 'Attendance consideration recommended to HOD for final clearance.', 'success');
      fetchTeacherData();
    } catch (err) {
      addToast('Review Failed', err.message || 'Failed to review request.', 'error');
    } finally {
      setActionProcessing(null);
    }
  };

  const filteredMentees = tgMentees.filter((m) => {
    const q = menteeSearch.toLowerCase();
    return (
      (m.name || '').toLowerCase().includes(q) ||
      (m.rollNo || '').toLowerCase().includes(q) ||
      (m.enrollmentNo || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-wrapper">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {isAppointedTg ? 'Faculty & TG Dashboard' : 'Faculty Dashboard'}
              </h1>
              <span className="badge badge-indigo">{teacher?.facultyId || 'Faculty'}</span>
              {isAppointedTg && (
                <span className="badge badge-emerald" style={{ fontSize: '11px' }}>
                  ⭐ Appointed TG (Section {tgData.groupName ? tgData.groupName.replace(/.*Section\s*/i, 'Sec ') : 'A'})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {teacher?.name} • {teacher?.designation || 'Faculty'} • {teacher?.specialization || 'Computer Science & Engineering'}
              {isAppointedTg && (
                <span className="font-semibold text-indigo-600 ml-1">
                  • TG: {tgMentees.length} Mentees Under Your Mentorship
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Highly Visible Leave Toggle */}
            <button
              onClick={handleToggleLeave}
              disabled={togglingLeave}
              className="btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '20px',
                fontWeight: 700,
                fontSize: '12px',
                border: isOnLeave ? '2px solid #EF4444' : '2px solid #10B981',
                backgroundColor: isOnLeave ? '#FEE2E2' : '#D1FAE5',
                color: isOnLeave ? '#991B1B' : '#065F46',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              id="btn-teacher-leave-toggle"
              title="Click to toggle your availability status for today"
            >
              <span>{isOnLeave ? '🔴' : '🟢'}</span>
              <span>{isOnLeave ? 'Status: On Leave' : 'Status: Available'}</span>
              <span style={{ fontSize: '10px', opacity: 0.8 }}>({togglingLeave ? '...' : 'Toggle'})</span>
            </button>

            <button
              onClick={fetchTeacherData}
              disabled={loading}
              className="btn btn-outline text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <Link
              to="/teacher/attendance"
              className="btn btn-primary text-xs py-2 px-4 shadow-sm flex items-center gap-1.5"
            >
              <CheckSquare size={16} />
              <span>Mark Roll Call</span>
            </Link>
          </div>
        </div>

        {/* TG = Faculty + TG Dashboard Segmented Control Tabs */}
        {isAppointedTg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('all')}
              className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '12px', padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-full)' }}
            >
              <Sparkles size={13} style={{ marginRight: '0.35rem', display: 'inline' }} />
              <span>All-in-One Dashboard (Faculty + TG)</span>
            </button>

            <button
              onClick={() => setActiveTab('teaching')}
              className={`btn btn-sm ${activeTab === 'teaching' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '12px', padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-full)' }}
            >
              <BookOpen size={13} style={{ marginRight: '0.35rem', display: 'inline' }} />
              <span>Teaching Classes & Schedule ({todayClasses.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('tg')}
              className={`btn btn-sm ${activeTab === 'tg' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '12px', padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-full)' }}
            >
              <Users size={13} style={{ marginRight: '0.35rem', display: 'inline' }} />
              <span>TG Mentorship Hub ({tgMentees.length} Mentees • {totalTgPending} Pending)</span>
            </button>
          </div>
        )}

        {/* Loading and Error states */}
        {loading && (
          <div className="p-8 text-center text-slate-500 card flex flex-col items-center justify-center gap-2">
            <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }} />
            <span className="text-xs font-semibold">Loading Faculty & TG Workspace Data...</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={fetchTeacherData} className="btn btn-sm btn-primary text-xs">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Faculty Duty & Leave Control Center */}
            <div
              className="card"
              style={{
                borderRadius: '16px',
                border: isOnLeave ? '2px solid #FCA5A5' : '1px solid var(--border-subtle)',
                backgroundColor: isOnLeave ? '#FEF2F2' : 'var(--surface)',
                boxShadow: isOnLeave ? '0 4px 15px rgba(239, 68, 68, 0.1)' : 'var(--shadow-sm)',
                padding: '1.25rem',
                marginBottom: '1rem',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      backgroundColor: isOnLeave ? '#FEE2E2' : '#DCFCE7',
                      color: isOnLeave ? '#DC2626' : '#16A34A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {isOnLeave ? <AlertTriangle size={22} /> : <CheckCircle2 size={22} />}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        Today's Faculty Duty Status:
                      </h3>
                      <span
                        className={`badge ${isOnLeave ? 'badge-rose' : 'badge-emerald'}`}
                        style={{ padding: '0.35rem 0.75rem', fontSize: '12px', fontWeight: 800 }}
                      >
                        {isOnLeave ? '🔴 ON LEAVE TODAY' : '🟢 AVAILABLE ON DUTY'}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                      {isOnLeave
                        ? `You are marked ON LEAVE for today (${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}). Department HOD is notified.`
                        : `You are marked AVAILABLE for today (${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}). All regular teaching sessions active.`}
                    </p>
                  </div>
                </div>

                {/* 1-Click Interactive Toggle Button & Switch */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={handleToggleLeave}
                    disabled={togglingLeave}
                    id="btn-teacher-duty-switch"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 18px',
                      borderRadius: '30px',
                      fontWeight: 800,
                      fontSize: '12px',
                      border: isOnLeave ? '2px solid #EF4444' : '2px solid #10B981',
                      backgroundColor: isOnLeave ? '#DC2626' : '#059669',
                      color: '#FFFFFF',
                      cursor: togglingLeave ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      transition: 'all 0.2s ease'
                    }}
                    title="Toggle your availability status for today"
                  >
                    <span>{isOnLeave ? 'Switch to Available 🟢' : 'Mark On Leave 🔴'}</span>
                    {togglingLeave && <RefreshCw size={12} className="animate-spin" />}
                  </button>
                </div>
              </div>

              {/* If marked on leave, show affected classes table */}
              {isOnLeave && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #FECDD3' }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#991B1B', marginBottom: '0.5rem' }}>
                    Affected Timetable Classes Requiring Substitution ({affectedClasses.length} sessions):
                  </p>
                  {affectedClasses.length > 0 ? (
                    <div style={{ overflowX: 'auto', backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #FECDD3' }}>
                      <table style={{ width: '100%', fontSize: '12px', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#FFF1F2', borderBottom: '1px solid #FECDD3' }}>
                            <th style={{ padding: '8px 12px' }}>Period / Time</th>
                            <th style={{ padding: '8px 12px' }}>Subject</th>
                            <th style={{ padding: '8px 12px' }}>Target Section</th>
                            <th style={{ padding: '8px 12px' }}>Room</th>
                            <th style={{ padding: '8px 12px' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {affectedClasses.map((cls, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #FEE2E2' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 700 }}>{cls.time || `Period ${cls.period || idx + 1}`}</td>
                              <td style={{ padding: '8px 12px' }}>{cls.subject?.name || cls.subjectName || 'Scheduled Class'}</td>
                              <td style={{ padding: '8px 12px' }}>Sem {cls.semester} - Section {cls.section?.name || cls.section || 'A'}</td>
                              <td style={{ padding: '8px 12px' }}>{cls.classroom?.roomNumber || cls.room || 'CR-101'}</td>
                              <td style={{ padding: '8px 12px' }}>
                                <span className="badge badge-amber" style={{ fontSize: '10px' }}>
                                  Replacement Pending
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>
                      No classes are scheduled on your timetable for today.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions Bar (Includes both Faculty + TG actions if appointed) */}
            <QuickActions role="teacher" />

            {/* Quick Display Widget */}
            <QuickDisplay />

            {/* Integrated Metrics Row: Teaching + TG */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {/* Teaching Classes */}
              <div className="card flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Calendar size={20} />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Classes Today</span>
                  <div className="text-2xl font-extrabold text-slate-900">{todayClasses.length} Lectures</div>
                  <span className="text-[11px] text-blue-600 font-semibold">{dashboard?.currentRoom || 'Room not assigned'}</span>
                </div>
              </div>

              {/* Teaching Courses */}
              <div className="card flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <BookOpen size={20} />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Assigned Courses</span>
                  <div className="text-2xl font-extrabold text-slate-900">{assignedSubjects.length} Courses</div>
                  <span className="text-[11px] text-emerald-700 font-semibold">{teacher?.weeklyHours || 0} Hours/Week</span>
                </div>
              </div>

              {/* TG Mentees Metric (If appointed as TG) */}
              {isAppointedTg && (
                <div className="card flex items-center gap-3" style={{ borderLeft: '3px solid #6366F1' }}>
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Users size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">TG Section Mentees</span>
                    <div className="text-2xl font-extrabold text-slate-900">{tgMentees.length} Students</div>
                    <span className="text-[11px] text-indigo-600 font-semibold">Tutor Guardian Assigned</span>
                  </div>
                </div>
              )}

              {/* TG / Faculty Pending Requests */}
              <div className="card flex items-center gap-3" style={isAppointedTg ? { borderLeft: '3px solid #F59E0B' } : {}}>
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <CheckSquare size={20} />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">
                    {isAppointedTg ? 'Pending TG Approvals' : 'Pending Requests'}
                  </span>
                  <div className="text-2xl font-extrabold text-slate-900">{totalTgPending}</div>
                  <span className="text-[11px] text-amber-600 font-semibold">
                    {totalTgPending > 0 ? 'Requires Your Review' : 'All Clear'}
                  </span>
                </div>
              </div>
            </div>

            {/* TAB: Teaching Classes (Shown in 'all' or 'teaching') */}
            {(activeTab === 'all' || activeTab === 'teaching') && (
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Clock size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 m-0">Today's Teaching Schedule</h3>
                      <span className="text-[11px] text-slate-500">Your lecture allocations across classrooms</span>
                    </div>
                  </div>
                  <Link to="/teacher/timetable" className="text-xs text-blue-600 font-semibold hover:underline">
                    Full Timetable →
                  </Link>
                </div>

                {todayClasses.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs bg-slate-50 rounded-xl">
                    No classes scheduled for today. Check full weekly timetable.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {todayClasses.map((cls, idx) => (
                      <div key={cls.id || idx} className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col gap-1.5 shadow-xs">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-bold text-blue-600">Period {cls.period}</span>
                          <span>{cls.start_time} - {cls.end_time}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 truncate" title={cls.subject}>
                          {cls.subject}
                        </h4>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 pt-1.5 border-t border-slate-100">
                          <span>Sec {cls.section}</span>
                          <span className="badge badge-slate text-[10px]">{cls.room}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: TG Mentorship Hub (Shown in 'all' or 'tg' when isAppointedTg is true) */}
            {isAppointedTg && (activeTab === 'all' || activeTab === 'tg') && (
              <div className="flex flex-col gap-4">
                {/* TG Pending Approvals Action Queue */}
                <div className="card" style={{ border: '1px solid #C7D2FE', backgroundColor: '#FAFAFF' }}>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-indigo-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <ShieldCheck size={16} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 m-0">
                          TG Mentorship Pending Approvals ({totalTgPending})
                        </h3>
                        <span className="text-[11px] text-indigo-600">
                          Student requests requiring your TG recommendation before HOD approval
                        </span>
                      </div>
                    </div>
                    <Link to="/tg/requests" className="text-xs text-indigo-600 font-semibold hover:underline">
                      View All Requests →
                    </Link>
                  </div>

                  {totalTgPending === 0 ? (
                    <div className="p-5 text-center text-slate-500 text-xs bg-white rounded-xl border border-indigo-50">
                      <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-1.5" />
                      All student mentorship requests are up to date!
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {/* Leave Requests */}
                      {tgPendingLeaves.map((req) => (
                        <div key={req.id} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-2 shadow-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="badge badge-amber text-[10px]">Leave Application</span>
                              <span className="text-xs font-bold text-slate-900">{req.studentName}</span>
                              <span className="text-[11px] text-slate-500">({req.rollNo})</span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1 mb-0">
                              <strong>Duration:</strong> {req.dateRangeLabel || `${req.startDate} to ${req.endDate}`} • <strong>Reason:</strong> {req.reason}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRecommendLeave(req.id)}
                              disabled={actionProcessing === req.id}
                              className="btn btn-sm btn-success text-xs py-1 px-3 flex items-center gap-1"
                            >
                              <CheckCircle2 size={13} />
                              <span>{actionProcessing === req.id ? 'Processing...' : 'Recommend to HOD'}</span>
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Attendance Considerations */}
                      {tgPendingAttendance.map((req) => (
                        <div key={req.id} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-2 shadow-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="badge badge-purple text-[10px]">Attendance Consideration</span>
                              <span className="text-xs font-bold text-slate-900">{req.studentName}</span>
                              <span className="text-[11px] text-slate-500">({req.rollNo})</span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1 mb-0">
                              <strong>Category:</strong> {req.category || 'Institutional Duty'} • <strong>Reason:</strong> {req.reason}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRecommendAttendance(req.id)}
                              disabled={actionProcessing === req.id}
                              className="btn btn-sm btn-success text-xs py-1 px-3 flex items-center gap-1"
                            >
                              <CheckCircle2 size={13} />
                              <span>{actionProcessing === req.id ? 'Processing...' : 'Recommend to HOD'}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* TG Mentees Directory Card */}
                <div className="card">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <GraduationCap size={16} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 m-0">
                          My Assigned Mentees Roster ({tgMentees.length} Students)
                        </h3>
                        <span className="text-[11px] text-slate-500">
                          Direct supervision and attendance tracking for your assigned section
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Search student or roll no..."
                        value={menteeSearch}
                        onChange={(e) => setMenteeSearch(e.target.value)}
                        className="input-field text-xs py-1 px-2.5"
                        style={{ width: '200px' }}
                      />
                      <Link to="/tg/students" className="btn btn-outline text-xs py-1 px-2.5">
                        Full Portal →
                      </Link>
                    </div>
                  </div>

                  <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    <table className="table" style={{ width: '100%', fontSize: '12px' }}>
                      <thead>
                        <tr>
                          <th>Student Name</th>
                          <th>Enrollment No</th>
                          <th>Roll No</th>
                          <th>Semester</th>
                          <th>Attendance %</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMentees.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center p-4 text-slate-400">
                              No mentees match your search.
                            </td>
                          </tr>
                        ) : (
                          filteredMentees.slice(0, 15).map((m) => (
                            <tr key={m.id}>
                              <td className="font-bold text-slate-900">{m.name}</td>
                              <td>{m.enrollmentNo || '—'}</td>
                              <td>{m.rollNo || '—'}</td>
                              <td>Sem {m.semester || 5}</td>
                              <td>
                                <span
                                  className={`badge ${
                                    (m.attendance || 84) >= 75 ? 'badge-emerald' : 'badge-rose'
                                  }`}
                                  style={{ fontSize: '11px' }}
                                >
                                  {m.attendance || 84}%
                                </span>
                              </td>
                              <td>
                                <Link
                                  to="/tg/students"
                                  className="text-xs text-blue-600 font-semibold hover:underline"
                                >
                                  View Profile
                                </Link>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Link } from 'react-router-dom';
import AttendanceProgress from '../../components/AttendanceProgress';
import QuickActions from '../../components/QuickActions';
import QuickDisplay from '../../components/QuickDisplay';
import { dashboardApi } from '../../api/dashboardApi';
import { leaveApi } from '../../api/leaveApi';
import {
  CheckCircle2,
  Clock,
  Calendar,
  FileText,
  BarChart2,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  MapPin,
  User,
  UserCheck,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Bell,
  RefreshCw
} from 'lucide-react';

export default function StudentDashboard() {
  const { currentUser, notices, leaveRequests, openModal, dashboardData } = useERP();
  const [dashboard, setDashboard] = useState(dashboardData || null);
  const [facultyAvailability, setFacultyAvailability] = useState(dashboardData?.facultyAvailability || []);
  const [loading, setLoading] = useState(!dashboardData);
  const [error, setError] = useState(null);

  const fetchStudentData = async () => {
    if (!dashboard) setLoading(true);
    setError(null);
    try {
      const [dashRes, availRes] = await Promise.allSettled([
        dashboardApi.getStudentDashboard(),
        leaveApi.getFacultyAvailability()
      ]);
      if (dashRes.status === 'fulfilled' && dashRes.value?.data) {
        setDashboard(dashRes.value.data);
      }
      if (availRes.status === 'fulfilled') {
        const list = availRes.value?.data || availRes.value?.teachers || [];
        setFacultyAvailability(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      setError(err.message || 'Unable to load student data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  const student = dashboard?.student || currentUser || {};
  const attendance = dashboard?.attendance;
  const attendancePct = attendance?.percentage !== undefined ? attendance.percentage : 0;
  const todayClasses = dashboard?.todayTimetable || [];
  const pendingRequests = dashboard?.pendingRequests || [];
  const studentNotif = dashboard?.notifications || [];

  return (
    <div className="page-wrapper">
      <div className="flex flex-col gap-4">
        {/* Humanized Greeting Section */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Good day, {student.name || 'Student'}
              </h1>
              <span className="text-xl">👋</span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
              <span>CSE Department</span>
              <span>•</span>
              <span className="text-blue-600 font-semibold">Section {student.section || 'A'}</span>
              <span>•</span>
              <span className="tabular-nums font-medium">{student.rollNo || student.enrollment_no || 'Enrolled'}</span>
              <span>•</span>
              <span>Semester {student.semester || 5}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchStudentData}
              disabled={loading}
              className="btn btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5"
              title="Refresh Live Data"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <div className="relative shrink-0">
              <div
                className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200/80 flex items-center justify-center text-blue-700 shadow-sm"
                title={student.name}
              >
                <User size={20} className="text-blue-600" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-600 rounded-full flex items-center justify-center text-white ring-2 ring-white">
                <CheckCircle2 size={9} strokeWidth={3} />
              </span>
            </div>
          </div>
        </div>

        {/* Loading and Error states */}
        {loading && (
          <div className="p-8 text-center text-slate-500 card flex flex-col items-center justify-center gap-2">
            <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }} />
            <span className="text-xs font-semibold">Loading Student Records from Relational DB...</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={fetchStudentData} className="btn btn-sm btn-primary text-xs">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Quick Actions Bar */}
            <QuickActions role="student" />

            {/* Quick Display Widget */}
            <QuickDisplay />

            {/* Attendance & Academic Standing Metric Card */}
            <div className="card relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <ShieldCheck size={18} />
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    Department Academic & Attendance Standing
                  </span>
                </div>

                <Link to="/student/attendance" className="btn btn-sm btn-outline text-xs py-1 px-2.5">
                  <span>Subject Ledger</span>
                  <ChevronRight size={13} />
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-3 items-end mb-2">
                <div>
                  <span className="text-xs text-slate-500 block">Current Attendance</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-3xl font-extrabold text-slate-900 leading-none">
                      {attendancePct}
                    </span>
                    <span className={`text-base font-bold ${attendancePct >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      %
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-500 block">Required Threshold</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-bold text-slate-900">
                      {attendance?.requiredThreshold || 75}%
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Current Semester</span>
                  <span className="text-2xl font-extrabold text-blue-600">
                    Sem {student.semester || 5}
                  </span>
                </div>
              </div>

              <AttendanceProgress percentage={attendancePct} showDetails={false} />
            </div>

            {/* Today's Timetable Section */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Calendar size={18} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Today's Scheduled Classes (Section {student.section || 'A'})
                  </h3>
                </div>
                <Link to="/student/timetable" className="text-xs text-blue-600 font-semibold hover:underline">
                  Full Schedule →
                </Link>
              </div>

              {todayClasses.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-100">
                  No classes scheduled for today.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {todayClasses.map((cls, idx) => (
                    <div key={cls.id || idx} className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-bold text-blue-600">Period {cls.period}</span>
                        <span>{cls.start_time} - {cls.end_time}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 truncate" title={cls.subject}>
                        {cls.subject}
                      </h4>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 pt-1.5 border-t border-slate-100">
                        <span className="truncate">{cls.faculty}</span>
                        <span className="badge badge-slate text-[10px]">{cls.room}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Today's Faculty Status (RBAC protected: no private reasons shown) */}
            <div className="card shadow-sm p-4" style={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded p-2 bg-primary-subtle text-primary">
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-0">
                      Today's Faculty Status
                    </h3>
                    <span className="text-[11px] text-slate-500">Live teacher availability for your department</span>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <span className="badge bg-success-subtle text-success border border-success-subtle small">
                    🟢 {facultyAvailability.filter((f) => f.status !== 'ON_LEAVE').length} Available
                  </span>
                  <span className="badge bg-danger-subtle text-danger border border-danger-subtle small">
                    🔴 {facultyAvailability.filter((f) => f.status === 'ON_LEAVE').length} On Leave
                  </span>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 small text-xs">
                  <thead className="table-light">
                    <tr>
                      <th>Faculty Member</th>
                      <th>Subject / Specialization</th>
                      <th>Live Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facultyAvailability.length === 0 ? (
                      <tr><td colSpan="3" className="text-center py-3 text-muted">No faculty records available</td></tr>
                    ) : (
                      facultyAvailability.map((f, i) => {
                        const onLeave = f.status === 'ON_LEAVE';
                        return (
                          <tr key={f.id || i}>
                            <td className="fw-bold text-slate-900">{f.name}</td>
                            <td className="text-slate-600">{f.subject || f.specialization || 'Computer Science & Engineering'}</td>
                            <td>
                              <span
                                className={`badge ${onLeave ? 'bg-danger text-white' : 'bg-success text-white'}`}
                                style={{ padding: '4px 10px', borderRadius: '12px' }}
                              >
                                {onLeave ? '🔴 On Leave' : '🟢 Available'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pending Clearances & Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-amber-600" />
                    <h3 className="text-sm font-bold text-slate-900">My Pending Requests</h3>
                  </div>
                  <span className="badge badge-amber">{pendingRequests.length} Pending</span>
                </div>

                {pendingRequests.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-xs bg-slate-50 rounded-xl">
                    No records found.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {pendingRequests.map((req) => (
                      <div key={req.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-800">{req.title || req.requestType}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{req.reason || req.dateRangeLabel}</div>
                        </div>
                        <span className="badge badge-amber text-[10px]">{req.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bell size={16} className="text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">System Notifications</h3>
                  </div>
                  <span className="badge badge-blue">{studentNotif.length}</span>
                </div>

                {studentNotif.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-xs bg-slate-50 rounded-xl">
                    No records found.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {studentNotif.map((n) => (
                      <div key={n.id} className="p-2.5 rounded-xl border border-slate-100 text-xs flex flex-col gap-0.5">
                        <span className="font-bold text-slate-800">{n.title}</span>
                        <span className="text-[11px] text-slate-600">{n.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

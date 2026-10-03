import React, { useEffect, useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Link } from 'react-router-dom';
import QuickActions from '../../components/QuickActions';
import QuickDisplay from '../../components/QuickDisplay';
import { dashboardApi } from '../../api/dashboardApi';
import {
  Users,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  RefreshCw,
  AlertCircle,
  BookOpen
} from 'lucide-react';

export default function TgDashboard() {
  const {
    currentUser,
    tgReviewAttendanceConsideration,
    tgReviewLeave
  } = useERP();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionProcessing, setActionProcessing] = useState(null);

  const fetchTgData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getTgDashboard();
      if (res?.data) {
        setDashboard(res.data);
      }
    } catch (err) {
      setError(err.message || 'Unable to load TG mentor data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTgData();
  }, []);

  const mentor = dashboard?.mentor || currentUser || {};
  const mentees = dashboard?.mentees || [];
  const pendingLeaves = dashboard?.pendingLeaves || [];
  const pendingAttendance = dashboard?.pendingAttendance || [];
  const totalPending = pendingLeaves.length + pendingAttendance.length;

  const handleRecommendAttendance = async (id) => {
    setActionProcessing(id);
    try {
      await tgReviewAttendanceConsideration(id, 'Recommended by TG: Verified attendance credit.');
      fetchTgData();
    } finally {
      setActionProcessing(null);
    }
  };

  const handleRecommendLeave = async (id) => {
    setActionProcessing(id);
    try {
      await tgReviewLeave(id, true);
      fetchTgData();
    } finally {
      setActionProcessing(null);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="flex flex-col gap-4">
        {/* Header & TG Availability Toggle */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Mentor & TG Dashboard
              </h1>
              <span className="badge badge-indigo">Section {mentor?.assignedSection || 'A'}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Teacher Guardian: {mentor?.name || 'Mentor'} • {mentees.length} Mentees Under Direct Supervision
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchTgData}
              disabled={loading}
              className="btn btn-outline text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <Link
              to="/teacher"
              className="btn btn-outline text-xs py-2 px-3 flex items-center gap-1.5"
              title="View my regular teaching classes and attendance"
            >
              <BookOpen size={14} className="text-blue-600" />
              <span>My Teaching Classes</span>
            </Link>

          </div>
        </div>

        {/* Loading and Error states */}
        {loading && (
          <div className="p-8 text-center text-slate-500 card flex flex-col items-center justify-center gap-2">
            <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }} />
            <span className="text-xs font-semibold">Loading Mentor & Student Records...</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={fetchTgData} className="btn btn-sm btn-primary text-xs">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Quick Actions Bar */}
            <QuickActions role="tg" />

            {/* Quick Display Widget */}
            <QuickDisplay />

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div className="card flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Users size={20} />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Assigned Mentees</span>
                  <div className="text-2xl font-extrabold text-slate-900">{mentees.length}</div>
                  <span className="text-[11px] text-blue-600">Section {mentor.assignedSection || 'Unassigned'}</span>
                </div>
              </div>

              <div className="card flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock size={20} />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Pending Verifications</span>
                  <div className="text-2xl font-extrabold text-slate-900">{totalPending}</div>
                  <span className="text-[11px] text-amber-600 font-semibold">Requires TG Review</span>
                </div>
              </div>

            </div>

            {/* Pending Requests for TG Review */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Pending Student Requests Awaiting TG Review ({totalPending})
                  </h3>
                </div>
              </div>

              {totalPending === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs bg-slate-50 rounded-xl">
                  No records found.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {/* Attendance Considerations */}
                  {pendingAttendance.map((req) => (
                    <div key={req.id} className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{req.studentName}</span>
                          <span className="badge badge-blue text-[10px]">{req.rollNo}</span>
                          <span className="badge badge-amber text-[10px]">Attendance Consideration</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{req.reason || req.title}</p>
                      </div>
                      <button
                        onClick={() => handleRecommendAttendance(req.id)}
                        disabled={actionProcessing === req.id}
                        className="btn btn-sm btn-primary text-xs py-1 px-3"
                      >
                        {actionProcessing === req.id ? 'Submitting...' : 'Recommend to HOD'}
                      </button>
                    </div>
                  ))}

                  {/* Leave Applications */}
                  {pendingLeaves.map((leave) => (
                    <div key={leave.id} className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{leave.studentName}</span>
                          <span className="badge badge-blue text-[10px]">{leave.rollNo}</span>
                          <span className="badge badge-indigo text-[10px]">{leave.leaveType || 'Leave'}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{leave.reason || leave.title}</p>
                      </div>
                      <button
                        onClick={() => handleRecommendLeave(leave.id)}
                        disabled={actionProcessing === leave.id}
                        className="btn btn-sm btn-primary text-xs py-1 px-3"
                      >
                        {actionProcessing === leave.id ? 'Submitting...' : 'Recommend to HOD'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mentees Directory Table */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Mentees Under Supervision</h3>
                </div>
                <span className="badge badge-slate text-xs">{mentees.length} Enrolled</span>
              </div>

              {mentees.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs bg-slate-50 rounded-xl">
                  No records found.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table" style={{ width: '100%', fontSize: '12px' }}>
                    <thead>
                      <tr className="text-slate-500 text-left border-b border-slate-200">
                        <th className="pb-2 font-bold">Enrollment No.</th>
                        <th className="pb-2 font-bold">Student Name</th>
                        <th className="pb-2 font-bold">Section</th>
                        <th className="pb-2 font-bold">Batch</th>
                        <th className="pb-2 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {mentees.map((st) => (
                        <tr key={st.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 font-bold text-blue-600">{st.enrollment_no}</td>
                          <td className="py-2.5 text-slate-900 font-semibold">{st.name}</td>
                          <td className="py-2.5 text-slate-600">{st.section}</td>
                          <td className="py-2.5 text-slate-500">{st.batch}</td>
                          <td className="py-2.5">
                            <span className="badge badge-emerald text-[10px]">{st.status || 'Active'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

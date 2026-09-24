import React from 'react';
import { useERP } from '../../context/ERPContext';
import { Link } from 'react-router-dom';
import QuickActions from '../../components/QuickActions';
import QuickDisplay from '../../components/QuickDisplay';
import RequestCard from '../../components/RequestCard';
import AgentActivity from '../../components/AgentActivity';
import {
  Users,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export default function TgDashboard() {
  const {
    currentUser,
    students,
    attendanceRequests,
    leaveRequests,
    attendanceQueries,
    tgAvailable,
    toggleTgAvailability,
    tgReviewAttendanceConsideration,
    tgReviewLeave,
    openModal
  } = useERP();

  const atRiskStudents = students.filter((s) => s.attendance < 75);
  const pendingRequests = [
    ...attendanceRequests.filter((r) => r.status === 'pending_tg'),
    ...leaveRequests.filter((r) => r.status === 'pending_tg'),
    ...attendanceQueries.filter((q) => q.status === 'pending_tg')
  ];

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
              <span className="badge badge-indigo">Section {currentUser.assignedSection}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Teacher Guardian: {currentUser.name} • {students.length} Mentees Under Direct Supervision
            </p>
          </div>

          {/* Interactive TG Availability Telemetry Switch */}
          <div
            className={`flex items-center gap-3 p-2 px-3 rounded-2xl border transition-all ${
              tgAvailable ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
            }`}
          >
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-500 block">
                Office Availability
              </span>
              <div className={`text-xs font-bold ${tgAvailable ? 'text-emerald-700' : 'text-rose-700'}`}>
                {tgAvailable ? 'Available & In Office' : 'Marked Unavailable / On Leave'}
              </div>
            </div>

            <button
              onClick={toggleTgAvailability}
              className={`btn btn-sm ${tgAvailable ? 'btn-danger' : 'btn-success'} text-xs py-1 px-3`}
              id="btn-toggle-tg-availability"
            >
              {tgAvailable ? 'Mark On Leave' : 'Mark Available'}
            </button>
          </div>
        </div>

        {/* ACTIVE QUICK ACTIONS (Top of Dashboard) */}
        <QuickActions role="tg" />

        {/* QUICK DISPLAY WIDGET (Today, Pending, Alerts) */}
        <QuickDisplay />

        {/* Notice on TG Availability Behavior */}
        {!tgAvailable && (
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center gap-2.5 text-xs text-amber-900">
            <AlertTriangle size={18} className="shrink-0 text-amber-600" />
            <div>
              <strong>Autonomous Fallback Routing Active:</strong> Because you are marked unavailable, new student leave requests will automatically bypass your queue and route directly to HOD Dr. S. Roy.
            </div>
          </div>
        )}

        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="card flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Assigned Mentees</span>
              <div className="text-2xl font-extrabold text-slate-900">{students.length}</div>
              <span className="text-[11px] text-emerald-600 font-semibold">100% profiles synced</span>
            </div>
          </div>

          <div className="card flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${atRiskStudents.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Attendance Risk (&lt;75%)</span>
              <div className="text-2xl font-extrabold text-slate-900">{atRiskStudents.length} Students</div>
              <span className="text-[11px] text-rose-600 font-semibold">Shortage alerts dispatched</span>
            </div>
          </div>

          <div className="card flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${pendingRequests.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
              <Clock size={20} />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Pending TG Clearances</span>
              <div className="text-2xl font-extrabold text-slate-900">{pendingRequests.length}</div>
              <span className="text-[11px] text-amber-600 font-semibold">Action required</span>
            </div>
          </div>
        </div>

        {/* Two Columns: Pending Clearances & Academic Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pending Student Requests (FLOW 1 & FLOW 2 in TG stage) */}
          <div className="card flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Pending Student Clearances</h3>
                <span className="badge badge-amber text-xs">{pendingRequests.length} to review</span>
              </div>
              <Link to="/tg/requests" className="text-xs text-blue-600 font-semibold hover:underline">
                View All
              </Link>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-xs">
                ✨ Zero pending requests in your mentor queue!
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2 text-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-slate-900 text-sm">{req.title || 'Student Application'}</span>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          {req.studentName} ({req.rollNo}) • {req.dateRangeLabel || req.date}
                        </p>
                      </div>
                      <span className="badge badge-amber text-[10px]">Awaiting TG</span>
                    </div>

                    <p className="text-slate-700 bg-white p-2 rounded-lg border border-slate-100 text-[11px]">
                      "{req.reason}"
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/60">
                      {req.type === 'attendance_consideration' ? (
                        <button
                          onClick={() => tgReviewAttendanceConsideration(req.id)}
                          className="btn btn-sm btn-primary text-xs py-1.5 px-3 font-bold"
                          id={`btn-tg-verify-${req.id}`}
                        >
                          <CheckCircle2 size={13} />
                          <span>Verify & Forward to HOD</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => tgReviewLeave(req.id, true)}
                          className="btn btn-sm btn-primary text-xs py-1.5 px-3 font-bold"
                          id={`btn-tg-approve-leave-${req.id}`}
                        >
                          <CheckCircle2 size={13} />
                          <span>Approve & Forward</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Academic Alerts / Mentees At Risk */}
          <div className="card flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Academic & Attendance Alerts</h3>
                <span className="badge badge-rose text-xs">{atRiskStudents.length} Students At Risk</span>
              </div>
              <Link to="/tg/students" className="text-xs text-blue-600 font-semibold hover:underline">
                Mentees Roster
              </Link>
            </div>

            <div className="flex flex-col gap-2">
              {atRiskStudents.map((st) => (
                <div key={st.id} className="p-3 bg-rose-50/50 rounded-xl border border-rose-200 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 block truncate">{st.name} ({st.rollNo})</span>
                    <span className="text-[11px] text-rose-700 font-semibold">
                      Attendance: {st.attendance}% (Below 75% Examination Threshold)
                    </span>
                  </div>

                  <button
                    onClick={() => openModal('studentDetail', { student: st })}
                    className="btn btn-sm btn-outline text-xs py-1 px-2.5 shrink-0"
                  >
                    Inspect
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Autonomous Agent Activity Feed */}
        <AgentActivity maxItems={4} compact={true} />
      </div>
    </div>
  );
}

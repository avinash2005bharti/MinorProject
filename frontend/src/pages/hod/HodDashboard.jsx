import React from 'react';
import { useERP } from '../../context/ERPContext';
import { Link } from 'react-router-dom';
import QuickActions from '../../components/QuickActions';
import QuickDisplay from '../../components/QuickDisplay';
import RequestCard from '../../components/RequestCard';
import AgentActivity from '../../components/AgentActivity';
import {
  ShieldCheck,
  Users,
  CheckSquare,
  Sparkles,
  ArrowRight,
  Activity,
  Calendar,
  AlertTriangle,
  Bot
} from 'lucide-react';

export default function HodDashboard() {
  const {
    currentUser,
    attendanceRequests,
    leaveRequests,
    attendanceQueries,
    hodApproveAttendanceConsideration,
    hodApproveAttendanceQuery,
    hodApproveLeave,
    openModal
  } = useERP();

  const pendingAttendance = attendanceRequests.filter((r) => r.status === 'pending_hod');
  const pendingQueries = attendanceQueries.filter((q) => q.status === 'pending_hod');
  const pendingLeaves = leaveRequests.filter((l) => l.status === 'pending_hod' || l.status === 'pending_hod_direct');

  const totalPending = pendingAttendance.length + pendingQueries.length + pendingLeaves.length;

  return (
    <div className="page-wrapper">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Dept. of Computer Science & Engineering
              </h1>
              <span className="badge badge-indigo">HOD Office</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Head of Department: {currentUser.name} • Academic Governance & AI Agent Orchestration
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/hod/timetable" className="btn btn-primary text-xs py-2 px-4 shadow-sm">
              <Sparkles size={15} />
              <span>AI Timetable Generator</span>
            </Link>
          </div>
        </div>

        {/* ACTIVE QUICK ACTIONS (Top of Dashboard) */}
        <QuickActions role="hod" />

        {/* QUICK DISPLAY WIDGET (Today, Pending, Alerts) */}
        <QuickDisplay />

        {/* High-Level Department Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
          <div className="card flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Enrolled Students</span>
              <div className="text-2xl font-extrabold text-slate-900">340</div>
              <span className="text-[11px] text-emerald-600">Across 6 sections</span>
            </div>
          </div>

          <div className="card flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Department Faculty</span>
              <div className="text-2xl font-extrabold text-slate-900">24</div>
              <span className="text-[11px] text-emerald-600">All active in service</span>
            </div>
          </div>

          <div className="card flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Activity size={20} />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Avg. Attendance</span>
              <div className="text-2xl font-extrabold text-indigo-700">81.4%</div>
              <span className="text-[11px] text-slate-400">Statutory safe standing</span>
            </div>
          </div>

          <div className="card flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${totalPending > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
              <CheckSquare size={20} />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Pending Clearances</span>
              <div className="text-2xl font-extrabold text-slate-900">{totalPending}</div>
              <span className="text-[11px] text-amber-600 font-semibold">Requires HOD Sign-off</span>
            </div>
          </div>
        </div>

        {/* Pending Requests Requiring HOD Action (FLOW 2 & FLOW 8) */}
        <div className="card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Pending Approvals Requiring HOD Final Clearance
              </h3>
              <span className="badge badge-amber text-xs">{totalPending} items</span>
            </div>

            <Link to="/hod/requests" className="text-xs text-blue-600 font-semibold hover:underline">
              Requests Central →
            </Link>
          </div>

          {totalPending === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-xs">
              ✨ All student clearance applications and attendance considerations processed!
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Attendance Considerations (FLOW 2: Approving triggers Autonomous Attendance Consideration Agent) */}
              {pendingAttendance.map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-200 flex flex-col gap-2.5 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{req.title}</span>
                        <span className="badge badge-indigo text-[10px]">Duty Adjustment</span>
                      </div>
                      <p className="text-slate-600 text-xs mt-0.5">
                        Student: <strong>{req.studentName} ({req.rollNo})</strong> • Section: <strong>{req.section}</strong> • Period: <strong>{req.dateRangeLabel}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Current → Expected</span>
                      <span className="font-extrabold text-sm text-slate-800">
                        {req.currentAttendance}% → <span className="text-emerald-600">{req.expectedAttendance}%</span>
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/80 leading-relaxed">
                    <strong>Reason:</strong> {req.reason}
                  </p>

                  {req.tgRecommendation && (
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-800 text-[11px] border border-emerald-200/60">
                      <strong>TG Mentor Recommendation:</strong> {req.tgRecommendation}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-blue-100 flex-wrap gap-2">
                    <span className="text-[11px] text-blue-700 font-semibold flex items-center gap-1">
                      <Bot size={14} /> Approving will trigger Autonomous Attendance Agent to adjust 6 class sessions
                    </span>

                    <button
                      onClick={() => hodApproveAttendanceConsideration(req.id)}
                      className="btn btn-sm btn-primary text-xs py-1.5 px-4 font-bold shadow-sm"
                      id={`btn-hod-approve-att-${req.id}`}
                    >
                      <Sparkles size={13} />
                      <span>Approve & Launch Agent Sync</span>
                    </button>
                  </div>
                </div>
              ))}

              {/* Leave Requests */}
              {pendingLeaves.map((lv) => (
                <div
                  key={lv.id}
                  className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-2 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{lv.title}</span>
                        {lv.tgUnavailable && (
                          <span className="badge badge-amber text-[10px]">TG Bypassed (Direct Route)</span>
                        )}
                      </div>
                      <p className="text-slate-600 text-xs mt-0.5">
                        {lv.studentName} ({lv.rollNo}) • {lv.dateRangeLabel} • {lv.leaveType}
                      </p>
                    </div>

                    <span className="badge badge-amber text-[10px]">Awaiting Final Sign-off</span>
                  </div>

                  <p className="text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/80">
                    "{lv.reason}"
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/60">
                    <button
                      onClick={() => hodApproveLeave(lv.id)}
                      className="btn btn-sm btn-primary text-xs py-1.5 px-4 font-bold"
                      id={`btn-hod-approve-leave-${lv.id}`}
                    >
                      <ShieldCheck size={13} />
                      <span>Grant Leave Approval</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Autonomous Agent Activity Stream */}
        <AgentActivity maxItems={4} compact={true} />
      </div>
    </div>
  );
}

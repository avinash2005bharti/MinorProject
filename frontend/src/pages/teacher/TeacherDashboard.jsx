import React from 'react';
import { useERP } from '../../context/ERPContext';
import { Link } from 'react-router-dom';
import QuickActions from '../../components/QuickActions';
import QuickDisplay from '../../components/QuickDisplay';
import AgentActivity from '../../components/AgentActivity';
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
  FileText,
  MessageSquarePlus,
  Send
} from 'lucide-react';

export default function TeacherDashboard() {
  const { currentUser, students, assignments, submissions, openModal } = useERP();

  const autoUpdatedStudent = students.find((s) => s.autoUpdated || s.rollNo === '21CSE084');
  const pendingSubmissions = submissions.filter((s) => s.status !== 'graded');

  return (
    <div className="page-wrapper">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Faculty Dashboard
              </h1>
              <span className="badge badge-indigo">{currentUser.facultyId}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentUser.name} • {currentUser.designation} • Dept. of CSE
            </p>
          </div>

          <Link
            to="/teacher/attendance"
            className="btn btn-primary text-xs py-2 px-4 shadow-sm"
          >
            <CheckSquare size={16} />
            <span>Mark Live Roll Call</span>
          </Link>
        </div>

        {/* ACTIVE QUICK ACTIONS (Top of Dashboard) */}
        <QuickActions role="teacher" />

        {/* QUICK DISPLAY WIDGET (Today, Pending, Alerts) */}
        <QuickDisplay />

        {/* Feature 7 Visual Guarantee: Automated Agent Update Banner */}
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
          <Bot size={22} className="text-emerald-700 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-emerald-950">
              Autonomous Agent Ledger Synchronizations Active
            </h4>
            <p className="text-emerald-800 mt-0.5 leading-relaxed">
              "Attendance automatically updated by <strong>Attendance Agent</strong> for Rahul Sharma (CSE-3A) across Data Structures & Algorithms sessions following approved Hackathon duty credit. <strong>No manual teacher editing required.</strong>"
            </p>
          </div>
        </div>

        {/* Teaching Workload Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="card flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Classes Today</span>
              <div className="text-2xl font-extrabold text-slate-900">3 Lectures</div>
              <span className="text-[11px] text-blue-600 font-semibold">Period 2 Live in Room 204</span>
            </div>
          </div>

          <div className="card flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <BookOpen size={20} />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Assigned Courses</span>
              <div className="text-2xl font-extrabold text-slate-900">CS301 & CS306</div>
              <span className="text-[11px] text-emerald-700 font-semibold">Sections CSE-3A & 3B</span>
            </div>
          </div>

          <div className="card flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Pending Evaluations</span>
              <div className="text-2xl font-extrabold text-slate-900">{pendingSubmissions.length} Submissions</div>
              <Link to="/teacher/assignments" className="text-[11px] text-amber-700 font-semibold hover:underline">
                Review in Grading Central →
              </Link>
            </div>
          </div>
        </div>

        {/* Today's Teaching Schedule & Quick Attendance Action */}
        <div className="card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Today's Teaching Schedule</h3>
              <span className="agent-pulse" />
            </div>
            <span className="text-xs text-slate-500">Wednesday • 42 Enrolled</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {/* Live Class */}
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-1 h-10 bg-blue-600 rounded-full shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-blue-950 text-sm">Data Structures & Algorithms (CS301)</h4>
                    <span className="badge badge-emerald text-[10px]">Live Session</span>
                  </div>
                  <span className="text-slate-600 mt-0.5 block">
                    Period 2 (10:30 AM - 11:30 AM) • Room 204 • Section CSE-3A
                  </span>
                </div>
              </div>

              <Link to="/teacher/attendance" className="btn btn-sm btn-primary text-xs py-1.5 px-3 shrink-0">
                <CheckSquare size={13} />
                <span>Mark Attendance</span>
              </Link>
            </div>

            {/* Scheduled Practical */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-1 h-10 bg-emerald-500 rounded-full shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800 text-sm">DSA Practical Lab (CS306 - Batch A1)</h4>
                    <span className="badge badge-slate text-[10px]">Scheduled</span>
                  </div>
                  <span className="text-slate-500 mt-0.5 block">
                    Period 4-5 (02:15 PM - 04:15 PM) • Lab-3 • Section CSE-3A
                  </span>
                </div>
              </div>

              <span className="text-xs text-slate-500 font-semibold self-end sm:self-center">
                Starts at 02:15 PM
              </span>
            </div>
          </div>
        </div>

        {/* Autonomous Agent Activity Feed */}
        <AgentActivity maxItems={4} compact={true} />
      </div>
    </div>
  );
}

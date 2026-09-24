import React from 'react';
import { useERP } from '../../context/ERPContext';
import { Link } from 'react-router-dom';
import AttendanceProgress from '../../components/AttendanceProgress';
import AgentActivity from '../../components/AgentActivity';
import QuickActions from '../../components/QuickActions';
import QuickDisplay from '../../components/QuickDisplay';
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
  Sparkles,
  ExternalLink,
  ChevronRight,
  Upload,
  AlertCircle,
  Compass,
  AlertTriangle
} from 'lucide-react';

export default function StudentDashboard() {
  const { currentUser, students, assignments, submissions, notices, leaveRequests, openModal } = useERP();

  // Student submissions mapping
  const submittedIds = new Set(
    submissions
      .filter((s) => s.rollNo === currentUser.rollNo || s.studentId === currentUser.id)
      .map((s) => s.assignmentId)
  );

  const pendingAssignments = assignments.filter((a) => !submittedIds.has(a.id));
  const recentNotices = notices.slice(0, 3);
  const activeLeaves = leaveRequests.filter((l) => l.rollNo === currentUser.rollNo);

  return (
    <div className="page-wrapper">
      <div className="flex flex-col gap-4">
        {/* Humanized Greeting Section */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Good morning, {currentUser.name}
              </h1>
              <span className="text-xl">👋</span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
              <span>OIST Bhopal</span>
              <span>•</span>
              <span className="text-blue-600 font-semibold">{currentUser.section}</span>
              <span>•</span>
              <span className="tabular-nums font-medium">{currentUser.rollNo}</span>
              <span>•</span>
              <span>Mentor: {currentUser.tgName}</span>
            </p>
          </div>

          <div className="relative shrink-0">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-slate-200"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-600 rounded-full flex items-center justify-center text-white ring-2 ring-white">
              <CheckCircle2 size={10} strokeWidth={3} />
            </span>
          </div>
        </div>

        {/* ACTIVE QUICK ACTIONS (Top of Dashboard) */}
        <QuickActions role="student" />

        {/* QUICK DISPLAY WIDGET (Today, Pending, Alerts) */}
        <QuickDisplay />

        {/* Hero Academic & Attendance Metric Card */}
        <div className="card relative overflow-hidden">
          <div
            style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              backgroundColor: 'rgba(29, 78, 216, 0.05)',
              filter: 'blur(20px)',
              pointerEvents: 'none'
            }}
          />

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <span className="text-xs font-bold text-slate-700">
                Academic Standing & Examination Eligibility
              </span>
            </div>

            <Link
              to="/student/attendance"
              className="btn btn-sm btn-outline text-xs py-1 px-2.5"
            >
              <span>Subject Ledger</span>
              <ChevronRight size={13} />
            </Link>
          </div>

          {/* Mini Stats Grid */}
          <div className="grid grid-cols-3 gap-3 items-end mb-2">
            <div>
              <span className="text-xs text-slate-500 block">Attendance</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-extrabold text-slate-900 leading-none">
                  {currentUser.attendance}
                </span>
                <span className={`text-base font-bold ${currentUser.attendance >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  %
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-500 block">CGPA</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-bold text-slate-900">
                  {currentUser.cgpa}
                </span>
                <span className="text-xs text-slate-400">/ 10</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 block">Semester</span>
              <span className="text-2xl font-extrabold text-blue-600">
                {currentUser.semester}
              </span>
            </div>
          </div>

          {/* Attendance Progress Track */}
          <AttendanceProgress percentage={currentUser.attendance} showDetails={false} />
        </div>

        {/* Priority Card: Next Class */}
        <div className="bg-blue-600 text-white rounded-2xl p-4 shadow-md flex flex-col gap-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
                <Clock size={14} className="text-white" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-100">
                Current Class Slot
              </span>
            </div>
            <span className="py-0.5 px-2 rounded-full bg-white/20 text-xs font-semibold">
              Live Now
            </span>
          </div>

          <div>
            <h3 className="text-lg font-extrabold text-white">
              Data Structures & Algorithms (CS301)
            </h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-blue-100 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin size={13} /> Room 204
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <User size={13} /> Dr. Rajesh Verma
              </span>
              <span>•</span>
              <span>Period 2 (10:30 AM - 11:30 AM)</span>
            </div>
          </div>
        </div>

        {/* Pending Assignments & Recent Notices Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pending Coursework */}
          <div className="card flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BookOpen size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Pending Assignments</h3>
                  <span className="text-[11px] text-slate-500">Requires student submission</span>
                </div>
              </div>

              <Link to="/student/assignments" className="text-xs text-blue-600 font-semibold hover:underline">
                View All ({pendingAssignments.length})
              </Link>
            </div>

            <div className="flex flex-col gap-2">
              {pendingAssignments.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-medium">
                  🎉 No pending assignments! You are all caught up.
                </div>
              ) : (
                pendingAssignments.slice(0, 2).map((asg) => (
                  <div key={asg.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 truncate">{asg.title}</span>
                        <span className="badge badge-amber text-[10px]">{asg.dueDaysLeft}</span>
                      </div>
                      <span className="text-slate-500 block text-[11px] mt-0.5">
                        {asg.subjectCode} • Max: {asg.totalMarks} marks • Due: {asg.dueDate}
                      </span>
                    </div>

                    <button
                      onClick={() => openModal('submitAssignment', { assignment: asg })}
                      className="btn btn-sm btn-primary text-xs py-1.5 px-3 shrink-0"
                    >
                      <Upload size={13} />
                      <span>Submit</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Notices */}
          <div className="card flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Compass size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Recent Notices & Circulars</h3>
                  <span className="text-[11px] text-slate-500">Campus bulletins</span>
                </div>
              </div>

              <Link to="/student/notices" className="text-xs text-blue-600 font-semibold hover:underline">
                View All
              </Link>
            </div>

            <div className="flex flex-col gap-2">
              {recentNotices.slice(0, 2).map((notice) => (
                <div key={notice.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 truncate">{notice.title}</span>
                    <span className={`badge text-[10px] ${notice.priority === 'urgent' ? 'badge-rose' : 'badge-slate'}`}>
                      {notice.priority}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] line-clamp-1">{notice.content}</p>
                  <span className="text-[10px] text-slate-400 mt-0.5">{notice.authorRole} • {notice.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Split: Today's Schedule & Autonomous Agent Activity Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Today's Lectures Timeline */}
          <div className="card flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Today's Lectures</h3>
                <span className="agent-pulse" />
              </div>
              <span className="text-xs text-slate-500">Wednesday • Section CSE-3A</span>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-1 h-9 bg-emerald-500 rounded-full shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">Operating Systems (CS303)</h4>
                    <span className="text-[11px] text-slate-500">09:00 AM - 10:00 AM • Room 302 • Dr. Meenakshi S.</span>
                  </div>
                </div>
                <span className="badge badge-emerald text-[11px] shrink-0">
                  <CheckCircle2 size={12} /> Present
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-blue-50/60 rounded-xl border border-blue-200 gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-1 h-9 bg-blue-600 rounded-full shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-blue-900 truncate">Data Structures & Algorithms (CS301)</h4>
                    <span className="text-[11px] text-blue-700">10:30 AM - 11:30 AM • Room 204 • Dr. Rajesh Verma</span>
                  </div>
                </div>
                <span className="badge badge-indigo text-[11px] shrink-0">
                  <span className="agent-pulse w-1.5 h-1.5" /> Live
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-1 h-9 bg-slate-300 rounded-full shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-700 truncate">Computer Networks (CS304)</h4>
                    <span className="text-[11px] text-slate-500">02:00 PM - 03:00 PM • Room 204 • Prof. Amit K.</span>
                  </div>
                </div>
                <span className="badge badge-slate text-[11px] shrink-0">Scheduled</span>
              </div>
            </div>
          </div>

          {/* Agent Activity Stream */}
          <AgentActivity maxItems={4} compact={true} />
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useERP } from '../context/ERPContext';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  AlertCircle,
  Sparkles,
  ArrowRight,
  BookOpen
} from 'lucide-react';

export default function QuickDisplay() {
  const {
    currentRole,
    currentUser,
    students,
    leaveRequests,
    attendanceRequests,
    assignments,
    timetable,
    timetableConflicts
  } = useERP();
  const navigate = useNavigate();

  // Pending counts
  const pendingLeaves = leaveRequests.filter((l) => l.status.startsWith('pending')).length;
  const pendingAttReqs = attendanceRequests.filter((a) => a.status.startsWith('pending')).length;
  const pendingAssignmentsCount = assignments.filter((a) => a.status === 'active').length;
  const lowAttendanceStudents = students.filter((s) => s.attendance < 75);

  // Today's schedule items (Wednesday default for realistic display)
  const todayClasses = timetable['Wednesday'] || [];

  return (
    <div className="quick-display-grid">
      {/* CARD 1: TODAY'S SCHEDULE */}
      <div className="quick-display-card">
        <div className="quick-display-card-header">
          <div className="flex items-center gap-2">
            <span className="qd-badge-pill qd-badge-blue">
              <Calendar size={13} />
              <span>TODAY</span>
            </span>
            <span className="text-xs text-secondary font-medium">Wednesday</span>
          </div>
          <span className="agent-pulse" />
        </div>

        <div className="quick-display-schedule-list">
          {todayClasses.slice(0, 3).map((item, idx) => (
            <div key={idx} className={`qd-schedule-item ${item.isLive ? 'qd-schedule-live' : ''}`}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="qd-time-slot tabular-nums">{item.time.split(' - ')[0]}</span>
                <div className="truncate">
                  <span className="qd-subject-name truncate">{item.subject}</span>
                  <span className="qd-meta-info truncate">{item.room} • {item.faculty.split(' ')[0]}</span>
                </div>
              </div>
              {item.isLive ? (
                <span className="badge badge-emerald text-[10px] py-0.5 px-2">Live</span>
              ) : (
                <span className="qd-period-tag">P{item.period}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CARD 2: PENDING REVIEWS & SUBMISSIONS */}
      <div className="quick-display-card">
        <div className="quick-display-card-header">
          <div className="flex items-center gap-2">
            <span className="qd-badge-pill qd-badge-amber">
              <Clock size={13} />
              <span>PENDING</span>
            </span>
            <span className="text-xs text-muted font-medium">Needs Action</span>
          </div>
          <span className="text-xs text-primary font-semibold hover:underline cursor-pointer" onClick={() => {
            if (currentRole === 'student') navigate('/student/requests');
            else if (currentRole === 'tg') navigate('/tg/requests');
            else if (currentRole === 'hod') navigate('/hod/requests');
            else navigate('/teacher/assignments');
          }}>
            Review all
          </span>
        </div>

        <div className="quick-display-stat-rows">
          <div
            className="qd-stat-row cursor-pointer"
            onClick={() => navigate(currentRole === 'student' ? '/student/requests' : currentRole === 'tg' ? '/tg/requests' : '/hod/requests')}
          >
            <div className="flex items-center gap-2">
              <span className="qd-row-dot bg-amber-500" />
              <span className="text-xs font-semibold text-primary">Leave Requests</span>
            </div>
            <span className="qd-stat-count bg-amber-50 text-amber-700">{pendingLeaves} in queue</span>
          </div>

          <div
            className="qd-stat-row cursor-pointer"
            onClick={() => navigate(currentRole === 'student' ? '/student/attendance' : currentRole === 'tg' ? '/tg/requests' : '/hod/requests')}
          >
            <div className="flex items-center gap-2">
              <span className="qd-row-dot bg-blue-500" />
              <span className="text-xs font-semibold text-primary">Attendance Considerations</span>
            </div>
            <span className="qd-stat-count bg-blue-50 text-blue-700">{pendingAttReqs} active</span>
          </div>

          <div
            className="qd-stat-row cursor-pointer"
            onClick={() => navigate(currentRole === 'student' ? '/student/assignments' : '/teacher/assignments')}
          >
            <div className="flex items-center gap-2">
              <span className="qd-row-dot bg-indigo-500" />
              <span className="text-xs font-semibold text-primary">Active Course Assignments</span>
            </div>
            <span className="qd-stat-count bg-indigo-50 text-indigo-700">{pendingAssignmentsCount} due soon</span>
          </div>
        </div>
      </div>

      {/* CARD 3: ACTIONABLE ALERTS */}
      <div className="quick-display-card">
        <div className="quick-display-card-header">
          <div className="flex items-center gap-2">
            <span className="qd-badge-pill qd-badge-rose">
              <AlertCircle size={13} />
              <span>ALERTS</span>
            </span>
            <span className="text-xs text-muted font-medium">Telemetry Signals</span>
          </div>
          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 size={12} /> Live Sync
          </span>
        </div>

        <div className="quick-display-alerts-list">
          {currentRole === 'student' ? (
            <>
              {currentUser.attendance < 75 ? (
                <div className="qd-alert-box qd-alert-warning">
                  <AlertTriangle size={15} className="shrink-0 text-amber-600 mt-0.5" />
                  <div className="min-w-0">
                    <span className="qd-alert-title text-amber-900">Attendance Shortage Warning ({currentUser.attendance}%)</span>
                    <p className="qd-alert-desc text-amber-700">6% below required 75% minimum threshold for 6th Sem exams.</p>
                  </div>
                </div>
              ) : (
                <div className="qd-alert-box qd-alert-success">
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-600 mt-0.5" />
                  <div className="min-w-0">
                    <span className="qd-alert-title text-emerald-900">Attendance Status: Safe ({currentUser.attendance}%)</span>
                    <p className="qd-alert-desc text-emerald-700">Eligible for end-semester examinations and campus placements.</p>
                  </div>
                </div>
              )}
              <div className="qd-alert-box qd-alert-info">
                <FileText size={15} className="shrink-0 text-blue-600 mt-0.5" />
                <div className="min-w-0">
                  <span className="qd-alert-title text-blue-900">Mid-term Schedule Announced</span>
                  <p className="qd-alert-desc text-blue-700">Theory papers commence Oct 15. Check timetable.</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="qd-alert-box qd-alert-warning cursor-pointer" onClick={() => navigate(currentRole === 'hod' ? '/hod/students' : '/tg/students')}>
                <AlertTriangle size={15} className="shrink-0 text-amber-600 mt-0.5" />
                <div className="min-w-0">
                  <span className="qd-alert-title text-amber-900">{lowAttendanceStudents.length} Students below 75% attendance</span>
                  <p className="qd-alert-desc text-amber-700">Shortage alerts dispatched to student portals and TG mentors.</p>
                </div>
              </div>

              {timetableConflicts.length > 0 ? (
                <div className="qd-alert-box qd-alert-error cursor-pointer" onClick={() => navigate('/hod/timetable')}>
                  <AlertCircle size={15} className="shrink-0 text-rose-600 mt-0.5" />
                  <div className="min-w-0">
                    <span className="qd-alert-title text-rose-900">{timetableConflicts.length} Timetable Conflicts Flagged</span>
                    <p className="qd-alert-desc text-rose-700">Room 204 double-booking detected by AI Engine.</p>
                  </div>
                </div>
              ) : (
                <div className="qd-alert-box qd-alert-success">
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-600 mt-0.5" />
                  <div className="min-w-0">
                    <span className="qd-alert-title text-emerald-900">Zero Timetable Collisions</span>
                    <p className="qd-alert-desc text-emerald-700">Multi-room schedule verified by Timetable Agent.</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

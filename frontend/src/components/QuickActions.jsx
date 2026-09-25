import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useERP } from '../context/ERPContext';
import {
  CheckSquare,
  Calendar,
  FileText,
  Clock,
  PlusCircle,
  Sparkles,
  Send,
  Users,
  Award,
  BookOpen,
  HelpCircle,
  FileQuestion,
  MessageSquarePlus,
  Layers,
  ShieldCheck,
  UserCheck,
  GraduationCap
} from 'lucide-react';

export default function QuickActions({ role }) {
  const navigate = useNavigate();
  const { openModal, currentRole } = useERP();
  const activeRole = role || currentRole;

  const renderStudentActions = () => (
    <div className="quick-actions-bar">
      <button
        onClick={() => navigate('/student/attendance')}
        className="quick-action-btn"
        id="qa-view-attendance"
      >
        <span className="qa-icon-wrapper qa-icon-blue">
          <CheckSquare size={16} />
        </span>
        <span className="qa-label">View Attendance</span>
      </button>

      <button
        onClick={() => openModal('requestConsideration')}
        className="quick-action-btn qa-btn-accent"
        id="qa-request-consideration"
      >
        <span className="qa-icon-wrapper qa-icon-purple">
          <Sparkles size={16} />
        </span>
        <span className="qa-label">Request Consideration</span>
      </button>

      <button
        onClick={() => openModal('applyLeave')}
        className="quick-action-btn"
        id="qa-apply-leave"
      >
        <span className="qa-icon-wrapper qa-icon-emerald">
          <PlusCircle size={16} />
        </span>
        <span className="qa-label">Apply Leave</span>
      </button>

      <button
        onClick={() => navigate('/student/assignments')}
        className="quick-action-btn"
        id="qa-submit-assignment"
      >
        <span className="qa-icon-wrapper qa-icon-indigo">
          <FileText size={16} />
        </span>
        <span className="qa-label">Submit Assignment</span>
      </button>

      <button
        onClick={() => navigate('/student/timetable')}
        className="quick-action-btn"
        id="qa-view-timetable"
      >
        <span className="qa-icon-wrapper qa-icon-amber">
          <Calendar size={16} />
        </span>
        <span className="qa-label">View Timetable</span>
      </button>

      <button
        onClick={() => navigate('/student/requests')}
        className="quick-action-btn"
        id="qa-my-requests"
      >
        <span className="qa-icon-wrapper qa-icon-slate">
          <Clock size={16} />
        </span>
        <span className="qa-label">My Requests</span>
      </button>
    </div>
  );

  const renderTeacherActions = () => (
    <div className="quick-actions-bar">
      <button
        onClick={() => navigate('/teacher/attendance')}
        className="quick-action-btn qa-btn-accent"
        id="qa-teacher-mark-attendance"
      >
        <span className="qa-icon-wrapper qa-icon-emerald">
          <CheckSquare size={16} />
        </span>
        <span className="qa-label">Mark Attendance</span>
      </button>

      <button
        onClick={() => openModal('scheduleLecture')}
        className="quick-action-btn"
        id="qa-schedule-lecture"
      >
        <span className="qa-icon-wrapper qa-icon-blue">
          <Calendar size={16} />
        </span>
        <span className="qa-label">Schedule Lecture</span>
      </button>

      <button
        onClick={() => openModal('createAssignment')}
        className="quick-action-btn"
        id="qa-create-assignment"
      >
        <span className="qa-icon-wrapper qa-icon-indigo">
          <FileText size={16} />
        </span>
        <span className="qa-label">Create Assignment</span>
      </button>

      <button
        onClick={() => openModal('createTest')}
        className="quick-action-btn"
        id="qa-create-test"
      >
        <span className="qa-icon-wrapper qa-icon-amber">
          <FileQuestion size={16} />
        </span>
        <span className="qa-label">Online Test</span>
      </button>

      <button
        onClick={() => openModal('studentFeedback')}
        className="quick-action-btn"
        id="qa-give-feedback"
      >
        <span className="qa-icon-wrapper qa-icon-purple">
          <MessageSquarePlus size={16} />
        </span>
        <span className="qa-label">Give Feedback</span>
      </button>

      <button
        onClick={() => openModal('sendNotice')}
        className="quick-action-btn"
        id="qa-teacher-send-notice"
      >
        <span className="qa-icon-wrapper qa-icon-rose">
          <Send size={16} />
        </span>
        <span className="qa-label">Send Notice</span>
      </button>
    </div>
  );

  const renderTgActions = () => (
    <div className="quick-actions-bar">
      <button
        onClick={() => navigate('/tg/students')}
        className="quick-action-btn qa-btn-accent"
        id="qa-tg-view-students"
      >
        <span className="qa-icon-wrapper qa-icon-blue">
          <Users size={16} />
        </span>
        <span className="qa-label">View Students</span>
      </button>

      <button
        onClick={() => navigate('/tg/requests')}
        className="quick-action-btn"
        id="qa-tg-pending-requests"
      >
        <span className="qa-icon-wrapper qa-icon-amber">
          <Clock size={16} />
        </span>
        <span className="qa-label">Pending Requests</span>
      </button>

      <button
        onClick={() => navigate('/tg/attendance')}
        className="quick-action-btn"
        id="qa-tg-attendance"
      >
        <span className="qa-icon-wrapper qa-icon-emerald">
          <CheckSquare size={16} />
        </span>
        <span className="qa-label">Attendance Audit</span>
      </button>

      <button
        onClick={() => openModal('sendNotice', { defaultTarget: 'Section', targetValue: 'CSE-3A' })}
        className="quick-action-btn"
        id="qa-tg-send-notice"
      >
        <span className="qa-icon-wrapper qa-icon-rose">
          <Send size={16} />
        </span>
        <span className="qa-label">Send Notice</span>
      </button>
    </div>
  );

  const renderHodActions = () => (
    <div className="quick-actions-bar">
      <button
        onClick={() => navigate('/hod/requests')}
        className="quick-action-btn qa-btn-accent"
        id="qa-hod-approvals"
      >
        <span className="qa-icon-wrapper qa-icon-amber">
          <ShieldCheck size={16} />
        </span>
        <span className="qa-label">Approvals</span>
      </button>

      <button
        onClick={() => navigate('/hod/teachers')}
        className="quick-action-btn"
        id="qa-hod-manage-teachers"
      >
        <span className="qa-icon-wrapper qa-icon-blue">
          <UserCheck size={16} />
        </span>
        <span className="qa-label">Manage Teachers</span>
      </button>

      <button
        onClick={() => navigate('/hod/classes')}
        className="quick-action-btn"
        id="qa-hod-manage-classes"
      >
        <span className="qa-icon-wrapper qa-icon-indigo">
          <Layers size={16} />
        </span>
        <span className="qa-label">Manage Classes</span>
      </button>

      <button
        onClick={() => openModal('addSection')}
        className="quick-action-btn"
        id="qa-hod-add-section"
      >
        <span className="qa-icon-wrapper qa-icon-emerald">
          <PlusCircle size={16} />
        </span>
        <span className="qa-label">Add Section</span>
      </button>

      <button
        onClick={() => navigate('/hod/timetable')}
        className="quick-action-btn"
        id="qa-hod-generate-timetable"
      >
        <span className="qa-icon-wrapper qa-icon-purple">
          <Sparkles size={16} />
        </span>
        <span className="qa-label">Generate Timetable</span>
      </button>

      <button
        onClick={() => openModal('sendNotice', { defaultTarget: 'Department', targetValue: 'All Students & Faculty' })}
        className="quick-action-btn"
        id="qa-hod-send-notice"
      >
        <span className="qa-icon-wrapper qa-icon-rose">
          <Send size={16} />
        </span>
        <span className="qa-label">Send Notice</span>
      </button>
    </div>
  );

  const renderAdminActions = () => (
    <div className="quick-actions-bar">
      <button onClick={() => navigate('/admin/students')} className="quick-action-btn">
        <span className="qa-icon-wrapper qa-icon-blue"><Users size={16} /></span>
        <span className="qa-label">Students Roster</span>
      </button>
      <button onClick={() => navigate('/admin/teachers')} className="quick-action-btn">
        <span className="qa-icon-wrapper qa-icon-emerald"><UserCheck size={16} /></span>
        <span className="qa-label">Faculty Directory</span>
      </button>
      <button onClick={() => navigate('/admin/departments')} className="quick-action-btn">
        <span className="qa-icon-wrapper qa-icon-indigo"><GraduationCap size={16} /></span>
        <span className="qa-label">Academic Structure</span>
      </button>
      <button onClick={() => openModal('sendNotice')} className="quick-action-btn">
        <span className="qa-icon-wrapper qa-icon-rose"><Send size={16} /></span>
        <span className="qa-label">Broadcast Notice</span>
      </button>
      <button onClick={() => navigate('/admin/settings')} className="quick-action-btn">
        <span className="qa-icon-wrapper qa-icon-slate"><Sparkles size={16} /></span>
        <span className="qa-label">AI Agent Settings</span>
      </button>
    </div>
  );

  return (
    <div className="quick-actions-container">
      <div className="quick-actions-header">
        <span className="quick-actions-title">Quick Actions</span>
        <span className="quick-actions-hint">1-Click Fast Triggers</span>
      </div>
      {activeRole === 'student' && renderStudentActions()}
      {activeRole === 'teacher' && renderTeacherActions()}
      {activeRole === 'tg' && renderTgActions()}
      {activeRole === 'hod' && renderHodActions()}
      {activeRole === 'admin' && renderAdminActions()}
    </div>
  );
}

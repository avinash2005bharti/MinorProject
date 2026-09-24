import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ERPProvider, useERP } from './context/ERPContext';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/auth/LoginPage';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentRequests from './pages/student/StudentRequests';
import StudentTimetable from './pages/student/StudentTimetable';
import StudentAssignments from './pages/student/StudentAssignments';
import StudentNotices from './pages/student/StudentNotices';
import StudentProfile from './pages/student/StudentProfile';

// TG Pages
import TgDashboard from './pages/tg/TgDashboard';
import TgMyStudents from './pages/tg/TgMyStudents';
import TgRequests from './pages/tg/TgRequests';
import TgNotices from './pages/tg/TgNotices';

// HOD Pages
import HodDashboard from './pages/hod/HodDashboard';
import HodAttendanceApproval from './pages/hod/HodAttendanceApproval';
import HodLeaveApproval from './pages/hod/HodLeaveApproval';
import HodRequestsCentral from './pages/hod/HodRequestsCentral';
import HodTeacherManagement from './pages/hod/HodTeacherManagement';
import HodClassesSections from './pages/hod/HodClassesSections';
import HodStudents from './pages/hod/HodStudents';
import HodTimetableGenerator from './pages/hod/HodTimetableGenerator';
import HodTimetableMonitoring from './pages/hod/HodTimetableMonitoring';
import HodNotices from './pages/hod/HodNotices';
import HodReports from './pages/hod/HodReports';

// Teacher Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherMarkAttendance from './pages/teacher/TeacherMarkAttendance';
import TeacherLectures from './pages/teacher/TeacherLectures';
import TeacherAssignments from './pages/teacher/TeacherAssignments';
import TeacherTests from './pages/teacher/TeacherTests';
import TeacherStudents from './pages/teacher/TeacherStudents';
import TeacherClasses from './pages/teacher/TeacherClasses';
import TeacherTimetable from './pages/teacher/TeacherTimetable';
import TeacherNotices from './pages/teacher/TeacherNotices';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStudents from './pages/admin/AdminStudents';
import AdminTeachers from './pages/admin/AdminTeachers';
import AdminDepartments from './pages/admin/AdminDepartments';
import AdminSettings from './pages/admin/AdminSettings';

function RoleRedirect() {
  const { currentRole, isAuthenticated } = useERP();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={`/${currentRole}`} replace />;
}

function ProtectedLayout() {
  const { isAuthenticated } = useERP();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <DashboardLayout />;
}

function LoginWrapper() {
  const { isAuthenticated, currentRole } = useERP();
  if (isAuthenticated) {
    return <Navigate to={`/${currentRole}`} replace />;
  }
  return <LoginPage />;
}

function RoleRouteGuard({ role, children }) {
  const { currentRole, isAuthenticated } = useERP();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (currentRole !== role) {
    return <Navigate to={`/${currentRole}`} replace />;
  }

  return children;
}

export default function App() {
  return (
    <ERPProvider>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<LoginWrapper />} />

        {/* Protected ERP Dashboard Layout */}
        <Route path="/" element={<ProtectedLayout />}>
          {/* Default Route redirects to active role */}
          <Route index element={<RoleRedirect />} />

          {/* Student Routes - Only Student Window can open */}
          <Route path="student" element={<RoleRouteGuard role="student"><StudentDashboard /></RoleRouteGuard>} />
          <Route path="student/attendance" element={<RoleRouteGuard role="student"><StudentAttendance /></RoleRouteGuard>} />
          <Route path="student/timetable" element={<RoleRouteGuard role="student"><StudentTimetable /></RoleRouteGuard>} />
          <Route path="student/assignments" element={<RoleRouteGuard role="student"><StudentAssignments /></RoleRouteGuard>} />
          <Route path="student/requests" element={<RoleRouteGuard role="student"><StudentRequests /></RoleRouteGuard>} />
          <Route path="student/notices" element={<RoleRouteGuard role="student"><StudentNotices /></RoleRouteGuard>} />
          <Route path="student/profile" element={<RoleRouteGuard role="student"><StudentProfile /></RoleRouteGuard>} />

          {/* TG / Mentor Routes - Only TG Window can open */}
          <Route path="tg" element={<RoleRouteGuard role="tg"><TgDashboard /></RoleRouteGuard>} />
          <Route path="tg/students" element={<RoleRouteGuard role="tg"><TgMyStudents /></RoleRouteGuard>} />
          <Route path="tg/requests" element={<RoleRouteGuard role="tg"><TgRequests /></RoleRouteGuard>} />
          <Route path="tg/attendance" element={<RoleRouteGuard role="tg"><TgRequests /></RoleRouteGuard>} />
          <Route path="tg/leave" element={<RoleRouteGuard role="tg"><TgRequests /></RoleRouteGuard>} />
          <Route path="tg/notices" element={<RoleRouteGuard role="tg"><TgNotices /></RoleRouteGuard>} />

          {/* HOD Routes - Only HOD Window can open */}
          <Route path="hod" element={<RoleRouteGuard role="hod"><HodDashboard /></RoleRouteGuard>} />
          <Route path="hod/teachers" element={<RoleRouteGuard role="hod"><HodTeacherManagement /></RoleRouteGuard>} />
          <Route path="hod/classes" element={<RoleRouteGuard role="hod"><HodClassesSections /></RoleRouteGuard>} />
          <Route path="hod/students" element={<RoleRouteGuard role="hod"><HodStudents /></RoleRouteGuard>} />
          <Route path="hod/requests" element={<RoleRouteGuard role="hod"><HodRequestsCentral /></RoleRouteGuard>} />
          <Route path="hod/approvals" element={<RoleRouteGuard role="hod"><HodAttendanceApproval /></RoleRouteGuard>} />
          <Route path="hod/attendance" element={<RoleRouteGuard role="hod"><HodAttendanceApproval /></RoleRouteGuard>} />
          <Route path="hod/leave" element={<RoleRouteGuard role="hod"><HodLeaveApproval /></RoleRouteGuard>} />
          <Route path="hod/timetable" element={<RoleRouteGuard role="hod"><HodTimetableGenerator /></RoleRouteGuard>} />
          <Route path="hod/monitoring" element={<RoleRouteGuard role="hod"><HodTimetableMonitoring /></RoleRouteGuard>} />
          <Route path="hod/notices" element={<RoleRouteGuard role="hod"><HodNotices /></RoleRouteGuard>} />
          <Route path="hod/reports" element={<RoleRouteGuard role="hod"><HodReports /></RoleRouteGuard>} />

          {/* Teacher Routes - Only Teacher Window can open */}
          <Route path="teacher" element={<RoleRouteGuard role="teacher"><TeacherDashboard /></RoleRouteGuard>} />
          <Route path="teacher/attendance" element={<RoleRouteGuard role="teacher"><TeacherMarkAttendance /></RoleRouteGuard>} />
          <Route path="teacher/lectures" element={<RoleRouteGuard role="teacher"><TeacherLectures /></RoleRouteGuard>} />
          <Route path="teacher/assignments" element={<RoleRouteGuard role="teacher"><TeacherAssignments /></RoleRouteGuard>} />
          <Route path="teacher/tests" element={<RoleRouteGuard role="teacher"><TeacherTests /></RoleRouteGuard>} />
          <Route path="teacher/students" element={<RoleRouteGuard role="teacher"><TeacherStudents /></RoleRouteGuard>} />
          <Route path="teacher/classes" element={<RoleRouteGuard role="teacher"><TeacherClasses /></RoleRouteGuard>} />
          <Route path="teacher/timetable" element={<RoleRouteGuard role="teacher"><TeacherTimetable /></RoleRouteGuard>} />
          <Route path="teacher/notices" element={<RoleRouteGuard role="teacher"><TeacherNotices /></RoleRouteGuard>} />

          {/* Admin Routes - Only Admin Window can open */}
          <Route path="admin" element={<RoleRouteGuard role="admin"><AdminDashboard /></RoleRouteGuard>} />
          <Route path="admin/students" element={<RoleRouteGuard role="admin"><AdminStudents /></RoleRouteGuard>} />
          <Route path="admin/teachers" element={<RoleRouteGuard role="admin"><AdminTeachers /></RoleRouteGuard>} />
          <Route path="admin/departments" element={<RoleRouteGuard role="admin"><AdminDepartments /></RoleRouteGuard>} />
          <Route path="admin/timetable" element={<RoleRouteGuard role="admin"><HodTimetableGenerator /></RoleRouteGuard>} />
          <Route path="admin/settings" element={<RoleRouteGuard role="admin"><AdminSettings /></RoleRouteGuard>} />

          {/* Catch-all */}
          <Route path="*" element={<RoleRedirect />} />
        </Route>
      </Routes>
    </ERPProvider>
  );
}

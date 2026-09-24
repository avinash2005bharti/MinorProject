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

          {/* Student Routes */}
          <Route path="student" element={<StudentDashboard />} />
          <Route path="student/attendance" element={<StudentAttendance />} />
          <Route path="student/timetable" element={<StudentTimetable />} />
          <Route path="student/assignments" element={<StudentAssignments />} />
          <Route path="student/requests" element={<StudentRequests />} />
          <Route path="student/notices" element={<StudentNotices />} />
          <Route path="student/profile" element={<StudentProfile />} />

          {/* TG / Mentor Routes */}
          <Route path="tg" element={<TgDashboard />} />
          <Route path="tg/students" element={<TgMyStudents />} />
          <Route path="tg/requests" element={<TgRequests />} />
          <Route path="tg/attendance" element={<TgRequests />} />
          <Route path="tg/leave" element={<TgRequests />} />
          <Route path="tg/notices" element={<TgNotices />} />

          {/* HOD Routes */}
          <Route path="hod" element={<HodDashboard />} />
          <Route path="hod/teachers" element={<HodTeacherManagement />} />
          <Route path="hod/classes" element={<HodClassesSections />} />
          <Route path="hod/students" element={<HodStudents />} />
          <Route path="hod/requests" element={<HodRequestsCentral />} />
          <Route path="hod/approvals" element={<HodAttendanceApproval />} />
          <Route path="hod/attendance" element={<HodAttendanceApproval />} />
          <Route path="hod/leave" element={<HodLeaveApproval />} />
          <Route path="hod/timetable" element={<HodTimetableGenerator />} />
          <Route path="hod/monitoring" element={<HodTimetableMonitoring />} />
          <Route path="hod/notices" element={<HodNotices />} />
          <Route path="hod/reports" element={<HodReports />} />

          {/* Teacher Routes */}
          <Route path="teacher" element={<TeacherDashboard />} />
          <Route path="teacher/attendance" element={<TeacherMarkAttendance />} />
          <Route path="teacher/lectures" element={<TeacherLectures />} />
          <Route path="teacher/assignments" element={<TeacherAssignments />} />
          <Route path="teacher/tests" element={<TeacherTests />} />
          <Route path="teacher/students" element={<TeacherStudents />} />
          <Route path="teacher/classes" element={<TeacherClasses />} />
          <Route path="teacher/timetable" element={<TeacherTimetable />} />
          <Route path="teacher/notices" element={<TeacherNotices />} />

          {/* Admin Routes */}
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/students" element={<AdminStudents />} />
          <Route path="admin/teachers" element={<AdminTeachers />} />
          <Route path="admin/departments" element={<AdminDepartments />} />
          <Route path="admin/timetable" element={<HodTimetableGenerator />} />
          <Route path="admin/settings" element={<AdminSettings />} />

          {/* Catch-all */}
          <Route path="*" element={<RoleRedirect />} />
        </Route>
      </Routes>
    </ERPProvider>
  );
}

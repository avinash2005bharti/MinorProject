// ============================================================================
// Departmental ERP - PostgreSQL Prisma Model Registry
// Canonical Source of Truth for Relational ERP Business State
// ============================================================================

const { prisma } = require('../../config/postgres');

module.exports = {
  prisma,
  // Canonical Prisma models
  User: prisma.user,
  Role: prisma.role,
  Department: prisma.department,
  AcademicSession: prisma.academicSession,
  AcademicYear: prisma.academicSession,
  Semester: prisma.semester,
  Section: prisma.section,
  Teacher: prisma.teacher,
  Faculty: prisma.teacher, // Alias for legacy controller compatibility
  Hod: prisma.hOD,
  HOD: prisma.hOD,
  Student: prisma.student,
  Subject: prisma.subject,
  Enrollment: prisma.enrollment,
  TeacherSubject: prisma.teacherSubject,
  Classroom: prisma.classroom,
  Room: prisma.classroom, // Alias
  Timetable: prisma.timetable,
  TimetableSlot: prisma.timetableSlot,
  Attendance: prisma.attendance,
  AttendanceRecord: prisma.attendanceRecord,
  AttendanceCorrectionRequest: prisma.attendanceCorrectionRequest,
  AttendanceConsiderationRequest: prisma.attendanceConsiderationRequest,
  LeaveApplication: prisma.leaveApplication,
  LeaveRequest: prisma.leaveApplication, // Alias
  Notification: prisma.notification,
  Notice: prisma.notification, // Alias
  Note: prisma.documentMetadata, // Alias
  DocumentMetadata: prisma.documentMetadata,
  AIGeneratedRecord: prisma.aIGeneratedRecord
};

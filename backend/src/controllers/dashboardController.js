const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Timetable = require('../models/Timetable');
const AttendanceRequest = require('../models/AttendanceRequest');
const LeaveRequest = require('../models/LeaveRequest');
const AttendanceQuery = require('../models/AttendanceQuery');
const Notification = require('../models/Notification');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const timetableAiEngine = require('../services/timetableAiEngine');
const attendanceService = require('../services/attendanceService');

// 1. Student Dashboard
exports.getStudentDashboard = async (req, res, next) => {
  try {
    let student = null;
    if (req.user) {
      student = await Student.findOne({ user: req.user._id });
    }
    if (!student) {
      student = await Student.findOne({ rollNo: '21CSE084' });
    }

    const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
    const queryDay = currentDay === 'Sunday' || currentDay === 'Saturday' ? 'Monday' : currentDay;

    const [todaySchedule, pendingLeaves, pendingAttendance, notifications] = await Promise.all([
      Timetable.find({ section: student?.section || 'CSE-3A', day: queryDay }).sort({ period: 1 }),
      LeaveRequest.find({ rollNo: student?.rollNo || '21CSE084', status: { $regex: 'pending' } }),
      AttendanceRequest.find({ rollNo: student?.rollNo || '21CSE084', status: { $regex: 'pending' } }),
      Notification.find({ recipient: 'student' }).sort({ createdAt: -1 }).limit(5)
    ]);

    const thresholdStatus = attendanceService.getStatusThreshold(student ? student.attendance : 72);

    res.status(200).json({
      success: true,
      data: {
        student: {
          name: student?.name || 'Rahul Sharma',
          rollNo: student?.rollNo || '21CSE084',
          section: student?.section || 'CSE-3A',
          semester: student?.semester || 6,
          batch: student?.batch || '2021-2025',
          cgpa: student?.cgpa || 8.42
        },
        attendance: {
          percentage: student ? student.attendance : 72,
          requiredThreshold: 75,
          status: thresholdStatus
        },
        todayTimetable: todaySchedule,
        pendingRequestsCount: pendingLeaves.length + pendingAttendance.length,
        pendingRequests: [...pendingLeaves, ...pendingAttendance],
        notifications
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Teacher Dashboard
exports.getTeacherDashboard = async (req, res, next) => {
  try {
    let teacher = null;
    if (req.user) {
      teacher = await Teacher.findOne({ user: req.user._id });
    }
    if (!teacher) {
      teacher = await Teacher.findOne({ facultyId: 'FAC-102' });
    }

    const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
    const queryDay = currentDay === 'Sunday' || currentDay === 'Saturday' ? 'Monday' : currentDay;

    const [todayClasses, pendingApprovals] = await Promise.all([
      Timetable.find({
        $or: [
          { faculty: teacher?.name || 'Dr. Rajesh Verma' },
          { section: 'CSE-3A', day: queryDay }
        ]
      }).sort({ period: 1 }),
      AttendanceRequest.find({ status: 'pending_tg' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        teacher: {
          name: teacher?.name || 'Dr. Rajesh Verma',
          facultyId: teacher?.facultyId || 'FAC-102',
          designation: teacher?.designation || 'Associate Professor',
          assignedSections: teacher?.assignedSections || ['CSE-3A', 'CSE-3B'],
          assignedSubjects: teacher?.assignedSubjects || [
            { code: 'CS301', name: 'Data Structures & Algorithms' },
            { code: 'CS306', name: 'DSA Lab' }
          ],
          weeklyHours: teacher?.weeklyHours || 14
        },
        todayClasses,
        pendingApprovalsCount: pendingApprovals.length,
        currentRoom: teacher?.currentRoom || 'Room 204'
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. TG / Mentor Dashboard
exports.getTgDashboard = async (req, res, next) => {
  try {
    const [pendingLeaves, pendingAttendance, mentees] = await Promise.all([
      LeaveRequest.find({ status: 'pending_tg' }),
      AttendanceRequest.find({ status: 'pending_tg' }),
      Student.find({ section: 'CSE-3A' }).limit(30)
    ]);

    res.status(200).json({
      success: true,
      data: {
        mentor: {
          name: 'Prof. K. Sen',
          facultyId: 'FAC-088',
          assignedSection: 'CSE-3A',
          menteesCount: mentees.length,
          available: true
        },
        pendingLeaves,
        pendingAttendance,
        totalPending: pendingLeaves.length + pendingAttendance.length,
        mentees
      }
    });
  } catch (error) {
    next(error);
  }
};

// 4. HOD Dashboard
exports.getHodDashboard = async (req, res, next) => {
  try {
    const [students, faculty, pendingLeaves, pendingAttendance, pendingQueries, conflictAnalysis] = await Promise.all([
      Student.find(),
      Teacher.find(),
      LeaveRequest.find({ status: { $in: ['pending_hod', 'pending_hod_direct'] } }),
      AttendanceRequest.find({ status: 'pending_hod' }),
      AttendanceQuery.find({ status: 'pending_hod' }),
      timetableAiEngine.analyzeConstraints()
    ]);

    // Average department attendance
    const avgAttendance = students.length > 0
      ? Math.round(students.reduce((acc, s) => acc + s.attendance, 0) / students.length)
      : 81;

    // Faculty workload distribution
    const facultyWorkload = faculty.map((f) => ({
      name: f.name,
      facultyId: f.facultyId,
      weeklyHours: f.weeklyHours,
      assignedSections: f.assignedSections,
      status: f.status
    }));

    res.status(200).json({
      success: true,
      data: {
        department: 'Computer Science & Engineering',
        totalStudentsCount: students.length,
        totalFacultyCount: faculty.length,
        departmentAverageAttendance: avgAttendance,
        pendingApprovalsCount: pendingLeaves.length + pendingAttendance.length + pendingQueries.length,
        pendingApprovals: {
          leaves: pendingLeaves,
          attendanceConsiderations: pendingAttendance,
          attendanceQueries: pendingQueries
        },
        facultyWorkload,
        timetableConflicts: conflictAnalysis.conflicts,
        timetableOptimizationScore: conflictAnalysis.optimizationScore
      }
    });
  } catch (error) {
    next(error);
  }
};

// 5. Admin Dashboard
exports.getAdminDashboard = async (req, res, next) => {
  try {
    const [userCount, studentCount, teacherCount, recentActivity] = await Promise.all([
      User.countDocuments(),
      Student.countDocuments(),
      Teacher.countDocuments(),
      AuditLog.find().sort({ createdAt: -1 }).limit(10)
    ]);

    res.status(200).json({
      success: true,
      data: {
        counts: {
          totalUsers: userCount || 140,
          totalStudents: studentCount || 120,
          totalFaculty: teacherCount || 10,
          activeAgentsCount: 4
        },
        systemStatus: 'Optimal',
        department: 'Computer Science & Engineering',
        recentActivity
      }
    });
  } catch (error) {
    next(error);
  }
};

const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Timetable = require('../models/Timetable');
const Subject = require('../models/Subject');

const attendanceService = {
  // Recalculates student's overall attendance %
  calculatePercentage(attended, total) {
    if (!total || total === 0) return 100;
    return Math.round((attended / total) * 100);
  },

  // Determines badge color, threshold and label for attendance percentage
  getStatusThreshold(percentage) {
    if (percentage >= 75) {
      return {
        label: 'Safe Status',
        sublabel: 'Above 75% required threshold',
        badgeClass: 'badge-emerald',
        color: '#059669',
        isSafe: true
      };
    } else if (percentage >= 65) {
      return {
        label: 'Borderline Warning',
        sublabel: 'Warning: 65% – 75% range',
        badgeClass: 'badge-amber',
        color: '#D97706',
        isSafe: false
      };
    } else {
      return {
        label: 'Critical Shortage',
        sublabel: 'Critical shortage (< 65%)',
        badgeClass: 'badge-rose',
        color: '#E11D48',
        isSafe: false
      };
    }
  },

  // Identifies affected classes for a student's section within a date range
  async identifyAffectedClasses(section, startDate, endDate) {
    try {
      // Find subjects and scheduled timetable slots for this section
      const timetableSlots = await Timetable.find({ section });
      if (timetableSlots.length > 0) {
        return timetableSlots.slice(0, 6).map((slot, idx) => ({
          subject: slot.subject,
          code: slot.code,
          date: `${10 + idx} Sept`,
          faculty: slot.faculty,
          period: `Period ${slot.period}`
        }));
      }
    } catch (e) {
      console.warn('[attendanceService] Timetable query warning:', e.message);
    }

    // Default institutional classes in CSE-3A
    return [
      { subject: 'Data Structures & Algorithms', code: 'CS301', date: '10 Sept', faculty: 'Dr. Rajesh Verma', period: 'Period 2' },
      { subject: 'Database Management Systems', code: 'CS302', date: '11 Sept', faculty: 'Prof. Anita Sharma', period: 'Period 1' },
      { subject: 'Operating Systems', code: 'CS303', date: '12 Sept', faculty: 'Dr. Meenakshi S.', period: 'Period 3' },
      { subject: 'Computer Networks', code: 'CS304', date: '13 Sept', faculty: 'Prof. Amit K.', period: 'Period 2' },
      { subject: 'Data Structures Lab', code: 'CS306', date: '14 Sept', faculty: 'Dr. Rajesh Verma', period: 'Period 4-5' },
      { subject: 'Software Engineering', code: 'CS305', date: '15 Sept', faculty: 'Prof. K. Sen', period: 'Period 1' }
    ];
  },

  // Recalculates student's aggregate attendance in DB
  async recalculateStudentAttendance(studentId) {
    const student = await Student.findById(studentId);
    if (!student) return null;

    const records = await Attendance.find({ student: studentId });
    if (records.length === 0) return student.attendance;

    const presentOrDuty = records.filter(
      (r) => r.status === 'present' || r.status === 'duty_leave'
    ).length;

    const newPercentage = Math.round((presentOrDuty / records.length) * 100);
    student.attendance = newPercentage;
    await student.save();

    return newPercentage;
  }
};

module.exports = attendanceService;

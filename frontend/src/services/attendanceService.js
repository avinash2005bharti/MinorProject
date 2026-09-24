// ==========================================================================
// CampusFlow – Attendance Service
// Handles section-wise automated propagation, recalculation, and query tracking
// ==========================================================================

export const attendanceService = {
  // Recalculates student's overall attendance %
  calculatePercentage(attended, total) {
    if (!total || total === 0) return 100;
    return Math.round((attended / total) * 100);
  },

  // Identifies affected classes for a student's section within a date range
  identifyAffectedClasses(section, startDate, endDate) {
    // Simulated class discovery across section timetable
    return [
      { subject: 'Data Structures & Algorithms', code: 'CS301', date: '10 Sept', faculty: 'Dr. Rajesh Verma' },
      { subject: 'Database Management Systems', code: 'CS302', date: '11 Sept', faculty: 'Prof. Anita Sharma' },
      { subject: 'Operating Systems', code: 'CS303', date: '12 Sept', faculty: 'Dr. Meenakshi S.' },
      { subject: 'Computer Networks', code: 'CS304', date: '13 Sept', faculty: 'Prof. Amit K.' },
      { subject: 'Data Structures Lab', code: 'CS306', date: '14 Sept', faculty: 'Dr. Rajesh Verma' },
      { subject: 'Software Engineering', code: 'CS305', date: '15 Sept', faculty: 'Prof. K. Sen' }
    ];
  },

  // Determines badge color and label for attendance percentage
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
  }
};

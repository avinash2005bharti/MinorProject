// ==========================================================================
// CSE Department ERP – Institutional System Initial Configuration
// Pure Schema Templates for User Windows & Role State Initialization
// ==========================================================================

export const INITIAL_USERS = {
  student: {
    id: 6,
    role: 'student',
    name: 'Ayush Sharma',
    rollNo: '0103CS211001',
    collegeId: 'ayush.student@college.edu',
    department: 'Computer Science & Engineering',
    semester: 5,
    year: '3rd Year',
    section: 'A',
    batch: '2022-2026',
    cgpa: 8.42,
    avatar: null,
    tgName: 'Prof. Rahul Mehta',
    tgEmail: 'rahul.mehta@college.edu',
    hodName: 'Dr. Alok Verma',
    attendance: 84,
    requiredThreshold: 75,
    pendingRequestsCount: 0
  },
  teacher: {
    id: 3,
    role: 'teacher',
    name: 'Dr. Sunita Sharma',
    facultyId: 'FAC-02',
    email: 'sunita.sharma@college.edu',
    department: 'Computer Science & Engineering',
    designation: 'Associate Professor',
    avatar: null,
    assignedSubjects: [
      { code: 'CS501', name: 'Database Management Systems', sections: ['A', 'B'], hoursPerWeek: 4 },
      { code: 'CS505', name: 'DBMS Laboratory', sections: ['A'], hoursPerWeek: 2 }
    ],
    weeklyClassesCount: 16,
    currentRoom: 'CSE Room 204'
  },
  tg: {
    id: 4,
    role: 'tg',
    name: 'Prof. Rahul Mehta',
    facultyId: 'FAC-03',
    email: 'rahul.mehta@college.edu',
    department: 'Computer Science & Engineering',
    designation: 'Assistant Professor (TG)',
    assignedSection: 'A',
    assignedMenteesCount: 30,
    avatar: null,
    available: true
  },
  hod: {
    id: 2,
    role: 'hod',
    name: 'Dr. Alok Verma',
    facultyId: 'FAC-01',
    email: 'hod.cse@college.edu',
    department: 'Computer Science & Engineering',
    designation: 'Professor & Head (HOD)',
    avatar: null,
    pendingApprovalsCount: 0,
    totalFacultyCount: 4,
    totalStudentsCount: 3
  },
  admin: {
    id: 1,
    role: 'admin',
    name: 'CSE Department Administrator',
    adminId: 'ADMIN-01',
    email: 'admin@college.edu',
    avatar: null,
    systemStatus: 'Optimal',
    activeAgentsCount: 4
  }
};

// All mock collections replaced with empty arrays to strictly load from MySQL database
export const CSE_SUBJECTS = [];
export const ENROLLED_STUDENTS_CSE3A = [];
export const INITIAL_ATTENDANCE_REQUESTS = [];
export const INITIAL_ATTENDANCE_QUERIES = [];
export const INITIAL_LEAVE_REQUESTS = [];
export const INITIAL_AGENT_ACTIVITIES = [];
export const INITIAL_TIMETABLE_CSE3A = {
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: []
};
export const INITIAL_NOTIFICATIONS = [];
export const INITIAL_CLASSES = [];
export const INITIAL_SECTIONS = [];
export const INITIAL_ASSIGNMENTS = [];
export const INITIAL_SUBMISSIONS = [];
export const INITIAL_NOTICES = [];
export const INITIAL_TESTS = [];
export const INITIAL_FEEDBACK = [];
export const INITIAL_TEACHERS = [];
export const INITIAL_EXAMS = [];
export const INITIAL_NOTES = [];
export const INITIAL_MEETINGS = [];
export const SYSTEM_LOGS = [];
export const INITIAL_TIMETABLE_METRICS = {
  hard_constraints_satisfied: true,
  soft_constraints_score: 0.94,
  teacher_workload_balance: 0.91,
  room_utilization: 0.85,
  conflicts: 0
};

// ==========================================================================
// OIST CSE – Realistic Mock ERP Data & Pre-loaded System State
// ==========================================================================

export const INITIAL_USERS = {
  student: {
    id: 'usr-student-01',
    role: 'student',
    name: 'Rahul Sharma',
    rollNo: '21CSE084',
    collegeId: '21cse084@oist.ac.in',
    department: 'Computer Science & Engineering',
    semester: '6th',
    section: 'CSE-3A',
    batch: '2021-2025',
    cgpa: 8.42,
    avatar: null,
    tgName: 'Prof. K. Sen',
    tgEmail: 'k.sen@oist.ac.in',
    hodName: 'Dr. S. Roy',
    attendance: 72, // starts at 72% (shortage warning); will increase to 84% upon HOD approval
    requiredThreshold: 75,
    pendingRequestsCount: 2
  },
  teacher: {
    id: 'usr-teacher-01',
    role: 'teacher',
    name: 'Dr. Rajesh Verma',
    facultyId: 'FAC-102',
    email: 'r.verma@oist.ac.in',
    department: 'Computer Science & Engineering',
    designation: 'Associate Professor',
    avatar: null,
    assignedSubjects: [
      { code: 'CS301', name: 'Data Structures & Algorithms', sections: ['CSE-3A', 'CSE-3B'], hoursPerWeek: 4 },
      { code: 'CS306', name: 'Advanced Algorithms Lab', sections: ['CSE-3A'], hoursPerWeek: 3 }
    ],
    weeklyClassesCount: 14,
    currentRoom: 'Room 204'
  },
  tg: {
    id: 'usr-tg-01',
    role: 'tg',
    name: 'Prof. K. Sen',
    facultyId: 'FAC-088',
    email: 'k.sen@oist.ac.in',
    department: 'Computer Science & Engineering',
    designation: 'Assistant Professor & Mentor (TG)',
    assignedSection: 'CSE-3A',
    assignedMenteesCount: 30,
    avatar: null,
    available: true // Can be toggled to test TG Unavailable fallback routing
  },
  hod: {
    id: 'usr-hod-01',
    role: 'hod',
    name: 'Dr. S. Roy',
    facultyId: 'HOD-001',
    email: 's.roy@oist.ac.in',
    department: 'Computer Science & Engineering',
    designation: 'Head of Department (CSE)',
    avatar: null,
    pendingApprovalsCount: 4,
    totalFacultyCount: 24,
    totalStudentsCount: 340
  },
  admin: {
    id: 'usr-admin-01',
    role: 'admin',
    name: 'OIST Central Administration',
    adminId: 'SYS-ADMIN-01',
    email: 'admin.support@oist.ac.in',
    avatar: null,
    systemStatus: 'Optimal',
    activeAgentsCount: 4
  }
};

export const CSE_SUBJECTS = [
  { id: 'sub-1', code: 'CS301', name: 'Data Structures & Algorithms', faculty: 'Dr. Rajesh Verma', totalHeld: 25, attended: 18, type: 'Lecture' },
  { id: 'sub-2', code: 'CS302', name: 'Database Management Systems', faculty: 'Prof. Anita Sharma', totalHeld: 24, attended: 17, type: 'Lecture' },
  { id: 'sub-3', code: 'CS303', name: 'Operating Systems', faculty: 'Dr. Meenakshi S.', totalHeld: 22, attended: 16, type: 'Lecture' },
  { id: 'sub-4', code: 'CS304', name: 'Computer Networks', faculty: 'Prof. Amit K.', totalHeld: 20, attended: 14, type: 'Lecture' },
  { id: 'sub-5', code: 'CS305', name: 'Software Engineering', faculty: 'Prof. K. Sen', totalHeld: 18, attended: 13, type: 'Lecture' }
];

export const ENROLLED_STUDENTS_CSE3A = [
  { id: 'st-01', rollNo: '21CSE084', name: 'Rahul Sharma', attendance: 72, cgpa: 8.42, status: 'present', autoUpdated: false },
  { id: 'st-02', rollNo: '21CSE085', name: 'Bhavna Patel', attendance: 88, cgpa: 8.91, status: 'present', autoUpdated: false },
  { id: 'st-03', rollNo: '21CSE086', name: 'Chirag Reddy', attendance: 68, cgpa: 7.20, status: 'absent', autoUpdated: false },
  { id: 'st-04', rollNo: '21CSE087', name: 'Divya Nair', attendance: 92, cgpa: 9.15, status: 'present', autoUpdated: false },
  { id: 'st-05', rollNo: '21CSE088', name: 'Faizan Ahmed', attendance: 85, cgpa: 8.35, status: 'present', autoUpdated: false },
  { id: 'st-06', rollNo: '21CSE089', name: 'Gaurav Kulkarni', attendance: 74, cgpa: 7.85, status: 'absent', autoUpdated: false },
  { id: 'st-07', rollNo: '21CSE090', name: 'Avinash Sharma', attendance: 84, cgpa: 8.42, status: 'present', autoUpdated: false },
  { id: 'st-08', rollNo: '21CSE091', name: 'Ishita Roy', attendance: 91, cgpa: 9.30, status: 'present', autoUpdated: false },
  { id: 'st-09', rollNo: '21CSE092', name: 'Jatin Mehta', attendance: 79, cgpa: 8.00, status: 'present', autoUpdated: false },
  { id: 'st-10', rollNo: '21CSE093', name: 'Kavita Sen', attendance: 86, cgpa: 8.70, status: 'present', autoUpdated: false }
];

export const INITIAL_ATTENDANCE_REQUESTS = [
  {
    id: 'REQ-ATT-101',
    type: 'attendance_consideration',
    title: 'Attendance Consideration (Hackathon & Sports Duty)',
    studentId: 'usr-student-01',
    studentName: 'Rahul Sharma',
    rollNo: '21CSE084',
    department: 'Computer Science & Engineering',
    semester: '6th',
    section: 'CSE-3A',
    startDate: '2025-09-10',
    endDate: '2025-09-15',
    dateRangeLabel: '10 Sept – 15 Sept 2025',
    reason: 'Official College Representation: Smart India Hackathon Grand Finale & Inter-College Championship (Team OIST).',
    supportingDoc: 'SIH2025_Duty_Verification_Signed.pdf',
    currentAttendance: 72,
    expectedAttendance: 84,
    affectedClasses: [
      { subject: 'Data Structures & Algorithms', code: 'CS301', date: '10 Sept', period: 'Period 2' },
      { subject: 'Database Management Systems', code: 'CS302', date: '11 Sept', period: 'Period 1' },
      { subject: 'Operating Systems', code: 'CS303', date: '12 Sept', period: 'Period 3' },
      { subject: 'Computer Networks', code: 'CS304', date: '13 Sept', period: 'Period 2' },
      { subject: 'Data Structures Lab', code: 'CS306', date: '14 Sept', period: 'Period 4-5' },
      { subject: 'Software Engineering', code: 'CS305', date: '15 Sept', period: 'Period 1' }
    ],
    status: 'pending_tg', // Workflow: pending_tg -> pending_hod -> agent_processing -> completed
    tgRecommendation: 'Recommended: Student has official OD clearance signed by Sports/Academic Coordinator.',
    appliedAt: '2025-09-16 09:30 AM',
    timeline: [
      { step: 'Submitted by Student', actor: 'Rahul Sharma', time: '16 Sept, 09:30 AM', completed: true },
      { step: 'TG / Mentor Review', actor: 'Prof. K. Sen', time: 'Pending Review', completed: false, active: true },
      { step: 'HOD Approval & Clearance', actor: 'Dr. S. Roy', time: 'In Queue', completed: false },
      { step: 'Attendance Agent Execution', actor: 'Autonomous Agent', time: 'Pending', completed: false }
    ]
  }
];

export const INITIAL_ATTENDANCE_QUERIES = [
  {
    id: 'QRY-ATT-201',
    type: 'attendance_query',
    studentId: 'usr-student-01',
    studentName: 'Rahul Sharma',
    rollNo: '21CSE084',
    section: 'CSE-3A',
    subject: 'Data Structures & Algorithms (CS301)',
    faculty: 'Dr. Rajesh Verma',
    date: '12 Sept 2025',
    period: 'Period 2 (10:30 AM - 11:30 AM)',
    currentStatus: 'Absent',
    expectedStatus: 'Present',
    reason: 'I was present in the front row and submitted my coding assignment on the lab portal during class. Roll call was missed due to audio noise.',
    supportingDoc: 'lab_commit_screenshot.png',
    status: 'pending_tg',
    appliedAt: '12 Sept 2025, 01:15 PM'
  }
];

export const INITIAL_LEAVE_REQUESTS = [
  {
    id: 'REQ-LV-301',
    type: 'leave_request',
    title: 'Medical Leave (Viral Fever)',
    studentId: 'usr-student-01',
    studentName: 'Rahul Sharma',
    rollNo: '21CSE084',
    section: 'CSE-3A',
    leaveType: 'Medical',
    startDate: '2025-09-24',
    endDate: '2025-09-26',
    dateRangeLabel: '24 Sept – 26 Sept 2025 (3 Days)',
    reason: 'Diagnosed with viral fever. Advised bed rest by university health center medical officer.',
    supportingDoc: 'Medical_Certificate_OIST_Clinic.pdf',
    status: 'pending_tg',
    appliedAt: '24 Sept 2025, 08:30 AM',
    tgUnavailable: false,
    timeline: [
      { step: 'Leave Submitted', actor: 'Rahul Sharma', time: '24 Sept, 08:30 AM', completed: true },
      { step: 'TG Review', actor: 'Prof. K. Sen', time: 'In Queue', completed: false, active: true },
      { step: 'HOD Approval', actor: 'Dr. S. Roy', time: 'Awaiting TG', completed: false }
    ]
  },
  {
    id: 'REQ-LV-302',
    type: 'leave_request',
    title: 'Hostel Outstation Leave',
    studentId: 'usr-student-01',
    studentName: 'Rahul Sharma',
    rollNo: '21CSE084',
    section: 'CSE-3A',
    leaveType: 'Personal',
    startDate: '2025-09-01',
    endDate: '2025-09-03',
    dateRangeLabel: '1 Sept – 3 Sept 2025',
    reason: 'Sister marriage ceremony in home town.',
    supportingDoc: 'parent_invitation_letter.pdf',
    status: 'completed',
    appliedAt: '28 Aug 2025, 11:00 AM',
    tgUnavailable: false,
    timeline: [
      { step: 'Leave Submitted', actor: 'Rahul Sharma', time: '28 Aug', completed: true },
      { step: 'TG Review', actor: 'Prof. K. Sen (Approved)', time: '28 Aug', completed: true },
      { step: 'HOD Clearance', actor: 'Dr. S. Roy (Signed)', time: '29 Aug', completed: true }
    ]
  }
];

export const INITIAL_AGENT_ACTIVITIES = [
  {
    id: 'act-1',
    agentName: 'Attendance Agent',
    icon: 'fact_check',
    timestamp: '2 mins ago',
    type: 'attendance',
    summary: 'Autonomous audit running for Department of CSE.',
    details: 'Verified Section CSE-3A attendance ledger. All 5 subject synchronizations intact.'
  },
  {
    id: 'act-2',
    agentName: 'Leave Agent',
    icon: 'edit_calendar',
    timestamp: '8 mins ago',
    type: 'leave',
    summary: 'Active monitor: TG availability telemetry check passed.',
    details: 'TG Prof. K. Sen marked as available. Standard 3-stage clearance pipeline active.'
  },
  {
    id: 'act-3',
    agentName: 'Timetable Agent',
    icon: 'schedule',
    timestamp: '25 mins ago',
    type: 'timetable',
    summary: 'Audited room allocation for CSE Department.',
    details: 'Checked Room 204, 302, and Lab-3 against current period schedule. Zero collisions.'
  },
  {
    id: 'act-4',
    agentName: 'Notification Agent',
    icon: 'notifications_active',
    timestamp: '40 mins ago',
    type: 'notification',
    summary: 'Broadcast periodic circulars to 340 OIST CSE students.',
    details: 'Dispatched notification for Mid-term Exam Schedule release to OIST CSE mobile app.'
  }
];

export const INITIAL_TIMETABLE_CSE3A = {
  Monday: [
    { period: 1, time: '09:00 - 10:00', code: 'CS301', subject: 'Data Structures', faculty: 'Dr. Rajesh Verma', room: 'Room 204', type: 'Lecture' },
    { period: 2, time: '10:00 - 11:00', code: 'CS302', subject: 'DBMS', faculty: 'Prof. Anita Sharma', room: 'Room 204', type: 'Lecture' },
    { period: 3, time: '11:15 - 12:15', code: 'CS303', subject: 'Operating Systems', faculty: 'Dr. Meenakshi S.', room: 'Room 204', type: 'Lecture' },
    { period: 4, time: '01:15 - 02:15', code: 'CS304', subject: 'Computer Networks', faculty: 'Prof. Amit K.', room: 'Room 204', type: 'Lecture' },
    { period: 5, time: '02:15 - 04:15', code: 'CS306', subject: 'DSA Lab (Batch A1)', faculty: 'Dr. Rajesh Verma', room: 'Lab-3', type: 'Lab' }
  ],
  Tuesday: [
    { period: 1, time: '09:00 - 10:00', code: 'CS303', subject: 'Operating Systems', faculty: 'Dr. Meenakshi S.', room: 'Room 204', type: 'Lecture' },
    { period: 2, time: '10:00 - 11:00', code: 'CS301', subject: 'Data Structures', faculty: 'Dr. Rajesh Verma', room: 'Room 204', type: 'Lecture' },
    { period: 3, time: '11:15 - 12:15', code: 'CS305', subject: 'Software Engg', faculty: 'Prof. K. Sen', room: 'Room 204', type: 'Lecture' },
    { period: 4, time: '01:15 - 03:15', code: 'CS307', subject: 'DBMS Lab (Batch A2)', faculty: 'Prof. Anita Sharma', room: 'Lab-2', type: 'Lab' }
  ],
  Wednesday: [
    { period: 1, time: '09:00 - 10:00', code: 'CS302', subject: 'DBMS', faculty: 'Prof. Anita Sharma', room: 'Room 204', type: 'Lecture' },
    { period: 2, time: '10:30 - 11:30', code: 'CS301', subject: 'Data Structures', faculty: 'Dr. Rajesh Verma', room: 'Room 204', type: 'Lecture', isLive: true },
    { period: 3, time: '11:45 - 12:45', code: 'CS304', subject: 'Computer Networks', faculty: 'Prof. Amit K.', room: 'Room 204', type: 'Lecture' },
    { period: 4, time: '02:00 - 04:00', code: 'CS308', subject: 'Network Simulation Lab', faculty: 'Prof. Amit K.', room: 'Lab-1', type: 'Lab' }
  ],
  Thursday: [
    { period: 1, time: '09:00 - 10:00', code: 'CS305', subject: 'Software Engg', faculty: 'Prof. K. Sen', room: 'Room 204', type: 'Lecture' },
    { period: 2, time: '10:00 - 11:00', code: 'CS303', subject: 'Operating Systems', faculty: 'Dr. Meenakshi S.', room: 'Room 204', type: 'Lecture' },
    { period: 3, time: '11:15 - 12:15', code: 'CS301', subject: 'Data Structures', faculty: 'Dr. Rajesh Verma', room: 'Room 204', type: 'Lecture' },
    { period: 4, time: '01:15 - 02:15', code: 'CS302', subject: 'DBMS', faculty: 'Prof. Anita Sharma', room: 'Room 204', type: 'Lecture' }
  ],
  Friday: [
    { period: 1, time: '09:00 - 10:00', code: 'CS304', subject: 'Computer Networks', faculty: 'Prof. Amit K.', room: 'Room 204', type: 'Lecture' },
    { period: 2, time: '10:00 - 11:00', code: 'CS305', subject: 'Software Engg', faculty: 'Prof. K. Sen', room: 'Room 204', type: 'Lecture' },
    { period: 3, time: '11:15 - 12:15', code: 'CS309', subject: 'Open Elective / Seminar', faculty: 'Guest Faculty', room: 'Seminar Hall B', type: 'Seminar' }
  ]
};

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    recipient: 'student',
    title: 'Mid-term Schedule Announced',
    message: 'OIST CSE 6th Semester Mid-term examinations commence from 15 October 2025.',
    time: '2 hours ago',
    read: false,
    type: 'notice'
  },
  {
    id: 'notif-2',
    recipient: 'hod',
    title: '4 Pending Clearance Requests',
    message: 'Attendance consideration and leave applications await your HOD digital sign-off.',
    time: '3 hours ago',
    read: false,
    type: 'approval'
  },
  {
    id: 'notif-3',
    recipient: 'teacher',
    title: 'Period 2 Ready for Attendance',
    message: 'Data Structures & Algorithms (CSE-3A) roll call is active for Period 2.',
    time: '15 mins ago',
    read: false,
    type: 'attendance'
  }
];

export const INITIAL_CLASSES = [
  {
    id: 'cls-1',
    name: 'CSE 3rd Year',
    semester: '6th Semester',
    batch: '2021-2025',
    department: 'Computer Science & Engineering',
    sections: ['CSE-3A', 'CSE-3B'],
    studentsCount: 120,
    coordinator: 'Dr. Rajesh Verma'
  },
  {
    id: 'cls-2',
    name: 'CSE 2nd Year',
    semester: '4th Semester',
    batch: '2022-2026',
    department: 'Computer Science & Engineering',
    sections: ['CSE-2A', 'CSE-2B'],
    studentsCount: 125,
    coordinator: 'Dr. Meenakshi S.'
  }
];

export const INITIAL_SECTIONS = [
  {
    id: 'sec-1',
    name: 'CSE-3A',
    classId: 'cls-1',
    className: 'CSE 3rd Year',
    semester: '6th Semester',
    tgName: 'Prof. K. Sen',
    room: 'Room 204',
    studentsCount: 60,
    subjects: ['Data Structures', 'DBMS', 'Operating Systems', 'Computer Networks', 'Software Engineering']
  },
  {
    id: 'sec-2',
    name: 'CSE-3B',
    classId: 'cls-1',
    className: 'CSE 3rd Year',
    semester: '6th Semester',
    tgName: 'Prof. Amit K.',
    room: 'Room 205',
    studentsCount: 60,
    subjects: ['Data Structures', 'DBMS', 'Operating Systems', 'Computer Networks', 'Software Engineering']
  },
  {
    id: 'sec-3',
    name: 'CSE-2A',
    classId: 'cls-2',
    className: 'CSE 2nd Year',
    semester: '4th Semester',
    tgName: 'Dr. Meenakshi S.',
    room: 'Room 301',
    studentsCount: 62,
    subjects: ['Discrete Maths', 'OOP with Java', 'Digital Electronics']
  },
  {
    id: 'sec-4',
    name: 'CSE-2B',
    classId: 'cls-2',
    className: 'CSE 2nd Year',
    semester: '4th Semester',
    tgName: 'Prof. Anita Sharma',
    room: 'Room 302',
    studentsCount: 63,
    subjects: ['Discrete Maths', 'OOP with Java', 'Digital Electronics']
  }
];

export const INITIAL_ASSIGNMENTS = [
  {
    id: 'asg-1',
    title: 'Balanced Binary Search Trees & AVL Rotations',
    subject: 'Data Structures & Algorithms',
    subjectCode: 'CS301',
    faculty: 'Dr. Rajesh Verma',
    section: 'CSE-3A',
    className: 'CSE 3rd Year',
    dueDate: '2025-10-05',
    dueDaysLeft: '3 days left',
    totalMarks: 20,
    description: 'Implement AVL tree node insertion and LL, RR, LR, RL balancing rotations in C++/Java. Include benchmark test cases.',
    attachmentName: 'AVL_Rotations_Spec.pdf',
    status: 'active',
    submissionsCount: 38
  },
  {
    id: 'asg-2',
    title: 'Relational Database Schema Normalization (3NF & BCNF)',
    subject: 'Database Management Systems',
    subjectCode: 'CS302',
    faculty: 'Prof. Anita Sharma',
    section: 'CSE-3A',
    className: 'CSE 3rd Year',
    dueDate: '2025-10-08',
    dueDaysLeft: '6 days left',
    totalMarks: 25,
    description: 'Decompose given hospital database schema into BCNF. Provide dependency preservation proof and minimal cover analysis.',
    attachmentName: 'DBMS_Normalization_ProblemSet.pdf',
    status: 'active',
    submissionsCount: 41
  },
  {
    id: 'asg-3',
    title: 'Producer-Consumer Synchronization with POSIX Semaphores',
    subject: 'Operating Systems',
    subjectCode: 'CS303',
    faculty: 'Dr. Meenakshi S.',
    section: 'CSE-3A',
    className: 'CSE 3rd Year',
    dueDate: '2025-10-12',
    dueDaysLeft: '10 days left',
    totalMarks: 20,
    description: 'Solve the classic producer-consumer race condition using mutex locks and counting semaphores in multi-threaded C.',
    attachmentName: 'OS_IPC_LabSpec.pdf',
    status: 'active',
    submissionsCount: 35
  }
];

export const INITIAL_SUBMISSIONS = [
  {
    id: 'subm-1',
    assignmentId: 'asg-2',
    assignmentTitle: 'Relational Database Schema Normalization (3NF & BCNF)',
    studentId: 'usr-student-01',
    studentName: 'Rahul Sharma',
    rollNo: '21CSE084',
    section: 'CSE-3A',
    submittedAt: 'Yesterday, 04:30 PM',
    fileName: 'Rahul_Sharma_DBMS_Assignment2.pdf',
    fileSize: '1.4 MB',
    status: 'graded',
    marks: 23,
    totalMarks: 25,
    feedback: 'Excellent functional dependency decomposition and clear minimal cover calculation. Well presented.'
  }
];

export const INITIAL_NOTICES = [
  {
    id: 'not-1',
    title: 'Internal Mid-Term Examination Schedule – 6th Semester',
    content: 'OIST CSE 6th Semester Mid-Term theory & practical examinations will commence from 15 October 2025. Hall ticket clearance requires minimum 75% attendance.',
    authorRole: 'HOD Office',
    authorName: 'Dr. S. Roy',
    targetType: 'Department',
    targetValue: 'All Students & Faculty',
    date: 'Today, 09:30 AM',
    priority: 'urgent',
    pinned: true
  },
  {
    id: 'not-2',
    title: 'Section CSE-3A: Extra DSA Tutorial on Graph Algorithms',
    content: 'Special tutorial and practical session on BFS/DFS topological sorting and Dijkstra algorithm scheduled this Saturday at 10:00 AM in Room 204.',
    authorRole: 'Faculty',
    authorName: 'Dr. Rajesh Verma',
    targetType: 'Section',
    targetValue: 'CSE-3A',
    date: 'Yesterday, 03:45 PM',
    priority: 'normal',
    pinned: false
  },
  {
    id: 'not-3',
    title: 'Smart India Hackathon 2025: Team Mentorship Review',
    content: 'All shortlisted hackathon project teams must attend the internal evaluation review with their respective TG mentors this Thursday in the Innovation Lab.',
    authorRole: 'TG / Mentor',
    authorName: 'Prof. K. Sen',
    targetType: 'Class',
    targetValue: 'CSE 3rd Year',
    date: '2 days ago',
    priority: 'normal',
    pinned: false
  },
  {
    id: 'not-4',
    title: 'Library Book Return & Digital Repository Access Renewal',
    content: 'Central library book renewal and IEEE Xplore digital research repository tokens have been dispatched to all institutional student emails.',
    authorRole: 'Administration',
    authorName: 'Central Admin',
    targetType: 'Department',
    targetValue: 'All Students',
    date: '3 days ago',
    priority: 'info',
    pinned: false
  }
];

export const INITIAL_TESTS = [
  {
    id: 'tst-1',
    title: 'DSA Unit 2 Assessment: Stacks, Queues & Heaps',
    subject: 'Data Structures & Algorithms',
    subjectCode: 'CS301',
    section: 'CSE-3A',
    duration: '30 mins',
    totalQuestions: 15,
    totalMarks: 30,
    status: 'Completed',
    averageScore: 24.5,
    submissionCount: 42,
    date: '20 Sept 2025'
  },
  {
    id: 'tst-2',
    title: 'DBMS SQL & Relational Algebra Online Quiz',
    subject: 'Database Management Systems',
    subjectCode: 'CS302',
    section: 'CSE-3A',
    duration: '45 mins',
    totalQuestions: 20,
    totalMarks: 40,
    status: 'Upcoming',
    averageScore: null,
    submissionCount: 0,
    date: '06 Oct 2025'
  }
];

export const INITIAL_FEEDBACK = [
  {
    id: 'fb-01',
    studentRoll: '21CSE084',
    studentName: 'Rahul Sharma',
    teacherName: 'Dr. Rajesh Verma',
    category: 'Academic',
    feedback: 'Active participant in Data Structures lectures. Outstanding problem-solving in dynamic programming practicals.',
    date: '22 Sept 2025'
  },
  {
    id: 'fb-02',
    studentRoll: '21CSE084',
    studentName: 'Rahul Sharma',
    teacherName: 'Prof. K. Sen (TG)',
    category: 'Attendance & Conduct',
    feedback: 'Regular in classes. Attendance temporarily dipped during Hackathon representation; advised to maintain safety margin post duty credit.',
    date: '16 Sept 2025'
  }
];


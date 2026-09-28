require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const AttendanceRequest = require('../models/AttendanceRequest');
const AttendanceQuery = require('../models/AttendanceQuery');
const Notification = require('../models/Notification');
const Assignment = require('../models/Assignment');
const Notice = require('../models/Notice');
const AcademicStructure = require('../models/AcademicStructure');

const seedData = async () => {
  console.log('[Seed] Starting database seeding...');
  
  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Student.deleteMany({}),
    Teacher.deleteMany({}),
    Subject.deleteMany({}),
    Timetable.deleteMany({}),
    Attendance.deleteMany({}),
    LeaveRequest.deleteMany({}),
    AttendanceRequest.deleteMany({}),
    AttendanceQuery.deleteMany({}),
    Notification.deleteMany({}),
    Assignment.deleteMany({}),
    Notice.deleteMany({}),
    AcademicStructure.deleteMany({})
  ]);

  const hashedPassword = 'password123';

  // 1. Create Core Users
  console.log('[Seed] Creating core users...');
  
  // Student: Rahul Sharma
  const studentUser = await User.create({
    name: 'Rahul Sharma',
    email: '21cse084@oist.ac.in',
    collegeId: '21cse084@oist.ac.in',
    password: hashedPassword,
    role: 'student'
  });
  // Also create alias for student1@campusflow.com
  await User.create({
    name: 'Rahul Sharma (Alias)',
    email: 'student1@campusflow.com',
    collegeId: 'student1@campusflow.com',
    password: hashedPassword,
    role: 'student'
  });

  // Teacher: Dr. Rajesh Verma
  const teacherUser = await User.create({
    name: 'Dr. Rajesh Verma',
    email: 'r.verma@oist.ac.in',
    collegeId: 'r.verma@oist.ac.in',
    password: hashedPassword,
    role: 'teacher'
  });
  await User.create({
    name: 'Dr. Rajesh Verma (Alias)',
    email: 'teacher1@campusflow.com',
    collegeId: 'teacher1@campusflow.com',
    password: hashedPassword,
    role: 'teacher'
  });

  // TG: Prof. K. Sen
  const tgUser = await User.create({
    name: 'Prof. K. Sen',
    email: 'k.sen@oist.ac.in',
    collegeId: 'k.sen@oist.ac.in',
    password: hashedPassword,
    role: 'tg'
  });
  await User.create({
    name: 'Prof. K. Sen (TG Alias)',
    email: 'tg@campusflow.com',
    collegeId: 'tg@campusflow.com',
    password: hashedPassword,
    role: 'tg'
  });

  // HOD: Dr. S. Roy
  const hodUser = await User.create({
    name: 'Dr. S. Roy',
    email: 's.roy@oist.ac.in',
    collegeId: 's.roy@oist.ac.in',
    password: hashedPassword,
    role: 'hod'
  });
  await User.create({
    name: 'Dr. S. Roy (HOD Alias)',
    email: 'hod.cse@campusflow.com',
    collegeId: 'hod.cse@campusflow.com',
    password: hashedPassword,
    role: 'hod'
  });

  // Admin: OIST Central Admin
  const adminUser = await User.create({
    name: 'OIST Central Administration',
    email: 'admin.support@oist.ac.in',
    collegeId: 'admin.support@oist.ac.in',
    password: hashedPassword,
    role: 'admin'
  });
  await User.create({
    name: 'CampusFlow Admin (Alias)',
    email: 'admin@campusflow.com',
    collegeId: 'admin@campusflow.com',
    password: hashedPassword,
    role: 'admin'
  });

  // 2. Create 10 Teachers
  console.log('[Seed] Creating 10 CSE faculty members...');
  const facultyList = [
    { facultyId: 'FAC-102', name: 'Dr. Rajesh Verma', email: 'r.verma@oist.ac.in', designation: 'Associate Professor', specialization: 'Data Structures, Graph Theory', sections: ['CSE-3A', 'CSE-3B'], user: teacherUser._id, hours: 14, room: 'Room 204' },
    { facultyId: 'FAC-104', name: 'Prof. Anita Sharma', email: 'a.sharma@oist.ac.in', designation: 'Assistant Professor', specialization: 'Database Systems, Distributed SQL', sections: ['CSE-3A', 'CSE-5A'], hours: 16, room: 'Room 205' },
    { facultyId: 'FAC-108', name: 'Dr. Meenakshi S.', email: 'm.sundaram@oist.ac.in', designation: 'Associate Professor', specialization: 'Operating Systems, Kernel Architectures', sections: ['CSE-3A', 'CSE-7B'], hours: 15, room: 'Room 204' },
    { facultyId: 'FAC-112', name: 'Prof. Amit K.', email: 'a.kumar@oist.ac.in', designation: 'Assistant Professor', specialization: 'Computer Networks, SDN & Wireless Protocols', sections: ['CSE-3A', 'CSE-3B'], hours: 14, room: 'Room 204' },
    { facultyId: 'FAC-088', name: 'Prof. K. Sen', email: 'k.sen@oist.ac.in', designation: 'Assistant Professor & TG', specialization: 'Software Engineering, Agile Dev, CI/CD', sections: ['CSE-3A'], isTG: true, tgAssignedSection: 'CSE-3A', user: tgUser._id, hours: 12, room: 'Room 204' },
    { facultyId: 'FAC-115', name: 'Dr. V. Dubey', email: 'v.dubey@oist.ac.in', designation: 'Professor', specialization: 'Discrete Mathematics & Graph Theory', sections: ['CSE-2A', 'CSE-2B'], hours: 14, room: 'Room 301' },
    { facultyId: 'FAC-120', name: 'Prof. S. Das', email: 's.das@oist.ac.in', designation: 'Assistant Professor', specialization: 'Digital Logic & Microprocessors', sections: ['CSE-2A', 'CSE-2B'], hours: 14, room: 'Room 302' },
    { facultyId: 'FAC-125', name: 'Dr. H. Pathak', email: 'h.pathak@oist.ac.in', designation: 'Associate Professor', specialization: 'Physics for Computing', sections: ['CSE-1A', 'CSE-1B'], hours: 12, room: 'Room 101' },
    { facultyId: 'FAC-130', name: 'Prof. R. Saxena', email: 'r.saxena@oist.ac.in', designation: 'Assistant Professor', specialization: 'Basic Computer Engineering & C', sections: ['CSE-1A'], hours: 14, room: 'Room 102' },
    { facultyId: 'HOD-001', name: 'Dr. S. Roy', email: 's.roy@oist.ac.in', designation: 'Head of Department (CSE)', specialization: 'Distributed Systems & Cloud Computing', sections: ['CSE-4A', 'CSE-4B'], user: hodUser._id, hours: 8, room: 'HOD Office' }
  ];

  const createdTeachers = [];
  for (const f of facultyList) {
    let uId = f.user;
    if (!uId) {
      const u = await User.create({
        name: f.name,
        email: f.email,
        collegeId: f.email,
        password: hashedPassword,
        role: f.isTG ? 'tg' : 'teacher'
      });
      uId = u._id;
    }
    const t = await Teacher.create({
      user: uId,
      facultyId: f.facultyId,
      name: f.name,
      email: f.email,
      designation: f.designation,
      specialization: f.specialization,
      assignedSections: f.sections,
      weeklyHours: f.hours,
      isTG: !!f.isTG,
      tgAssignedSection: f.tgAssignedSection || null,
      currentRoom: f.room,
      assignedSubjects: [
        { code: 'CS301', name: 'Data Structures & Algorithms', sections: ['CSE-3A', 'CSE-3B'], hoursPerWeek: 4 }
      ]
    });
    createdTeachers.push(t);
  }

  // 3. Create 120+ Students across CSE sections
  console.log('[Seed] Creating 120+ enrolled CSE students across years and sections...');
  const firstNames = ['Rahul', 'Bhavna', 'Chirag', 'Divya', 'Faizan', 'Gaurav', 'Avinash', 'Ishita', 'Jatin', 'Kavita', 'Manish', 'Neha', 'Omkar', 'Pooja', 'Rohan', 'Sneha', 'Tushar', 'Varun', 'Yash', 'Zoya'];
  const lastNames = ['Sharma', 'Patel', 'Reddy', 'Nair', 'Ahmed', 'Kulkarni', 'Verma', 'Roy', 'Mehta', 'Sen', 'Dubey', 'Gupta', 'Singh', 'Chopra', 'Malhotra', 'Joshi', 'Bhatia', 'Saxena', 'Kapoor', 'Das'];

  const studentDocs = [];
  let rollCounter = 1;

  // Primary student (matches frontend)
  const primaryStudent = await Student.create({
    user: studentUser._id,
    rollNo: '21CSE084',
    name: 'Rahul Sharma',
    email: '21cse084@oist.ac.in',
    year: 3,
    semester: 6,
    semesterLabel: '6th',
    section: 'CSE-3A',
    batch: '2021-2025',
    cgpa: 8.42,
    attendance: 72, // starts at 72%
    requiredThreshold: 75,
    tgName: 'Prof. K. Sen',
    tgEmail: 'k.sen@oist.ac.in',
    status: 'present'
  });

  // Generate 125 additional students
  for (let y = 1; y <= 4; y++) {
    const sem = y * 2;
    const sections = ['A', 'B'];

    for (const sec of sections) {
      const sectionFullName = `CSE-${y}${sec}`;
      const countPerSec = 16; // 4 * 2 * 16 = 128 students

      for (let i = 0; i < countPerSec; i++) {
        const rollFormatted = `2${5 - y}CSE${String(rollCounter++).padStart(3, '0')}`;
        const name = `${firstNames[(rollCounter + i) % firstNames.length]} ${lastNames[(rollCounter * 2 + i) % lastNames.length]}`;
        const email = `${rollFormatted.toLowerCase()}@oist.ac.in`;

        // Create standard user account
        const user = await User.create({
          name,
          email,
          collegeId: email,
          password: hashedPassword,
          role: 'student'
        });

        // Attendance between 68% and 94%
        const attendance = 68 + ((rollCounter * 7) % 27);
        const cgpa = 7.0 + Number(((rollCounter % 30) * 0.08).toFixed(2));

        studentDocs.push({
          user: user._id,
          rollNo: rollFormatted,
          name,
          email,
          year: y,
          semester: sem,
          semesterLabel: `${sem}th`,
          section: sectionFullName,
          batch: `202${5 - y}-202${9 - y}`,
          cgpa: Math.min(9.8, cgpa),
          attendance,
          status: attendance >= 75 ? 'present' : 'absent'
        });
      }
    }
  }

  await Student.insertMany(studentDocs);
  console.log(`[Seed] Created 1 + ${studentDocs.length} students.`);

  // 4. Create Subjects
  console.log('[Seed] Seeding CSE curriculum subjects...');
  const subjectsData = [
    { code: 'CS301', name: 'Data Structures & Algorithms', facultyName: 'Dr. Rajesh Verma', totalHeld: 25, attended: 18, semester: 6, year: 3, sections: ['CSE-3A', 'CSE-3B'], credits: 4, hours: 4 },
    { code: 'CS302', name: 'Database Management Systems', facultyName: 'Prof. Anita Sharma', totalHeld: 24, attended: 17, semester: 6, year: 3, sections: ['CSE-3A', 'CSE-3B'], credits: 4, hours: 4 },
    { code: 'CS303', name: 'Operating Systems Architecture', facultyName: 'Dr. Meenakshi S.', totalHeld: 22, attended: 16, semester: 6, year: 3, sections: ['CSE-3A', 'CSE-3B'], credits: 4, hours: 4 },
    { code: 'CS304', name: 'Computer Networks & Protocols', facultyName: 'Prof. Amit K.', totalHeld: 20, attended: 14, semester: 6, year: 3, sections: ['CSE-3A', 'CSE-3B'], credits: 4, hours: 4 },
    { code: 'CS305', name: 'Software Engineering Principles', facultyName: 'Prof. K. Sen', totalHeld: 18, attended: 13, semester: 6, year: 3, sections: ['CSE-3A', 'CSE-3B'], credits: 3, hours: 3 }
  ];
  await Subject.insertMany(subjectsData);

  // 5. Create Master Timetable for CSE-3A
  console.log('[Seed] Seeding master timetable slots for CSE-3A...');
  const timetableSlots = [
    // Monday
    { day: 'Monday', period: 1, time: '09:00 - 10:00', code: 'CS301', subject: 'Data Structures', faculty: 'Dr. Rajesh Verma', room: 'Room 204', section: 'CSE-3A', semester: 6 },
    { day: 'Monday', period: 2, time: '10:00 - 11:00', code: 'CS302', subject: 'DBMS', faculty: 'Prof. Anita Sharma', room: 'Room 204', section: 'CSE-3A', semester: 6 },
    { day: 'Monday', period: 3, time: '11:15 - 12:15', code: 'CS303', subject: 'Operating Systems', faculty: 'Dr. Meenakshi S.', room: 'Room 204', section: 'CSE-3A', semester: 6 },
    { day: 'Monday', period: 4, time: '01:15 - 02:15', code: 'CS304', subject: 'Computer Networks', faculty: 'Prof. Amit K.', room: 'Room 204', section: 'CSE-3A', semester: 6 },
    { day: 'Monday', period: 5, time: '02:15 - 04:15', code: 'CS306', subject: 'DSA Lab (Batch A1)', faculty: 'Dr. Rajesh Verma', room: 'Lab-3', section: 'CSE-3A', semester: 6, type: 'Lab' },
    // Tuesday
    { day: 'Tuesday', period: 1, time: '09:00 - 10:00', code: 'CS303', subject: 'Operating Systems', faculty: 'Dr. Meenakshi S.', room: 'Room 204', section: 'CSE-3A', semester: 6 },
    { day: 'Tuesday', period: 2, time: '10:00 - 11:00', code: 'CS301', subject: 'Data Structures', faculty: 'Dr. Rajesh Verma', room: 'Room 204', section: 'CSE-3A', semester: 6 },
    { day: 'Tuesday', period: 3, time: '11:15 - 12:15', code: 'CS305', subject: 'Software Engg', faculty: 'Prof. K. Sen', room: 'Room 204', section: 'CSE-3A', semester: 6 },
    { day: 'Tuesday', period: 4, time: '01:15 - 03:15', code: 'CS307', subject: 'DBMS Lab (Batch A2)', faculty: 'Prof. Anita Sharma', room: 'Lab-2', section: 'CSE-3A', semester: 6, type: 'Lab' },
    // Wednesday
    { day: 'Wednesday', period: 1, time: '09:00 - 10:00', code: 'CS302', subject: 'DBMS', faculty: 'Prof. Anita Sharma', room: 'Room 204', section: 'CSE-3A', semester: 6 },
    { day: 'Wednesday', period: 2, time: '10:30 - 11:30', code: 'CS301', subject: 'Data Structures', faculty: 'Dr. Rajesh Verma', room: 'Room 204', section: 'CSE-3A', semester: 6, isLive: true },
    { day: 'Wednesday', period: 3, time: '11:45 - 12:45', code: 'CS304', subject: 'Computer Networks', faculty: 'Prof. Amit K.', room: 'Room 204', section: 'CSE-3A', semester: 6 },
    { day: 'Wednesday', period: 4, time: '02:00 - 04:00', code: 'CS308', subject: 'Network Simulation Lab', faculty: 'Prof. Amit K.', room: 'Lab-1', section: 'CSE-3A', semester: 6, type: 'Lab' },
    // Thursday
    { day: 'Thursday', period: 1, time: '09:00 - 10:00', code: 'CS305', subject: 'Software Engg', faculty: 'Prof. K. Sen', room: 'Room 204', section: 'CSE-3A', semester: 6 },
    { day: 'Thursday', period: 2, time: '10:00 - 11:00', code: 'CS303', subject: 'Operating Systems', faculty: 'Dr. Meenakshi S.', room: 'Room 204', section: 'CSE-3A', semester: 6 },
    { day: 'Thursday', period: 3, time: '11:15 - 12:15', code: 'CS301', subject: 'Data Structures', faculty: 'Dr. Rajesh Verma', room: 'Room 204', section: 'CSE-3A', semester: 6 },
    { day: 'Thursday', period: 4, time: '01:15 - 02:15', code: 'CS302', subject: 'DBMS', faculty: 'Prof. Anita Sharma', room: 'Room 204', section: 'CSE-3A', semester: 6 },
    // Friday
    { day: 'Friday', period: 1, time: '09:00 - 10:00', code: 'CS304', subject: 'Computer Networks', faculty: 'Prof. Amit K.', room: 'Room 204', section: 'CSE-3A', semester: 6 },
    { day: 'Friday', period: 2, time: '10:00 - 11:00', code: 'CS305', subject: 'Software Engg', faculty: 'Prof. K. Sen', room: 'Room 204', section: 'CSE-3A', semester: 6 },
    { day: 'Friday', period: 3, time: '11:15 - 12:15', code: 'CS309', subject: 'Open Elective / Seminar', faculty: 'Guest Faculty', room: 'Seminar Hall B', section: 'CSE-3A', semester: 6, type: 'Seminar' }
  ];
  await Timetable.insertMany(timetableSlots);

  // 6. Create Initial Attendance Requests
  console.log('[Seed] Seeding attendance consideration request...');
  await AttendanceRequest.create({
    requestId: 'REQ-ATT-101',
    student: primaryStudent._id,
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
    status: 'pending_tg',
    tgRecommendation: 'Recommended: Student has official OD clearance signed by Sports/Academic Coordinator.',
    timeline: [
      { step: 'Submitted by Student', actor: 'Rahul Sharma', time: '16 Sept, 09:30 AM', completed: true },
      { step: 'TG / Mentor Review', actor: 'Prof. K. Sen', time: 'Pending Review', completed: false, active: true },
      { step: 'HOD Approval & Clearance', actor: 'Dr. S. Roy', time: 'In Queue', completed: false },
      { step: 'Attendance Agent Execution', actor: 'Autonomous Agent', time: 'Pending', completed: false }
    ]
  });

  // 7. Create Initial Attendance Query
  await AttendanceQuery.create({
    queryId: 'QRY-ATT-201',
    student: primaryStudent._id,
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
    status: 'pending_tg'
  });

  // 8. Create Leave Requests
  console.log('[Seed] Seeding leave requests...');
  await LeaveRequest.create({
    requestId: 'REQ-LV-301',
    student: primaryStudent._id,
    studentName: 'Rahul Sharma',
    rollNo: '21CSE084',
    section: 'CSE-3A',
    leaveType: 'Medical',
    title: 'Medical Leave (Viral Fever)',
    startDate: '2025-09-24',
    endDate: '2025-09-26',
    dateRangeLabel: '24 Sept – 26 Sept 2025 (3 Days)',
    reason: 'Diagnosed with viral fever. Advised bed rest by university health center medical officer.',
    supportingDoc: 'Medical_Certificate_OIST_Clinic.pdf',
    status: 'pending_tg',
    tgUnavailable: false,
    timeline: [
      { step: 'Leave Submitted', actor: 'Rahul Sharma', time: '24 Sept, 08:30 AM', completed: true },
      { step: 'TG Review', actor: 'Prof. K. Sen', time: 'In Queue', completed: false, active: true },
      { step: 'HOD Approval', actor: 'Dr. S. Roy', time: 'Awaiting TG', completed: false }
    ]
  });

  // 9. Create Notifications
  console.log('[Seed] Seeding notifications...');
  await Notification.insertMany([
    { recipient: 'student', title: 'Mid-term Schedule Announced', message: 'OIST CSE 6th Semester Mid-term examinations commence from 15 October 2025.', type: 'notice' },
    { recipient: 'hod', title: '4 Pending Clearance Requests', message: 'Attendance consideration and leave applications await your HOD digital sign-off.', type: 'approval' },
    { recipient: 'teacher', title: 'Period 2 Ready for Attendance', message: 'Data Structures & Algorithms (CSE-3A) roll call is active for Period 2.', type: 'attendance' }
  ]);

  // 10. Create Assignments & Notices
  console.log('[Seed] Seeding assignments and notices...');
  await Assignment.create({
    title: 'Balanced Binary Search Trees & AVL Rotations',
    subject: 'Data Structures & Algorithms',
    subjectCode: 'CS301',
    faculty: 'Dr. Rajesh Verma',
    section: 'CSE-3A',
    className: 'CSE 3rd Year',
    dueDate: '2025-10-05',
    totalMarks: 20,
    description: 'Implement AVL tree node insertion and LL, RR, LR, RL balancing rotations in C++/Java. Include benchmark test cases.',
    submissionsCount: 38
  });

  await Notice.create({
    title: 'CSE Department: Mid-Term Examination Schedule Announced',
    content: 'All 2nd, 3rd, and 4th Year CSE students are advised that Mid-Term 1 examinations commence from 15th October 2025 in designated seminar blocks.',
    authorRole: 'HOD Office',
    authorName: 'Dr. S. Roy',
    targetType: 'Department',
    targetValue: 'CSE All',
    priority: 'urgent',
    pinned: true
  });

  console.log('\n======================================================');
  console.log(' CAMPUSFLOW CSE DATABASE SEEDED SUCCESSFULLY! ');
  console.log('======================================================');
  console.log('Demo Credentials (All passwords: password123):');
  console.log('• Admin:   admin@campusflow.com   / admin.support@oist.ac.in');
  console.log('• HOD:     hod.cse@campusflow.com / s.roy@oist.ac.in');
  console.log('• TG:      tg@campusflow.com      / k.sen@oist.ac.in');
  console.log('• Teacher: teacher1@campusflow.com/ r.verma@oist.ac.in');
  console.log('• Student: student1@campusflow.com/ 21cse084@oist.ac.in');
  console.log('======================================================\n');
};

if (require.main === module) {
  const { connectDB, disconnectDB } = require('../config/db');
  connectDB()
    .then(async () => {
      await seedData();
      await disconnectDB();
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed] Error seeding database:', err);
      process.exit(1);
    });
}

module.exports = seedData;

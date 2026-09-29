const bcrypt = require('bcryptjs');
const {
  User,
  Student,
  Faculty,
  Subject,
  Classroom,
  Section,
  TimetableMaster,
  Timetable,
  TeacherAbsence,
  TeacherSubstitution,
  SchedulingConstraint,
  Assignment,
  AssignmentSubmission,
  Attendance,
  Note,
  Department,
  Notice,
  Notification,
  StudentRequest
} = require('../models/mysql');
const { UserMemory, AiPreference, Conversation } = require('../models/mongo/aiMemoryModels');
const { logger } = require('../services/loggerService');

const seedCseDatabase = async () => {
  logger.info('[Seed] Seeding CSE Department normalized data into MySQL and MongoDB...');

  try {
    // 1. Clear existing relational tables
    await StudentRequest.destroy({ where: {}, truncate: false }).catch(() => {});
    await Notification.destroy({ where: {}, truncate: false }).catch(() => {});
    await Notice.destroy({ where: {}, truncate: false }).catch(() => {});
    await TeacherSubstitution.destroy({ where: {}, truncate: false }).catch(() => {});
    await TeacherAbsence.destroy({ where: {}, truncate: false }).catch(() => {});
    await AssignmentSubmission.destroy({ where: {}, truncate: false }).catch(() => {});
    await Attendance.destroy({ where: {}, truncate: false }).catch(() => {});
    await Assignment.destroy({ where: {}, truncate: false }).catch(() => {});
    await Note.destroy({ where: {}, truncate: false }).catch(() => {});
    await Timetable.destroy({ where: {}, truncate: false }).catch(() => {});
    await TimetableMaster.destroy({ where: {}, truncate: false }).catch(() => {});
    await SchedulingConstraint.destroy({ where: {}, truncate: false }).catch(() => {});
    await Classroom.destroy({ where: {}, truncate: false }).catch(() => {});
    await Subject.destroy({ where: {}, truncate: false }).catch(() => {});
    await Section.destroy({ where: {}, truncate: false }).catch(() => {});
    await Student.destroy({ where: {}, truncate: false }).catch(() => {});
    await Faculty.destroy({ where: {}, truncate: false }).catch(() => {});
    await Department.destroy({ where: {}, truncate: false }).catch(() => {});
    await User.destroy({ where: {}, truncate: false }).catch(() => {});

    const defaultPassword = await bcrypt.hash('password123', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);

    // 2. Seed Department
    const dept = await Department.create({
      code: 'CSE',
      name: 'Computer Science & Engineering',
      hod_name: 'Dr. Alok Verma'
    });

    // 3. Seed Classrooms & Labs
    const classroomsData = [
      { department_code: 'CSE', room_number: '204', name: 'CSE Room 204', room_type: 'Classroom', capacity: 60, is_available: true },
      { department_code: 'CSE', room_number: '205', name: 'CSE Room 205', room_type: 'Classroom', capacity: 60, is_available: true },
      { department_code: 'CSE', room_number: '302', name: 'CSE Room 302', room_type: 'Classroom', capacity: 65, is_available: true },
      { department_code: 'CSE', room_number: 'LAB-2', name: 'CSE Software Lab 2', room_type: 'Lab', capacity: 60, is_available: true },
      { department_code: 'CSE', room_number: 'LAB-1', name: 'CSE Hardware Lab 1', room_type: 'Lab', capacity: 50, is_available: true }
    ];
    for (const c of classroomsData) {
      await Classroom.create(c);
    }

    // 4. Seed Admin User
    await User.create({
      email: 'admin@college.edu',
      password: adminPassword,
      name: 'CSE Department Administrator',
      role: 'admin',
      status: 'active'
    });

    // 5. Seed Faculty Members & Users
    const facultyData = [
      {
        name: 'Dr. Alok Verma',
        email: 'hod.cse@college.edu',
        designation: 'Professor & Head (HOD)',
        specialization: 'Artificial Intelligence & Machine Learning',
        phone: '+91 98260 11223',
        department_code: 'CSE',
        max_periods_per_day: 3,
        max_periods_per_week: 14,
        preferred_slots: JSON.stringify(['09:30 AM', '10:30 AM'])
      },
      {
        name: 'Dr. Sunita Sharma',
        email: 'sunita.sharma@college.edu',
        designation: 'Associate Professor',
        specialization: 'Database Systems & Big Data',
        phone: '+91 98260 44556',
        department_code: 'CSE',
        max_periods_per_day: 4,
        max_periods_per_week: 16,
        preferred_slots: JSON.stringify(['09:30 AM', '11:45 AM', '01:30 PM'])
      },
      {
        name: 'Prof. Rahul Mehta',
        email: 'rahul.mehta@college.edu',
        designation: 'Assistant Professor (TG)',
        specialization: 'Operating Systems & Distributed Architecture',
        phone: '+91 98260 77889',
        department_code: 'CSE',
        max_periods_per_day: 4,
        max_periods_per_week: 16,
        preferred_slots: JSON.stringify(['10:30 AM', '09:30 AM'])
      },
      {
        name: 'Prof. Priya Singh',
        email: 'priya.singh@college.edu',
        designation: 'Assistant Professor',
        specialization: 'Computer Networks & Cybersecurity',
        phone: '+91 98260 99001',
        department_code: 'CSE',
        max_periods_per_day: 4,
        max_periods_per_week: 16,
        preferred_slots: JSON.stringify(['10:30 AM', '11:45 AM'])
      }
    ];

    const createdFaculty = [];
    for (const f of facultyData) {
      const u = await User.create({
        email: f.email,
        password: defaultPassword,
        name: f.name,
        role: f.email.includes('hod') ? 'hod' : 'faculty',
        status: 'active'
      });
      const fac = await Faculty.create({
        userId: u.id,
        name: f.name,
        email: f.email,
        designation: f.designation,
        specialization: f.specialization,
        phone: f.phone,
        department_code: f.department_code,
        max_periods_per_day: f.max_periods_per_day,
        max_periods_per_week: f.max_periods_per_week,
        preferred_slots: f.preferred_slots
      });
      createdFaculty.push(fac);
    }

    // Update Department HOD ID
    await dept.update({ hod_id: createdFaculty[0].id });

    // 6. Seed Sections
    const sectionSeeds = [
      { year: '1st Year', semester: 1, section_name: 'A' },
      { year: '1st Year', semester: 1, section_name: 'B' },
      { year: '1st Year', semester: 2, section_name: 'A' },
      { year: '1st Year', semester: 2, section_name: 'B' },
      { year: '2nd Year', semester: 3, section_name: 'A' },
      { year: '2nd Year', semester: 3, section_name: 'B' },
      { year: '2nd Year', semester: 4, section_name: 'A' },
      { year: '2nd Year', semester: 4, section_name: 'B' },
      { year: '3rd Year', semester: 5, section_name: 'A' },
      { year: '3rd Year', semester: 5, section_name: 'B' },
      { year: '3rd Year', semester: 6, section_name: 'A' },
      { year: '3rd Year', semester: 6, section_name: 'B' },
      { year: '4th Year', semester: 7, section_name: 'A' },
      { year: '4th Year', semester: 7, section_name: 'B' },
      { year: '4th Year', semester: 8, section_name: 'A' },
      { year: '4th Year', semester: 8, section_name: 'B' }
    ];

    for (const s of sectionSeeds) {
      await Section.create(s);
    }

    // 7. Seed Core CSE Subjects
    const subjectsData = [
      { code: 'CS501', name: 'Database Management Systems', semester: 5, credits: 4, hours_per_week: 4, is_lab: false, required_room_type: 'Classroom' },
      { code: 'CS502', name: 'Theory of Computation', semester: 5, credits: 4, hours_per_week: 4, is_lab: false, required_room_type: 'Classroom' },
      { code: 'CS503', name: 'Computer Networks', semester: 5, credits: 4, hours_per_week: 4, is_lab: false, required_room_type: 'Classroom' },
      { code: 'CS504', name: 'Operating Systems', semester: 5, credits: 4, hours_per_week: 4, is_lab: false, required_room_type: 'Classroom' },
      { code: 'CS505', name: 'DBMS Laboratory', semester: 5, credits: 2, hours_per_week: 2, is_lab: true, required_room_type: 'Lab' },
      { code: 'CS301', name: 'Data Structures & Algorithms', semester: 3, credits: 4, hours_per_week: 4, is_lab: false, required_room_type: 'Classroom' },
      { code: 'CS701', name: 'Artificial Intelligence & Deep Learning', semester: 7, credits: 4, hours_per_week: 4, is_lab: false, required_room_type: 'Classroom' },
      { code: 'CS101', name: 'Problem Solving & Programming in C', semester: 1, credits: 4, hours_per_week: 4, is_lab: false, required_room_type: 'Classroom' }
    ];

    const createdSubjects = [];
    for (const sub of subjectsData) {
      const s = await Subject.create(sub);
      createdSubjects.push(s);
    }

    // 8. Seed Scheduling Constraints
    await SchedulingConstraint.create({
      department_code: 'CSE',
      constraint_type: 'MAX_CONSECUTIVE_HOURS',
      rule_data: JSON.stringify({ max_hours: 3 }),
      is_hard: true,
      is_active: true
    });
    await SchedulingConstraint.create({
      department_code: 'CSE',
      constraint_type: 'LAB_CONSECUTIVE_PERIODS',
      rule_data: JSON.stringify({ periods: 2, mandatory_room_type: 'Lab' }),
      is_hard: true,
      is_active: true
    });

    // 9. Seed Students & Users
    const studentsData = [
      {
        name: 'Ayush Sharma',
        email: 'ayush.student@college.edu',
        enrollment_no: '0103CS211001',
        phone: '+91 99887 11223',
        year: '3rd Year',
        semester: 5,
        section: 'A',
        batch: '2022-2026'
      },
      {
        name: 'Rohit Verma',
        email: 'rohit.sharma@college.edu',
        enrollment_no: '0103CS211002',
        phone: '+91 99887 22334',
        year: '3rd Year',
        semester: 5,
        section: 'A',
        batch: '2022-2026'
      },
      {
        name: 'Ananya Patel',
        email: 'ananya.patel@college.edu',
        enrollment_no: '0103CS211003',
        phone: '+91 99887 33445',
        year: '3rd Year',
        semester: 5,
        section: 'B',
        batch: '2022-2026'
      }
    ];

    const createdStudents = [];
    for (const st of studentsData) {
      const u = await User.create({
        email: st.email,
        password: defaultPassword,
        name: st.name,
        role: 'student',
        status: 'active'
      });
      const student = await Student.create({
        userId: u.id,
        enrollment_no: st.enrollment_no,
        name: st.name,
        email: st.email,
        phone: st.phone,
        year: st.year,
        semester: st.semester,
        section: st.section,
        batch: st.batch,
        status: 'Active'
      });
      createdStudents.push(student);
    }

    // 10. Seed Timetable Master & Version 1 for 3rd Year Sem 5 Section A
    const master = await TimetableMaster.create({
      department_code: 'CSE',
      year: '3rd Year',
      semester: 5,
      section: 'A',
      academic_year: '2026-27',
      version: 1,
      status: 'Published',
      stats: JSON.stringify({
        hard_constraints_satisfied: true,
        soft_constraints_score: 0.94,
        teacher_workload_balance: 0.91,
        room_utilization: 0.85,
        conflicts: 0
      }),
      created_by: 'Deterministic Scheduling Engine',
      approved_by: 'Dr. Alok Verma (HOD)',
      published_at: new Date()
    });

    const timetableData = [
      // Monday
      { timetable_master_id: master.id, year: '3rd Year', semester: 5, section: 'A', day: 'Monday', period: 1, start_time: '09:30 AM', end_time: '10:30 AM', subject: 'Database Management Systems', faculty: 'Dr. Sunita Sharma', room: 'CSE Room 204', type: 'Lecture' },
      { timetable_master_id: master.id, year: '3rd Year', semester: 5, section: 'A', day: 'Monday', period: 2, start_time: '10:30 AM', end_time: '11:30 AM', subject: 'Operating Systems', faculty: 'Prof. Rahul Mehta', room: 'CSE Room 204', type: 'Lecture' },
      { timetable_master_id: master.id, year: '3rd Year', semester: 5, section: 'A', day: 'Monday', period: 3, start_time: '11:45 AM', end_time: '12:45 PM', subject: 'Computer Networks', faculty: 'Prof. Priya Singh', room: 'CSE Room 204', type: 'Lecture' },
      { timetable_master_id: master.id, year: '3rd Year', semester: 5, section: 'A', day: 'Monday', period: 4, start_time: '01:30 PM', end_time: '03:30 PM', subject: 'DBMS Laboratory', faculty: 'Dr. Sunita Sharma', room: 'CSE Software Lab 2', type: 'Lab' },
      // Tuesday
      { timetable_master_id: master.id, year: '3rd Year', semester: 5, section: 'A', day: 'Tuesday', period: 1, start_time: '09:30 AM', end_time: '10:30 AM', subject: 'Theory of Computation', faculty: 'Dr. Alok Verma', room: 'CSE Room 204', type: 'Lecture' },
      { timetable_master_id: master.id, year: '3rd Year', semester: 5, section: 'A', day: 'Tuesday', period: 2, start_time: '10:30 AM', end_time: '11:30 AM', subject: 'Computer Networks', faculty: 'Prof. Priya Singh', room: 'CSE Room 204', type: 'Lecture' },
      { timetable_master_id: master.id, year: '3rd Year', semester: 5, section: 'A', day: 'Tuesday', period: 3, start_time: '11:45 AM', end_time: '12:45 PM', subject: 'Database Management Systems', faculty: 'Dr. Sunita Sharma', room: 'CSE Room 204', type: 'Lecture' },
      // Wednesday
      { timetable_master_id: master.id, year: '3rd Year', semester: 5, section: 'A', day: 'Wednesday', period: 1, start_time: '09:30 AM', end_time: '10:30 AM', subject: 'Operating Systems', faculty: 'Prof. Rahul Mehta', room: 'CSE Room 204', type: 'Lecture' },
      { timetable_master_id: master.id, year: '3rd Year', semester: 5, section: 'A', day: 'Wednesday', period: 2, start_time: '10:30 AM', end_time: '11:30 AM', subject: 'Theory of Computation', faculty: 'Dr. Alok Verma', room: 'CSE Room 204', type: 'Lecture' },
      // Thursday
      { timetable_master_id: master.id, year: '3rd Year', semester: 5, section: 'A', day: 'Thursday', period: 1, start_time: '09:30 AM', end_time: '10:30 AM', subject: 'Computer Networks', faculty: 'Prof. Priya Singh', room: 'CSE Room 204', type: 'Lecture' },
      { timetable_master_id: master.id, year: '3rd Year', semester: 5, section: 'A', day: 'Thursday', period: 2, start_time: '10:30 AM', end_time: '11:30 AM', subject: 'Database Management Systems', faculty: 'Dr. Sunita Sharma', room: 'CSE Room 204', type: 'Lecture' },
      // Friday
      { timetable_master_id: master.id, year: '3rd Year', semester: 5, section: 'A', day: 'Friday', period: 1, start_time: '09:30 AM', end_time: '10:30 AM', subject: 'Operating Systems', faculty: 'Prof. Rahul Mehta', room: 'CSE Room 204', type: 'Lecture' },
      { timetable_master_id: master.id, year: '3rd Year', semester: 5, section: 'A', day: 'Friday', period: 2, start_time: '10:30 AM', end_time: '11:30 AM', subject: 'Theory of Computation', faculty: 'Dr. Alok Verma', room: 'CSE Room 204', type: 'Lecture' }
    ];

    for (const t of timetableData) {
      await Timetable.create(t);
    }

    // 11. Seed Attendance Records
    const attendanceStatuses = ['Present', 'Present', 'Present', 'Present', 'Absent', 'Present'];
    for (let dayOffset = 0; dayOffset < 15; dayOffset++) {
      const d = new Date();
      d.setDate(d.getDate() - dayOffset);
      const dateStr = d.toISOString().split('T')[0];

      for (const st of createdStudents.slice(0, 3)) {
        for (const sub of createdSubjects.slice(0, 3)) {
          const randStatus = attendanceStatuses[Math.floor(Math.random() * attendanceStatuses.length)];
          await Attendance.create({
            student_id: st.id,
            subject_id: sub.id,
            faculty_id: createdFaculty[0].id,
            date: dateStr,
            status: randStatus
          });
        }
      }
    }

    // 12. Seed Assignments
    const asg1 = await Assignment.create({
      title: 'Assignment 1: Relational Algebra & SQL Complex Queries',
      description: 'Implement complex nested SQL queries and schema normalization up to BCNF for an e-commerce database system.',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      subject_id: createdSubjects[0].id,
      max_marks: 100,
      file_url: '/uploads/sample_assignment1.pdf'
    });

    await AssignmentSubmission.create({
      assignment_id: asg1.id,
      student_id: createdStudents[0].id,
      file: '/uploads/ayush_dbms_asg1.pdf',
      marks: 92,
      feedback: 'Excellent normalization proofs and optimized SQL join performance.',
      status: 'Graded'
    });

    // 13. Seed Department Notes & Regulations
    await Note.create({
      title: 'CSE Department Policy: Timetable and Faculty Scheduling Regulations',
      description: 'Mandatory rules: Faculty max 4 periods/day, consecutive lab blocks must be 2 hours, 45-min lunch break required, teacher absence requires HOD substitution approval.',
      file_url: '/uploads/cse_timetable_policy.pdf',
      file_type: 'pdf',
      category: 'Circulars',
      subject_id: null,
      faculty_id: createdFaculty[0].id,
      year: '3rd Year',
      semester: 5,
      rag_indexed: true
    });

    // 14. Seed Department Notices into MySQL
    await Notice.create({
      title: 'Department Technical Symposium & Hackathon Call',
      content: 'All 2nd, 3rd, and 4th year CSE students are invited to register for the Annual State Technical Symposium. Duty attendance will be granted to all participants upon HOD approval.',
      authorRole: 'HOD Office',
      authorName: 'Dr. Alok Verma',
      targetType: 'Department',
      targetValue: 'CSE',
      priority: 'important',
      pinned: true
    });
    await Notice.create({
      title: 'Mid-Semester Timetable & Continuous Internal Evaluation Schedule',
      content: 'The finalized Mid-Semester CIE timetable for CSE Semesters 3, 5, and 7 has been published. Room allocations: Labs LAB-1 & LAB-2, Classrooms 204 & 205.',
      authorRole: 'Faculty',
      authorName: 'Prof. Rahul Mehta',
      targetType: 'Section',
      targetValue: 'CSE-3A',
      priority: 'normal',
      pinned: false
    });

    // 15. Seed Department Notifications into MySQL
    await Notification.create({
      recipient: 'student',
      role: 'student',
      title: 'Timetable Published for CSE 3rd Year Sem 5',
      message: 'The official collision-free timetable has been locked and published by HOD Dr. Alok Verma.',
      type: 'info'
    });
    await Notification.create({
      recipient: 'tg',
      role: 'tg',
      title: 'Student Requests Queue Active',
      message: 'Student leave and attendance consideration verification pipeline is active.',
      type: 'approval'
    });

    // 16. Seed Student Requests into MySQL (Attendance Consideration & Leave)
    await StudentRequest.create({
      requestId: 'REQ-ATT-1001',
      requestType: 'attendance_consideration',
      studentId: createdStudents[0].id,
      studentName: createdStudents[0].name,
      rollNo: createdStudents[0].enrollment_no,
      department: 'CSE',
      semester: '5th',
      section: 'A',
      title: 'Attendance Consideration (Smart India Hackathon Duty)',
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dateRangeLabel: '10 Sept – 15 Sept 2026',
      reason: 'Official College Representation: Smart India Hackathon Grand Finale. Recommended by Faculty Mentor.',
      supportingDoc: '/uploads/sih_verification_signed.pdf',
      currentAttendance: 76,
      expectedAttendance: 86,
      status: 'pending_tg',
      tgRecommendation: 'Recommended: Student has verified institutional participation proof.',
      timeline: JSON.stringify([
        { step: 'Submitted by Student', actor: createdStudents[0].name, time: '2 days ago', completed: true },
        { step: 'TG / Mentor Review', actor: 'Prof. Rahul Mehta', time: 'In Queue', completed: false, active: true },
        { step: 'HOD Approval & Clearance', actor: 'Dr. Alok Verma', time: 'Awaiting TG', completed: false },
        { step: 'Attendance Agent Execution', actor: 'Autonomous Agent', time: 'Pending', completed: false }
      ]),
      affectedClasses: JSON.stringify([
        { subject: 'Database Management Systems', code: 'CS501', date: '10 Sept', period: 'Period 1' },
        { subject: 'Operating Systems', code: 'CS504', date: '11 Sept', period: 'Period 2' },
        { subject: 'Computer Networks', code: 'CS503', date: '12 Sept', period: 'Period 3' }
      ])
    });

    // 17. Seed MongoDB AI Memory
    try {
      await UserMemory.deleteMany({});
      await AiPreference.deleteMany({});
      await Conversation.deleteMany({});

      await UserMemory.create({
        userId: String(createdStudents[0].userId),
        role: 'student',
        longTermFacts: [
          { fact: 'Interested in AI/ML & Distributed Systems', category: 'interest' },
          { fact: 'Enrolled in 3rd Year Sem 5 Section A', category: 'academic' },
          { fact: 'Strong performance in DBMS SQL queries', category: 'performance' }
        ],
        academicInterests: ['Machine Learning', 'Databases', 'Computer Networks'],
        learningStrengths: ['Relational Database Design', 'Python Programming'],
        summaryProfile: 'High performing 3rd-year CSE student preparing for technical placements.'
      });

      await AiPreference.create({
        userId: 'global_cse_settings',
        temperature: 0.3,
        model: 'llama-3.3-70b-versatile',
        tone: 'Academic',
        enableProactiveReminders: true
      });
      logger.info('[Seed] MongoDB AI memory seeded successfully.');
    } catch (mErr) {
      logger.warn(`[Seed] MongoDB seeding skipped (${mErr.message}). Relational database fully ready.`);
    }

    logger.info('[Seed] ====================================================');
    logger.info('[Seed]  CSE DEPARTMENT DATABASE SEEDING COMPLETED SUCCESS  ');
    logger.info('[Seed] ====================================================');
    logger.info('[Seed] Admin:    admin@college.edu       / admin123');
    logger.info('[Seed] Faculty:  hod.cse@college.edu     / password123');
    logger.info('[Seed] Faculty:  sunita.sharma@college.edu / password123');
    logger.info('[Seed] Student:  ayush.student@college.edu / password123');
    logger.info('[Seed] ====================================================');

    return true;
  } catch (error) {
    logger.error(`[Seed] Fatal error during database seeding: ${error.message}`);
    throw error;
  }
};

module.exports = seedCseDatabase;

const bcrypt = require('bcryptjs');
const { User, Student, Faculty, Subject, Section, Timetable, Assignment, AssignmentSubmission, Attendance, Note } = require('../models/mysql');
const { UserMemory, AiPreference, Conversation } = require('../models/mongo/aiMemoryModels');
const { logger } = require('../services/loggerService');

const seedCseDatabase = async () => {
  logger.info('[Seed] Seeding CSE Department normalized data into MySQL and MongoDB...');

  try {
    // 1. Clear existing relational tables
    await AssignmentSubmission.destroy({ where: {}, truncate: false }).catch(() => {});
    await Attendance.destroy({ where: {}, truncate: false }).catch(() => {});
    await Assignment.destroy({ where: {}, truncate: false }).catch(() => {});
    await Note.destroy({ where: {}, truncate: false }).catch(() => {});
    await Timetable.destroy({ where: {}, truncate: false }).catch(() => {});
    await Subject.destroy({ where: {}, truncate: false }).catch(() => {});
    await Section.destroy({ where: {}, truncate: false }).catch(() => {});
    await Student.destroy({ where: {}, truncate: false }).catch(() => {});
    await Faculty.destroy({ where: {}, truncate: false }).catch(() => {});
    await User.destroy({ where: {}, truncate: false }).catch(() => {});

    const defaultPassword = await bcrypt.hash('password123', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);

    // 2. Seed Admin User
    const adminUser = await User.create({
      email: 'admin@college.edu',
      password: adminPassword,
      name: 'CSE Department Administrator',
      role: 'admin',
      status: 'active'
    });

    // 3. Seed Faculty Members & Users
    const facultyData = [
      {
        name: 'Dr. Alok Verma',
        email: 'hod.cse@college.edu',
        designation: 'Professor & Head (HOD)',
        specialization: 'Artificial Intelligence & Machine Learning',
        phone: '+91 98260 11223'
      },
      {
        name: 'Dr. Sunita Sharma',
        email: 'sunita.sharma@college.edu',
        designation: 'Associate Professor',
        specialization: 'Database Systems & Big Data',
        phone: '+91 98260 44556'
      },
      {
        name: 'Prof. Rahul Mehta',
        email: 'rahul.mehta@college.edu',
        designation: 'Assistant Professor (TG)',
        specialization: 'Operating Systems & Distributed Architecture',
        phone: '+91 98260 77889'
      },
      {
        name: 'Prof. Priya Singh',
        email: 'priya.singh@college.edu',
        designation: 'Assistant Professor',
        specialization: 'Computer Networks & Cybersecurity',
        phone: '+91 98260 99001'
      }
    ];

    const createdFaculty = [];
    for (const f of facultyData) {
      const u = await User.create({
        email: f.email,
        password: defaultPassword,
        name: f.name,
        role: 'faculty',
        status: 'active'
      });
      const fac = await Faculty.create({
        userId: u.id,
        name: f.name,
        email: f.email,
        designation: f.designation,
        specialization: f.specialization,
        phone: f.phone
      });
      createdFaculty.push(fac);
    }

    // 4. Seed Sections (strictly Year -> Semester -> Section)
    const sectionSeeds = [
      // 1st Year (Sem 1 & 2)
      { year: '1st Year', semester: 1, section_name: 'A' },
      { year: '1st Year', semester: 1, section_name: 'B' },
      { year: '1st Year', semester: 2, section_name: 'A' },
      { year: '1st Year', semester: 2, section_name: 'B' },
      // 2nd Year (Sem 3 & 4)
      { year: '2nd Year', semester: 3, section_name: 'A' },
      { year: '2nd Year', semester: 3, section_name: 'B' },
      { year: '2nd Year', semester: 4, section_name: 'A' },
      { year: '2nd Year', semester: 4, section_name: 'B' },
      // 3rd Year (Sem 5 & 6)
      { year: '3rd Year', semester: 5, section_name: 'A' },
      { year: '3rd Year', semester: 5, section_name: 'B' },
      { year: '3rd Year', semester: 6, section_name: 'A' },
      { year: '3rd Year', semester: 6, section_name: 'B' },
      // 4th Year (Sem 7 & 8)
      { year: '4th Year', semester: 7, section_name: 'A' },
      { year: '4th Year', semester: 7, section_name: 'B' },
      { year: '4th Year', semester: 8, section_name: 'A' },
      { year: '4th Year', semester: 8, section_name: 'B' }
    ];

    for (const s of sectionSeeds) {
      await Section.create(s);
    }

    // 5. Seed Core CSE Subjects
    const subjectsData = [
      { code: 'CS501', name: 'Database Management Systems', semester: 5, credits: 4 },
      { code: 'CS502', name: 'Theory of Computation', semester: 5, credits: 4 },
      { code: 'CS503', name: 'Computer Networks', semester: 5, credits: 4 },
      { code: 'CS504', name: 'Operating Systems', semester: 5, credits: 4 },
      { code: 'CS505', name: 'Data Analytics with Python Lab', semester: 5, credits: 2 },
      { code: 'CS301', name: 'Data Structures & Algorithms', semester: 3, credits: 4 },
      { code: 'CS701', name: 'Artificial Intelligence & Deep Learning', semester: 7, credits: 4 },
      { code: 'CS101', name: 'Problem Solving & Programming in C', semester: 1, credits: 4 }
    ];

    const createdSubjects = [];
    for (const sub of subjectsData) {
      const s = await Subject.create(sub);
      createdSubjects.push(s);
    }

    // 6. Seed Students & Users
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
      },
      {
        name: 'Devraj Kapoor',
        email: 'dev.kapoor@college.edu',
        enrollment_no: '0103CS201004',
        phone: '+91 99887 44556',
        year: '4th Year',
        semester: 7,
        section: 'A',
        batch: '2021-2025'
      },
      {
        name: 'Aarav Gupta',
        email: 'aarav.gupta@college.edu',
        enrollment_no: '0103CS221005',
        phone: '+91 99887 55667',
        year: '2nd Year',
        semester: 3,
        section: 'A',
        batch: '2023-2027'
      },
      {
        name: 'Tanya Singh',
        email: 'tanya.singh@college.edu',
        enrollment_no: '0103CS231006',
        phone: '+91 99887 66778',
        year: '1st Year',
        semester: 1,
        section: 'A',
        batch: '2024-2028'
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

    // 7. Seed Timetable for 3rd Year Sem 5 Section A
    const timetableData = [
      // Monday
      { year: '3rd Year', semester: 5, section: 'A', day: 'Monday', start_time: '09:30 AM', end_time: '10:30 AM', subject: 'Database Management Systems', faculty: 'Dr. Sunita Sharma', room: 'CSE Room 204' },
      { year: '3rd Year', semester: 5, section: 'A', day: 'Monday', start_time: '10:30 AM', end_time: '11:30 AM', subject: 'Operating Systems', faculty: 'Prof. Rahul Mehta', room: 'CSE Room 204' },
      { year: '3rd Year', semester: 5, section: 'A', day: 'Monday', start_time: '11:45 AM', end_time: '12:45 PM', subject: 'Computer Networks', faculty: 'Prof. Priya Singh', room: 'CSE Room 204' },
      { year: '3rd Year', semester: 5, section: 'A', day: 'Monday', start_time: '01:30 PM', end_time: '03:30 PM', subject: 'DBMS Laboratory', faculty: 'Dr. Sunita Sharma', room: 'CSE Software Lab 2' },
      // Tuesday
      { year: '3rd Year', semester: 5, section: 'A', day: 'Tuesday', start_time: '09:30 AM', end_time: '10:30 AM', subject: 'Theory of Computation', faculty: 'Dr. Alok Verma', room: 'CSE Room 204' },
      { year: '3rd Year', semester: 5, section: 'A', day: 'Tuesday', start_time: '10:30 AM', end_time: '11:30 AM', subject: 'Computer Networks', faculty: 'Prof. Priya Singh', room: 'CSE Room 204' },
      { year: '3rd Year', semester: 5, section: 'A', day: 'Tuesday', start_time: '11:45 AM', end_time: '12:45 PM', subject: 'Database Management Systems', faculty: 'Dr. Sunita Sharma', room: 'CSE Room 204' },
      // Wednesday
      { year: '3rd Year', semester: 5, section: 'A', day: 'Wednesday', start_time: '09:30 AM', end_time: '10:30 AM', subject: 'Operating Systems', faculty: 'Prof. Rahul Mehta', room: 'CSE Room 204' },
      { year: '3rd Year', semester: 5, section: 'A', day: 'Wednesday', start_time: '10:30 AM', end_time: '11:30 AM', subject: 'Theory of Computation', faculty: 'Dr. Alok Verma', room: 'CSE Room 204' },
      // Thursday
      { year: '3rd Year', semester: 5, section: 'A', day: 'Thursday', start_time: '09:30 AM', end_time: '10:30 AM', subject: 'Computer Networks', faculty: 'Prof. Priya Singh', room: 'CSE Room 204' },
      { year: '3rd Year', semester: 5, section: 'A', day: 'Thursday', start_time: '10:30 AM', end_time: '11:30 AM', subject: 'Database Management Systems', faculty: 'Dr. Sunita Sharma', room: 'CSE Room 204' },
      // Friday
      { year: '3rd Year', semester: 5, section: 'A', day: 'Friday', start_time: '09:30 AM', end_time: '10:30 AM', subject: 'Operating Systems', faculty: 'Prof. Rahul Mehta', room: 'CSE Room 204' },
      { year: '3rd Year', semester: 5, section: 'A', day: 'Friday', start_time: '10:30 AM', end_time: '11:30 AM', subject: 'Theory of Computation', faculty: 'Dr. Alok Verma', room: 'CSE Room 204' }
    ];

    for (const t of timetableData) {
      await Timetable.create(t);
    }

    // 8. Seed Attendance Records
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

    // 9. Seed Assignments
    const asg1 = await Assignment.create({
      title: 'Assignment 1: Relational Algebra & SQL Complex Queries',
      description: 'Implement complex nested SQL queries and schema normalization up to BCNF for an e-commerce database system.',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // in 5 days
      subject_id: createdSubjects[0].id, // DBMS
      max_marks: 100,
      file_url: '/uploads/sample_assignment1.pdf'
    });

    const asg2 = await Assignment.create({
      title: 'Assignment 2: CPU Scheduling & Deadlock Banker Algorithm',
      description: 'Implement Round Robin and Priority scheduling algorithms in C/Python and analyze turnaround time.',
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      subject_id: createdSubjects[3].id, // OS
      max_marks: 50,
      file_url: '/uploads/sample_assignment2.pdf'
    });

    // Sample submission
    await AssignmentSubmission.create({
      assignment_id: asg1.id,
      student_id: createdStudents[0].id,
      file: '/uploads/ayush_dbms_asg1.pdf',
      marks: 92,
      feedback: 'Excellent normalization proofs and optimized SQL join performance.',
      status: 'Graded'
    });

    // 10. Seed Department Notes & Circulars
    await Note.create({
      title: 'Unit 1 & 2 Complete Lecture Notes: Relational Data Models',
      description: 'Comprehensive slides covering ER modeling, Relational Calculus, and Normalization.',
      file_url: '/uploads/dbms_unit1_notes.pdf',
      file_type: 'pdf',
      category: 'Notes',
      subject_id: createdSubjects[0].id,
      faculty_id: createdFaculty[1].id,
      year: '3rd Year',
      semester: 5,
      rag_indexed: true
    });

    await Note.create({
      title: 'CSE Department Circular: Mid-Semester Test Schedule Autumn 2025',
      description: 'Official datesheet and seating plan for 3rd Year Semester 5 Mid-Semester Examinations.',
      file_url: '/uploads/cse_circular_mst_2025.pdf',
      file_type: 'pdf',
      category: 'Circulars',
      subject_id: null,
      faculty_id: createdFaculty[0].id,
      year: '3rd Year',
      semester: 5,
      rag_indexed: true
    });

    await Note.create({
      title: 'CSE Department 4-Year B.Tech Curriculum Syllabus Handbook',
      description: 'Complete syllabus and course outcomes from Semester 1 through Semester 8.',
      file_url: '/uploads/cse_complete_syllabus.pdf',
      file_type: 'pdf',
      category: 'Syllabus',
      year: '3rd Year',
      semester: 5,
      rag_indexed: true
    });

    // 11. Seed MongoDB AI Memory
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
    logger.info('[Seed] Student:  ayush.student@college.edu / password123');
    logger.info('[Seed] ====================================================');

    return true;
  } catch (error) {
    logger.error(`[Seed] Fatal error during database seeding: ${error.message}`);
    throw error;
  }
};

module.exports = seedCseDatabase;

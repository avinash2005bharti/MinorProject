// ============================================================================
// Authoritative Relational ERP Baseline Seeder
// Seeds PostgreSQL (source of truth) and synchronizes MongoDB (auth & session)
// ============================================================================

require('dotenv').config();
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const {
  sequelize,
  Department,
  AcademicYear,
  Program,
  Semester,
  Section,
  Room,
  Subject,
  Teacher,
  Hod,
  MentorTeacherGroup,
  StudentMentorAssignment,
  Student,
  User,
  TeacherSubjectAssignment,
  TimetableEntry,
  TimetableVersion,
  AttendanceSession,
  AttendanceRecord,
  LeaveRequest,
  Notice,
  Notification
} = require('../models/postgres');
const MongoUser = require('../models/mongo/User');

async function seedBaseline() {
  console.log('================================================================');
  console.log('  PROVISIONING AUTHORITATIVE RELATIONAL ERP BASELINE');
  console.log('================================================================\n');

  await sequelize.authenticate();
  console.log('✓ PostgreSQL connected.');

  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
      console.log('✓ MongoDB connected.');
    } catch (mErr) {
      console.warn('⚠️ MongoDB connection warning:', mErr.message);
    }
  }

  // 1. Academic Year
  const [academicYear] = await AcademicYear.findOrCreate({
    where: { name: '2026-27' },
    defaults: {
      name: '2026-27',
      start_date: '2026-07-01',
      end_date: '2027-06-30',
      is_current: true
    }
  });
  console.log(`✓ Academic Year: ${academicYear.name}`);

  // 2. Department: CSE
  let cseDept = await Department.findOne({ where: { code: 'CSE' } });
  if (!cseDept) {
    cseDept = await Department.create({
      code: 'CSE',
      name: 'Computer Science & Engineering',
      description: 'Department of Computer Science & Engineering - Center of Excellence'
    });
    console.log(`✓ Created CSE Department (ID: ${cseDept.id})`);
  } else {
    console.log(`✓ Found CSE Department (ID: ${cseDept.id})`);
  }

  // 3. Program: B.Tech CSE
  const [program] = await Program.findOrCreate({
    where: { code: 'BTECH-CSE' },
    defaults: {
      code: 'BTECH-CSE',
      name: 'Bachelor of Technology in Computer Science & Engineering',
      department_id: cseDept.id,
      duration_years: 4
    }
  });
  console.log(`✓ Program: ${program.name}`);

  // 4. Semesters (1 to 8)
  const semesters = {};
  for (let s = 1; s <= 8; s++) {
    let [sem] = await Semester.findOrCreate({
      where: { program_id: program.id, semester_number: s },
      defaults: {
        program_id: program.id,
        semester_number: s,
        academic_year: '2026-27'
      }
    });
    semesters[s] = sem;
  }
  console.log(`✓ Semesters 1 to 8 provisioned.`);

  // 5. Sections for Semester 5 (and others)
  const sections = {};
  for (const secName of ['A', 'B', 'C']) {
    let [sec] = await Section.findOrCreate({
      where: { department_id: cseDept.id, semester_id: semesters[5].id, name: secName },
      defaults: {
        department_id: cseDept.id,
        semester_id: semesters[5].id,
        name: secName,
        academic_year: '2026-27',
        capacity: 60
      }
    });
    sections[secName] = sec;
  }
  console.log(`✓ Sections for Semester 5: A, B, C provisioned.`);

  // 6. Classrooms & Labs
  const roomsData = [
    { room_number: '204', building: 'Main Academic Block', floor: 2, room_type: 'CLASSROOM', capacity: 60 },
    { room_number: '205', building: 'Main Academic Block', floor: 2, room_type: 'CLASSROOM', capacity: 60 },
    { room_number: '302', building: 'Main Academic Block', floor: 3, room_type: 'CLASSROOM', capacity: 65 },
    { room_number: 'LAB-1', building: 'Turing Computer Center', floor: 1, room_type: 'LAB', capacity: 50 },
    { room_number: 'LAB-2', building: 'Turing Computer Center', floor: 1, room_type: 'LAB', capacity: 60 }
  ];
  const rooms = {};
  for (const r of roomsData) {
    let [rm] = await Room.findOrCreate({
      where: { room_number: r.room_number },
      defaults: r
    });
    rooms[r.room_number] = rm;
  }
  console.log(`✓ Rooms provisioned: ${Object.keys(rooms).join(', ')}`);

  // 7. Subjects for Semester 5
  const subjectsData = [
    { code: 'CS501', name: 'Database Management Systems', semester: 5, credits: 4, lecture_hours: 3, practical_hours: 2, subject_type: 'THEORY' },
    { code: 'CS502', name: 'Theory of Computation', semester: 5, credits: 4, lecture_hours: 4, practical_hours: 0, subject_type: 'THEORY' },
    { code: 'CS503', name: 'Computer Networks', semester: 5, credits: 4, lecture_hours: 3, practical_hours: 2, subject_type: 'THEORY' },
    { code: 'CS504', name: 'Operating Systems', semester: 5, credits: 4, lecture_hours: 3, practical_hours: 2, subject_type: 'THEORY' },
    { code: 'CS505', name: 'DBMS Laboratory', semester: 5, credits: 2, lecture_hours: 0, practical_hours: 4, subject_type: 'LAB' },
    { code: 'CS506', name: 'Computer Networks Lab', semester: 5, credits: 2, lecture_hours: 0, practical_hours: 4, subject_type: 'LAB' }
  ];
  const subjects = {};
  for (const s of subjectsData) {
    let [sub] = await Subject.findOrCreate({
      where: { code: s.code },
      defaults: {
        ...s,
        department_id: cseDept.id,
        semester_id: semesters[s.semester].id
      }
    });
    subjects[s.code] = sub;
  }
  console.log(`✓ Subjects provisioned: ${Object.keys(subjects).join(', ')}`);

  // 8. Provision Accounts & Profiles (Admin, HOD, TG, Faculty, Student)
  const passwordHash = await bcrypt.hash('password123', 10);
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);

  // A. Admin Account
  const adminEmail = 'admin@college.edu';
  let [adminUser] = await User.findOrCreate({
    where: { email: adminEmail },
    defaults: {
      email: adminEmail,
      password: adminPasswordHash,
      name: 'System Administrator',
      role: 'admin',
      status: 'ACTIVE'
    }
  });
  if (mongoose.connection.readyState === 1) {
    await MongoUser.findOneAndUpdate(
      { email: adminEmail },
      {
        email: adminEmail,
        password: adminPasswordHash,
        name: 'System Administrator',
        role: 'admin',
        isActive: true
      },
      { upsert: true, new: true }
    );
  }
  console.log(`✓ Admin account: ${adminEmail}`);

  // B. HOD Account & Profile
  const hodEmail = 'hod.cse@college.edu';
  let [hodUser] = await User.findOrCreate({
    where: { email: hodEmail },
    defaults: {
      email: hodEmail,
      password: passwordHash,
      name: 'Dr. Alok Verma',
      role: 'hod',
      status: 'ACTIVE'
    }
  });
  let [hodTeacher] = await Teacher.findOrCreate({
    where: { email: hodEmail },
    defaults: {
      user_id: hodUser.id,
      employee_id: 'EMP-CSE-001',
      first_name: 'Alok',
      last_name: 'Verma',
      email: hodEmail,
      phone: '+91 98260 11223',
      designation: 'Professor & Head (HOD)',
      department_id: cseDept.id,
      specialization: 'Artificial Intelligence & Machine Learning',
      max_periods_per_day: 3,
      max_periods_per_week: 14,
      status: 'ACTIVE'
    }
  });
  if (hodTeacher.user_id !== hodUser.id) {
    await hodTeacher.update({ user_id: hodUser.id });
  }

  // Ensure HOD table entry
  await Hod.findOrCreate({
    where: { teacher_id: hodTeacher.id, department_id: cseDept.id },
    defaults: {
      teacher_id: hodTeacher.id,
      department_id: cseDept.id,
      is_current: true
    }
  });

  if (mongoose.connection.readyState === 1) {
    await MongoUser.findOneAndUpdate(
      { email: hodEmail },
      {
        email: hodEmail,
        password: passwordHash,
        name: 'Dr. Alok Verma',
        role: 'hod',
        collegeId: 'EMP-CSE-001',
        isActive: true,
        profile: {
          employee_id: 'EMP-CSE-001',
          designation: 'Professor & Head (HOD)',
          specialization: 'Artificial Intelligence & Machine Learning'
        }
      },
      { upsert: true, new: true }
    );
  }
  console.log(`✓ HOD account & profile: ${hodEmail} (Dr. Alok Verma)`);

  // C. Faculty: Dr. Sunita Sharma
  const sunitaEmail = 'sunita.sharma@college.edu';
  let [sunitaUser] = await User.findOrCreate({
    where: { email: sunitaEmail },
    defaults: {
      email: sunitaEmail,
      password: passwordHash,
      name: 'Dr. Sunita Sharma',
      role: 'faculty',
      status: 'ACTIVE'
    }
  });
  let [sunitaTeacher] = await Teacher.findOrCreate({
    where: { email: sunitaEmail },
    defaults: {
      user_id: sunitaUser.id,
      employee_id: 'EMP-CSE-002',
      first_name: 'Sunita',
      last_name: 'Sharma',
      email: sunitaEmail,
      phone: '+91 98260 44556',
      designation: 'Associate Professor',
      department_id: cseDept.id,
      specialization: 'Database Systems & Big Data',
      max_periods_per_day: 4,
      max_periods_per_week: 16,
      status: 'ACTIVE'
    }
  });
  if (sunitaTeacher.user_id !== sunitaUser.id) {
    await sunitaTeacher.update({ user_id: sunitaUser.id });
  }
  if (mongoose.connection.readyState === 1) {
    await MongoUser.findOneAndUpdate(
      { email: sunitaEmail },
      {
        email: sunitaEmail,
        password: passwordHash,
        name: 'Dr. Sunita Sharma',
        role: 'faculty',
        collegeId: 'EMP-CSE-002',
        isActive: true,
        profile: {
          employee_id: 'EMP-CSE-002',
          designation: 'Associate Professor',
          specialization: 'Database Systems & Big Data'
        }
      },
      { upsert: true, new: true }
    );
  }
  console.log(`✓ Faculty: ${sunitaEmail} (Dr. Sunita Sharma)`);

  // D. TG / Mentor: Prof. Rahul Mehta
  const rahulEmail = 'rahul.mehta@college.edu';
  let [rahulUser] = await User.findOrCreate({
    where: { email: rahulEmail },
    defaults: {
      email: rahulEmail,
      password: passwordHash,
      name: 'Prof. Rahul Mehta',
      role: 'tg',
      status: 'ACTIVE'
    }
  });
  let [rahulTeacher] = await Teacher.findOrCreate({
    where: { email: rahulEmail },
    defaults: {
      user_id: rahulUser.id,
      employee_id: 'EMP-CSE-003',
      first_name: 'Rahul',
      last_name: 'Mehta',
      email: rahulEmail,
      phone: '+91 98260 77889',
      designation: 'Assistant Professor (TG)',
      department_id: cseDept.id,
      specialization: 'Operating Systems & Distributed Architecture',
      max_periods_per_day: 4,
      max_periods_per_week: 16,
      status: 'ACTIVE'
    }
  });
  if (rahulTeacher.user_id !== rahulUser.id) {
    await rahulTeacher.update({ user_id: rahulUser.id });
  }
  // TG Group
  const [tgGroup] = await MentorTeacherGroup.findOrCreate({
    where: { teacher_id: rahulTeacher.id, name: 'CSE-TG-3A' },
    defaults: {
      teacher_id: rahulTeacher.id,
      name: 'CSE-TG-3A',
      department_id: cseDept.id,
      academic_year: '2026-27'
    }
  });
  if (mongoose.connection.readyState === 1) {
    await MongoUser.findOneAndUpdate(
      { email: rahulEmail },
      {
        email: rahulEmail,
        password: passwordHash,
        name: 'Prof. Rahul Mehta',
        role: 'tg',
        collegeId: 'EMP-CSE-003',
        isActive: true,
        profile: {
          employee_id: 'EMP-CSE-003',
          designation: 'Assistant Professor (TG)',
          specialization: 'Operating Systems & Distributed Architecture'
        }
      },
      { upsert: true, new: true }
    );
  }
  console.log(`✓ TG / Mentor: ${rahulEmail} (Prof. Rahul Mehta, Group: ${tgGroup.name})`);

  // E. Faculty: Prof. Priya Singh
  const priyaEmail = 'priya.singh@college.edu';
  let [priyaUser] = await User.findOrCreate({
    where: { email: priyaEmail },
    defaults: {
      email: priyaEmail,
      password: passwordHash,
      name: 'Prof. Priya Singh',
      role: 'faculty',
      status: 'ACTIVE'
    }
  });
  let [priyaTeacher] = await Teacher.findOrCreate({
    where: { email: priyaEmail },
    defaults: {
      user_id: priyaUser.id,
      employee_id: 'EMP-CSE-004',
      first_name: 'Priya',
      last_name: 'Singh',
      email: priyaEmail,
      phone: '+91 98260 99001',
      designation: 'Assistant Professor',
      department_id: cseDept.id,
      specialization: 'Computer Networks & Cybersecurity',
      max_periods_per_day: 4,
      max_periods_per_week: 16,
      status: 'ACTIVE'
    }
  });
  if (priyaTeacher.user_id !== priyaUser.id) {
    await priyaTeacher.update({ user_id: priyaUser.id });
  }
  if (mongoose.connection.readyState === 1) {
    await MongoUser.findOneAndUpdate(
      { email: priyaEmail },
      {
        email: priyaEmail,
        password: passwordHash,
        name: 'Prof. Priya Singh',
        role: 'faculty',
        collegeId: 'EMP-CSE-004',
        isActive: true,
        profile: {
          employee_id: 'EMP-CSE-004',
          designation: 'Assistant Professor',
          specialization: 'Computer Networks & Cybersecurity'
        }
      },
      { upsert: true, new: true }
    );
  }
  console.log(`✓ Faculty: ${priyaEmail} (Prof. Priya Singh)`);

  // F. Students: Ayush Verma & Avinash Bharti
  const studentData = [
    {
      email: 'ayush.student@college.edu',
      name: 'Ayush Verma',
      firstName: 'Ayush',
      lastName: 'Verma',
      enrollmentNo: '0103CS211001',
      rollNo: '0103CS211001',
      semester: 5,
      section: 'A'
    },
    {
      email: 'avinashbharti3007@gmail.com',
      name: 'Avinash Bharti',
      firstName: 'Avinash',
      lastName: 'Bharti',
      enrollmentNo: '0103CS211002',
      rollNo: '0103CS211002',
      semester: 5,
      section: 'A'
    }
  ];

  const seededStudents = [];
  for (const s of studentData) {
    let [stuUser] = await User.findOrCreate({
      where: { email: s.email },
      defaults: {
        email: s.email,
        password: passwordHash,
        name: s.name,
        role: 'student',
        status: 'ACTIVE'
      }
    });

    let [student] = await Student.findOrCreate({
      where: { enrollment_no: s.enrollmentNo },
      defaults: {
        user_id: stuUser.id,
        enrollment_no: s.enrollmentNo,
        roll_no: s.rollNo,
        first_name: s.firstName,
        last_name: s.lastName,
        email: s.email,
        phone: '+91 98765 43210',
        admission_year: 2023,
        semester: s.semester,
        department_id: cseDept.id,
        section_id: sections[s.section].id,
        status: 'ACTIVE'
      }
    });
    if (student.user_id !== stuUser.id) {
      await student.update({ user_id: stuUser.id });
    }

    // Assign to TG Group
    await StudentMentorAssignment.findOrCreate({
      where: { student_id: student.id, mentor_group_id: tgGroup.id },
      defaults: {
        student_id: student.id,
        mentor_group_id: tgGroup.id,
        academic_year: '2026-27'
      }
    });

    if (mongoose.connection.readyState === 1) {
      await MongoUser.findOneAndUpdate(
        { email: s.email },
        {
          email: s.email,
          password: passwordHash,
          name: s.name,
          role: 'student',
          collegeId: s.enrollmentNo,
          isActive: true,
          profile: {
            enrollment_no: s.enrollmentNo,
            roll_no: s.rollNo,
            semester: s.semester,
            section: s.section
          }
        },
        { upsert: true, new: true }
      );
    }
    seededStudents.push(student);
    console.log(`✓ Student: ${s.email} (${s.name}, ${s.enrollmentNo})`);
  }

  // 9. Teacher Subject Assignments
  const assignments = [
    { teacher_id: sunitaTeacher.id, subject_id: subjects['CS501'].id, section_id: sections['A'].id },
    { teacher_id: rahulTeacher.id, subject_id: subjects['CS504'].id, section_id: sections['A'].id },
    { teacher_id: priyaTeacher.id, subject_id: subjects['CS503'].id, section_id: sections['A'].id },
    { teacher_id: hodTeacher.id, subject_id: subjects['CS502'].id, section_id: sections['A'].id },
    { teacher_id: sunitaTeacher.id, subject_id: subjects['CS505'].id, section_id: sections['A'].id },
    { teacher_id: priyaTeacher.id, subject_id: subjects['CS506'].id, section_id: sections['A'].id }
  ];
  for (const a of assignments) {
    await TeacherSubjectAssignment.findOrCreate({
      where: { teacher_id: a.teacher_id, subject_id: a.subject_id, section_id: a.section_id },
      defaults: {
        teacher_id: a.teacher_id,
        subject_id: a.subject_id,
        section_id: a.section_id,
        semester: 5,
        academic_year: '2026-27'
      }
    });
  }
  console.log(`✓ Teacher subject assignments provisioned.`);

  // 10. Timetable Version & Entries for Section A (Monday - Friday)
  let [ttVersion] = await TimetableVersion.findOrCreate({
    where: { department_id: cseDept.id, status: 'ACTIVE' },
    defaults: {
      department_id: cseDept.id,
      generated_by: 'CampusFlow Timetable Scheduler',
      generation_method: 'AI',
      reason: 'Authoritative Semester 5 Schedule',
      status: 'ACTIVE',
      activated_at: new Date()
    }
  });

  const timetableSlots = [
    // Monday
    { day: 'Monday', day_of_week: 1, period: 1, start: '09:30', end: '10:30', sub: 'CS501', teacher: sunitaTeacher, room: rooms['204'], type: 'Lecture' },
    { day: 'Monday', day_of_week: 1, period: 2, start: '10:30', end: '11:30', sub: 'CS503', teacher: priyaTeacher, room: rooms['204'], type: 'Lecture' },
    { day: 'Monday', day_of_week: 1, period: 3, start: '11:45', end: '12:45', sub: 'CS504', teacher: rahulTeacher, room: rooms['204'], type: 'Lecture' },
    { day: 'Monday', day_of_week: 1, period: 4, start: '01:30', end: '03:30', sub: 'CS505', teacher: sunitaTeacher, room: rooms['LAB-2'], type: 'Lab' },
    // Tuesday
    { day: 'Tuesday', day_of_week: 2, period: 1, start: '09:30', end: '10:30', sub: 'CS502', teacher: hodTeacher, room: rooms['204'], type: 'Lecture' },
    { day: 'Tuesday', day_of_week: 2, period: 2, start: '10:30', end: '11:30', sub: 'CS501', teacher: sunitaTeacher, room: rooms['204'], type: 'Lecture' },
    { day: 'Tuesday', day_of_week: 2, period: 3, start: '11:45', end: '12:45', sub: 'CS503', teacher: priyaTeacher, room: rooms['204'], type: 'Lecture' },
    // Wednesday
    { day: 'Wednesday', day_of_week: 3, period: 1, start: '09:30', end: '10:30', sub: 'CS504', teacher: rahulTeacher, room: rooms['204'], type: 'Lecture' },
    { day: 'Wednesday', day_of_week: 3, period: 2, start: '10:30', end: '11:30', sub: 'CS502', teacher: hodTeacher, room: rooms['204'], type: 'Lecture' },
    { day: 'Wednesday', day_of_week: 3, period: 3, start: '11:45', end: '12:45', sub: 'CS501', teacher: sunitaTeacher, room: rooms['204'], type: 'Lecture' },
    // Thursday
    { day: 'Thursday', day_of_week: 4, period: 1, start: '09:30', end: '10:30', sub: 'CS503', teacher: priyaTeacher, room: rooms['204'], type: 'Lecture' },
    { day: 'Thursday', day_of_week: 4, period: 2, start: '10:30', end: '11:30', sub: 'CS504', teacher: rahulTeacher, room: rooms['204'], type: 'Lecture' },
    { day: 'Thursday', day_of_week: 4, period: 3, start: '11:45', end: '01:45', sub: 'CS506', teacher: priyaTeacher, room: rooms['LAB-1'], type: 'Lab' },
    // Friday
    { day: 'Friday', day_of_week: 5, period: 1, start: '09:30', end: '10:30', sub: 'CS502', teacher: hodTeacher, room: rooms['204'], type: 'Lecture' },
    { day: 'Friday', day_of_week: 5, period: 2, start: '10:30', end: '11:30', sub: 'CS501', teacher: sunitaTeacher, room: rooms['204'], type: 'Lecture' }
  ];

  for (const s of timetableSlots) {
    const today = new Date().toISOString().split('T')[0];
    await TimetableEntry.findOrCreate({
      where: {
        section_id: sections['A'].id,
        day_of_week: s.day_of_week,
        period: s.period,
        academic_year: '2026-27'
      },
      defaults: {
        section_id: sections['A'].id,
        subject_id: subjects[s.sub].id,
        teacher_id: s.teacher.id,
        room_id: s.room.id,
        day_of_week: s.day_of_week,
        day: s.day,
        period: s.period,
        start_time: `${s.start}:00`,
        end_time: `${s.end}:00`,
        academic_year: '2026-27',
        semester: 5,
        timetable_version: ttVersion.id,
        type: s.type
      }
    });
  }
  console.log(`✓ Timetable entries provisioned for Section A, Semester 5.`);

  // 11. Attendance Sessions & Records
  const todayDate = new Date();
  for (let daysAgo = 5; daysAgo >= 0; daysAgo--) {
    const sessionDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const dateStr = sessionDate.toISOString().split('T')[0];

    const [session] = await AttendanceSession.findOrCreate({
      where: {
        subject_id: subjects['CS501'].id,
        teacher_id: sunitaTeacher.id,
        date: dateStr,
        period: 1
      },
      defaults: {
        section_id: sections['A'].id,
        subject_id: subjects['CS501'].id,
        teacher_id: sunitaTeacher.id,
        date: dateStr,
        period: 1,
        status: 'CLOSED'
      }
    });

    for (const stu of seededStudents) {
      // Ayush Present mostly, Avinash Present
      const status = (daysAgo === 1 && stu.first_name === 'Ayush') ? 'ABSENT' : 'PRESENT';
      await AttendanceRecord.findOrCreate({
        where: { session_id: session.id, student_id: stu.id },
        defaults: {
          session_id: session.id,
          student_id: stu.id,
          status,
          marked_by: 'Dr. Sunita Sharma',
          remarks: 'Regular Session Roll Call'
        }
      });
    }
  }
  console.log(`✓ Real Attendance Sessions & Records provisioned in PostgreSQL.`);

  // 12. Notices & Notifications
  await Notice.findOrCreate({
    where: { title: 'Mid-Term Examinations Schedule Announced' },
    defaults: {
      title: 'Mid-Term Examinations Schedule Announced',
      content: 'The Mid-Term theory examinations for 3rd Year (Semester 5) will commence from next Monday. Timetable is available on the departmental portal.',
      author_role: 'HOD Office',
      author_name: 'Dr. Alok Verma',
      target_type: 'Department',
      target_value: 'CSE-3A',
      priority: 'important',
      pinned: true
    }
  });

  await Notification.findOrCreate({
    where: { title: 'Welcome to CampusFlow CSE ERP' },
    defaults: {
      title: 'Welcome to CampusFlow CSE ERP',
      message: 'Your official departmental ERP portal is online with real PostgreSQL source of truth.',
      type: 'info',
      role: 'all'
    }
  });

  console.log(`✓ Institutional Notices and Notifications provisioned.`);
  console.log('\n================================================================');
  console.log('  RELATIONAL ERP BASELINE SEEDED SUCCESSFULLY!');
  console.log('================================================================\n');
}

seedBaseline()
  .catch((err) => {
    console.error('Seed Error:', err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });

const bcrypt = require('bcryptjs');
const {
  sequelize,
  AcademicYear,
  Department,
  Program,
  Semester,
  Section,
  User,
  Teacher,
  Faculty,
  Hod,
  MentorTeacherGroup,
  Student,
  StudentMentorAssignment,
  Subject,
  TeacherSubjectAssignment,
  Room,
  Classroom,
  TimetableVersion,
  TimetableMaster,
  TimetableEntry,
  Timetable,
  TeacherAvailability,
  TeacherAbsence,
  AttendanceSession,
  AttendanceRecord,
  Attendance,
  AttendanceCorrectionRequest,
  AttendanceCorrection,
  LeaveRequest,
  LeaveApplication,
  AttendanceConsiderationRequest,
  StudentRequest,
  Notification,
  AuditLog,
  AuditRecord,
  Notice,
  Assignment,
  AssignmentSubmission,
  Note
} = require('../../src/models/postgres');
const { UserMemory, AiPreference, Conversation } = require('../../src/models/mongo/aiMemoryModels');
const { logger } = require('../../src/services/loggerService');

const seedCseDatabase = async () => {
  logger.info('[Seed] Seeding CSE Department normalized Core ERD data into PostgreSQL...');

  try {
    const defaultPassword = await bcrypt.hash('password123', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);

    // 1. Academic Year
    let [academicYear] = await AcademicYear.findOrCreate({
      where: { name: '2026-27' },
      defaults: {
        name: '2026-27',
        start_date: '2026-07-01',
        end_date: '2027-06-30',
        is_current: true
      }
    });

    // 2. Department
    let [department] = await Department.findOrCreate({
      where: { code: 'CSE' },
      defaults: {
        code: 'CSE',
        name: 'Computer Science & Engineering',
        description: 'Department of Computer Science & Engineering, Oriental Institute of Science & Technology (OIST), Bhopal'
      }
    });

    // 3. Program
    let [program] = await Program.findOrCreate({
      where: { code: 'BTECH_CSE' },
      defaults: {
        code: 'BTECH_CSE',
        name: 'Bachelor of Technology in Computer Science & Engineering',
        department_id: department.id,
        duration_years: 4
      }
    });

    // 4. Semesters (1 through 8)
    const semMap = {};
    for (let s = 1; s <= 8; s++) {
      let [sem] = await Semester.findOrCreate({
        where: { program_id: program.id, semester_number: s },
        defaults: {
          semester_number: s,
          program_id: program.id,
          academic_year: '2026-27'
        }
      });
      semMap[s] = sem;
    }

    // 5. Sections
    const sectionMap = {};
    for (const secName of ['A', 'B', 'C']) {
      let [sec] = await Section.findOrCreate({
        where: { department_id: department.id, name: secName, academic_year: '2026-27' },
        defaults: {
          name: secName,
          semester_id: semMap[5].id,
          department_id: department.id,
          academic_year: '2026-27',
          capacity: 60
        }
      });
      sectionMap[secName] = sec;
    }

    // 6. Classrooms & Labs (Rooms)
    const roomsData = [
      { room_number: '204', name: 'CSE Room 204', building: 'Main Academic Block', floor: 2, room_type: 'CLASSROOM', capacity: 60 },
      { room_number: '205', name: 'CSE Room 205', building: 'Main Academic Block', floor: 2, room_type: 'CLASSROOM', capacity: 60 },
      { room_number: '302', name: 'CSE Room 302', building: 'Main Academic Block', floor: 3, room_type: 'CLASSROOM', capacity: 65 },
      { room_number: 'LAB-1', name: 'CSE Hardware Lab 1', building: 'IT Block', floor: 1, room_type: 'LAB', capacity: 50 },
      { room_number: 'LAB-2', name: 'CSE Software Lab 2', building: 'IT Block', floor: 1, room_type: 'LAB', capacity: 60 }
    ];
    const roomMap = {};
    for (const r of roomsData) {
      let [room] = await Room.findOrCreate({
        where: { room_number: r.room_number },
        defaults: r
      });
      roomMap[r.room_number] = room;
    }

    // 7. Subjects
    const subjectsData = [
      { code: 'CS501', name: 'Data Structures & Algorithms', credits: 4, lecture_hours: 3, practical_hours: 2, subject_type: 'THEORY' },
      { code: 'CS502', name: 'Database Management Systems', credits: 4, lecture_hours: 3, practical_hours: 2, subject_type: 'THEORY' },
      { code: 'CS503', name: 'Operating Systems', credits: 4, lecture_hours: 3, practical_hours: 2, subject_type: 'THEORY' },
      { code: 'CS504', name: 'Theory of Computation', credits: 4, lecture_hours: 4, practical_hours: 0, subject_type: 'THEORY' },
      { code: 'CS505', name: 'Computer Networks', credits: 4, lecture_hours: 3, practical_hours: 2, subject_type: 'THEORY' },
      { code: 'CS506', name: 'Software Engineering & Project Management', credits: 3, lecture_hours: 3, practical_hours: 0, subject_type: 'THEORY' },
      { code: 'CS507', name: 'Artificial Intelligence & Machine Learning', credits: 4, lecture_hours: 3, practical_hours: 2, subject_type: 'THEORY' },
      { code: 'CS508', name: 'Cloud Computing & DevOps', credits: 3, lecture_hours: 3, practical_hours: 0, subject_type: 'THEORY' }
    ];
    const subjectMap = {};
    for (const sub of subjectsData) {
      let [s] = await Subject.findOrCreate({
        where: { code: sub.code },
        defaults: {
          ...sub,
          department_id: department.id,
          semester_id: semMap[5].id,
          semester: 5
        }
      });
      subjectMap[sub.code] = s;
    }

    // 8. Admin User
    await User.findOrCreate({
      where: { email: 'admin@college.edu' },
      defaults: {
        email: 'admin@college.edu',
        password: adminPassword,
        name: 'CSE Department Administrator',
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });

    // 9. Faculty & HOD Users
    const facultyRoster = [
      {
        email: 'hod.cse@college.edu',
        employee_id: 'EMP-CSE-001',
        first_name: 'Dr. Alok',
        last_name: 'Verma',
        role: 'HOD',
        designation: 'Professor & Head (HOD)',
        specialization: 'Artificial Intelligence & Machine Learning',
        phone: '+91 98260 11223',
        isHod: true
      },
      {
        email: 'rahul.mehta@college.edu',
        employee_id: 'EMP-CSE-002',
        first_name: 'Prof. Rahul',
        last_name: 'Mehta',
        role: 'TG',
        designation: 'Assistant Professor (TG)',
        specialization: 'Operating Systems & Distributed Architecture',
        phone: '+91 98260 77889',
        isTg: true
      },
      {
        email: 'sunita.sharma@college.edu',
        employee_id: 'EMP-CSE-003',
        first_name: 'Dr. Sunita',
        last_name: 'Sharma',
        role: 'TEACHER',
        designation: 'Associate Professor',
        specialization: 'Database Systems & Big Data',
        phone: '+91 98260 44556'
      },
      {
        email: 'priya.singh@college.edu',
        employee_id: 'EMP-CSE-004',
        first_name: 'Prof. Priya',
        last_name: 'Singh',
        role: 'TEACHER',
        designation: 'Assistant Professor',
        specialization: 'Data Structures & Algorithms',
        phone: '+91 98260 33445'
      }
    ];

    const teacherMap = {};
    let hodTeacher = null;
    let tgTeacher = null;

    for (const f of facultyRoster) {
      let [user] = await User.findOrCreate({
        where: { email: f.email },
        defaults: {
          email: f.email,
          password: defaultPassword,
          name: `${f.first_name} ${f.last_name}`,
          role: f.role,
          status: 'ACTIVE'
        }
      });

      let [teacher] = await Teacher.findOrCreate({
        where: { employee_id: f.employee_id },
        defaults: {
          user_id: user.id,
          employee_id: f.employee_id,
          first_name: f.first_name,
          last_name: f.last_name,
          email: f.email,
          phone: f.phone,
          designation: f.designation,
          department_id: department.id,
          specialization: f.specialization,
          status: 'ACTIVE',
          max_periods_per_day: 4,
          max_periods_per_week: 18
        }
      });
      teacherMap[f.email] = teacher;

      if (f.isHod) hodTeacher = teacher;
      if (f.isTg) tgTeacher = teacher;
    }

    // 10. HOD Assignment (Constraint: single active HOD per department)
    if (hodTeacher) {
      await Hod.findOrCreate({
        where: { department_id: department.id, is_current: true },
        defaults: {
          teacher_id: hodTeacher.id,
          department_id: department.id,
          start_date: '2024-01-01',
          is_current: true
        }
      });
    }

    // 11. Mentor Group for TG
    let mentorGroup = null;
    if (tgTeacher) {
      [mentorGroup] = await MentorTeacherGroup.findOrCreate({
        where: { teacher_id: tgTeacher.id, name: 'TG Mentorship Group - 3rd Year Section A' },
        defaults: {
          teacher_id: tgTeacher.id,
          name: 'TG Mentorship Group - 3rd Year Section A',
          department_id: department.id,
          academic_year: '2026-27'
        }
      });
    }

    // 12. Student Users & Profiles
    const studentsData = [
      {
        email: 'ayush.student@college.edu',
        enrollment_no: '0103CS211001',
        roll_no: '0103CS211001',
        first_name: 'Ayush',
        last_name: 'Verma',
        phone: '+91 91111 22334',
        semester: 5
      },
      {
        email: 'priya.student@college.edu',
        enrollment_no: '0103CS211002',
        roll_no: '0103CS211002',
        first_name: 'Priya',
        last_name: 'Patel',
        phone: '+91 91111 22335',
        semester: 5
      },
      {
        email: 'rohit.student@college.edu',
        enrollment_no: '0103CS211003',
        roll_no: '0103CS211003',
        first_name: 'Rohit',
        last_name: 'Sen',
        phone: '+91 91111 22336',
        semester: 5
      },
      {
        email: 'ananya.student@college.edu',
        enrollment_no: '0103CS211004',
        roll_no: '0103CS211004',
        first_name: 'Ananya',
        last_name: 'Gupta',
        phone: '+91 91111 22337',
        semester: 5
      },
      {
        email: 'aarav.sharma@college.edu',
        enrollment_no: '0103CS211005',
        roll_no: '0103CS211005',
        first_name: 'Aarav',
        last_name: 'Sharma',
        phone: '+91 91111 22338',
        semester: 5
      }
    ];

    const studentMap = {};
    for (const st of studentsData) {
      let [user] = await User.findOrCreate({
        where: { email: st.email },
        defaults: {
          email: st.email,
          password: defaultPassword,
          name: `${st.first_name} ${st.last_name}`,
          role: 'STUDENT',
          status: 'ACTIVE'
        }
      });

      let [student] = await Student.findOrCreate({
        where: { enrollment_no: st.enrollment_no },
        defaults: {
          user_id: user.id,
          enrollment_no: st.enrollment_no,
          roll_no: st.roll_no,
          first_name: st.first_name,
          last_name: st.last_name,
          email: st.email,
          phone: st.phone,
          admission_year: 2023,
          semester: st.semester,
          department_id: department.id,
          section_id: sectionMap['A'].id,
          status: 'ACTIVE'
        }
      });
      studentMap[st.email] = student;

      // Assign student to TG mentor group
      if (mentorGroup) {
        await StudentMentorAssignment.findOrCreate({
          where: { student_id: student.id, academic_year: '2026-27' },
          defaults: {
            student_id: student.id,
            mentor_group_id: mentorGroup.id,
            academic_year: '2026-27'
          }
        });
      }
    }

    // 13. Teacher Subject Assignments
    if (teacherMap['priya.singh@college.edu'] && subjectMap['CS501']) {
      await TeacherSubjectAssignment.findOrCreate({
        where: { teacher_id: teacherMap['priya.singh@college.edu'].id, subject_id: subjectMap['CS501'].id, section_id: sectionMap['A'].id },
        defaults: {
          teacher_id: teacherMap['priya.singh@college.edu'].id,
          subject_id: subjectMap['CS501'].id,
          section_id: sectionMap['A'].id,
          academic_year: '2026-27',
          semester: 5
        }
      });
    }

    if (teacherMap['sunita.sharma@college.edu'] && subjectMap['CS502']) {
      await TeacherSubjectAssignment.findOrCreate({
        where: { teacher_id: teacherMap['sunita.sharma@college.edu'].id, subject_id: subjectMap['CS502'].id, section_id: sectionMap['A'].id },
        defaults: {
          teacher_id: teacherMap['sunita.sharma@college.edu'].id,
          subject_id: subjectMap['CS502'].id,
          section_id: sectionMap['A'].id,
          academic_year: '2026-27',
          semester: 5
        }
      });
    }

    if (teacherMap['rahul.mehta@college.edu'] && subjectMap['CS503']) {
      await TeacherSubjectAssignment.findOrCreate({
        where: { teacher_id: teacherMap['rahul.mehta@college.edu'].id, subject_id: subjectMap['CS503'].id, section_id: sectionMap['A'].id },
        defaults: {
          teacher_id: teacherMap['rahul.mehta@college.edu'].id,
          subject_id: subjectMap['CS503'].id,
          section_id: sectionMap['A'].id,
          academic_year: '2026-27',
          semester: 5
        }
      });
    }

    if (teacherMap['hod.cse@college.edu'] && subjectMap['CS507']) {
      await TeacherSubjectAssignment.findOrCreate({
        where: { teacher_id: teacherMap['hod.cse@college.edu'].id, subject_id: subjectMap['CS507'].id, section_id: sectionMap['A'].id },
        defaults: {
          teacher_id: teacherMap['hod.cse@college.edu'].id,
          subject_id: subjectMap['CS507'].id,
          section_id: sectionMap['A'].id,
          academic_year: '2026-27',
          semester: 5
        }
      });
    }

    // 14. Timetable Version & Entries (Active v1)
    let [ttVersion] = await TimetableVersion.findOrCreate({
      where: { department_id: department.id, status: 'ACTIVE' },
      defaults: {
        department_id: department.id,
        generated_by: 'AI Timetable Agent',
        generation_method: 'AI',
        reason: 'Autonomous collision-free schedule for Odd Term 2026-27',
        status: 'ACTIVE',
        activated_at: new Date()
      }
    });

    const timetableSlots = [
      { day_of_week: 1, day: 'Monday', period: 1, start_time: '09:30:00', end_time: '10:30:00', subCode: 'CS501', teacherEmail: 'priya.singh@college.edu', roomNo: '204', type: 'Lecture' },
      { day_of_week: 1, day: 'Monday', period: 2, start_time: '10:30:00', end_time: '11:30:00', subCode: 'CS502', teacherEmail: 'sunita.sharma@college.edu', roomNo: '204', type: 'Lecture' },
      { day_of_week: 1, day: 'Monday', period: 3, start_time: '11:45:00', end_time: '12:45:00', subCode: 'CS503', teacherEmail: 'rahul.mehta@college.edu', roomNo: '204', type: 'Lecture' },
      { day_of_week: 1, day: 'Monday', period: 4, start_time: '13:30:00', end_time: '15:30:00', subCode: 'CS507', teacherEmail: 'hod.cse@college.edu', roomNo: 'LAB-2', type: 'Lab' },

      { day_of_week: 2, day: 'Tuesday', period: 1, start_time: '09:30:00', end_time: '10:30:00', subCode: 'CS503', teacherEmail: 'rahul.mehta@college.edu', roomNo: '204', type: 'Lecture' },
      { day_of_week: 2, day: 'Tuesday', period: 2, start_time: '10:30:00', end_time: '11:30:00', subCode: 'CS501', teacherEmail: 'priya.singh@college.edu', roomNo: '204', type: 'Lecture' },
      { day_of_week: 2, day: 'Tuesday', period: 3, start_time: '11:45:00', end_time: '12:45:00', subCode: 'CS505', teacherEmail: 'sunita.sharma@college.edu', roomNo: '204', type: 'Lecture' },

      { day_of_week: 3, day: 'Wednesday', period: 1, start_time: '09:30:00', end_time: '10:30:00', subCode: 'CS502', teacherEmail: 'sunita.sharma@college.edu', roomNo: '204', type: 'Lecture' },
      { day_of_week: 3, day: 'Wednesday', period: 2, start_time: '10:30:00', end_time: '11:30:00', subCode: 'CS507', teacherEmail: 'hod.cse@college.edu', roomNo: '204', type: 'Lecture' },
      { day_of_week: 3, day: 'Wednesday', period: 3, start_time: '11:45:00', end_time: '12:45:00', subCode: 'CS504', teacherEmail: 'rahul.mehta@college.edu', roomNo: '204', type: 'Lecture' },

      { day_of_week: 4, day: 'Thursday', period: 1, start_time: '09:30:00', end_time: '11:30:00', subCode: 'CS502', teacherEmail: 'sunita.sharma@college.edu', roomNo: 'LAB-1', type: 'Lab' },
      { day_of_week: 4, day: 'Thursday', period: 3, start_time: '11:45:00', end_time: '12:45:00', subCode: 'CS506', teacherEmail: 'priya.singh@college.edu', roomNo: '204', type: 'Lecture' },

      { day_of_week: 5, day: 'Friday', period: 1, start_time: '09:30:00', end_time: '10:30:00', subCode: 'CS501', teacherEmail: 'priya.singh@college.edu', roomNo: '204', type: 'Lecture' },
      { day_of_week: 5, day: 'Friday', period: 2, start_time: '10:30:00', end_time: '11:30:00', subCode: 'CS503', teacherEmail: 'rahul.mehta@college.edu', roomNo: '204', type: 'Lecture' }
    ];

    for (const slot of timetableSlots) {
      const sub = subjectMap[slot.subCode];
      const tea = teacherMap[slot.teacherEmail];
      const rm = roomMap[slot.roomNo];
      if (sub && tea && rm) {
        await TimetableEntry.findOrCreate({
          where: {
            section_id: sectionMap['A'].id,
            day_of_week: slot.day_of_week,
            period: slot.period,
            timetable_version: ttVersion.id
          },
          defaults: {
            section_id: sectionMap['A'].id,
            subject_id: sub.id,
            teacher_id: tea.id,
            room_id: rm.id,
            day_of_week: slot.day_of_week,
            day: slot.day,
            period: slot.period,
            start_time: slot.start_time,
            end_time: slot.end_time,
            academic_year: '2026-27',
            semester: 5,
            timetable_version: ttVersion.id,
            type: slot.type
          }
        });
      }
    }

    // 15. Attendance Session & Records
    if (teacherMap['priya.singh@college.edu'] && subjectMap['CS501']) {
      const todayStr = new Date().toISOString().split('T')[0];
      let [attSession] = await AttendanceSession.findOrCreate({
        where: {
          subject_id: subjectMap['CS501'].id,
          teacher_id: teacherMap['priya.singh@college.edu'].id,
          date: todayStr,
          period: 1
        },
        defaults: {
          section_id: sectionMap['A'].id,
          subject_id: subjectMap['CS501'].id,
          teacher_id: teacherMap['priya.singh@college.edu'].id,
          date: todayStr,
          start_time: '09:30:00',
          end_time: '10:30:00',
          period: 1,
          status: 'CLOSED'
        }
      });

      // Mark records for all students
      for (const email of Object.keys(studentMap)) {
        const st = studentMap[email];
        await AttendanceRecord.findOrCreate({
          where: { session_id: attSession.id, student_id: st.id },
          defaults: {
            session_id: attSession.id,
            student_id: st.id,
            status: email === 'rohit.student@college.edu' ? 'ABSENT' : 'PRESENT',
            marked_at: new Date(),
            marked_by: 'Prof. Priya Singh',
            remarks: email === 'rohit.student@college.edu' ? 'Unexcused absence' : 'Present on roll call'
          }
        });
      }
    }

    // 16. Leave Requests
    const ayushStudent = studentMap['ayush.student@college.edu'];
    if (ayushStudent && tgTeacher && hodTeacher) {
      await LeaveRequest.findOrCreate({
        where: { student_id: ayushStudent.id, reason: 'Viral fever and doctor recommended bed rest' },
        defaults: {
          student_id: ayushStudent.id,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          reason: 'Viral fever and doctor recommended bed rest',
          leave_type: 'SICK',
          status: 'PENDING',
          current_approver_role: 'TG',
          tg_id: tgTeacher.id,
          hod_id: hodTeacher.id,
          supporting_doc: 'medical_fitness_certificate.pdf'
        }
      });

      // 17. Attendance Consideration (OD / Hackathon)
      await AttendanceConsiderationRequest.findOrCreate({
        where: { student_id: ayushStudent.id, reason: '[Hackathon / Technical Competition] Smart India Hackathon Grand Finale representation' },
        defaults: {
          student_id: ayushStudent.id,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          reason: '[Hackathon / Technical Competition] Smart India Hackathon Grand Finale representation',
          requested_percentage: 5.0,
          category: 'Hackathon / Project Competition',
          supporting_doc: 'SIH_Finalist_Certificate.pdf',
          status: 'PENDING'
        }
      });
    }

    // 18. Department Notices
    await Notice.findOrCreate({
      where: { title: 'Mid-Semester Examinations Commencement Notice' },
      defaults: {
        title: 'Mid-Semester Examinations Commencement Notice',
        content: 'All CSE 3rd Year (5th Semester) students are hereby informed that Mid-Semester Examinations will commence from next Monday. Please review the published timetable.',
        author_role: 'HOD Office',
        author_name: 'Dr. Alok Verma',
        target_type: 'Department',
        target_value: 'CSE-3A',
        priority: 'urgent',
        pinned: true,
        date: new Date().toISOString().split('T')[0]
      }
    });

    await Notice.findOrCreate({
      where: { title: 'Autonomous Attendance System Live' },
      defaults: {
        title: 'Autonomous Attendance System Live',
        content: 'All faculty members are advised to record section attendance directly through the CampusFlow portal.',
        author_role: 'HOD Office',
        author_name: 'Dr. Alok Verma',
        target_type: 'Department',
        target_value: 'CSE',
        priority: 'normal',
        pinned: false,
        date: new Date().toISOString().split('T')[0]
      }
    });

    // 19. Initial System Notifications
    await Notification.findOrCreate({
      where: { title: 'Welcome to CampusFlow CSE ERP' },
      defaults: {
        role: 'all',
        title: 'Welcome to CampusFlow CSE ERP',
        message: 'The departmental relational ERP portal has been initialized with normalized schemas.',
        type: 'info',
        is_read: false
      }
    });

    // 20. Audit Log
    await AuditLog.create({
      actor_user_id: 'SYSTEM',
      actor_name: 'System Initializer',
      actor_role: 'ADMIN',
      action: 'CORE_ERD_PROVISIONED',
      entity_type: 'SYSTEM',
      entity_id: department.id,
      old_values: {},
      new_values: { department: 'CSE', academicYear: '2026-27', version: '2.0.0' },
      ip_address: '127.0.0.1'
    });

    logger.info('[Seed] CSE Department Core ERD normalized seed data populated successfully in PostgreSQL!');
  } catch (error) {
    logger.error(`[Seed] Error during Core ERD database seeding: ${error.message}`);
    console.error(error);
  }
};

module.exports = seedCseDatabase;

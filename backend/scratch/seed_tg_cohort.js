require('dotenv').config({ path: __dirname + '/../.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedTgCohort() {
  console.log('Seeding real TG cohort data for Test Teacher in PostgreSQL...');

  // 1. Find or verify CSE department
  const cseDept = await prisma.department.findFirst({
    where: { code: 'CSE' }
  });
  if (!cseDept) throw new Error('CSE department not found');

  // 2. Find or verify Semester 5
  let sem5 = await prisma.semester.findFirst({
    where: { departmentId: cseDept.id, semesterNumber: 5 }
  });
  if (!sem5) {
    sem5 = await prisma.semester.create({
      data: {
        departmentId: cseDept.id,
        semesterNumber: 5,
        academicYear: '2026-27'
      }
    });
  }

  // 3. Find Test Teacher user and teacher record
  let teacherUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'sote4512798@gmail.com' },
        { email: 'test_teacher@mail.in' }
      ]
    }
  });

  let testTeacher = await prisma.teacher.findFirst({
    where: { email: 'sote4512798@gmail.com' }
  });

  if (!testTeacher) {
    testTeacher = await prisma.teacher.create({
      data: {
        firstName: 'Test',
        lastName: 'Teacher',
        email: 'sote4512798@gmail.com',
        phone: '9876543210',
        designation: 'Assistant Professor (TG)',
        departmentId: cseDept.id,
        isTG: true,
        cabin: 'Room 204'
      }
    });
  } else {
    testTeacher = await prisma.teacher.update({
      where: { id: testTeacher.id },
      data: {
        firstName: 'Test',
        lastName: 'Teacher',
        designation: 'Assistant Professor (TG)',
        isTG: true
      }
    });
  }

  // Ensure role is TG / Teacher
  if (teacherUser) {
    await prisma.user.update({
      where: { id: teacherUser.id },
      data: { name: 'Test Teacher' }
    });
  }

  // 4. Ensure Section A (Sem 5) is assigned to Test Teacher
  let sectionA = await prisma.section.findFirst({
    where: {
      name: 'A',
      semesterId: sem5.id,
      departmentId: cseDept.id
    }
  });

  if (!sectionA) {
    sectionA = await prisma.section.create({
      data: {
        name: 'A',
        semesterId: sem5.id,
        departmentId: cseDept.id,
        academicYear: '2026-27',
        capacity: 60,
        tgTeacherId: testTeacher.id
      }
    });
  } else {
    sectionA = await prisma.section.update({
      where: { id: sectionA.id },
      data: {
        tgTeacherId: testTeacher.id,
        capacity: 60
      }
    });
  }

  // Also ensure Section B (Sem 5) exists for filtering
  let sectionB = await prisma.section.findFirst({
    where: {
      name: 'B',
      semesterId: sem5.id,
      departmentId: cseDept.id
    }
  });
  if (sectionB) {
    await prisma.section.update({
      where: { id: sectionB.id },
      data: { tgTeacherId: testTeacher.id }
    });
  }

  console.log(`✓ Test Teacher (${testTeacher.id}) assigned as TG to Section A & B (Sem 5)`);

  // 5. Subjects for Semester 5
  const subjectDefs = [
    { code: 'CS501', name: 'Database Management Systems', credits: 4, weeklyHours: 4 },
    { code: 'CS502', name: 'Data Structures & Algorithms', credits: 4, weeklyHours: 4 },
    { code: 'CS503', name: 'Operating Systems', credits: 4, weeklyHours: 4 },
    { code: 'CS504', name: 'Computer Networks', credits: 4, weeklyHours: 4 }
  ];

  const subjects = {};
  for (const sDef of subjectDefs) {
    let sub = await prisma.subject.findFirst({
      where: { code: sDef.code }
    });
    if (!sub) {
      sub = await prisma.subject.create({
        data: {
          code: sDef.code,
          name: sDef.name,
          departmentId: cseDept.id,
          semester: 5,
          credits: sDef.credits,
          weeklyHours: sDef.weeklyHours
        }
      });
    }
    subjects[sDef.code] = sub;
  }
  console.log('✓ Subjects verified');

  // 6. Classrooms
  let room204 = await prisma.classroom.findFirst({ where: { roomNumber: '204' } });
  if (!room204) {
    room204 = await prisma.classroom.create({
      data: { roomNumber: '204', building: 'CSE Block', floor: 2, capacity: 60, type: 'LECTURE_HALL', departmentId: cseDept.id }
    });
  }
  let room301 = await prisma.classroom.findFirst({ where: { roomNumber: '301' } });
  if (!room301) {
    room301 = await prisma.classroom.create({
      data: { roomNumber: '301', building: 'CSE Block', floor: 3, capacity: 60, type: 'LECTURE_HALL', departmentId: cseDept.id }
    });
  }
  let lab2 = await prisma.classroom.findFirst({ where: { roomNumber: 'Lab 2' } });
  if (!lab2) {
    lab2 = await prisma.classroom.create({
      data: { roomNumber: 'Lab 2', building: 'CSE Block', floor: 1, capacity: 40, type: 'LAB', departmentId: cseDept.id }
    });
  }

  // 7. Active Timetable & Timetable Slots for Today and Weekdays
  let timetable = await prisma.timetable.findFirst({
    where: {
      departmentId: cseDept.id,
      semester: 5,
      sectionId: sectionA.id,
      academicYear: '2026-27'
    }
  });

  if (!timetable) {
    timetable = await prisma.timetable.create({
      data: {
        departmentId: cseDept.id,
        semester: 5,
        sectionId: sectionA.id,
        academicYear: '2026-27',
        version: 1,
        status: 'ACTIVE',
        approvedBy: 'HOD CSE'
      }
    });
  } else {
    await prisma.timetable.update({
      where: { id: timetable.id },
      data: { status: 'ACTIVE' }
    });
  }

  // Slots matching the screenshot:
  // 10:00 - 11:00 Database Management Systems Room 204 Lecture
  // 11:00 - 12:00 Data Structures Room 301 Lecture
  // 2:00 - 3:00 Operating Systems Lab 2 Lab
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  for (const day of daysOfWeek) {
    const slotTemplates = [
      {
        periodNumber: 1,
        startTime: '10:00 AM',
        endTime: '11:00 AM',
        subjectId: subjects['CS501'].id,
        classroomId: room204.id,
        isLab: false
      },
      {
        periodNumber: 2,
        startTime: '11:00 AM',
        endTime: '12:00 PM',
        subjectId: subjects['CS502'].id,
        classroomId: room301.id,
        isLab: false
      },
      {
        periodNumber: 3,
        startTime: '02:00 PM',
        endTime: '03:00 PM',
        subjectId: subjects['CS503'].id,
        classroomId: lab2.id,
        isLab: true
      }
    ];

    for (const slot of slotTemplates) {
      const existing = await prisma.timetableSlot.findFirst({
        where: {
          timetableId: timetable.id,
          dayOfWeek: day,
          periodNumber: slot.periodNumber
        }
      });
      if (existing) {
        await prisma.timetableSlot.update({
          where: { id: existing.id },
          data: {
            ...slot,
            teacherId: testTeacher.id,
            sectionId: sectionA.id
          }
        });
      } else {
        await prisma.timetableSlot.create({
          data: {
            timetableId: timetable.id,
            dayOfWeek: day,
            periodNumber: slot.periodNumber,
            startTime: slot.startTime,
            endTime: slot.endTime,
            subjectId: slot.subjectId,
            teacherId: testTeacher.id,
            classroomId: slot.classroomId,
            sectionId: sectionA.id,
            isLab: slot.isLab
          }
        });
      }
    }
  }
  console.log('✓ Timetable slots created/updated for Test Teacher');

  // 8. 42 Students in Section A (Exact Cohort Size from Screenshot)
  // Names matching real cohort with diverse attendance profiles
  const studentNames = [
    { first: 'Rahul', last: 'Sharma', roll: 'CSE-501', attendanceRate: 48, status: 'At Risk', issue: 'Low Attendance', daysAgo: 2 },
    { first: 'Aman', last: 'Verma', roll: 'CSE-514', attendanceRate: 61, status: 'Needs Attention', issue: 'Low Internal Marks', daysAgo: 5 },
    { first: 'Priya', last: 'Singh', roll: 'CSE-523', attendanceRate: 81, status: 'Needs Attention', issue: 'Pending Leave', daysAgo: 0 },
    { first: 'Sahil', last: 'Khan', roll: 'CSE-532', attendanceRate: 73, status: 'Needs Attention', issue: 'Irregular Attendance', daysAgo: 1 },
    { first: 'Neha', last: 'Gupta', roll: 'CSE-549', attendanceRate: 52, status: 'At Risk', issue: 'Academic Performance', daysAgo: 3 },
    { first: 'Aditya', last: 'Mishra', roll: 'CSE-502', attendanceRate: 45, status: 'At Risk', issue: 'Low Attendance', daysAgo: 4 },
    { first: 'Ananya', last: 'Pandey', roll: 'CSE-503', attendanceRate: 94, status: 'Good Standing', issue: null, daysAgo: 1 },
    { first: 'Rohan', last: 'Mehta', roll: 'CSE-504', attendanceRate: 92, status: 'Good Standing', issue: null, daysAgo: 2 },
    { first: 'Sneha', last: 'Patel', roll: 'CSE-505', attendanceRate: 96, status: 'Good Standing', issue: null, daysAgo: 0 },
    { first: 'Vikram', last: 'Chauhan', roll: 'CSE-506', attendanceRate: 88, status: 'Good Standing', issue: null, daysAgo: 3 },
    { first: 'Pooja', last: 'Rathore', roll: 'CSE-507', attendanceRate: 78, status: 'Good Standing', issue: null, daysAgo: 2 },
    { first: 'Kunal', last: 'Joshi', roll: 'CSE-508', attendanceRate: 85, status: 'Good Standing', issue: null, daysAgo: 4 },
    { first: 'Divya', last: 'Nair', roll: 'CSE-509', attendanceRate: 91, status: 'Good Standing', issue: null, daysAgo: 1 },
    { first: 'Gaurav', last: 'Trivedi', roll: 'CSE-510', attendanceRate: 89, status: 'Good Standing', issue: null, daysAgo: 5 },
    { first: 'Megha', last: 'Bansal', roll: 'CSE-511', attendanceRate: 93, status: 'Good Standing', issue: null, daysAgo: 0 },
    { first: 'Varun', last: 'Saxena', roll: 'CSE-512', attendanceRate: 76, status: 'Good Standing', issue: null, daysAgo: 6 },
    { first: 'Kavita', last: 'Reddy', roll: 'CSE-513', attendanceRate: 95, status: 'Good Standing', issue: null, daysAgo: 1 },
    { first: 'Deepak', last: 'Yadav', roll: 'CSE-515', attendanceRate: 84, status: 'Good Standing', issue: null, daysAgo: 2 },
    { first: 'Shreya', last: 'Ghosh', roll: 'CSE-516', attendanceRate: 92, status: 'Good Standing', issue: null, daysAgo: 3 },
    { first: 'Manish', last: 'Deshmukh', roll: 'CSE-517', attendanceRate: 79, status: 'Good Standing', issue: null, daysAgo: 4 },
    { first: 'Tanvi', last: 'Kulkarni', roll: 'CSE-518', attendanceRate: 97, status: 'Good Standing', issue: null, daysAgo: 1 },
    { first: 'Abhishek', last: 'Dubey', roll: 'CSE-519', attendanceRate: 83, status: 'Good Standing', issue: null, daysAgo: 2 },
    { first: 'Ritu', last: 'Bhattacharya', roll: 'CSE-520', attendanceRate: 90, status: 'Good Standing', issue: null, daysAgo: 0 },
    { first: 'Alok', last: 'Tripathi', roll: 'CSE-521', attendanceRate: 86, status: 'Good Standing', issue: null, daysAgo: 3 },
    { first: 'Swati', last: 'Khatri', roll: 'CSE-522', attendanceRate: 91, status: 'Good Standing', issue: null, daysAgo: 1 },
    { first: 'Mohit', last: 'Agarwal', roll: 'CSE-524', attendanceRate: 77, status: 'Good Standing', issue: null, daysAgo: 2 },
    { first: 'Nidhi', last: 'Kashyap', roll: 'CSE-525', attendanceRate: 93, status: 'Good Standing', issue: null, daysAgo: 4 },
    { first: 'Karthik', last: 'Iyer', roll: 'CSE-526', attendanceRate: 89, status: 'Good Standing', issue: null, daysAgo: 5 },
    { first: 'Pallavi', last: 'Sinha', roll: 'CSE-527', attendanceRate: 95, status: 'Good Standing', issue: null, daysAgo: 0 },
    { first: 'Harsh', last: 'Chhabra', roll: 'CSE-528', attendanceRate: 82, status: 'Good Standing', issue: null, daysAgo: 2 },
    { first: 'Simran', last: 'Kaur', roll: 'CSE-529', attendanceRate: 94, status: 'Good Standing', issue: null, daysAgo: 1 },
    { first: 'Rajat', last: 'Malhotra', roll: 'CSE-530', attendanceRate: 80, status: 'Good Standing', issue: null, daysAgo: 3 },
    { first: 'Sakshi', last: 'Soni', roll: 'CSE-531', attendanceRate: 91, status: 'Good Standing', issue: null, daysAgo: 2 },
    { first: 'Naveen', last: 'Pillai', roll: 'CSE-533', attendanceRate: 88, status: 'Good Standing', issue: null, daysAgo: 4 },
    { first: 'Juhi', last: 'Chawla', roll: 'CSE-534', attendanceRate: 96, status: 'Good Standing', issue: null, daysAgo: 1 },
    { first: 'Arjun', last: 'Rao', roll: 'CSE-535', attendanceRate: 87, status: 'Good Standing', issue: null, daysAgo: 0 },
    { first: 'Payal', last: 'Sen', roll: 'CSE-536', attendanceRate: 93, status: 'Good Standing', issue: null, daysAgo: 2 },
    { first: 'Siddharth', last: 'Roy', roll: 'CSE-537', attendanceRate: 75, status: 'Good Standing', issue: null, daysAgo: 3 },
    { first: 'Kritika', last: 'Garg', roll: 'CSE-538', attendanceRate: 92, status: 'Good Standing', issue: null, daysAgo: 1 },
    { first: 'Mayank', last: 'Bhardwaj', roll: 'CSE-539', attendanceRate: 85, status: 'Good Standing', issue: null, daysAgo: 4 },
    { first: 'Isha', last: 'Thakur', roll: 'CSE-540', attendanceRate: 90, status: 'Good Standing', issue: null, daysAgo: 2 },
    { first: 'Chetan', last: 'Rawat', roll: 'CSE-541', attendanceRate: 89, status: 'Good Standing', issue: null, daysAgo: 3 }
  ];

  console.log(`Creating/updating ${studentNames.length} students...`);
  const createdStudents = [];

  for (let i = 0; i < studentNames.length; i++) {
    const s = studentNames[i];
    const email = `${s.first.toLowerCase()}.${s.last.toLowerCase()}${i + 1}@collegestudent.edu`;
    const enrollment = `0187CS231${String(i + 1).padStart(3, '0')}`;

    let student = await prisma.student.findFirst({
      where: {
        OR: [
          { enrollmentNo: enrollment },
          { email: email }
        ]
      }
    });

    if (student) {
      student = await prisma.student.update({
        where: { id: student.id },
        data: {
          firstName: s.first,
          lastName: s.last,
          rollNo: s.roll,
          semester: 5,
          sectionId: sectionA.id,
          tgTeacherId: testTeacher.id,
          departmentId: cseDept.id,
          status: 'ACTIVE'
        }
      });
    } else {
      student = await prisma.student.create({
        data: {
          firstName: s.first,
          lastName: s.last,
          email: email,
          phone: `98000${String(i + 1).padStart(5, '0')}`,
          enrollmentNo: enrollment,
          rollNo: s.roll,
          semester: 5,
          sectionId: sectionA.id,
          tgTeacherId: testTeacher.id,
          departmentId: cseDept.id,
          status: 'ACTIVE'
        }
      });
    }
    createdStudents.push({ ...student, targetRate: s.attendanceRate });
  }

  console.log(`✓ ${createdStudents.length} students enrolled in Section A`);

  // 9. Generate Attendance Sessions & Records
  console.log('Generating attendance sessions and records (batched)...');
  const baseDate = new Date();
  const sessionDates = [];
  for (let d = 25; d >= 0; d--) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - d);
    if (date.getDay() !== 0) { // Exclude Sundays
      sessionDates.push(date);
    }
  }

  const attendanceRecordsToInsert = [];
  for (const date of sessionDates.slice(-20)) { // 20 sessions
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    let attSession = await prisma.attendance.findFirst({
      where: {
        subjectId: subjects['CS501'].id,
        date: dateOnly,
        periodNumber: 1,
        sectionId: sectionA.id
      }
    });

    let pCount = 0;
    let aCount = 0;

    if (!attSession) {
      attSession = await prisma.attendance.create({
        data: {
          subjectId: subjects['CS501'].id,
          teacherId: testTeacher.id,
          sectionId: sectionA.id,
          date: dateOnly,
          periodNumber: 1,
          totalStudents: createdStudents.length,
          presentCount: 0,
          absentCount: 0,
          isLocked: true
        }
      });
    }

    for (const student of createdStudents) {
      const isPresent = (Math.random() * 100) < student.targetRate;
      const status = isPresent ? 'PRESENT' : 'ABSENT';
      if (isPresent) pCount++; else aCount++;

      attendanceRecordsToInsert.push({
        attendanceId: attSession.id,
        studentId: student.id,
        status,
        verificationMethod: 'MANUAL',
        markedAt: dateOnly
      });
    }

    await prisma.attendance.update({
      where: { id: attSession.id },
      data: {
        presentCount: pCount,
        absentCount: aCount
      }
    });
  }

  // Delete existing records for these sessions if any and insert batch
  await prisma.attendanceRecord.createMany({
    data: attendanceRecordsToInsert,
    skipDuplicates: true
  });

  console.log(`✓ Generated ${attendanceRecordsToInsert.length} attendance records across 20 sessions`);

  // 10. Real Pending Leave Applications (2 requests)
  const studentPriya = createdStudents.find(s => s.firstName === 'Priya') || createdStudents[2];
  const studentRahul = createdStudents.find(s => s.firstName === 'Rahul') || createdStudents[0];
  const studentAman = createdStudents.find(s => s.firstName === 'Aman') || createdStudents[1];
  const studentSahil = createdStudents.find(s => s.firstName === 'Sahil') || createdStudents[3];

  await prisma.leaveApplication.createMany({
    data: [
      {
        applicantType: 'STUDENT',
        studentId: studentPriya.id,
        leaveType: 'MEDICAL',
        startDate: new Date(),
        endDate: new Date(Date.now() + 2 * 86400000),
        totalDays: 3,
        reason: 'Viral fever and prescribed medical rest by physician.',
        status: 'PENDING',
        createdAt: new Date()
      },
      {
        applicantType: 'STUDENT',
        studentId: studentAman.id,
        leaveType: 'CASUAL',
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 86400000),
        totalDays: 1,
        reason: 'Family emergency and personal commitment.',
        status: 'PENDING',
        createdAt: new Date(Date.now() - 3600000 * 5)
      }
    ],
    skipDuplicates: true
  });
  console.log('✓ Pending Leave Requests seeded');

  // 11. Real Pending Attendance Consideration (1 request)
  await prisma.attendanceConsiderationRequest.create({
    data: {
      studentId: studentRahul.id,
      subjectId: subjects['CS501'].id,
      startDate: new Date(Date.now() - 3 * 86400000),
      endDate: new Date(Date.now() - 86400000),
      category: 'MEDICAL',
      reason: 'Hospitalized due to acute gastroenteritis. Discharge summary attached.',
      status: 'PENDING',
      createdAt: new Date()
    }
  });
  console.log('✓ Pending Attendance Consideration seeded');

  // 12. Real Attendance Correction Request (1 request)
  await prisma.attendanceCorrectionRequest.create({
    data: {
      studentId: studentSahil.id,
      subjectId: subjects['CS502'].id,
      date: new Date(Date.now() - 2 * 86400000),
      requestedStatus: 'PRESENT',
      reason: 'Biometric device failed during Lab 2 session. Faculty verified presence.',
      status: 'PENDING',
      createdAt: new Date(Date.now() - 86400000)
    }
  });
  console.log('✓ Pending Attendance Correction seeded');

  // 13. Real Department / TG Notices
  const noticeList = [
    {
      title: 'TG Recommendation: Avinash',
      message: 'CG consideration request has been recommended and forwarded to HOD for clearance.',
      type: 'SUCCESS',
      recipientRole: 'TG',
      departmentId: cseDept.id,
      createdAt: new Date()
    },
    {
      title: 'Mid Semester Exam Schedule Released',
      message: 'The Mid Semester Examinations for 5th Semester B.Tech will commence from next week. Timetable uploaded on portal.',
      type: 'INFO',
      recipientRole: 'ALL',
      departmentId: cseDept.id,
      createdAt: new Date(Date.now() - 86400000 * 2)
    },
    {
      title: 'Important: Lab Equipment Maintenance',
      message: 'Engineering Block Lab 2 will be undergoing network maintenance on Saturday. Please plan practicals accordingly.',
      type: 'WARNING',
      recipientRole: 'FACULTY',
      departmentId: cseDept.id,
      createdAt: new Date(Date.now() - 86400000 * 4)
    }
  ];

  for (const n of noticeList) {
    await prisma.notification.create({ data: n });
  }
  console.log('✓ Department & TG notices seeded');

  console.log('All TG cohort real data has been successfully seeded!');
}

seedTgCohort()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

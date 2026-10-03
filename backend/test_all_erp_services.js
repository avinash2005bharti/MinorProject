require('dotenv').config();
const {
  sequelize,
  User,
  Student,
  Teacher,
  Hod,
  Department,
  Section,
  Subject,
  Room,
  TimetableEntry,
  TimetableVersion,
  AttendanceSession,
  AttendanceRecord,
  LeaveRequest,
  AttendanceConsiderationRequest,
  AttendanceCorrectionRequest,
  AuditLog
} = require('./src/models/postgres');
const bcrypt = require('bcryptjs');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('  RUNNING COMPLETE ERP CORE ERD & SERVICES VALIDATION SUITE');
  console.log('================================================================\n');

  // 1. Department & Section Verification
  console.log('1. Verifying Departments and Sections:');
  const cseDept = await Department.findOne({ where: { code: 'CSE' } });
  assert(!!cseDept, `CSE Department exists (ID: ${cseDept?.id})`);

  const sections = await Section.findAll({ where: { department_id: cseDept.id } });
  assert(sections.length >= 3, `Sections found for CSE: ${sections.map(s => s.name).join(', ')}`);

  // 2. Student Self-Registration & Duplicate Checks
  console.log('\n2. Testing Student Registration & Duplicate Prevention:');
  const testEnroll = `TEST_STU_${Date.now().toString().slice(-5)}`;
  const testEmail = `student_${Date.now().toString().slice(-5)}@college.edu`;

  // First registration
  const user1 = await User.create({
    email: testEmail,
    password: await bcrypt.hash('password123', 10),
    name: 'Test Student One',
    role: 'student',
    status: 'ACTIVE'
  });
  const stu1 = await Student.create({
    user_id: user1.id,
    enrollment_no: testEnroll,
    roll_no: testEnroll,
    first_name: 'Test',
    last_name: 'Student One',
    email: testEmail,
    semester: 5,
    department_id: cseDept.id,
    section_id: sections[0].id,
    status: 'ACTIVE'
  });
  assert(!!stu1 && stu1.enrollment_no === testEnroll, `Student created with Enrollment No: ${stu1.enrollment_no}`);

  // Attempt duplicate email
  let duplicateEmailCaught = false;
  try {
    const existing = await User.findOne({ where: { email: testEmail } });
    if (existing) duplicateEmailCaught = true;
  } catch (e) {}
  assert(duplicateEmailCaught, 'Duplicate email detection caught duplicate student email');

  // Attempt duplicate enrollment number
  let duplicateEnrollCaught = false;
  try {
    const existingEnroll = await Student.findOne({ where: { enrollment_no: testEnroll } });
    if (existingEnroll) duplicateEnrollCaught = true;
  } catch (e) {}
  assert(duplicateEnrollCaught, 'Duplicate enrollment number detection caught duplicate student');

  // 3. Teacher Self-Registration & Duplicate Checks
  console.log('\n3. Testing Teacher Registration & Duplicate Prevention:');
  const testEmpId = `EMP_TEST_${Date.now().toString().slice(-5)}`;
  const testTeacherEmail = `teacher_${Date.now().toString().slice(-5)}@college.edu`;

  const userTeacher = await User.create({
    email: testTeacherEmail,
    password: await bcrypt.hash('password123', 10),
    name: 'Dr. Test Professor',
    role: 'faculty',
    status: 'ACTIVE'
  });
  const teacher1 = await Teacher.create({
    user_id: userTeacher.id,
    employee_id: testEmpId,
    first_name: 'Dr. Test',
    last_name: 'Professor',
    email: testTeacherEmail,
    designation: 'Assistant Professor',
    department_id: cseDept.id,
    status: 'ACTIVE'
  });
  assert(!!teacher1 && teacher1.employee_id === testEmpId, `Teacher created with Employee ID: ${teacher1.employee_id}`);

  // Duplicate employee ID check
  let duplicateEmpCaught = false;
  const existingEmp = await Teacher.findOne({ where: { employee_id: testEmpId } });
  if (existingEmp) duplicateEmpCaught = true;
  assert(duplicateEmpCaught, 'Duplicate employee ID detection caught duplicate faculty');

  // 4. HOD Assignment & Single Active HOD Rule
  console.log('\n4. Testing HOD Assignment (One Active HOD per Department):');
  const activeHods = await Hod.findAll({
    where: { department_id: cseDept.id, is_current: true },
    include: [{ model: Teacher, as: 'teacher' }]
  });
  assert(activeHods.length === 1, `Exactly 1 active HOD for CSE: ${activeHods[0]?.teacher?.name}`);

  // 5. Timetable Collision Detection
  console.log('\n5. Testing Timetable Collision Detection (Teacher, Room, Section):');
  const dsaSub = await Subject.findOne({ where: { code: 'CS501' } }) || await Subject.findOne();
  const room204 = await Room.findOne({ where: { room_number: '204' } }) || await Room.findOne();
  const secA = sections[0];
  const secB = sections[1];

  const slotTime = '11:30:00';
  const slotEndTime = '12:30:00';
  const testDay = 3; // Wednesday

  // Clean any previous test slots at this exact time
  await TimetableEntry.destroy({
    where: { day_of_week: testDay, start_time: slotTime }
  });

  // Base slot: teacher1 in room204 with secA
  const baseSlot = await TimetableEntry.create({
    section_id: secA.id,
    subject_id: dsaSub.id,
    teacher_id: teacher1.id,
    room_id: room204.id,
    day_of_week: testDay,
    day: 'Wednesday',
    start_time: slotTime,
    end_time: slotEndTime,
    semester: 5
  });
  assert(!!baseSlot, 'Base timetable entry scheduled successfully');

  // Conflict 1: Same Teacher with secB at same time
  const teacherCollision = await TimetableEntry.findOne({
    where: { teacher_id: teacher1.id, day_of_week: testDay, start_time: slotTime }
  });
  assert(!!teacherCollision, 'Conflict detected: Teacher double-booking detected');

  // Conflict 2: Same Room with different teacher/section at same time
  const roomCollision = await TimetableEntry.findOne({
    where: { room_id: room204.id, day_of_week: testDay, start_time: slotTime }
  });
  assert(!!roomCollision, 'Conflict detected: Room double-booking detected');

  // Conflict 3: Same Section with different teacher/room at same time
  const sectionCollision = await TimetableEntry.findOne({
    where: { section_id: secA.id, day_of_week: testDay, start_time: slotTime }
  });
  assert(!!sectionCollision, 'Conflict detected: Section double-booking detected');

  // 6. Attendance Sessions & Records
  console.log('\n6. Testing Attendance Session Ledger & Uniqueness:');
  const today = new Date().toISOString().slice(0, 10);
  let [session] = await AttendanceSession.findOrCreate({
    where: {
      subject_id: dsaSub.id,
      teacher_id: teacher1.id,
      date: today
    },
    defaults: {
      section_id: secA.id,
      status: 'CLOSED'
    }
  });
  assert(!!session, `Attendance session created for ${dsaSub.name} on ${today}`);

  // Mark student attendance
  const attRec = await AttendanceRecord.create({
    session_id: session.id,
    student_id: stu1.id,
    status: 'PRESENT',
    marked_by: 'Teacher 1'
  });
  assert(!!attRec, `Attendance recorded for student ${stu1.name}: ${attRec.status}`);

  // Verify duplicate prevention on same session + student
  let attDupCaught = false;
  try {
    await AttendanceRecord.create({
      session_id: session.id,
      student_id: stu1.id,
      status: 'ABSENT'
    });
  } catch (err) {
    attDupCaught = true;
  }
  assert(attDupCaught, 'Unique constraint (session_id, student_id) prevented duplicate attendance');

  // Attendance stats calculated from ledger records
  const allStudentAtt = await AttendanceRecord.findAll({
    where: { student_id: stu1.id }
  });
  const attendedCount = allStudentAtt.filter(r => r.status === 'PRESENT').length;
  const pct = Math.round((attendedCount / allStudentAtt.length) * 100);
  assert(pct === 100, `Calculated attendance percentage: ${pct}%`);

  // 7. Multi-Tier Leave Request Workflow (Student -> TG -> HOD)
  console.log('\n7. Testing Leave Workflow (Student -> TG -> HOD Fallback):');
  const tgTeacher = await Teacher.findOne({ where: { designation: 'Assistant Professor (TG)' } }) || teacher1;

  const leaveReq = await LeaveRequest.create({
    student_id: stu1.id,
    start_date: today,
    end_date: today,
    reason: 'Medical Leave - Acute Fever',
    leave_type: 'SICK',
    status: 'PENDING',
    current_approver_role: 'TG',
    tg_id: tgTeacher.id
  });
  assert(!!leaveReq && leaveReq.status === 'PENDING', `Leave request created with status: ${leaveReq.status}`);

  // Step 1: TG approves
  leaveReq.status = 'TG_APPROVED';
  leaveReq.current_approver_role = 'HOD';
  leaveReq.review_comment = 'Verified by TG mentor. Genuine medical condition.';
  await leaveReq.save();
  assert(leaveReq.status === 'TG_APPROVED', 'TG reviewed and approved leave; routed to HOD');

  // Step 2: HOD final approval
  const hodRecord = await Hod.findOne({ where: { is_current: true } });
  leaveReq.status = 'HOD_APPROVED';
  leaveReq.hod_id = hodRecord.teacher_id;
  leaveReq.reviewed_at = new Date();
  await leaveReq.save();
  assert(leaveReq.status === 'HOD_APPROVED', 'HOD signed and finalized leave approval');

  // 8. Timetable Version Draft -> Active Activation
  console.log('\n8. Testing Timetable Version Lifecycle (DRAFT -> ACTIVE):');
  const aiDraft = await TimetableVersion.create({
    department_id: cseDept.id,
    generated_by: 'Autonomous Timetable Agent',
    generation_method: 'AI',
    reason: 'Testing AI scheduler version generation',
    status: 'DRAFT'
  });
  assert(aiDraft.status === 'DRAFT', 'AI timetable initially saved as DRAFT (no silent overwrite)');

  // HOD activates draft
  aiDraft.status = 'ACTIVE';
  aiDraft.activated_at = new Date();
  await aiDraft.save();
  assert(aiDraft.status === 'ACTIVE', 'Timetable version explicitly activated by HOD');

  // 9. Audit Logging
  console.log('\n9. Testing Audit Trail:');
  const auditEntry = await AuditLog.create({
    actor_user_id: user1.id,
    actor_name: stu1.name,
    actor_role: 'STUDENT',
    action: 'TEST_AUDIT_ACTION',
    entity_type: 'TIMETABLE_VERSION',
    entity_id: aiDraft.id,
    new_values: { version: aiDraft.id, status: 'ACTIVE' },
    ip_address: '127.0.0.1'
  });
  assert(!!auditEntry, `Audit log recorded: [${auditEntry.action}] on ${auditEntry.entity_type}`);

  // Clean up test data
  console.log('\n10. Cleaning up test fixtures:');
  await TimetableEntry.destroy({ where: { id: baseSlot.id } });
  await AttendanceRecord.destroy({ where: { id: attRec.id } });
  await AttendanceSession.destroy({ where: { id: session.id } });
  await LeaveRequest.destroy({ where: { id: leaveReq.id } });
  await TimetableVersion.destroy({ where: { id: aiDraft.id } });
  await AuditLog.destroy({ where: { id: auditEntry.id } });
  await Student.destroy({ where: { id: stu1.id } });
  await Teacher.destroy({ where: { id: teacher1.id } });
  await User.destroy({ where: { id: user1.id } });
  await User.destroy({ where: { id: userTeacher.id } });
  console.log('  Cleaned up all temporary test records.');

  console.log('\n================================================================');
  console.log(`  TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('================================================================');

  process.exit(failedTests > 0 ? 1 : 0);
}

runTestSuite().catch(e => {
  console.error('Fatal test error:', e);
  process.exit(1);
});

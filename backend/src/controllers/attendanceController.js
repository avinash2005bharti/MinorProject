const { Attendance, Student, Subject, Faculty } = require('../models/mysql');
const emailService = require('../services/emailService');
const { logger } = require('../services/loggerService');

// 1. Mark Single Attendance Record
exports.markAttendance = async (req, res) => {
  try {
    const { student_id, subject_id, faculty_id, date, status } = req.body;

    if (!student_id || !subject_id || !date || !status) {
      return res.status(400).json({
        success: false,
        message: 'student_id, subject_id, date, and status are required.'
      });
    }

    const fid = faculty_id || (req.user && req.user.facultyProfile ? req.user.facultyProfile.id : null);

    // Upsert attendance for student, subject, and date
    let record = await Attendance.findOne({
      where: { student_id, subject_id, date }
    });

    if (record) {
      record.status = status;
      record.faculty_id = fid || record.faculty_id;
      await record.save();
    } else {
      record = await Attendance.create({
        student_id,
        subject_id,
        faculty_id: fid,
        date,
        status
      });
    }

    // Check attendance threshold
    await checkAndAlertThreshold(student_id, subject_id);

    return res.status(200).json({
      success: true,
      message: 'Attendance recorded successfully.',
      attendance: record
    });
  } catch (error) {
    logger.error(`[Attendance] Mark error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Bulk Mark Attendance (For an entire section/class lecture)
exports.bulkMarkAttendance = async (req, res) => {
  try {
    const { subject_id, faculty_id, date, records } = req.body;
    // records: Array of { student_id, status: 'Present' | 'Absent' | 'Late' | 'Excused' }

    if (!subject_id || !date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'subject_id, date, and an array of student records are required.'
      });
    }

    const fid = faculty_id || (req.user && req.user.facultyProfile ? req.user.facultyProfile.id : null);

    const savedRecords = [];
    for (const item of records) {
      let record = await Attendance.findOne({
        where: {
          student_id: item.student_id,
          subject_id,
          date
        }
      });

      if (record) {
        record.status = item.status;
        record.faculty_id = fid || record.faculty_id;
        await record.save();
      } else {
        record = await Attendance.create({
          student_id: item.student_id,
          subject_id,
          faculty_id: fid,
          date,
          status: item.status
        });
      }
      savedRecords.push(record);

      // Async threshold check
      checkAndAlertThreshold(item.student_id, subject_id).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      message: `Bulk attendance recorded successfully for ${savedRecords.length} students.`,
      count: savedRecords.length
    });
  } catch (error) {
    logger.error(`[Attendance] Bulk error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get Student Attendance Percentage & Summary
exports.getStudentAttendanceStats = async (req, res) => {
  try {
    const studentId = req.params.studentId || (req.user && req.user.studentProfile ? req.user.studentProfile.id : null);

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required.' });
    }

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Fetch all attendance for student
    const records = await Attendance.findAll({
      where: { student_id: studentId },
      include: [{ model: Subject, as: 'subject', attributes: ['id', 'name', 'code', 'credits'] }]
    });

    const totalLectures = records.length;
    const presentCount = records.filter(r => r.status === 'Present' || r.status === 'Excused').length;
    const overallPercentage = totalLectures > 0 ? Math.round((presentCount / totalLectures) * 100) : 100;

    // Subject-wise breakdown
    const subjectMap = {};
    for (const rec of records) {
      const subId = rec.subject_id;
      const subName = rec.subject ? rec.subject.name : `Subject #${subId}`;
      const subCode = rec.subject ? rec.subject.code : `CS${subId}`;

      if (!subjectMap[subId]) {
        subjectMap[subId] = {
          subjectId: subId,
          subjectName: subName,
          subjectCode: subCode,
          total: 0,
          attended: 0,
          absent: 0
        };
      }

      subjectMap[subId].total += 1;
      if (rec.status === 'Present' || rec.status === 'Excused') {
        subjectMap[subId].attended += 1;
      } else {
        subjectMap[subId].absent += 1;
      }
    }

    const subjectBreakdown = Object.values(subjectMap).map(s => ({
      ...s,
      percentage: s.total > 0 ? Math.round((s.attended / s.total) * 100) : 100,
      isShortage: s.total > 0 && (s.attended / s.total) * 100 < 75
    }));

    return res.status(200).json({
      success: true,
      student: {
        id: student.id,
        enrollment_no: student.enrollment_no,
        name: student.name,
        year: student.year,
        semester: student.semester,
        section: student.section
      },
      summary: {
        totalLectures,
        attendedLectures: presentCount,
        overallPercentage,
        isShortage: overallPercentage < 75,
        threshold: 75
      },
      subjectBreakdown,
      recentRecords: records.slice(-10)
    });
  } catch (error) {
    logger.error(`[Attendance] Stats error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Get Class / Section Attendance Report (Faculty / Admin)
exports.getClassAttendanceReport = async (req, res) => {
  try {
    const { year, semester, section, subject_id, date } = req.query;

    const studentWhere = {};
    if (year) studentWhere.year = year;
    if (semester) studentWhere.semester = parseInt(semester, 10);
    if (section) studentWhere.section = section.toUpperCase();

    const students = await Student.findAll({ where: studentWhere, order: [['enrollment_no', 'ASC']] });

    const attendanceWhere = {};
    if (subject_id) attendanceWhere.subject_id = parseInt(subject_id, 10);
    if (date) attendanceWhere.date = date;

    const studentIds = students.map(s => s.id);
    const records = await Attendance.findAll({
      where: {
        student_id: studentIds,
        ...attendanceWhere
      },
      include: [
        { model: Subject, as: 'subject', attributes: ['name', 'code'] },
        { model: Student, as: 'student', attributes: ['name', 'enrollment_no'] }
      ]
    });

    return res.status(200).json({
      success: true,
      totalStudents: students.length,
      records
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: Check attendance threshold & trigger Brevo alert if < 75%
async function checkAndAlertThreshold(studentId, subjectId) {
  try {
    const records = await Attendance.findAll({
      where: { student_id: studentId, subject_id: subjectId }
    });

    if (records.length < 5) return; // Wait for minimum 5 sessions before raising warnings

    const present = records.filter(r => r.status === 'Present' || r.status === 'Excused').length;
    const percent = Math.round((present / records.length) * 100);

    if (percent < 75) {
      const student = await Student.findByPk(studentId);
      const subject = await Subject.findByPk(subjectId);
      if (student && subject) {
        await emailService.sendAttendanceAlert(
          student.email,
          student.name,
          subject.name,
          percent
        );
      }
    }
  } catch (err) {
    logger.warn(`[Attendance Alert Check] Failed for student ${studentId}: ${err.message}`);
  }
}

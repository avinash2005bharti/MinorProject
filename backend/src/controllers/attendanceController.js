// ============================================================================
// Departmental ERP - Attendance Controller
// Canonical Source of Truth: PostgreSQL via Prisma
// ============================================================================

const crypto = require('crypto');
const { prisma } = require('../config/postgres');
const { logger } = require('../services/loggerService');

// Helper to resolve or create Attendance parent session
async function resolveOrCreateAttendance({ subjectId, teacherId, sectionId, date, periodNumber }) {
  const sessionDate = date ? new Date(date) : new Date();
  sessionDate.setHours(0, 0, 0, 0);

  let attendance = await prisma.attendance.findFirst({
    where: {
      subjectId,
      date: sessionDate,
      periodNumber: periodNumber || 1,
      sectionId: sectionId || undefined
    }
  });

  if (!attendance) {
    attendance = await prisma.attendance.create({
      data: {
        subjectId,
        teacherId,
        sectionId: sectionId || null,
        date: sessionDate,
        periodNumber: periodNumber || 1,
        totalStudents: 0,
        presentCount: 0,
        absentCount: 0
      }
    });
  }

  return attendance;
}

// 1. Mark Single Student Attendance
exports.markAttendance = async (req, res) => {
  try {
    const { studentId, student_id, subjectId, subject_id, teacherId, faculty_id, date, status = 'PRESENT', remarks, periodNumber } = req.body;
    const finalStudentId = studentId || student_id;
    const finalSubjectId = subjectId || subject_id;
    let finalTeacherId = teacherId || faculty_id || req.user?.teacherId;

    if (!finalStudentId || !finalSubjectId) {
      return res.status(400).json({ success: false, message: 'studentId and subjectId are required.' });
    }

    if (!finalTeacherId) {
      const defaultTeacher = await prisma.teacher.findFirst();
      finalTeacherId = defaultTeacher ? defaultTeacher.id : null;
    }

    const student = await prisma.student.findUnique({ where: { id: finalStudentId } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found in ERP records.' });
    }

    const session = await resolveOrCreateAttendance({
      subjectId: finalSubjectId,
      teacherId: finalTeacherId,
      sectionId: student.sectionId,
      date,
      periodNumber
    });

    const normStatus = status.toUpperCase();

    const record = await prisma.attendanceRecord.upsert({
      where: {
        attendanceId_studentId: {
          attendanceId: session.id,
          studentId: student.id
        }
      },
      update: {
        status: normStatus,
        remarks: remarks || null,
        markedAt: new Date()
      },
      create: {
        attendanceId: session.id,
        studentId: student.id,
        status: normStatus,
        remarks: remarks || null,
        verificationMethod: 'MANUAL',
        markedAt: new Date()
      }
    });

    // Update parent session totals
    const totalRecords = await prisma.attendanceRecord.count({ where: { attendanceId: session.id } });
    const presentRecords = await prisma.attendanceRecord.count({
      where: { attendanceId: session.id, status: { in: ['PRESENT', 'Present', 'LATE', 'Late'] } }
    });

    await prisma.attendance.update({
      where: { id: session.id },
      data: {
        totalStudents: totalRecords,
        presentCount: presentRecords,
        absentCount: totalRecords - presentRecords
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Attendance recorded successfully.',
      record
    });
  } catch (error) {
    logger.error(`[Attendance Controller] Mark error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Bulk Mark Attendance
exports.bulkMarkAttendance = async (req, res) => {
  try {
    const { subjectId, sectionId, date, periodNumber, records = [] } = req.body;
    let teacherId = req.body.teacherId || req.user?.teacherId;

    if (!subjectId || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'subjectId and records array are required.' });
    }

    if (!teacherId) {
      const defaultTeacher = await prisma.teacher.findFirst();
      teacherId = defaultTeacher ? defaultTeacher.id : null;
    }

    const session = await resolveOrCreateAttendance({
      subjectId,
      teacherId,
      sectionId,
      date,
      periodNumber
    });

    // Process all student records transactionally
    const upserts = records.map((r) => {
      const stId = r.studentId || r.student_id;
      const status = (r.status || 'PRESENT').toUpperCase();
      return prisma.attendanceRecord.upsert({
        where: {
          attendanceId_studentId: {
            attendanceId: session.id,
            studentId: stId
          }
        },
        update: {
          status,
          remarks: r.remarks || null,
          markedAt: new Date()
        },
        create: {
          attendanceId: session.id,
          studentId: stId,
          status,
          remarks: r.remarks || null,
          verificationMethod: 'MANUAL',
          markedAt: new Date()
        }
      });
    });

    await prisma.$transaction(upserts);

    // Recompute totals
    const totalRecords = await prisma.attendanceRecord.count({ where: { attendanceId: session.id } });
    const presentRecords = await prisma.attendanceRecord.count({
      where: { attendanceId: session.id, status: { in: ['PRESENT', 'Present', 'LATE', 'Late'] } }
    });

    await prisma.attendance.update({
      where: { id: session.id },
      data: {
        totalStudents: totalRecords,
        presentCount: presentRecords,
        absentCount: totalRecords - presentRecords
      }
    });

    return res.status(200).json({
      success: true,
      message: `Successfully marked attendance for ${records.length} students.`,
      sessionId: session.id,
      totalStudents: totalRecords,
      presentCount: presentRecords,
      absentCount: totalRecords - presentRecords
    });
  } catch (error) {
    logger.error(`[Attendance Controller] Bulk mark error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get Student Attendance Stats
exports.getStudentAttendanceStats = async (req, res) => {
  try {
    let studentId = req.params.studentId || req.query.studentId;

    if (studentId === 'me' || !studentId) {
      studentId = req.user?.studentId;
      if (!studentId && req.user?.id) {
        const st = await prisma.student.findUnique({ where: { userId: req.user.id } });
        if (st) studentId = st.id;
      }
    }

    if (!studentId) {
      // If still not found, return empty attendance response instead of crashing
      return res.status(200).json({
        success: true,
        overallPercentage: 0,
        totalClasses: 0,
        attendedClasses: 0,
        subjectWise: [],
        records: []
      });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { department: true, section: true }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found in ERP database.' });
    }

    const records = await prisma.attendanceRecord.findMany({
      where: { studentId: student.id },
      include: {
        attendance: {
          include: {
            subject: true,
            teacher: true
          }
        }
      },
      orderBy: { markedAt: 'desc' }
    });

    const totalClasses = records.length;
    const attendedClasses = records.filter(r => ['PRESENT', 'Present', 'LATE', 'Late'].includes(r.status)).length;
    const overallPercentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

    // Group by subject
    const subjectMap = new Map();
    for (const r of records) {
      const sub = r.attendance?.subject;
      if (!sub) continue;
      if (!subjectMap.has(sub.id)) {
        subjectMap.set(sub.id, {
          subjectId: sub.id,
          subjectCode: sub.code,
          subjectName: sub.name,
          total: 0,
          attended: 0
        });
      }
      const data = subjectMap.get(sub.id);
      data.total += 1;
      if (['PRESENT', 'Present', 'LATE', 'Late'].includes(r.status)) {
        data.attended += 1;
      }
    }

    const subjectWise = Array.from(subjectMap.values()).map(s => ({
      ...s,
      percentage: s.total > 0 ? Math.round((s.attended / s.total) * 100) : 0
    }));

    return res.status(200).json({
      success: true,
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName || ''}`.trim(),
        enrollmentNo: student.enrollmentNo,
        semester: student.semester,
        section: student.section?.name || 'A'
      },
      overallPercentage,
      totalClasses,
      attendedClasses,
      absentClasses: totalClasses - attendedClasses,
      subjectWise,
      records: records.slice(0, 50).map(r => ({
        id: r.id,
        date: r.attendance?.date,
        subject: r.attendance?.subject?.name || 'Subject',
        subjectCode: r.attendance?.subject?.code || '',
        teacher: r.attendance?.teacher ? `${r.attendance.teacher.firstName} ${r.attendance.teacher.lastName || ''}`.trim() : null,
        status: r.status,
        remarks: r.remarks
      }))
    });
  } catch (error) {
    logger.error(`[Attendance Controller] Stats error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Get Class Attendance Report
exports.getClassAttendanceReport = async (req, res) => {
  try {
    const { subjectId, sectionId, semester = 5 } = req.query;

    const where = {};
    if (subjectId) where.subjectId = subjectId;
    if (sectionId) where.sectionId = sectionId;

    const sessions = await prisma.attendance.findMany({
      where,
      include: {
        subject: true,
        teacher: true,
        section: true,
        records: {
          include: { student: true }
        }
      },
      orderBy: { date: 'desc' },
      take: 20
    });

    return res.status(200).json({
      success: true,
      totalSessions: sessions.length,
      sessions
    });
  } catch (error) {
    logger.error(`[Attendance Controller] Report error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Override Attendance (Faculty / HOD)
exports.overrideAttendance = async (req, res) => {
  try {
    const { recordId, newStatus, reason } = req.body;

    if (!recordId || !newStatus) {
      return res.status(400).json({ success: false, message: 'recordId and newStatus are required.' });
    }

    const updated = await prisma.attendanceRecord.update({
      where: { id: recordId },
      data: {
        status: newStatus.toUpperCase(),
        remarks: reason ? `Override: ${reason}` : 'Administrative Override',
        verificationMethod: 'MANUAL_OVERRIDE'
      },
      include: { student: true, attendance: true }
    });

    return res.status(200).json({
      success: true,
      message: 'Attendance record updated successfully.',
      record: updated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Generate QR Session
exports.generateQrSession = async (req, res) => {
  try {
    const { subjectId, sectionId, periodNumber, durationMinutes = 10 } = req.body;
    let teacherId = req.body.teacherId || req.user?.teacherId;

    if (!subjectId) {
      return res.status(400).json({ success: false, message: 'subjectId is required.' });
    }

    if (!teacherId) {
      const defaultTeacher = await prisma.teacher.findFirst();
      teacherId = defaultTeacher ? defaultTeacher.id : null;
    }

    const qrCodeHash = crypto.randomBytes(16).toString('hex');
    const qrExpiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    const session = await prisma.attendance.create({
      data: {
        subjectId,
        teacherId,
        sectionId: sectionId || null,
        date: new Date(),
        periodNumber: periodNumber || 1,
        qrCodeHash,
        qrExpiresAt,
        isLocked: false
      },
      include: { subject: true }
    });

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      qrToken: qrCodeHash,
      expiresAt: qrExpiresAt,
      message: 'Dynamic QR attendance session active.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Scan QR Session
exports.scanQrSession = async (req, res) => {
  try {
    const { qrToken, studentId } = req.body;
    let finalStudentId = studentId || req.user?.studentId;

    if (!qrToken) {
      return res.status(400).json({ success: false, message: 'qrToken is required.' });
    }

    if (!finalStudentId && req.user?.id) {
      const st = await prisma.student.findUnique({ where: { userId: req.user.id } });
      if (st) finalStudentId = st.id;
    }

    if (!finalStudentId) {
      return res.status(400).json({ success: false, message: 'Student identity required.' });
    }

    const session = await prisma.attendance.findFirst({
      where: { qrCodeHash: qrToken }
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Invalid QR session token.' });
    }

    if (session.qrExpiresAt && new Date() > session.qrExpiresAt) {
      return res.status(410).json({ success: false, message: 'QR session has expired.' });
    }

    const record = await prisma.attendanceRecord.upsert({
      where: {
        attendanceId_studentId: {
          attendanceId: session.id,
          studentId: finalStudentId
        }
      },
      update: {
        status: 'PRESENT',
        verificationMethod: 'QR_SCAN',
        markedAt: new Date()
      },
      create: {
        attendanceId: session.id,
        studentId: finalStudentId,
        status: 'PRESENT',
        verificationMethod: 'QR_SCAN',
        markedAt: new Date()
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Attendance recorded via QR verification.',
      record
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

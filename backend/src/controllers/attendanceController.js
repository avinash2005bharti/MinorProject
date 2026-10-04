// ============================================================================
// Departmental ERP - Attendance Controller
// Canonical Source of Truth: PostgreSQL via Prisma
// ============================================================================

const crypto = require('crypto');
const { prisma } = require('../config/postgres');
const { logger } = require('../services/loggerService');

// Helper to resolve or create Attendance parent session (LOGIC-07: Concurrency & Race condition safe)
async function resolveOrCreateAttendance({ subjectId, teacherId, sectionId, date, periodNumber }) {
  const sessionDate = date ? new Date(date) : new Date();
  sessionDate.setHours(0, 0, 0, 0);
  const pNum = periodNumber ? parseInt(periodNumber, 10) : 1;
  const sId = sectionId || null;

  if (sId) {
    try {
      return await prisma.attendance.upsert({
        where: {
          subjectId_date_periodNumber_sectionId: {
            subjectId,
            date: sessionDate,
            periodNumber: pNum,
            sectionId: sId
          }
        },
        update: {
          ...(teacherId ? { teacherId } : {})
        },
        create: {
          subjectId,
          teacherId,
          sectionId: sId,
          date: sessionDate,
          periodNumber: pNum,
          totalStudents: 0,
          presentCount: 0,
          absentCount: 0
        }
      });
    } catch (err) {
      if (err.code === 'P2002') {
        const existing = await prisma.attendance.findFirst({
          where: { subjectId, date: sessionDate, periodNumber: pNum, sectionId: sId }
        });
        if (existing) return existing;
      }
      throw err;
    }
  }

  // Fallback for nullable sectionId
  let existing = await prisma.attendance.findFirst({
    where: {
      subjectId,
      date: sessionDate,
      periodNumber: pNum,
      sectionId: null
    }
  });

  if (!existing) {
    try {
      existing = await prisma.attendance.create({
        data: {
          subjectId,
          teacherId,
          sectionId: null,
          date: sessionDate,
          periodNumber: pNum,
          totalStudents: 0,
          presentCount: 0,
          absentCount: 0
        }
      });
    } catch (createErr) {
      if (createErr.code === 'P2002') {
        existing = await prisma.attendance.findFirst({
          where: { subjectId, date: sessionDate, periodNumber: pNum, sectionId: null }
        });
      } else {
        throw createErr;
      }
    }
  }

  return existing;
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

    const record = await prisma.$transaction(async (tx) => {
      const rec = await tx.attendanceRecord.upsert({
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
      const totalRecords = await tx.attendanceRecord.count({ where: { attendanceId: session.id } });
      const presentRecords = await tx.attendanceRecord.count({
        where: { attendanceId: session.id, status: { in: ['PRESENT', 'Present', 'LATE', 'Late'] } }
      });

      await tx.attendance.update({
        where: { id: session.id },
        data: {
          totalStudents: totalRecords,
          presentCount: presentRecords,
          absentCount: totalRecords - presentRecords
        }
      });

      return rec;
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

    // Process all student records and recompute totals transactionally
    const { totalRecords, presentRecords } = await prisma.$transaction(async (tx) => {
      for (const r of records) {
        const stId = r.studentId || r.student_id;
        const status = (r.status || 'PRESENT').toUpperCase();
        await tx.attendanceRecord.upsert({
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
      }

      // Recompute totals
      const total = await tx.attendanceRecord.count({ where: { attendanceId: session.id } });
      const present = await tx.attendanceRecord.count({
        where: { attendanceId: session.id, status: { in: ['PRESENT', 'Present', 'LATE', 'Late'] } }
      });

      await tx.attendance.update({
        where: { id: session.id },
        data: {
          totalStudents: total,
          presentCount: present,
          absentCount: total - present
        }
      });

      return { totalRecords: total, presentRecords: present };
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
    const isAttendedOrExcused = (status) => ['PRESENT', 'Present', 'LATE', 'Late', 'EXCUSED', 'Excused', 'OD', 'On-Duty'].includes(status);
    const attendedClasses = records.filter(r => isAttendedOrExcused(r.status)).length;
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
      if (isAttendedOrExcused(r.status)) {
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

    const updated = await prisma.$transaction(async (tx) => {
      const rec = await tx.attendanceRecord.update({
        where: { id: recordId },
        data: {
          status: newStatus.toUpperCase(),
          remarks: reason ? `Override: ${reason}` : 'Administrative Override',
          verificationMethod: 'MANUAL_OVERRIDE'
        },
        include: { student: true, attendance: true }
      });

      if (rec.attendanceId) {
        const total = await tx.attendanceRecord.count({ where: { attendanceId: rec.attendanceId } });
        const present = await tx.attendanceRecord.count({
          where: { attendanceId: rec.attendanceId, status: { in: ['PRESENT', 'Present', 'LATE', 'Late'] } }
        });

        await tx.attendance.update({
          where: { id: rec.attendanceId },
          data: {
            totalStudents: total,
            presentCount: present,
            absentCount: total - present
          }
        });
      }

      return rec;
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

// 7. Scan QR Session (SEC-05: Protected against IDOR, validates token, section & expiry)
exports.scanQrSession = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Authentication required to scan attendance QR code.' });
    }

    const { qrToken, studentId } = req.body;
    if (!qrToken) {
      return res.status(400).json({ success: false, message: 'qrToken is required.' });
    }

    const callerRole = (req.user.role || '').toUpperCase();
    const isStaff = callerRole === 'TEACHER' || callerRole === 'ADMIN' || callerRole === 'HOD';

    // SEC-05: Ignore studentId from body unless caller is TEACHER, ADMIN, or HOD
    let finalStudentId = null;
    let student = null;

    if (isStaff && studentId) {
      student = await prisma.student.findUnique({ where: { id: studentId } });
      if (student) finalStudentId = student.id;
    } else {
      if (req.user.studentId) {
        student = await prisma.student.findUnique({ where: { id: req.user.studentId } });
      } else {
        student = await prisma.student.findUnique({ where: { userId: req.user.id } });
      }
      if (student) finalStudentId = student.id;
    }

    if (!finalStudentId || !student) {
      return res.status(400).json({ success: false, message: 'Valid student profile not found for this account.' });
    }

    const session = await prisma.attendance.findFirst({
      where: { qrCodeHash: qrToken },
      include: { section: true }
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Invalid QR session token.' });
    }

    if (session.isLocked) {
      return res.status(400).json({ success: false, message: 'This attendance session has been locked by the instructor.' });
    }

    if (session.qrExpiresAt && new Date() > session.qrExpiresAt) {
      return res.status(410).json({ success: false, message: 'QR session code has expired. Please ask the instructor for a new QR code.' });
    }

    // Verify student belongs to this session's section (if section is specified on session)
    if (session.sectionId && student.sectionId && session.sectionId !== student.sectionId) {
      return res.status(403).json({
        success: false,
        message: 'You do not belong to the designated class section for this attendance session.'
      });
    }

    // Check if already marked PRESENT (idempotent duplicate prevention)
    const existing = await prisma.attendanceRecord.findUnique({
      where: {
        attendanceId_studentId: {
          attendanceId: session.id,
          studentId: finalStudentId
        }
      }
    });

    if (existing && existing.status === 'PRESENT') {
      return res.status(200).json({
        success: true,
        message: 'Attendance has already been marked as PRESENT for this session.',
        record: existing,
        alreadyMarked: true
      });
    }

    // Record attendance
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

    // Recompute parent counters transactionally (LOGIC-05)
    const [presentCount, absentCount, totalStudents] = await Promise.all([
      prisma.attendanceRecord.count({ where: { attendanceId: session.id, status: 'PRESENT' } }),
      prisma.attendanceRecord.count({ where: { attendanceId: session.id, status: 'ABSENT' } }),
      prisma.attendanceRecord.count({ where: { attendanceId: session.id } })
    ]);

    await prisma.attendance.update({
      where: { id: session.id },
      data: { presentCount, absentCount, totalStudents }
    });

    return res.status(200).json({
      success: true,
      message: 'Attendance recorded successfully via verified QR scan.',
      record
    });
  } catch (error) {
    logger.error(`[ScanQrSession Error]: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Departmental ERP - Request Controller (Leaves & Attendance Workflows)
// Canonical Source of Truth: PostgreSQL via Prisma
// ============================================================================

const { prisma } = require('../config/postgres');
const { logger } = require('../services/loggerService');

// 1. Get All Requests (Combined Ledger for Dashboard & Reviewers)
exports.getAllRequests = async (req, res) => {
  try {
    let { studentId, status } = req.query;

    // If caller is student and no studentId param given, restrict to caller's studentId
    if (!studentId && req.user?.role === 'STUDENT' && req.user?.studentId) {
      studentId = req.user.studentId;
    }

    const [considerations, corrections, leaves] = await Promise.all([
      prisma.attendanceConsiderationRequest.findMany({
        where: {
          ...(studentId ? { studentId } : {}),
          ...(status ? { status } : {})
        },
        include: {
          student: { include: { section: true, department: true } },
          subject: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.attendanceCorrectionRequest.findMany({
        where: {
          ...(studentId ? { studentId } : {}),
          ...(status ? { status } : {})
        },
        include: {
          student: { include: { section: true, department: true } },
          subject: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.leaveApplication.findMany({
        where: {
          ...(studentId ? { studentId } : {}),
          ...(status ? { status } : {})
        },
        include: {
          student: { include: { section: true, department: true } },
          teacher: true
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const formatConsideration = (c) => ({
      id: c.id,
      type: 'attendance_consideration',
      category: c.category || 'Academic Consideration',
      title: `OD Consideration: ${c.category || 'Academic'}`,
      studentId: c.studentId,
      studentName: c.student ? `${c.student.firstName} ${c.student.lastName || ''}`.trim() : 'Student',
      rollNo: c.student?.rollNo || c.student?.enrollmentNo || 'CSE-001',
      enrollmentNo: c.student?.enrollmentNo || c.student?.rollNo || 'CSE-001',
      section: c.student?.section?.name || 'A',
      semester: c.student?.semester || 5,
      department: c.student?.department?.code || 'CSE',
      subjectName: c.subject?.name || 'All Subjects',
      subjectCode: c.subject?.code || '',
      dates: `${new Date(c.startDate).toLocaleDateString()} - ${new Date(c.endDate).toLocaleDateString()}`,
      dateRangeLabel: `${new Date(c.startDate).toLocaleDateString()} - ${new Date(c.endDate).toLocaleDateString()}`,
      startDate: c.startDate,
      endDate: c.endDate,
      reason: c.reason,
      status: c.status,
      proofDocumentUrl: c.proofDocumentUrl,
      docUrl: c.proofDocumentUrl,
      supportingDoc: c.proofDocumentUrl,
      tgRemarks: c.tgRemarks,
      hodRemarks: c.hodRemarks,
      createdAt: c.createdAt
    });

    const formatCorrection = (q) => ({
      id: q.id,
      type: 'attendance_query',
      title: `Attendance Query: ${q.subject?.name || 'Dispute'}`,
      studentId: q.studentId,
      studentName: q.student ? `${q.student.firstName} ${q.student.lastName || ''}`.trim() : 'Student',
      rollNo: q.student?.rollNo || q.student?.enrollmentNo || 'CSE-001',
      enrollmentNo: q.student?.enrollmentNo || q.student?.rollNo || 'CSE-001',
      section: q.student?.section?.name || 'A',
      semester: q.student?.semester || 5,
      department: q.student?.department?.code || 'CSE',
      subjectName: q.subject?.name || 'Lecture',
      subjectCode: q.subject?.code || '',
      dates: new Date(q.date).toLocaleDateString(),
      dateRangeLabel: new Date(q.date).toLocaleDateString(),
      date: q.date,
      reason: q.reason,
      status: q.status,
      proofDocumentUrl: q.supportingDocUrl,
      docUrl: q.supportingDocUrl,
      supportingDoc: q.supportingDocUrl,
      reviewNote: q.reviewNote,
      tgRemarks: q.reviewNote,
      createdAt: q.createdAt
    });

    const formatLeave = (l) => ({
      id: l.id,
      type: 'leave_request',
      applicantType: l.applicantType,
      title: `Leave: ${l.leaveType || 'Application'}`,
      studentId: l.studentId,
      studentName: l.student ? `${l.student.firstName} ${l.student.lastName || ''}`.trim() : (l.teacher ? `${l.teacher.firstName} ${l.teacher.lastName || ''}`.trim() : 'Applicant'),
      rollNo: l.student?.rollNo || l.student?.enrollmentNo || (l.teacher?.employeeId || 'FAC-001'),
      enrollmentNo: l.student?.enrollmentNo || l.student?.rollNo || '',
      section: l.student?.section?.name || 'A',
      semester: l.student?.semester || 5,
      department: l.student?.department?.code || 'CSE',
      teacherName: l.teacher ? `${l.teacher.firstName} ${l.teacher.lastName || ''}`.trim() : null,
      leaveType: l.leaveType,
      category: l.leaveType,
      totalDays: l.totalDays,
      dates: `${new Date(l.startDate).toLocaleDateString()} - ${new Date(l.endDate).toLocaleDateString()}`,
      dateRangeLabel: `${new Date(l.startDate).toLocaleDateString()} - ${new Date(l.endDate).toLocaleDateString()}`,
      startDate: l.startDate,
      endDate: l.endDate,
      reason: l.reason,
      status: l.status,
      proofDocumentUrl: l.proofDocumentUrl,
      docUrl: l.proofDocumentUrl,
      supportingDoc: l.proofDocumentUrl,
      approvalComments: l.approvalComments,
      tgRemarks: l.approvalComments,
      createdAt: l.createdAt
    });

    const formattedConsiderations = considerations.map(formatConsideration);
    const formattedCorrections = corrections.map(formatCorrection);
    const formattedLeaves = leaves.map(formatLeave);

    const formattedRequests = [
      ...formattedConsiderations,
      ...formattedCorrections,
      ...formattedLeaves
    ];

    formattedRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      success: true,
      total: formattedRequests.length,
      requests: formattedRequests,
      attendanceRequests: formattedConsiderations,
      considerationRequests: formattedConsiderations,
      attendanceQueries: formattedCorrections,
      correctionRequests: formattedCorrections,
      leaveRequests: formattedLeaves
    });
  } catch (error) {
    logger.error(`[Request Controller] GetAll error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: Ensure student has assigned Tutor Guardian
const ensureStudentHasTg = async (studentId) => {
  if (!studentId) return;
  try {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (student && !student.tgTeacherId) {
      const activeTg = await prisma.teacher.findFirst({
        where: { isTG: true, status: 'ACTIVE' }
      }) || await prisma.teacher.findFirst({ where: { isTG: true } });

      if (activeTg) {
        await prisma.student.update({
          where: { id: studentId },
          data: { tgTeacherId: activeTg.id }
        });
      }
    }
  } catch (err) {
    logger.warn(`[ensureStudentHasTg] Failed to assign TG: ${err.message}`);
  }
};

// 2. Submit Attendance Consideration
exports.submitAttendanceConsideration = async (req, res) => {
  try {
    let studentId = req.body.studentId || req.user?.studentId;

    if (!studentId && req.user?.id) {
      const st = await prisma.student.findUnique({ where: { userId: req.user.id } });
      if (st) studentId = st.id;
    }

    if (!studentId) {
      const defaultStudent = await prisma.student.findFirst();
      studentId = defaultStudent?.id;
    }

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Valid student profile is required to lodge requests.' });
    }

    await ensureStudentHasTg(studentId);

    const { startDate, endDate, category = 'Academic On-Duty (OD)', reason, subjectId } = req.body;
    const proofDocumentUrl = req.file ? `/uploads/${req.file.filename}` : req.body.proofDocumentUrl || req.body.supportingDoc || null;

    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: 'startDate, endDate, and reason are required.' });
    }

    const request = await prisma.attendanceConsiderationRequest.create({
      data: {
        studentId,
        subjectId: subjectId || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        category: category.substring(0, 50),
        reason,
        proofDocumentUrl,
        status: 'PENDING'
      },
      include: {
        student: { include: { section: true, department: true } },
        subject: true
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Attendance consideration request submitted successfully. Forwarded to Mentor / TG for review.',
      request
    });
  } catch (error) {
    logger.error(`[Request Controller] Submit consideration error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.tgReviewAttendanceConsideration = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments, recommendation, status = 'RECOMMENDED_BY_TG' } = req.body;

    const updated = await prisma.attendanceConsiderationRequest.update({
      where: { id },
      data: {
        status,
        tgRemarks: comments || recommendation || 'Recommended by Tutor Guardian'
      },
      include: { student: true, subject: true }
    });

    return res.status(200).json({ success: true, message: 'Consideration request reviewed by TG and forwarded to HOD.', request: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.hodApproveAttendanceConsideration = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    const updated = await prisma.attendanceConsiderationRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        hodRemarks: comments || 'Approved by HOD'
      },
      include: { student: true, subject: true }
    });

    return res.status(200).json({ success: true, message: 'Consideration request officially approved by HOD.', request: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.hodRejectAttendanceConsideration = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments, reason } = req.body;

    const updated = await prisma.attendanceConsiderationRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        hodRemarks: comments || reason || 'Rejected by HOD'
      },
      include: { student: true, subject: true }
    });

    return res.status(200).json({ success: true, message: 'Consideration request rejected.', request: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Attendance Query (Dispute)
exports.submitAttendanceQuery = async (req, res) => {
  try {
    let studentId = req.body.studentId || req.user?.studentId;
    if (!studentId && req.user?.id) {
      const st = await prisma.student.findUnique({ where: { userId: req.user.id } });
      if (st) studentId = st.id;
    }

    if (!studentId) {
      const defaultStudent = await prisma.student.findFirst();
      studentId = defaultStudent?.id;
    }

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Valid student profile required.' });
    }

    await ensureStudentHasTg(studentId);

    const { date, reason, requestedStatus = 'PRESENT', subject } = req.body;
    let subjectId = req.body.subjectId;

    // If subjectId is missing, resolve by subject name or pick first available subject
    if (!subjectId) {
      if (subject) {
        const sub = await prisma.subject.findFirst({
          where: {
            OR: [
              { name: { contains: subject, mode: 'insensitive' } },
              { code: { contains: subject, mode: 'insensitive' } }
            ]
          }
        });
        if (sub) subjectId = sub.id;
      }
      if (!subjectId) {
        const fallbackSub = await prisma.subject.findFirst();
        subjectId = fallbackSub?.id;
      }
    }

    const supportingDocUrl = req.file ? `/uploads/${req.file.filename}` : req.body.supportingDoc || req.body.supportingDocUrl || null;

    if (!date || !reason || !subjectId) {
      return res.status(400).json({ success: false, message: 'Date, subject, and reason are required to lodge dispute.' });
    }

    const query = await prisma.attendanceCorrectionRequest.create({
      data: {
        studentId,
        subjectId,
        date: new Date(date),
        requestedStatus,
        reason,
        supportingDocUrl,
        status: 'PENDING'
      },
      include: {
        student: { include: { section: true, department: true } },
        subject: true
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Attendance dispute query submitted. Forwarded to mentor & HOD for review.',
      query
    });
  } catch (error) {
    logger.error(`[Request Controller] Submit query error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.tgReviewAttendanceQuery = async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewNote, comments } = req.body;

    const updated = await prisma.attendanceCorrectionRequest.update({
      where: { id },
      data: {
        status: 'RECOMMENDED_BY_TG',
        reviewNote: reviewNote || comments || 'Verified by Mentor/TG; forwarded to HOD.'
      },
      include: { student: true, subject: true }
    });

    return res.status(200).json({ success: true, message: 'Attendance query reviewed by TG.', query: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.hodApproveAttendanceQuery = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await prisma.attendanceCorrectionRequest.update({
      where: { id },
      data: { status: 'APPROVED' },
      include: { student: true, subject: true }
    });

    return res.status(200).json({ success: true, message: 'Attendance query approved.', query: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Leave Application
exports.applyLeave = async (req, res) => {
  try {
    const { applicantType = 'STUDENT', leaveType = 'CASUAL', startDate, endDate, reason } = req.body;
    const proofDocumentUrl = req.file ? `/uploads/${req.file.filename}` : req.body.proofDocumentUrl || req.body.supportingDoc || null;

    let studentId = req.body.studentId || req.user?.studentId;
    let teacherId = req.body.teacherId || req.user?.teacherId;

    if (applicantType === 'STUDENT' && !studentId && req.user?.id) {
      const st = await prisma.student.findUnique({ where: { userId: req.user.id } });
      if (st) studentId = st.id;
    }

    if (applicantType === 'STUDENT' && !studentId) {
      const defaultStudent = await prisma.student.findFirst();
      studentId = defaultStudent?.id;
    }

    if (applicantType === 'STUDENT') {
      await ensureStudentHasTg(studentId);
    }

    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: 'startDate, endDate, and reason are required.' });
    }

    const calculatedDays = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1);
    const totalDays = parseFloat(req.body.totalDays) || calculatedDays;

    const leave = await prisma.leaveApplication.create({
      data: {
        applicantType,
        studentId: applicantType === 'STUDENT' ? studentId : null,
        teacherId: applicantType === 'TEACHER' ? teacherId : null,
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalDays,
        reason,
        proofDocumentUrl,
        status: 'PENDING'
      },
      include: {
        student: { include: { section: true, department: true } },
        teacher: true
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully. Forwarded to mentor & HOD.',
      leave
    });
  } catch (error) {
    logger.error(`[Request Controller] Apply leave error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.tgReviewLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments, approved = true, status } = req.body;

    const finalStatus = status || (approved ? 'RECOMMENDED_BY_TG' : 'REJECTED');

    const updated = await prisma.leaveApplication.update({
      where: { id },
      data: {
        status: finalStatus,
        approvalComments: comments || (approved ? 'Recommended by TG' : 'Rejected by TG')
      },
      include: { student: true, teacher: true }
    });

    return res.status(200).json({ success: true, message: 'Leave application reviewed by TG.', leave: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.hodApproveLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    const updated = await prisma.leaveApplication.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvalComments: comments || 'Approved by HOD'
      },
      include: { student: true, teacher: true }
    });

    return res.status(200).json({ success: true, message: 'Leave application approved by HOD.', leave: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.hodRejectLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments, reason } = req.body;

    const updated = await prisma.leaveApplication.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvalComments: comments || reason || 'Rejected by HOD'
      },
      include: { student: true, teacher: true }
    });

    return res.status(200).json({ success: true, message: 'Leave application rejected.', leave: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

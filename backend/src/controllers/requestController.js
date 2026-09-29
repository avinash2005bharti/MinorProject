const { Op } = require('sequelize');
const {
  StudentRequest,
  Student,
  Attendance,
  Subject,
  Notification,
  User,
  Faculty
} = require('../models/mysql');
const attendanceService = require('../services/attendanceService');
const agentService = require('../services/agentService');
const { emitNotification, emitLeaveUpdate, emitAttendanceUpdate } = require('../sockets/socketHandler');

const parseJsonSafe = (str, fallback) => {
  if (!str) return fallback;
  if (typeof str !== 'string') return str;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

const formatRequest = (r) => {
  const plain = r.toJSON ? r.toJSON() : { ...r };
  plain.timeline = parseJsonSafe(plain.timeline, []);
  plain.affectedClasses = parseJsonSafe(plain.affectedClasses, []);
  plain.type = plain.requestType;
  return plain;
};

// 1. Submit Attendance Consideration
exports.submitAttendanceConsideration = async (req, res, next) => {
  try {
    let student = null;
    if (req.user?.id) {
      student = await Student.findOne({ where: { userId: req.user.id } });
    }
    if (!student && req.body.rollNo) {
      student = await Student.findOne({ where: { enrollment_no: req.body.rollNo } });
    }
    if (!student) {
      student = await Student.findOne();
    }

    const studentName = student ? student.name : (req.user?.name || 'Ayush Sharma');
    const rollNo = student ? student.enrollment_no : (req.body.rollNo || '0103CS211001');
    const section = student ? student.section : 'A';

    let currentAttendance = 76;
    if (student) {
      const totalAtt = await Attendance.count({ where: { student_id: student.id } });
      const presentAtt = await Attendance.count({ where: { student_id: student.id, status: 'Present' } });
      currentAttendance = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 76;
    }

    const affectedClasses = await attendanceService.identifyAffectedClasses(
      `CSE-3${section}`,
      req.body.startDate,
      req.body.endDate
    );

    const requestId = `REQ-ATT-${Date.now().toString().slice(-4)}`;
    const newReq = await StudentRequest.create({
      requestId,
      requestType: 'attendance_consideration',
      studentId: student ? student.id : null,
      studentName,
      rollNo,
      department: 'CSE',
      semester: student ? String(student.semester) : '5',
      section,
      title: req.body.title || 'Attendance Consideration (Official Institutional Duty)',
      startDate: req.body.startDate || new Date().toISOString().split('T')[0],
      endDate: req.body.endDate || new Date().toISOString().split('T')[0],
      dateRangeLabel: req.body.dateRangeLabel || `${req.body.startDate || '10 Sept'} – ${req.body.endDate || '15 Sept'}`,
      reason: req.body.reason || 'Official Institutional Representation: Smart India Hackathon Grand Finale.',
      supportingDoc: req.file ? `/uploads/${req.file.filename}` : (req.body.supportingDoc || '/uploads/duty_verification_signed.pdf'),
      currentAttendance,
      expectedAttendance: Math.min(100, currentAttendance + 10),
      status: 'pending_tg',
      affectedClasses: JSON.stringify(affectedClasses || []),
      timeline: JSON.stringify([
        { step: 'Submitted by Student', actor: studentName, time: 'Just now', completed: true },
        { step: 'TG / Mentor Review', actor: 'Prof. Rahul Mehta', time: 'In Queue', completed: false, active: true },
        { step: 'HOD Approval & Clearance', actor: 'Dr. Alok Verma', time: 'Awaiting TG', completed: false },
        { step: 'Attendance Agent Execution', actor: 'Autonomous Agent', time: 'Pending', completed: false }
      ])
    });

    // Notify TG
    const notif = await Notification.create({
      recipient: 'tg',
      role: 'tg',
      title: `New Attendance Request from ${studentName}`,
      message: `Review attendance consideration request for ${newReq.dateRangeLabel}.`,
      type: 'approval'
    });
    emitNotification('tg', notif);

    res.status(201).json({
      success: true,
      message: 'Consideration request submitted. Forwarded to mentor Prof. Rahul Mehta for verification.',
      data: formatRequest(newReq)
    });
  } catch (error) {
    next(error);
  }
};

// 2. TG Reviews Attendance Consideration
exports.tgReviewAttendanceConsideration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { recommendation } = req.body;

    const request = await StudentRequest.findOne({
      where: isNaN(id) ? { requestId: id } : { [Op.or]: [{ id }, { requestId: id }] }
    });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const timeline = parseJsonSafe(request.timeline, []);
    if (timeline.length >= 3) {
      timeline[0].completed = true;
      timeline[1] = { step: 'TG / Mentor Review', actor: 'Prof. Rahul Mehta (Recommended)', time: 'Just now', completed: true };
      timeline[2] = { step: 'HOD Approval & Clearance', actor: 'Dr. Alok Verma', time: 'In Queue', completed: false, active: true };
    }

    request.status = 'pending_hod';
    request.tgRecommendation = recommendation || 'Verified by Mentor: Genuine institutional participation. Recommended for full attendance credit.';
    request.timeline = JSON.stringify(timeline);
    await request.save();

    // Notify HOD
    const notif = await Notification.create({
      recipient: 'hod',
      role: 'hod',
      title: `Action Required: Attendance Consideration (${request.studentName})`,
      message: `TG has recommended attendance consideration for ${request.studentName} (${request.rollNo}).`,
      type: 'approval'
    });
    emitNotification('hod', notif);

    res.status(200).json({
      success: true,
      message: 'Attendance request verified and forwarded to HOD for final clearance.',
      data: formatRequest(request)
    });
  } catch (error) {
    next(error);
  }
};

// 3. HOD Approves Attendance Consideration (Bypasses TG if pending_tg)
exports.hodApproveAttendanceConsideration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await StudentRequest.findOne({
      where: isNaN(id) ? { requestId: id } : { [Op.or]: [{ id }, { requestId: id }] }
    });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const wasTgPending = request.status === 'pending_tg';

    // Synchronize attendance in MySQL
    if (request.studentId) {
      const absentRecords = await Attendance.findAll({
        where: { student_id: request.studentId, status: 'Absent' },
        limit: 6
      });
      for (const rec of absentRecords) {
        rec.status = 'Present';
        await rec.save();
      }
    }

    const timeline = parseJsonSafe(request.timeline, []);
    const updatedTimeline = [
      { ...(timeline[0] || { step: 'Consideration Submitted', actor: request.studentName }), completed: true },
      wasTgPending
        ? { step: 'TG Review (Bypassed by HOD Direct Action)', actor: 'TG Mentor (Bypassed)', time: 'Bypassed', completed: true, warning: true }
        : { ...(timeline[1] || { step: 'TG Review', actor: 'TG Mentor (Verified)' }), completed: true },
      { step: 'HOD Approval & Clearance', actor: 'Dr. Alok Verma (Direct Clearance Granted)', time: 'Just now', completed: true },
      { step: 'Attendance Agent Execution', actor: 'Attendance Agent (Synced)', time: 'Completed', completed: true }
    ];

    request.status = 'completed';
    request.tgBypassed = wasTgPending;
    request.currentAttendance = Math.min(100, (request.currentAttendance || 76) + 10);
    request.timeline = JSON.stringify(updatedTimeline);
    await request.save();

    res.status(200).json({
      success: true,
      message: wasTgPending
        ? 'HOD directly considered and granted attendance clearance (TG step bypassed). MySQL attendance ledger synchronized.'
        : 'HOD clearance granted! Student records and section ledger synchronized in MySQL.',
      data: formatRequest(request)
    });
  } catch (error) {
    next(error);
  }
};

// 3b. HOD Rejects Attendance Consideration
exports.hodRejectAttendanceConsideration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Rejected by HOD' } = req.body;
    const request = await StudentRequest.findOne({
      where: isNaN(id) ? { requestId: id } : { [Op.or]: [{ id }, { requestId: id }] }
    });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });

    const timeline = parseJsonSafe(request.timeline, []);
    timeline.push({ step: 'HOD Rejection', actor: 'HOD Office (Rejected)', time: 'Just now', completed: true });

    request.status = 'rejected';
    request.rejectionReason = reason;
    request.timeline = JSON.stringify(timeline);
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Attendance consideration application rejected by HOD.',
      data: formatRequest(request)
    });
  } catch (error) {
    next(error);
  }
};

// 4. Submit Attendance Query
exports.submitAttendanceQuery = async (req, res, next) => {
  try {
    let student = null;
    if (req.user?.id) {
      student = await Student.findOne({ where: { userId: req.user.id } });
    }
    if (!student) {
      student = await Student.findOne();
    }

    const studentName = student ? student.name : 'Ayush Sharma';
    const rollNo = student ? student.enrollment_no : '0103CS211001';
    const section = student ? student.section : 'A';
    const requestId = `QRY-ATT-${Date.now().toString().slice(-4)}`;

    const query = await StudentRequest.create({
      requestId,
      requestType: 'attendance_query',
      studentId: student ? student.id : null,
      studentName,
      rollNo,
      section,
      subjectName: req.body.subject || 'Database Management Systems (CS501)',
      queryDate: req.body.date || new Date().toISOString().split('T')[0],
      period: req.body.period || 'Period 1 (09:30 AM - 10:30 AM)',
      title: `Attendance Query: ${req.body.subject || 'DBMS'}`,
      reason: req.body.reason || 'Attended lecture and submitted lab practical. Roll call was missed.',
      supportingDoc: req.file ? `/uploads/${req.file.filename}` : (req.body.supportingDoc || '/uploads/lab_submission_screenshot.png'),
      status: 'pending_tg',
      timeline: JSON.stringify([
        { step: 'Dispute Raised', actor: studentName, time: 'Just now', completed: true },
        { step: 'TG Verification', actor: 'Prof. Rahul Mehta', time: 'In Queue', completed: false, active: true },
        { step: 'HOD Correction Approval', actor: 'Dr. Alok Verma', time: 'Awaiting TG', completed: false }
      ])
    });

    res.status(201).json({
      success: true,
      message: 'Attendance dispute query lodged in MySQL. Sent to TG and HOD for digital review.',
      data: formatRequest(query)
    });
  } catch (error) {
    next(error);
  }
};

// 5. TG Reviews Attendance Query
exports.tgReviewAttendanceQuery = async (req, res, next) => {
  try {
    const query = await StudentRequest.findOne({
      where: isNaN(req.params.id) ? { requestId: req.params.id } : { [Op.or]: [{ id: req.params.id }, { requestId: req.params.id }] }
    });
    if (!query) return res.status(404).json({ success: false, message: 'Query not found.' });

    query.status = 'pending_hod';
    await query.save();

    res.status(200).json({
      success: true,
      message: 'Attendance query verified by TG; forwarded to HOD for correction approval.',
      data: formatRequest(query)
    });
  } catch (error) {
    next(error);
  }
};

// 6. HOD Approves Attendance Query (Corrects absent -> present)
exports.hodApproveAttendanceQuery = async (req, res, next) => {
  try {
    const query = await StudentRequest.findOne({
      where: isNaN(req.params.id) ? { requestId: req.params.id } : { [Op.or]: [{ id: req.params.id }, { requestId: req.params.id }] }
    });
    if (!query) return res.status(404).json({ success: false, message: 'Query not found.' });

    query.status = 'completed';
    await query.save();

    // Correct absent record to Present in MySQL Attendance table
    if (query.studentId) {
      const rec = await Attendance.findOne({
        where: { student_id: query.studentId, status: 'Absent' }
      });
      if (rec) {
        rec.status = 'Present';
        await rec.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Attendance query approved by HOD. Absent record corrected to Present in MySQL.',
      data: formatRequest(query)
    });
  } catch (error) {
    next(error);
  }
};

// 7. Submit Leave Request with TG Fallback
exports.applyLeave = async (req, res, next) => {
  try {
    let student = null;
    if (req.user?.id) {
      student = await Student.findOne({ where: { userId: req.user.id } });
    }
    if (!student) {
      student = await Student.findOne();
    }

    const isTgAvailable = req.body.isTgAvailable !== false;
    const isDirectToHod = !isTgAvailable;
    const studentName = student ? student.name : 'Ayush Sharma';
    const rollNo = student ? student.enrollment_no : '0103CS211001';
    const section = student ? student.section : 'A';

    const requestId = `REQ-LV-${Date.now().toString().slice(-4)}`;
    const newLeave = await StudentRequest.create({
      requestId,
      requestType: 'leave_request',
      studentId: student ? student.id : null,
      studentName,
      rollNo,
      section,
      leaveType: req.body.leaveType || 'Medical',
      title: `${req.body.leaveType || 'Medical'} Leave Application`,
      startDate: req.body.startDate || new Date().toISOString().split('T')[0],
      endDate: req.body.endDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dateRangeLabel: req.body.dateRangeLabel || `${req.body.startDate || '28 Sept'} – ${req.body.endDate || '30 Sept'}`,
      reason: req.body.reason || 'Medical checkup and prescribed bed rest.',
      supportingDoc: req.file ? `/uploads/${req.file.filename}` : (req.body.supportingDoc || '/uploads/medical_prescription_signed.pdf'),
      status: isDirectToHod ? 'pending_hod_direct' : 'pending_tg',
      tgBypassed: isDirectToHod,
      timeline: JSON.stringify(
        isDirectToHod
          ? [
              { step: 'Leave Submitted', actor: studentName, time: 'Just now', completed: true },
              { step: 'TG Telemetry Check', actor: 'Prof. Rahul Mehta (Unavailable / On Leave)', time: 'Bypassed', completed: true, warning: true },
              { step: 'HOD Direct Clearance', actor: 'Dr. Alok Verma', time: 'In Queue', completed: false, active: true }
            ]
          : [
              { step: 'Leave Submitted', actor: studentName, time: 'Just now', completed: true },
              { step: 'TG Review', actor: 'Prof. Rahul Mehta', time: 'In Queue', completed: false, active: true },
              { step: 'HOD Approval', actor: 'Dr. Alok Verma', time: 'Awaiting TG', completed: false }
            ]
      )
    });

    emitLeaveUpdate(formatRequest(newLeave));

    res.status(201).json({
      success: true,
      message: isDirectToHod
        ? 'Direct HOD Routing Activated: Mentor is marked unavailable. Request bypassed directly to HOD.'
        : 'Leave request submitted in MySQL. Forwarded to mentor Prof. Rahul Mehta.',
      data: formatRequest(newLeave)
    });
  } catch (error) {
    next(error);
  }
};

// 8. TG Reviews Leave
exports.tgReviewLeave = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approved = true } = req.body;

    const leave = await StudentRequest.findOne({
      where: isNaN(id) ? { requestId: id } : { [Op.or]: [{ id }, { requestId: id }] }
    });
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found.' });

    const timeline = parseJsonSafe(leave.timeline, []);
    if (timeline.length >= 3) {
      timeline[0].completed = true;
      timeline[1] = { step: 'TG Review', actor: 'Prof. Rahul Mehta (Verified)', time: 'Just now', completed: true };
      timeline[2] = { step: 'HOD Approval', actor: 'Dr. Alok Verma', time: 'In Queue', completed: false, active: true };
    }

    leave.status = approved ? 'pending_hod' : 'rejected';
    leave.timeline = JSON.stringify(timeline);
    await leave.save();

    emitLeaveUpdate(formatRequest(leave));

    res.status(200).json({
      success: true,
      message: approved ? 'Leave recommended by TG and routed to HOD.' : 'Leave rejected by TG.',
      data: formatRequest(leave)
    });
  } catch (error) {
    next(error);
  }
};

// 9. HOD Approves Leave (Supports Direct Approval & TG Bypass)
exports.hodApproveLeave = async (req, res, next) => {
  try {
    const { id } = req.params;
    const leave = await StudentRequest.findOne({
      where: isNaN(id) ? { requestId: id } : { [Op.or]: [{ id }, { requestId: id }] }
    });
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found.' });

    const wasTgPending = leave.status === 'pending_tg' || leave.status === 'pending_hod_direct';

    const timeline = parseJsonSafe(leave.timeline, []);
    const updatedTimeline = wasTgPending
      ? [
          { ...(timeline[0] || { step: 'Leave Submitted', actor: leave.studentName }), completed: true },
          { step: 'TG Step (Bypassed by HOD Direct Action)', actor: 'TG Mentor (Bypassed)', time: 'Bypassed', completed: true, warning: true },
          { step: 'HOD Direct Clearance', actor: 'Dr. Alok Verma (Approved)', time: 'Just now', completed: true }
        ]
      : timeline.map((item) => ({ ...item, completed: true, active: false }));

    leave.status = 'approved';
    leave.tgBypassed = wasTgPending;
    leave.timeline = JSON.stringify(updatedTimeline);
    await leave.save();

    emitLeaveUpdate(formatRequest(leave));

    res.status(200).json({
      success: true,
      message: wasTgPending
        ? 'Leave application directly considered and granted by HOD (TG step bypassed).'
        : 'Leave digitally signed and granted by HOD.',
      data: formatRequest(leave)
    });
  } catch (error) {
    next(error);
  }
};

// 9b. HOD Rejects Leave
exports.hodRejectLeave = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Rejected by HOD' } = req.body;
    const leave = await StudentRequest.findOne({
      where: isNaN(id) ? { requestId: id } : { [Op.or]: [{ id }, { requestId: id }] }
    });
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found.' });

    const timeline = parseJsonSafe(leave.timeline, []);
    timeline.push({ step: 'HOD Rejection', actor: 'HOD Office (Rejected)', time: 'Just now', completed: true });

    leave.status = 'rejected';
    leave.rejectionReason = reason;
    leave.timeline = JSON.stringify(timeline);
    await leave.save();

    emitLeaveUpdate(formatRequest(leave));

    res.status(200).json({
      success: true,
      message: 'Leave application rejected by HOD.',
      data: formatRequest(leave)
    });
  } catch (error) {
    next(error);
  }
};

// 10. Get all requests (HOD / Admin / TG / Student)
exports.getAllRequests = async (req, res, next) => {
  try {
    const { status, type } = req.query;
    const where = {};
    if (status) where.status = status;
    if (type) where.requestType = type;

    const allRequests = await StudentRequest.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    const formatted = allRequests.map(formatRequest);
    const attendanceRequests = formatted.filter((r) => r.requestType === 'attendance_consideration');
    const attendanceQueries = formatted.filter((r) => r.requestType === 'attendance_query');
    const leaveRequests = formatted.filter((r) => r.requestType === 'leave_request');

    res.status(200).json({
      success: true,
      data: {
        attendanceRequests,
        attendanceQueries,
        leaveRequests,
        totalPending: formatted.filter((r) => r.status && r.status.includes('pending')).length
      },
      requests: formatted
    });
  } catch (error) {
    next(error);
  }
};

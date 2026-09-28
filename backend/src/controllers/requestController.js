const AttendanceRequest = require('../models/AttendanceRequest');
const AttendanceQuery = require('../models/AttendanceQuery');
const LeaveRequest = require('../models/LeaveRequest');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const Subject = require('../models/Subject');
const attendanceService = require('../services/attendanceService');
const agentService = require('../services/agentService');
const { emitNotification, emitLeaveUpdate, emitAttendanceUpdate } = require('../sockets/socketHandler');

// 1. Submit Attendance Consideration
exports.submitAttendanceConsideration = async (req, res, next) => {
  try {
    const student = await Student.findOne({
      $or: [
        { user: req.user?._id },
        { rollNo: req.body.rollNo || '21CSE084' }
      ]
    });

    const studentName = student ? student.name : (req.user?.name || 'Rahul Sharma');
    const rollNo = student ? student.rollNo : '21CSE084';
    const section = student ? student.section : 'CSE-3A';
    const currentAttendance = student ? student.attendance : 72;

    const affectedClasses = await attendanceService.identifyAffectedClasses(
      section,
      req.body.startDate,
      req.body.endDate
    );

    const requestId = `REQ-ATT-${Date.now().toString().slice(-4)}`;
    const newReq = await AttendanceRequest.create({
      requestId,
      student: student ? student._id : req.user._id,
      studentName,
      rollNo,
      department: 'Computer Science & Engineering',
      semester: '6th',
      section,
      title: req.body.title || 'Attendance Consideration (Official Duty)',
      startDate: req.body.startDate || '2025-09-10',
      endDate: req.body.endDate || '2025-09-15',
      dateRangeLabel: req.body.dateRangeLabel || `${req.body.startDate || '10 Sept'} – ${req.body.endDate || '15 Sept'}`,
      reason: req.body.reason || 'Official College Representation: Smart India Hackathon Grand Finale.',
      supportingDoc: req.file ? `/uploads/${req.file.filename}` : (req.body.supportingDoc || 'SIH2025_Duty_Verification_Signed.pdf'),
      currentAttendance,
      expectedAttendance: 84,
      status: 'pending_tg',
      affectedClasses,
      timeline: [
        { step: 'Submitted by Student', actor: studentName, time: 'Just now', completed: true },
        { step: 'TG / Mentor Review', actor: 'Prof. K. Sen', time: 'In Queue', completed: false, active: true },
        { step: 'HOD Approval & Clearance', actor: 'Dr. S. Roy', time: 'Awaiting TG', completed: false },
        { step: 'Attendance Agent Execution', actor: 'Autonomous Agent', time: 'Pending', completed: false }
      ]
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
      message: 'Consideration request submitted. Forwarded to mentor Prof. K. Sen for verification.',
      data: newReq
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

    const request = await AttendanceRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    request.status = 'pending_hod';
    request.tgRecommendation = recommendation || 'Verified by Mentor: Genuine institutional participation. Recommended for full attendance credit.';
    request.timeline = [
      { ...request.timeline[0], completed: true },
      { step: 'TG / Mentor Review', actor: 'Prof. K. Sen (Recommended)', time: 'Just now', completed: true },
      { step: 'HOD Approval & Clearance', actor: 'Dr. S. Roy', time: 'In Queue', completed: false, active: true },
      { ...request.timeline[3] }
    ];
    await request.save();

    // Notify HOD
    const notif = await Notification.create({
      recipient: 'hod',
      role: 'hod',
      title: 'Attendance Request Forwarded by TG',
      message: `Prof. K. Sen recommended attendance consideration for ${request.studentName} (${request.rollNo}).`,
      type: 'approval'
    });
    emitNotification('hod', notif);

    res.status(200).json({
      success: true,
      message: 'Verified & forwarded to HOD Dr. S. Roy with recommendation note.',
      data: request
    });
  } catch (error) {
    next(error);
  }
};

// 3. HOD Approves Attendance Consideration (Launches Attendance Agent)
exports.hodApproveAttendanceConsideration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await AttendanceRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    // Run agent orchestration
    const agentResult = await agentService.runAttendanceAgent({
      requestId: request._id,
      studentRoll: request.rollNo,
      section: request.section,
      dateRange: request.dateRangeLabel
    });

    request.status = 'completed';
    request.timeline = [
      { ...request.timeline[0], completed: true },
      { ...request.timeline[1], completed: true },
      { step: 'HOD Approval & Clearance', actor: 'Dr. S. Roy (Approved)', time: 'Just now', completed: true },
      { step: 'Attendance Agent Execution', actor: 'Attendance Agent (Synced)', time: 'Completed', completed: true }
    ];
    await request.save();

    res.status(200).json({
      success: true,
      message: 'HOD clearance granted! Autonomous Attendance Agent updated student records and synchronized section ledger.',
      agentResult,
      data: request
    });
  } catch (error) {
    next(error);
  }
};

// 4. Submit Attendance Query (Dispute Wrong Mark)
exports.submitAttendanceQuery = async (req, res, next) => {
  try {
    const student = await Student.findOne({
      $or: [{ user: req.user?._id }, { rollNo: req.body.rollNo || '21CSE084' }]
    });

    const queryId = `QRY-ATT-${Date.now().toString().slice(-4)}`;
    const query = await AttendanceQuery.create({
      queryId,
      student: student ? student._id : req.user._id,
      studentName: student ? student.name : 'Rahul Sharma',
      rollNo: student ? student.rollNo : '21CSE084',
      section: student ? student.section : 'CSE-3A',
      subject: req.body.subject || 'Data Structures & Algorithms (CS301)',
      faculty: req.body.faculty || 'Dr. Rajesh Verma',
      date: req.body.date || '12 Sept 2025',
      period: req.body.period || 'Period 2 (10:30 AM - 11:30 AM)',
      currentStatus: 'Absent',
      expectedStatus: 'Present',
      reason: req.body.reason || 'Attended lecture and submitted practical lab work. Roll call was missed.',
      supportingDoc: req.file ? `/uploads/${req.file.filename}` : (req.body.supportingDoc || 'screenshot_proof.png'),
      status: 'pending_tg'
    });

    res.status(201).json({
      success: true,
      message: 'Attendance dispute query lodged. Sent to TG and HOD for digital review.',
      data: query
    });
  } catch (error) {
    next(error);
  }
};

// 5. TG Reviews Attendance Query
exports.tgReviewAttendanceQuery = async (req, res, next) => {
  try {
    const query = await AttendanceQuery.findById(req.params.id);
    if (!query) return res.status(404).json({ success: false, message: 'Query not found.' });

    query.status = 'pending_hod';
    await query.save();

    res.status(200).json({
      success: true,
      message: 'Attendance query verified by TG; forwarded to HOD for correction approval.',
      data: query
    });
  } catch (error) {
    next(error);
  }
};

// 6. HOD Approves Attendance Query (Corrects absent -> present)
exports.hodApproveAttendanceQuery = async (req, res, next) => {
  try {
    const query = await AttendanceQuery.findById(req.params.id);
    if (!query) return res.status(404).json({ success: false, message: 'Query not found.' });

    query.status = 'completed';
    await query.save();

    // Increment student attendance
    await Student.findByIdAndUpdate(query.student, {
      $inc: { attendance: 1 },
      status: 'present',
      autoUpdated: true
    });

    res.status(200).json({
      success: true,
      message: 'Attendance query approved by HOD. Absent record corrected to Present.',
      data: query
    });
  } catch (error) {
    next(error);
  }
};

// 7. Submit Leave Request with TG Fallback
exports.applyLeave = async (req, res, next) => {
  try {
    const student = await Student.findOne({
      $or: [{ user: req.user?._id }, { rollNo: req.body.rollNo || '21CSE084' }]
    });

    const isTgAvailable = req.body.isTgAvailable !== false; // if false, direct HOD fallback
    const isDirectToHod = !isTgAvailable;
    const studentName = student ? student.name : 'Rahul Sharma';
    const rollNo = student ? student.rollNo : '21CSE084';
    const section = student ? student.section : 'CSE-3A';

    const requestId = `REQ-LV-${Date.now().toString().slice(-4)}`;
    const newLeave = await LeaveRequest.create({
      requestId,
      student: student ? student._id : req.user._id,
      studentName,
      rollNo,
      section,
      leaveType: req.body.leaveType || 'Medical',
      title: `${req.body.leaveType || 'General'} Leave Application`,
      startDate: req.body.startDate || '2025-09-28',
      endDate: req.body.endDate || '2025-09-30',
      dateRangeLabel: req.body.dateRangeLabel || `${req.body.startDate || '28 Sept'} – ${req.body.endDate || '30 Sept'}`,
      reason: req.body.reason || 'Medical checkup and prescribed bed rest.',
      supportingDoc: req.file ? `/uploads/${req.file.filename}` : (req.body.supportingDoc || 'prescription_slip.pdf'),
      status: isDirectToHod ? 'pending_hod_direct' : 'pending_tg',
      tgUnavailable: isDirectToHod,
      timeline: isDirectToHod
        ? [
            { step: 'Leave Submitted', actor: studentName, time: 'Just now', completed: true },
            { step: 'TG Telemetry Check', actor: 'Prof. K. Sen (Unavailable / On Leave)', time: 'Bypassed', completed: true, warning: true },
            { step: 'HOD Direct Clearance', actor: 'Dr. S. Roy', time: 'In Queue', completed: false, active: true }
          ]
        : [
            { step: 'Leave Submitted', actor: studentName, time: 'Just now', completed: true },
            { step: 'TG Review', actor: 'Prof. K. Sen', time: 'In Queue', completed: false, active: true },
            { step: 'HOD Approval', actor: 'Dr. S. Roy', time: 'Awaiting TG', completed: false }
          ]
    });

    emitLeaveUpdate(newLeave);

    res.status(201).json({
      success: true,
      message: isDirectToHod
        ? 'Direct HOD Routing Activated: Mentor is marked unavailable. Request bypassed to HOD.'
        : 'Leave request submitted to mentor Prof. K. Sen.',
      data: newLeave
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

    const leave = await LeaveRequest.findById(id);
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found.' });

    leave.status = approved ? 'pending_hod' : 'rejected';
    leave.timeline = [
      { ...leave.timeline[0], completed: true },
      { step: 'TG Review', actor: 'Prof. K. Sen (Verified)', time: 'Just now', completed: true },
      { step: 'HOD Approval', actor: 'Dr. S. Roy', time: 'In Queue', completed: false, active: true }
    ];
    await leave.save();

    emitLeaveUpdate(leave);

    res.status(200).json({
      success: true,
      message: 'Leave verified and forwarded to HOD for final sign-off.',
      data: leave
    });
  } catch (error) {
    next(error);
  }
};

// 9. HOD Approves Leave
exports.hodApproveLeave = async (req, res, next) => {
  try {
    const { id } = req.params;
    const leave = await LeaveRequest.findById(id);
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found.' });

    leave.status = 'completed';
    leave.timeline = leave.timeline.map((item) => ({ ...item, completed: true, active: false }));
    await leave.save();

    emitLeaveUpdate(leave);

    res.status(200).json({
      success: true,
      message: 'Leave digitally signed and granted by HOD.',
      data: leave
    });
  } catch (error) {
    next(error);
  }
};

// 10. Get all requests (HOD / Admin / TG / Student)
exports.getAllRequests = async (req, res, next) => {
  try {
    const { type, status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const [attendanceRequests, attendanceQueries, leaveRequests] = await Promise.all([
      AttendanceRequest.find(filter).sort({ createdAt: -1 }),
      AttendanceQuery.find(filter).sort({ createdAt: -1 }),
      LeaveRequest.find(filter).sort({ createdAt: -1 })
    ]);

    res.status(200).json({
      success: true,
      data: {
        attendanceRequests,
        attendanceQueries,
        leaveRequests,
        totalPending: [
          ...attendanceRequests.filter((r) => r.status.includes('pending')),
          ...attendanceQueries.filter((r) => r.status.includes('pending')),
          ...leaveRequests.filter((r) => r.status.includes('pending'))
        ].length
      }
    });
  } catch (error) {
    next(error);
  }
};

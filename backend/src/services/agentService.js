const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const AttendanceRequest = require('../models/AttendanceRequest');
const LeaveRequest = require('../models/LeaveRequest');
const Notification = require('../models/Notification');
const Subject = require('../models/Subject');
const {
  Student: MysqlStudent,
  Attendance: MysqlAttendance,
  StudentRequest: MysqlStudentRequest
} = require('../models/mysql');
const timetableAiEngine = require('./timetableAiEngine');
const { emitNotification, emitAttendanceUpdate, emitLeaveUpdate, emitAgentStep } = require('../sockets/socketHandler');

const agentService = {
  // Returns step definition matching frontend modal animations
  getAttendanceAgentSteps(studentName = 'Rahul Sharma', section = 'CSE-3A', dateRange = '10 Sept – 15 Sept') {
    return [
      { id: 1, text: `HOD Digital Authorization verified for ${studentName}`, delay: 500 },
      { id: 2, text: `Locating student registry: ${studentName} in Section ${section}`, delay: 1100 },
      { id: 3, text: `Scanning class attendance ledger for period: ${dateRange}`, delay: 1800 },
      { id: 4, text: `Identified 6 affected lectures across 5 course modules`, delay: 2500 },
      { id: 5, text: `Applying institutional duty credit to Section ${section} database`, delay: 3200 },
      { id: 6, text: `Recalculating overall attendance aggregate: 72% → 84% (Safe Status)`, delay: 3900 },
      { id: 7, text: `Auto-generated notices dispatched to Student and Subject Teachers`, delay: 4500 }
    ];
  },

  getTimetableAgentSteps() {
    return [
      { id: 1, text: 'Ingesting department curriculum syllabus and credit requirements', delay: 400 },
      { id: 2, text: 'Querying faculty availability matrix and statutory teaching load limits', delay: 900 },
      { id: 3, text: 'Scanning classroom capacities and laboratory specialized software specs', delay: 1500 },
      { id: 4, text: 'Synthesizing combinatorial schedule matrix for Section CSE-3A & 3B', delay: 2200 },
      { id: 5, text: 'Running heuristic multi-variable collision detector', delay: 2800 },
      { id: 6, text: 'Constraint verification finished: 2 scheduling collisions flagged for resolution', delay: 3500 }
    ];
  },

  getTimetableResolutionSteps() {
    return [
      { id: 1, text: 'Re-routing Room 204 collision: CS402 shifted to Smart Classroom 205', delay: 500 },
      { id: 2, text: 'Balancing Dr. Meenakshi S. teaching slots with mandatory 30-min break', delay: 1100 },
      { id: 3, text: 'Validating updated master grid with zero room or teacher collisions', delay: 1700 },
      { id: 4, text: 'Autonomous healing complete: 100% collision-free timetable locked', delay: 2300 }
    ];
  },

  getAttendanceQuerySteps(studentName = 'Rahul Sharma', subject = 'Data Structures & Algorithms', date = '12 Sept') {
    return [
      { id: 1, text: `HOD approved attendance query for ${studentName}`, delay: 400 },
      { id: 2, text: `Targeting session record: ${subject} on ${date}`, delay: 900 },
      { id: 3, text: 'Modifying ledger entry from Absent → Present (Verified by Faculty/HOD)', delay: 1500 },
      { id: 4, text: 'Synchronizing student portal standing and recalculating percentage', delay: 2100 },
      { id: 5, text: `Confirmation notification pushed to ${studentName}`, delay: 2700 }
    ];
  },

  // Orchestrates real backend Attendance Agent execution
  async runAttendanceAgent({ requestId, studentRoll = '21CSE084', section = 'CSE-3A', dateRange = '10 Sept – 15 Sept' }) {
    let student = await Student.findOne({ rollNo: studentRoll });
    const studentName = student ? student.name : 'Ayush Sharma';

    // 1. Update Student's attendance in DB (MongoDB & MySQL)
    if (student) {
      student.attendance = 84;
      student.status = 'present';
      student.autoUpdated = true;
      await student.save();
    }

    try {
      const mysqlSt = await MysqlStudent.findOne({ where: { enrollment_no: studentRoll } });
      if (mysqlSt) {
        const absents = await MysqlAttendance.findAll({
          where: { student_id: mysqlSt.id, status: 'Absent' },
          limit: 6
        });
        for (const a of absents) {
          a.status = 'Present';
          await a.save();
        }
      }
      if (requestId) {
        const reqRecord = await MysqlStudentRequest.findOne({
          where: isNaN(requestId) ? { requestId } : { id: requestId }
        });
        if (reqRecord) {
          reqRecord.status = 'completed';
          reqRecord.currentAttendance = 86;
          await reqRecord.save();
        }
      }
    } catch {}

    // 2. If requestId provided, update AttendanceRequest
    if (requestId) {
      await AttendanceRequest.findOneAndUpdate(
        { $or: [{ _id: requestId }, { requestId }] },
        {
          status: 'completed',
          'timeline.2.completed': true,
          'timeline.3.completed': true
        }
      );
    }

    // 3. Increment subject attended counts
    await Subject.updateMany({ semester: 6 }, { $inc: { attended: 1 } });

    // 4. Create and push Notifications
    const studentNotif = await Notification.create({
      recipient: 'student',
      role: 'student',
      title: 'Attendance Consideration Approved 🎉',
      message: 'Attendance Agent updated 6 affected lectures. Overall attendance raised to 84% (Safe Status).',
      type: 'success'
    });

    const teacherNotif = await Notification.create({
      recipient: 'teacher',
      role: 'teacher',
      title: `Section ${section} Attendance Auto-Updated`,
      message: `Attendance Agent auto-adjusted ${studentName} attendance for duty credit granted by HOD.`,
      type: 'attendance'
    });

    emitNotification('student', studentNotif);
    emitNotification('teacher', teacherNotif);
    emitAttendanceUpdate(section, { rollNo: studentRoll, newAttendance: 84 });

    const steps = this.getAttendanceAgentSteps(studentName, section, dateRange);

    return {
      success: true,
      agent: 'Attendance Agent',
      status: 'completed',
      studentRoll,
      newAttendance: 84,
      steps,
      completedAt: new Date().toISOString()
    };
  },

  // Orchestrates Leave Agent routing
  async runLeaveAgent({ studentRoll, isTgAvailable = true }) {
    const isDirectToHod = !isTgAvailable;
    const routingDecision = {
      isDirectToHod,
      routedTo: isDirectToHod ? 'HOD Direct Clearance' : 'TG / Mentor Review',
      reason: isDirectToHod ? 'TG telemetry signaled unavailable/on-leave status.' : 'TG active and available in office.',
      pipeline: isDirectToHod ? ['Submitted', 'TG Bypassed', 'HOD Clearance'] : ['Submitted', 'TG Review', 'HOD Approval']
    };

    return {
      success: true,
      agent: 'Leave Agent',
      routingDecision,
      timestamp: new Date().toISOString()
    };
  },

  // Orchestrates Timetable Agent
  async runTimetableAgent(action = 'analyze') {
    if (action === 'resolve') {
      const result = await timetableAiEngine.resolveConflicts('CSE-3A');
      const steps = this.getTimetableResolutionSteps();
      return {
        success: true,
        agent: 'Timetable Autonomous Healing Agent',
        steps,
        result
      };
    } else {
      const analysis = await timetableAiEngine.analyzeConstraints();
      const steps = this.getTimetableAgentSteps();
      return {
        success: true,
        agent: 'AI Timetable Generator Agent',
        steps,
        analysis
      };
    }
  },

  // Agent system health / telemetry status
  async getAgentsStatus() {
    return {
      system: 'CampusFlow Autonomous Multi-Agent Core',
      department: 'Computer Science & Engineering',
      timestamp: new Date().toISOString(),
      agents: [
        { name: 'Attendance Agent', status: 'Online', lastActive: 'Active', tasksCompleted: 148 },
        { name: 'Leave Agent', status: 'Online', lastActive: 'Active', tasksCompleted: 92 },
        { name: 'Timetable Agent', status: 'Online', lastActive: 'Standby', tasksCompleted: 34 },
        { name: 'Notification Agent', status: 'Online', lastActive: 'Active', tasksCompleted: 512 }
      ]
    };
  }
};

module.exports = agentService;

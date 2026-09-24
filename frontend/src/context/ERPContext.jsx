import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_USERS,
  CSE_SUBJECTS,
  ENROLLED_STUDENTS_CSE3A,
  INITIAL_ATTENDANCE_REQUESTS,
  INITIAL_ATTENDANCE_QUERIES,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_AGENT_ACTIVITIES,
  INITIAL_TIMETABLE_CSE3A,
  INITIAL_NOTIFICATIONS,
  INITIAL_CLASSES,
  INITIAL_SECTIONS,
  INITIAL_ASSIGNMENTS,
  INITIAL_SUBMISSIONS,
  INITIAL_NOTICES,
  INITIAL_TESTS,
  INITIAL_FEEDBACK
} from '../data/mockData';
import { agentService } from '../services/agentService';
import { notificationService } from '../services/notificationService';

const ERPContext = createContext(null);

export function ERPProvider({ children }) {
  // Authentication & session state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const saved = localStorage.getItem('oist_auth');
    return saved === 'true'; // Unauthenticated by default so user sees the login page first
  });

  // Current active role
  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem('oist_role') || 'student';
  });
  const [users, setUsers] = useState(INITIAL_USERS);
  const currentUser = users[currentRole];

  // Login handler
  const login = (role = 'student', credentials = {}) => {
    const targetRole = role || 'student';
    setCurrentRole(targetRole);
    setIsAuthenticated(true);
    localStorage.setItem('oist_auth', 'true');
    localStorage.setItem('oist_role', targetRole);

    addToast(
      'Authenticated Successfully',
      `Welcome to OIST CSE ERP, ${users[targetRole]?.name || 'User'}!`,
      'success'
    );
  };

  // Logout handler
  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem('oist_auth', 'false');
    addToast(
      'Logged Out',
      'You have been securely signed out of OIST CSE ERP.',
      'info'
    );
  };

  // Core entities
  const [students, setStudents] = useState(ENROLLED_STUDENTS_CSE3A);
  const [subjects, setSubjects] = useState(CSE_SUBJECTS);
  const [classes, setClasses] = useState(INITIAL_CLASSES);
  const [sections, setSections] = useState(INITIAL_SECTIONS);
  const [assignments, setAssignments] = useState(INITIAL_ASSIGNMENTS);
  const [submissions, setSubmissions] = useState(INITIAL_SUBMISSIONS);
  const [notices, setNotices] = useState(INITIAL_NOTICES);
  const [tests, setTests] = useState(INITIAL_TESTS);
  const [feedbackList, setFeedbackList] = useState(INITIAL_FEEDBACK);
  const [attendanceRequests, setAttendanceRequests] = useState(INITIAL_ATTENDANCE_REQUESTS);
  const [attendanceQueries, setAttendanceQueries] = useState(INITIAL_ATTENDANCE_QUERIES);
  const [leaveRequests, setLeaveRequests] = useState(INITIAL_LEAVE_REQUESTS);
  const [timetable, setTimetable] = useState(INITIAL_TIMETABLE_CSE3A);
  const [agentActivityLogs, setAgentActivityLogs] = useState(INITIAL_AGENT_ACTIVITIES);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [toasts, setToasts] = useState([]);

  // Universal Quick Action Interactive Modal state
  const [modalState, setModalState] = useState({ name: null, data: null });
  const openModal = (name, data = null) => setModalState({ name, data });
  const closeModal = () => setModalState({ name: null, data: null });

  // TG Availability state for demoing fallback routing
  const [tgAvailable, setTgAvailable] = useState(true);

  // Timetable AI states
  const [timetableGenerated, setTimetableGenerated] = useState(true);
  const [timetableConflicts, setTimetableConflicts] = useState([]);
  const [isTimetableConflictResolved, setIsTimetableConflictResolved] = useState(true);

  // Live Agent simulation modal state
  const [agentModal, setAgentModal] = useState({
    isOpen: false,
    title: '',
    subtitle: '',
    agentType: 'attendance',
    steps: [],
    activeStepIndex: 0,
    isComplete: false
  });

  // Switch role handler
  const switchRole = (newRole) => {
    if (users[newRole]) {
      setCurrentRole(newRole);
      localStorage.setItem('oist_role', newRole);
      addToast(
        `Switched to ${newRole.toUpperCase()} View`,
        `Logged in as ${users[newRole].name} (${users[newRole].department || 'Administration'})`,
        'info'
      );
    }
  };

  // Toast dispatcher
  const addToast = (title, message, type = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast = { id, title, message, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Toggle TG availability
  const toggleTgAvailability = () => {
    const nextState = !tgAvailable;
    setTgAvailable(nextState);

    // Also update users.tg
    setUsers((prev) => ({
      ...prev,
      tg: { ...prev.tg, available: nextState }
    }));

    if (!nextState) {
      addToast(
        'TG Status: Marked Unavailable',
        'Mentor Prof. K. Sen is now on leave. Future student leaves will autonomously route directly to HOD.',
        'warning'
      );
      // Append agent activity
      logAgentActivity(
        'Leave Agent',
        'TG status update: Prof. K. Sen marked unavailable.',
        'Telemetry confirmed mentor unavailability. Dynamic clearance rules updated to direct HOD route.',
        'leave'
      );
    } else {
      addToast(
        'TG Status: Available in Office',
        'Prof. K. Sen is back. Standard 3-stage clearance pipeline restored.',
        'success'
      );
    }
  };

  // Log an agent activity
  const logAgentActivity = (agentName, summary, details, type = 'attendance') => {
    const newLog = {
      id: `act-${Date.now()}`,
      agentName,
      icon: type === 'attendance' ? 'fact_check' : type === 'leave' ? 'edit_calendar' : type === 'timetable' ? 'schedule' : 'notifications_active',
      timestamp: 'Just now',
      type,
      summary,
      details
    };
    setAgentActivityLogs((prev) => [newLog, ...prev]);
  };

  // ==========================================================================
  // WORKFLOW 1: Autonomous Attendance Consideration
  // ==========================================================================

  // Student submits attendance consideration request
  const submitAttendanceConsideration = (formData) => {
    const newReqId = `REQ-ATT-${Date.now().toString().slice(-4)}`;
    const newReq = {
      id: newReqId,
      type: 'attendance_consideration',
      title: 'Attendance Consideration Request',
      studentId: currentUser.id,
      studentName: currentUser.name,
      rollNo: currentUser.rollNo,
      department: currentUser.department,
      semester: currentUser.semester,
      section: currentUser.section,
      startDate: formData.startDate || '2025-09-10',
      endDate: formData.endDate || '2025-09-15',
      dateRangeLabel: formData.dateRangeLabel || `${formData.startDate} to ${formData.endDate}`,
      reason: formData.reason || 'Official representation in University Hackathon/Sports event.',
      supportingDoc: formData.supportingDoc || 'official_od_certificate.pdf',
      currentAttendance: currentUser.attendance,
      expectedAttendance: 84,
      status: 'pending_tg',
      tgRecommendation: '',
      appliedAt: 'Just now',
      affectedClasses: [
        { subject: 'Data Structures & Algorithms', code: 'CS301', date: '10 Sept', period: 'Period 2' },
        { subject: 'Database Management Systems', code: 'CS302', date: '11 Sept', period: 'Period 1' },
        { subject: 'Operating Systems', code: 'CS303', date: '12 Sept', period: 'Period 3' },
        { subject: 'Computer Networks', code: 'CS304', date: '13 Sept', period: 'Period 2' },
        { subject: 'Data Structures Lab', code: 'CS306', date: '14 Sept', period: 'Period 4-5' },
        { subject: 'Software Engineering', code: 'CS305', date: '15 Sept', period: 'Period 1' }
      ],
      timeline: [
        { step: 'Submitted by Student', actor: currentUser.name, time: 'Just now', completed: true },
        { step: 'TG / Mentor Review', actor: 'Prof. K. Sen', time: 'In Queue', completed: false, active: true },
        { step: 'HOD Approval & Clearance', actor: 'Dr. S. Roy', time: 'Awaiting TG', completed: false },
        { step: 'Attendance Agent Execution', actor: 'Autonomous Agent', time: 'Pending', completed: false }
      ]
    };

    setAttendanceRequests((prev) => [newReq, ...prev]);

    addToast(
      'Consideration Request Submitted',
      'Sent to your mentor Prof. K. Sen for verification.',
      'info'
    );

    // Notify TG
    setNotifications((prev) => [
      notificationService.createNotification(
        'New Attendance Request from Rahul Sharma',
        'Review attendance consideration for 10 Sept - 15 Sept.',
        'tg',
        'approval'
      ),
      ...prev
    ]);
  };

  // TG reviews & recommends attendance consideration
  const tgReviewAttendanceConsideration = (requestId, recommendation) => {
    setAttendanceRequests((prev) =>
      prev.map((req) => {
        if (req.id === requestId) {
          return {
            ...req,
            status: 'pending_hod',
            tgRecommendation: recommendation || 'Verified by Mentor: Genuine institutional participation. Recommended for full attendance credit.',
            timeline: [
              { ...req.timeline[0], completed: true },
              { step: 'TG / Mentor Review', actor: 'Prof. K. Sen (Recommended)', time: 'Just now', completed: true },
              { step: 'HOD Approval & Clearance', actor: 'Dr. S. Roy', time: 'In Queue', completed: false, active: true },
              { ...req.timeline[3] }
            ]
          };
        }
        return req;
      })
    );

    addToast(
      'Verified & Forwarded to HOD',
      'Request forwarded to Dr. S. Roy with your recommendation note.',
      'success'
    );

    // Notify HOD
    setNotifications((prev) => [
      notificationService.createNotification(
        'Attendance Request Forwarded by TG',
        'Prof. K. Sen recommended attendance consideration for Rahul Sharma (21CSE084).',
        'hod',
        'approval'
      ),
      ...prev
    ]);
  };

  // HOD approves attendance consideration -> LAUNCHES AUTONOMOUS ATTENDANCE AGENT
  const hodApproveAttendanceConsideration = (requestId) => {
    const targetReq = attendanceRequests.find((r) => r.id === requestId);
    if (!targetReq) return;

    const steps = agentService.getAttendanceAgentSteps(
      targetReq.studentName,
      targetReq.section,
      targetReq.dateRangeLabel
    );

    // Open Agent Modal with streaming progress
    setAgentModal({
      isOpen: true,
      title: 'Autonomous Attendance Agent',
      subtitle: `Propagating section-wise duty adjustments for ${targetReq.studentName} (${targetReq.section})`,
      agentType: 'attendance',
      steps,
      activeStepIndex: 0,
      isComplete: false
    });

    // Run step by step simulation
    steps.forEach((step, index) => {
      setTimeout(() => {
        setAgentModal((prev) => ({
          ...prev,
          activeStepIndex: index + 1,
          isComplete: index === steps.length - 1
        }));

        // When all steps finish
        if (index === steps.length - 1) {
          // 1. Update Request state to completed
          setAttendanceRequests((prevReqs) =>
            prevReqs.map((req) => {
              if (req.id === requestId) {
                return {
                  ...req,
                  status: 'completed',
                  timeline: [
                    { ...req.timeline[0], completed: true },
                    { ...req.timeline[1], completed: true },
                    { step: 'HOD Approval & Clearance', actor: 'Dr. S. Roy (Approved)', time: 'Just now', completed: true },
                    { step: 'Attendance Agent Execution', actor: 'Attendance Agent (Synced)', time: 'Completed', completed: true }
                  ]
                };
              }
              return req;
            })
          );

          // 2. Update Student attendance in users.student (72% -> 84%)
          setUsers((prev) => ({
            ...prev,
            student: {
              ...prev.student,
              attendance: 84
            }
          }));

          // 3. Update enrolled students roster (CSE-3A)
          setStudents((prev) =>
            prev.map((st) =>
              st.rollNo === '21CSE084'
                ? { ...st, attendance: 84, status: 'present', autoUpdated: true }
                : st
            )
          );

          // 4. Update CSE subjects attended counts
          setSubjects((prev) =>
            prev.map((sub) => ({
              ...sub,
              attended: sub.attended + 1
            }))
          );

          // 5. Append Agent Activity Log
          logAgentActivity(
            'Attendance Agent',
            'Propagated Section CSE-3A attendance adjustment for Rahul Sharma.',
            `HOD approval verified. 6 classes across 5 subjects automatically credited for 10-15 Sept. Recalculated attendance aggregate to 84% (Safe Status).`,
            'attendance'
          );

          // 6. Push notifications
          setNotifications((prev) => [
            notificationService.createNotification(
              'Attendance Consideration Approved 🎉',
              'Attendance Agent updated 6 affected lectures. Overall attendance raised from 72% to 84% (Safe Status).',
              'student',
              'success'
            ),
            notificationService.createNotification(
              'Section CSE-3A Attendance Auto-Updated',
              'Attendance Agent auto-adjusted Rahul Sharma attendance for CS301 (Duty credit granted by HOD). No manual update needed.',
              'teacher',
              'attendance'
            ),
            ...prev
          ]);

          addToast(
            'Autonomous Update Complete!',
            'Section CSE-3A classes synchronized. Student attendance increased to 84%.',
            'success'
          );
        }
      }, step.delay);
    });
  };

  const closeAgentModal = () => {
    setAgentModal((prev) => ({ ...prev, isOpen: false }));
  };

  // ==========================================================================
  // WORKFLOW 2: Student Attendance Query System (Wrong Attendance)
  // ==========================================================================

  const submitAttendanceQuery = (formData) => {
    const newQuery = {
      id: `QRY-ATT-${Date.now().toString().slice(-4)}`,
      type: 'attendance_query',
      studentId: currentUser.id,
      studentName: currentUser.name,
      rollNo: currentUser.rollNo,
      section: currentUser.section,
      subject: formData.subject || 'Data Structures & Algorithms (CS301)',
      faculty: formData.faculty || 'Dr. Rajesh Verma',
      date: formData.date || '12 Sept 2025',
      period: formData.period || 'Period 2 (10:30 AM - 11:30 AM)',
      currentStatus: 'Absent',
      expectedStatus: 'Present',
      reason: formData.reason || 'Attended lecture and submitted practical lab work. Marked absent in roll call.',
      supportingDoc: formData.supportingDoc || 'screenshot_proof.png',
      status: 'pending_tg',
      appliedAt: 'Just now'
    };

    setAttendanceQueries((prev) => [newQuery, ...prev]);

    addToast(
      'Attendance Query Submitted',
      'Your query has been sent to TG Prof. K. Sen and HOD for digital review.',
      'info'
    );
  };

  const tgReviewAttendanceQuery = (queryId) => {
    setAttendanceQueries((prev) =>
      prev.map((q) => (q.id === queryId ? { ...q, status: 'pending_hod' } : q))
    );

    addToast(
      'Attendance Query Verified by TG',
      'Forwarded to HOD Dr. S. Roy for final correction approval.',
      'success'
    );
  };

  const hodApproveAttendanceQuery = (queryId) => {
    const query = attendanceQueries.find((q) => q.id === queryId);
    if (!query) return;

    const steps = agentService.getAttendanceQuerySteps(
      query.studentName,
      query.subject,
      query.date
    );

    setAgentModal({
      isOpen: true,
      title: 'Attendance Correction Agent',
      subtitle: `Correcting ledger error: ${query.subject} on ${query.date}`,
      agentType: 'attendance',
      steps,
      activeStepIndex: 0,
      isComplete: false
    });

    steps.forEach((step, index) => {
      setTimeout(() => {
        setAgentModal((prev) => ({
          ...prev,
          activeStepIndex: index + 1,
          isComplete: index === steps.length - 1
        }));

        if (index === steps.length - 1) {
          // Mark query completed
          setAttendanceQueries((prev) =>
            prev.map((q) => (q.id === queryId ? { ...q, status: 'completed' } : q))
          );

          // Increment attended count
          setUsers((prev) => ({
            ...prev,
            student: {
              ...prev.student,
              attendance: Math.min(100, prev.student.attendance + 1)
            }
          }));

          logAgentActivity(
            'Attendance Agent',
            `Corrected absent entry for ${query.studentName}.`,
            `${query.subject} on ${query.date} modified to Present. Synchronized across student record.`,
            'attendance'
          );

          setNotifications((prev) => [
            notificationService.createNotification(
              'Attendance Query Resolved',
              `Your query for ${query.subject} on ${query.date} was approved. Attendance status changed to Present.`,
              'student',
              'success'
            ),
            ...prev
          ]);

          addToast(
            'Attendance Corrected!',
            `${query.subject} marked Present. No teacher manual edit needed.`,
            'success'
          );
        }
      }, step.delay);
    });
  };

  // ==========================================================================
  // WORKFLOW 3: Leave Management with TG Fallback
  // ==========================================================================

  const applyLeave = (formData) => {
    const isDirectToHod = !tgAvailable;
    const newLeave = {
      id: `REQ-LV-${Date.now().toString().slice(-4)}`,
      type: 'leave_request',
      title: `${formData.leaveType || 'General'} Leave Application`,
      studentId: currentUser.id,
      studentName: currentUser.name,
      rollNo: currentUser.rollNo,
      section: currentUser.section,
      leaveType: formData.leaveType || 'Medical',
      startDate: formData.startDate || '2025-09-28',
      endDate: formData.endDate || '2025-09-30',
      dateRangeLabel: formData.dateRangeLabel || `${formData.startDate} – ${formData.endDate}`,
      reason: formData.reason || 'Medical checkup and prescribed bed rest.',
      supportingDoc: formData.supportingDoc || 'prescription_slip.pdf',
      status: isDirectToHod ? 'pending_hod_direct' : 'pending_tg',
      appliedAt: 'Just now',
      tgUnavailable: isDirectToHod,
      timeline: isDirectToHod
        ? [
            { step: 'Leave Submitted', actor: currentUser.name, time: 'Just now', completed: true },
            { step: 'TG Telemetry Check', actor: 'Prof. K. Sen (Unavailable / On Leave)', time: 'Bypassed', completed: true, warning: true },
            { step: 'HOD Direct Clearance', actor: 'Dr. S. Roy', time: 'In Queue', completed: false, active: true }
          ]
        : [
            { step: 'Leave Submitted', actor: currentUser.name, time: 'Just now', completed: true },
            { step: 'TG Review', actor: 'Prof. K. Sen', time: 'In Queue', completed: false, active: true },
            { step: 'HOD Approval', actor: 'Dr. S. Roy', time: 'Awaiting TG', completed: false }
          ]
    };

    setLeaveRequests((prev) => [newLeave, ...prev]);

    if (isDirectToHod) {
      addToast(
        'Direct HOD Routing Activated',
        'Mentor Prof. K. Sen is marked unavailable. Leave routed directly to HOD to prevent delay.',
        'warning'
      );
      logAgentActivity(
        'Leave Agent',
        'Autonomous Fallback Routing triggered.',
        `Routed leave request for ${currentUser.name} directly to HOD Dr. S. Roy because TG is currently unavailable.`,
        'leave'
      );
    } else {
      addToast(
        'Leave Application Submitted',
        'Sent to mentor Prof. K. Sen for 3-tier clearance.',
        'info'
      );
    }
  };

  const tgReviewLeave = (leaveId, approved = true) => {
    setLeaveRequests((prev) =>
      prev.map((lv) => {
        if (lv.id === leaveId) {
          return {
            ...lv,
            status: approved ? 'pending_hod' : 'rejected',
            timeline: [
              { ...lv.timeline[0], completed: true },
              { step: 'TG Review', actor: 'Prof. K. Sen (Verified)', time: 'Just now', completed: true },
              { step: 'HOD Approval', actor: 'Dr. S. Roy', time: 'In Queue', completed: false, active: true }
            ]
          };
        }
        return lv;
      })
    );

    addToast('Leave Verified', 'Forwarded to HOD for final sign-off.', 'success');
  };

  const hodApproveLeave = (leaveId) => {
    setLeaveRequests((prev) =>
      prev.map((lv) => {
        if (lv.id === leaveId) {
          return {
            ...lv,
            status: 'completed',
            timeline: lv.timeline.map((item) => ({ ...item, completed: true, active: false }))
          };
        }
        return lv;
      })
    );

    logAgentActivity(
      'Leave Agent',
      'Leave clearance signed and credited.',
      `HOD Dr. S. Roy approved leave request #${leaveId}. Portal records updated.`,
      'leave'
    );

    setNotifications((prev) => [
      notificationService.createNotification(
        'Leave Approved by HOD',
        'Your leave application has received final administrative clearance.',
        'student',
        'success'
      ),
      ...prev
    ]);

    addToast('Leave Approved', 'Leave digitally signed and granted.', 'success');
  };

  // ==========================================================================
  // WORKFLOW 4: AI-Based Timetable Generation & Autonomous Conflict Resolution
  // ==========================================================================

  const generateTimetableAI = (constraints) => {
    const steps = agentService.getTimetableAgentSteps();

    setAgentModal({
      isOpen: true,
      title: 'AI Timetable Generator Agent',
      subtitle: `Synthesizing schedule for Dept. of CSE (Sections CSE-3A & 3B)`,
      agentType: 'timetable',
      steps,
      activeStepIndex: 0,
      isComplete: false
    });

    steps.forEach((step, index) => {
      setTimeout(() => {
        setAgentModal((prev) => ({
          ...prev,
          activeStepIndex: index + 1,
          isComplete: index === steps.length - 1
        }));

        if (index === steps.length - 1) {
          setTimetableGenerated(true);
          setTimetableConflicts([
            {
              id: 'conf-1',
              title: 'Room Double-Booking Collision',
              room: 'Room 204',
              time: 'Wednesday • Period 3 (11:45 AM)',
              detail: 'CS304 (Prof. Amit K.) & CS402 (Prof. Raman) assigned to Room 204 simultaneously.',
              severity: 'High'
            },
            {
              id: 'conf-2',
              title: 'Faculty Workload Continuous Overlap',
              faculty: 'Dr. Meenakshi S.',
              time: 'Tuesday • Period 4',
              detail: '4 consecutive hours allocated without mandatory 30-minute academic break interval.',
              severity: 'Medium'
            }
          ]);
          setIsTimetableConflictResolved(false);

          logAgentActivity(
            'Timetable Agent',
            'Generated draft schedule; 2 conflicts detected.',
            'Multi-variable constraint engine completed run. Flagged Room 204 collision and faculty workload spike for automated resolution.',
            'timetable'
          );

          addToast(
            'Timetable Generated',
            'AI schedule matrix built. 2 scheduling conflicts flagged for resolution.',
            'warning'
          );
        }
      }, step.delay);
    });
  };

  const resolveTimetableConflictsAI = () => {
    const steps = agentService.getTimetableResolutionSteps();

    setAgentModal({
      isOpen: true,
      title: 'Timetable Autonomous Healing Agent',
      subtitle: 'Resolving Room 204 collision and balancing faculty workload intervals',
      agentType: 'timetable',
      steps,
      activeStepIndex: 0,
      isComplete: false
    });

    steps.forEach((step, index) => {
      setTimeout(() => {
        setAgentModal((prev) => ({
          ...prev,
          activeStepIndex: index + 1,
          isComplete: index === steps.length - 1
        }));

        if (index === steps.length - 1) {
          setTimetableConflicts([]);
          setIsTimetableConflictResolved(true);

          logAgentActivity(
            'Timetable Agent',
            'Resolved 2 scheduling conflicts autonomously.',
            'Re-routed CS402 to Smart Classroom 205 and balanced Dr. Meenakshi S. timetable with statutory break. Master grid locked.',
            'timetable'
          );

          addToast(
            'Conflicts Resolved Automagically!',
            'Zero collisions remaining. Master timetable locked and published.',
            'success'
          );
        }
      }, step.delay);
    });
  };

  // ==========================================================================
  // TEACHER ATTENDANCE MARKING
  // ==========================================================================

  const markStudentAttendance = (studentId, status) => {
    setStudents((prev) =>
      prev.map((st) => (st.id === studentId ? { ...st, status } : st))
    );
  };

  const markAllStudentsPresent = () => {
    setStudents((prev) =>
      prev.map((st) => ({ ...st, status: 'present' }))
    );
    addToast('Roll Call Updated', 'All 10 students marked Present.', 'info');
  };

  const submitTeacherAttendanceRollCall = (classDetails) => {
    const presentCount = students.filter((s) => s.status === 'present').length;
    addToast(
      'Attendance Locked & Synchronized',
      `Locked session for ${classDetails.subject} (${presentCount} Present, ${students.length - presentCount} Absent).`,
      'success'
    );
    logAgentActivity(
      'Attendance Agent',
      `Live session locked by Dr. Rajesh Verma for ${classDetails.subject}.`,
      `Verified digital roster. ${presentCount}/${students.length} students confirmed present. Portal synchronized.`,
      'attendance'
    );
  };

  // ==========================================================================
  // FLOW 5: HOD Class & Section Management
  // ==========================================================================

  const addSection = (sectionData) => {
    const newSecId = `sec-${Date.now().toString().slice(-4)}`;
    const newSection = {
      id: newSecId,
      name: sectionData.name || 'CSE-3C',
      classId: sectionData.classId || 'cls-1',
      className: sectionData.className || 'CSE 3rd Year',
      semester: sectionData.semester || '6th Semester',
      tgName: sectionData.tgName || 'Prof. K. Sen',
      room: sectionData.room || 'Room 206',
      studentsCount: parseInt(sectionData.studentsCount) || 55,
      subjects: sectionData.subjects || ['Data Structures', 'DBMS', 'Operating Systems']
    };

    setSections((prev) => [...prev, newSection]);

    setClasses((prev) =>
      prev.map((c) =>
        c.id === newSection.classId
          ? {
              ...c,
              sections: [...c.sections, newSection.name],
              studentsCount: c.studentsCount + newSection.studentsCount
            }
          : c
      )
    );

    addToast(
      'New Section Created! 🏫',
      `Section ${newSection.name} added to ${newSection.className}. Live across roll calls and timetables.`,
      'success'
    );

    logAgentActivity(
      'Department Admin Agent',
      `New Section ${newSection.name} provisioned for ${newSection.className}.`,
      `Room ${newSection.room} allocated. TG mentor ${newSection.tgName} assigned. System rosters synchronized.`,
      'notification'
    );
  };

  const addClass = (classData) => {
    const newClass = {
      id: `cls-${Date.now().toString().slice(-4)}`,
      name: classData.name,
      semester: classData.semester || '1st Semester',
      batch: classData.batch || '2024-2028',
      department: 'Computer Science & Engineering',
      sections: classData.sections || ['A'],
      studentsCount: parseInt(classData.studentsCount) || 60,
      coordinator: classData.coordinator || 'Faculty Coordinator'
    };
    setClasses((prev) => [...prev, newClass]);
    addToast('New Class Added', `${newClass.name} registered under Dept of CSE.`, 'success');
  };

  // ==========================================================================
  // FLOW 4: Coursework & Assignments Management
  // ==========================================================================

  const createAssignment = (asgData) => {
    const newAsg = {
      id: `asg-${Date.now().toString().slice(-4)}`,
      title: asgData.title || 'Data Structures Lab Problem Set',
      subject: asgData.subject || 'Data Structures & Algorithms',
      subjectCode: asgData.subjectCode || 'CS301',
      faculty: currentUser.name || 'Dr. Rajesh Verma',
      section: asgData.section || 'CSE-3A',
      className: asgData.className || 'CSE 3rd Year',
      dueDate: asgData.dueDate || '2025-10-15',
      dueDaysLeft: '7 days left',
      totalMarks: parseInt(asgData.totalMarks) || 20,
      description: asgData.description || 'Complete programming exercises and upload verified source code archive.',
      attachmentName: asgData.attachmentName || 'Assignment_ProblemSet.pdf',
      status: 'active',
      submissionsCount: 0
    };

    setAssignments((prev) => [newAsg, ...prev]);

    addToast(
      'Assignment Published! 📚',
      `Published "${newAsg.title}" for Section ${newAsg.section}. Due on ${newAsg.dueDate}.`,
      'success'
    );

    setNotifications((prev) => [
      notificationService.createNotification(
        `New Assignment: ${newAsg.title}`,
        `Published by ${newAsg.faculty} for ${newAsg.subject}. Deadline: ${newAsg.dueDate}.`,
        'student',
        'notice'
      ),
      ...prev
    ]);

    logAgentActivity(
      'Academic Notice Agent',
      `Dispatched coursework alert to Section ${newAsg.section}.`,
      `${newAsg.title} published by ${newAsg.faculty}. Student submission portals activated.`,
      'notification'
    );
  };

  const submitAssignment = (assignmentId, submData) => {
    const targetAsg = assignments.find((a) => a.id === assignmentId);
    const newSubm = {
      id: `subm-${Date.now().toString().slice(-4)}`,
      assignmentId,
      assignmentTitle: targetAsg?.title || 'Assignment',
      studentId: currentUser.id,
      studentName: currentUser.name,
      rollNo: currentUser.rollNo,
      section: currentUser.section,
      submittedAt: 'Just now',
      fileName: submData.fileName || 'Solution_Archive.pdf',
      fileSize: submData.fileSize || '2.1 MB',
      status: 'submitted',
      marks: null,
      totalMarks: targetAsg?.totalMarks || 20,
      feedback: ''
    };

    setSubmissions((prev) => [newSubm, ...prev]);

    setAssignments((prev) =>
      prev.map((a) => (a.id === assignmentId ? { ...a, submissionsCount: a.submissionsCount + 1 } : a))
    );

    addToast(
      'Assignment Submitted Successfully! 📄',
      `Submitted ${newSubm.fileName} for ${newSubm.assignmentTitle}.`,
      'success'
    );

    setNotifications((prev) => [
      notificationService.createNotification(
        `New Submission from ${currentUser.name}`,
        `Submitted work for ${targetAsg?.title || 'Assignment'} (${currentUser.section}).`,
        'teacher',
        'approval'
      ),
      ...prev
    ]);
  };

  const gradeSubmission = (submId, marks, feedback) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submId
          ? { ...s, marks: parseInt(marks), feedback, status: 'graded' }
          : s
      )
    );
    addToast('Submission Graded', 'Score and feedback recorded and published to student portal.', 'success');
  };

  // ==========================================================================
  // FLOW 7: Notice Broadcast Agent
  // ==========================================================================

  const sendNotice = (noticeData) => {
    const newNotice = {
      id: `not-${Date.now().toString().slice(-4)}`,
      title: noticeData.title,
      content: noticeData.content,
      authorRole: currentUser.role === 'hod' ? 'HOD Office' : currentUser.role === 'teacher' ? 'Faculty' : 'TG / Mentor',
      authorName: currentUser.name,
      targetType: noticeData.targetType || 'Section',
      targetValue: noticeData.targetValue || 'CSE-3A',
      date: 'Just now',
      priority: noticeData.priority || 'normal',
      pinned: !!noticeData.pinned
    };

    setNotices((prev) => [newNotice, ...prev]);

    setNotifications((prev) => [
      notificationService.createNotification(
        `Notice: ${newNotice.title}`,
        newNotice.content.slice(0, 95) + '...',
        'student',
        newNotice.priority === 'urgent' ? 'alert' : 'notice'
      ),
      ...prev
    ]);

    addToast(
      'Notice Broadcast Sent! 📢',
      `Delivered to ${newNotice.targetType}: ${newNotice.targetValue}. All enrolled students notified.`,
      'success'
    );

    logAgentActivity(
      'Notice Agent',
      `Autonomous circular broadcast to ${newNotice.targetType} [${newNotice.targetValue}].`,
      `Notice "${newNotice.title}" published by ${newNotice.authorName}. Distributed to student portals and alert feeds.`,
      'notification'
    );
  };

  // ==========================================================================
  // Online Tests, Feedback, and Lecture Scheduling
  // ==========================================================================

  const createTest = (testData) => {
    const newTest = {
      id: `tst-${Date.now().toString().slice(-4)}`,
      title: testData.title,
      subject: testData.subject || 'Data Structures',
      subjectCode: testData.subjectCode || 'CS301',
      section: testData.section || 'CSE-3A',
      duration: `${testData.duration || 30} mins`,
      totalQuestions: parseInt(testData.totalQuestions) || 15,
      totalMarks: parseInt(testData.totalMarks) || 30,
      status: 'Upcoming',
      averageScore: null,
      submissionCount: 0,
      date: testData.date || 'Tomorrow'
    };
    setTests((prev) => [newTest, ...prev]);
    addToast('Online Test Created', `${newTest.title} scheduled for ${newTest.section}.`, 'success');
  };

  const createFeedback = (fbData) => {
    const newFb = {
      id: `fb-${Date.now().toString().slice(-4)}`,
      studentRoll: fbData.studentRoll || '21CSE084',
      studentName: fbData.studentName || 'Rahul Sharma',
      teacherName: currentUser.name || 'Dr. Rajesh Verma',
      category: fbData.category || 'Academic',
      feedback: fbData.feedback,
      date: 'Today'
    };
    setFeedbackList((prev) => [newFb, ...prev]);
    addToast('Student Feedback Recorded', `Logged ${newFb.category} feedback for ${newFb.studentName}.`, 'success');
  };

  const scheduleLecture = (lectureData) => {
    addToast(
      'Lecture Scheduled',
      `${lectureData.subject} (${lectureData.section}) confirmed for ${lectureData.day || 'Today'} in ${lectureData.room || 'Room 204'}.`,
      'success'
    );
    logAgentActivity(
      'Timetable Agent',
      `Class session scheduled for ${lectureData.subject} (${lectureData.section}).`,
      `Room ${lectureData.room} verified free. Synchronized to student timetable grids.`,
      'timetable'
    );
  };

  const markNotificationRead = (notifId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  };

  const clearAllNotifications = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    addToast('Notifications Cleared', 'All notices marked as read.', 'info');
  };

  return (
    <ERPContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        currentRole,
        switchRole,
        currentUser,
        users,
        students,
        subjects,
        classes,
        sections,
        assignments,
        submissions,
        notices,
        tests,
        feedbackList,
        attendanceRequests,
        attendanceQueries,
        leaveRequests,
        timetable,
        agentActivityLogs,
        notifications,
        markNotificationRead,
        clearAllNotifications,
        toasts,
        addToast,
        removeToast,
        tgAvailable,
        toggleTgAvailability,
        agentModal,
        closeAgentModal,
        // Interactive modal state
        modalState,
        openModal,
        closeModal,
        // Workflow actions
        submitAttendanceConsideration,
        tgReviewAttendanceConsideration,
        hodApproveAttendanceConsideration,
        submitAttendanceQuery,
        tgReviewAttendanceQuery,
        hodApproveAttendanceQuery,
        applyLeave,
        tgReviewLeave,
        hodApproveLeave,
        // Timetable actions
        timetableGenerated,
        timetableConflicts,
        isTimetableConflictResolved,
        generateTimetableAI,
        resolveTimetableConflictsAI,
        // Teacher actions
        markStudentAttendance,
        markAllStudentsPresent,
        submitTeacherAttendanceRollCall,
        // New management actions
        addSection,
        addClass,
        createAssignment,
        submitAssignment,
        gradeSubmission,
        sendNotice,
        createTest,
        createFeedback,
        scheduleLecture
      }}
    >
      {children}
    </ERPContext.Provider>
  );
}

export function useERP() {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
}

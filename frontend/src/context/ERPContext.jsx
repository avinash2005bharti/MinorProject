import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  apiClient,
  authApi,
  dashboardApi,
  studentApi,
  teacherApi,
  attendanceApi,
  requestApi,
  timetableApi,
  teacherSchedulerApi,
  academicApi,
  notificationApi,
  noticeApi
} from '../api';

const ERPContext = createContext(null);

export function ERPProvider({ children }) {
  // Session & Authentication state
  const [token, setToken] = useState(() => apiClient.getToken());
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('oist_user');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      // Normalize cached association objects to plain strings
      if (parsed.section && typeof parsed.section === 'object') {
        parsed.section = parsed.section.name || 'A';
      }
      if (parsed.department && typeof parsed.department === 'object') {
        parsed.department = parsed.department.name || 'CSE';
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem('oist_role') || (currentUser?.role || 'student');
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!apiClient.getToken();
  });

  const [loadingAuth, setLoadingAuth] = useState(true);

  // Department Relational Entities (Source of Truth: Real Backend)
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [attendanceRequests, setAttendanceRequests] = useState([]);
  const [attendanceQueries, setAttendanceQueries] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [timetable, setTimetable] = useState({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: []
  });
  const [notices, setNotices] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [academicHierarchy, setAcademicHierarchy] = useState(null);

  // Dashboard cached data
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);

  // UI Modals & Toasts
  const [toasts, setToasts] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [agentModal, setAgentModal] = useState({
    isOpen: false,
    title: '',
    subtitle: '',
    steps: [],
    activeStepIndex: 0,
    isComplete: false,
    agentType: ''
  });

  const addToast = useCallback((title, message, type = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast = { id, title, message, type, time: 'Just now' };
    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const openModal = useCallback((name, data = {}) => {
    setActiveModal({ name, data });
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const openAgentModal = useCallback((config = {}) => {
    setAgentModal({
      isOpen: true,
      title: config.title || 'Autonomous Agent Flow',
      subtitle: config.subtitle || 'Synchronizing department records...',
      steps: config.steps || [],
      activeStepIndex: 0,
      isComplete: false,
      agentType: config.agentType || 'default'
    });
  }, []);

  const closeAgentModal = useCallback(() => {
    setAgentModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // 1. Initial Authentication Check via backend /api/auth/me
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const activeToken = apiClient.getToken();
      if (!activeToken) {
        if (isMounted) {
          setIsAuthenticated(false);
          setCurrentUser(null);
          setLoadingAuth(false);
        }
        return;
      }

      try {
        const res = await authApi.getMe();
        if (isMounted && res?.user) {
          const user = res.user;
          // Flatten profile data for convenient consumption in existing components
          const combinedUser = {
            ...user,
            ...(user.studentProfile || {}),
            ...(user.facultyProfile || {}),
            id: user.id,
            role: user.role
          };
          // Normalize association objects (section, department) to plain strings
          if (combinedUser.section && typeof combinedUser.section === 'object') {
            combinedUser.section = combinedUser.section.name || 'A';
          }
          if (combinedUser.department && typeof combinedUser.department === 'object') {
            combinedUser.department = combinedUser.department.name || 'CSE';
          }

          setCurrentUser(combinedUser);
          setIsAuthenticated(true);
          localStorage.setItem('oist_user', JSON.stringify(combinedUser));

          // TG is a faculty responsibility; keep faculty as the user's primary dashboard.
          let normalizedRole = (user.role || '').toLowerCase();
          const isAppointedTg = Boolean(
            normalizedRole === 'tg' ||
            user.isTG ||
            user.isTg ||
            combinedUser.isTG ||
            combinedUser.isTg ||
            (user.mentorGroups && user.mentorGroups.length > 0) ||
            (combinedUser.mentorGroups && combinedUser.mentorGroups.length > 0) ||
            (combinedUser.designation || '').toLowerCase().includes('(tg)') ||
            (combinedUser.designation || '').toLowerCase().includes('tg')
          );

          const storedRole = localStorage.getItem('oist_role');
          if (storedRole === 'tg' && isAppointedTg) {
            normalizedRole = 'tg';
          } else if (normalizedRole === 'faculty') {
            normalizedRole = isAppointedTg && storedRole === 'tg' ? 'tg' : 'teacher';
          } else if (normalizedRole === 'tg') {
            normalizedRole = 'tg';
          }
          combinedUser.isTG = isAppointedTg;
          combinedUser.isTg = isAppointedTg;
          combinedUser.isAppointedTg = isAppointedTg;
          setCurrentRole(normalizedRole);
          localStorage.setItem('oist_role', normalizedRole);
        }
      } catch (err) {
        console.warn('[ERPContext] Session verification error:', err.message);
        if (isMounted) {
          apiClient.clearSession();
          localStorage.removeItem('oist_user');
          localStorage.removeItem('oist_role');
          setIsAuthenticated(false);
          setCurrentUser(null);
          setCurrentRole(null);
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      } finally {
        if (isMounted) setLoadingAuth(false);
      }
    };

    verifySession();

    // FE-02: Re-validate user session and active roles on tab focus
    const handleFocus = () => {
      if (apiClient.getToken()) {
        verifySession();
      }
    };
    window.addEventListener('focus', handleFocus);

    // Listen for global auth events dispatched by API client
    const handleUnauthorized = () => {
      apiClient.clearSession();
      localStorage.removeItem('oist_user');
      localStorage.removeItem('oist_role');
      setIsAuthenticated(false);
      setCurrentUser(null);
      setCurrentRole(null);
      addToast('Session Expired', 'Your authentication session has expired. Please sign in again.', 'warning');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    };

    const handleForbidden = (e) => {
      addToast('Access Denied', e.detail?.message || 'You do not have permission to access this resource.', 'error');
    };

    window.addEventListener('erp:auth:unauthorized', handleUnauthorized);
    window.addEventListener('erp:auth:forbidden', handleForbidden);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('erp:auth:unauthorized', handleUnauthorized);
      window.removeEventListener('erp:auth:forbidden', handleForbidden);
    };
  }, [addToast]);

  // 2. Fetch Core Relational Data When Authenticated
  const refreshAllData = useCallback(async () => {
    if (!apiClient.getToken()) return;

    try {
      // Parallel fetch from real endpoints
      const [
        studentsRes,
        teachersRes,
        requestsRes,
        noticesRes,
        notificationsRes,
        subjectsRes,
        sectionsRes
      ] = await Promise.allSettled([
        studentApi.getStudents({ limit: 100 }),
        teacherApi.getFaculty(),
        requestApi.getAllRequests(),
        noticeApi.getNotices(),
        notificationApi.getNotifications(currentRole),
        academicApi.getSubjects(),
        academicApi.getSections()
      ]);

      if (studentsRes.status === 'fulfilled' && studentsRes.value?.students) {
        const normalizedStudents = studentsRes.value.students.map((st) => ({
          ...st,
          section: typeof st.section === 'object' && st.section !== null ? (st.section.name || 'A') : (st.section || 'A'),
          sectionName: typeof st.section === 'object' && st.section !== null ? (st.section.name || 'A') : (st.sectionName || st.section || 'A'),
          department: typeof st.department === 'object' && st.department !== null ? (st.department.name || 'CSE') : (st.department || 'CSE'),
          departmentName: typeof st.department === 'object' && st.department !== null ? (st.department.name || 'CSE') : (st.departmentName || st.department || 'CSE')
        }));
        setStudents(normalizedStudents);
      }
      if (teachersRes.status === 'fulfilled' && teachersRes.value?.faculty) {
        setTeachers(teachersRes.value.faculty);
      }
      if (requestsRes.status === 'fulfilled' && requestsRes.value) {
        const val = requestsRes.value;
        const data = val.data || val;
        const considerations = data.attendanceRequests || data.considerationRequests || [];
        const queries = data.attendanceQueries || data.correctionRequests || [];
        const leaves = data.leaveRequests || [];
        setAttendanceRequests(considerations);
        setAttendanceQueries(queries);
        setLeaveRequests(leaves);
      }
      if (noticesRes.status === 'fulfilled' && noticesRes.value?.notices) {
        setNotices(noticesRes.value.notices);
      }
      if (notificationsRes.status === 'fulfilled' && notificationsRes.value?.notifications) {
        setNotifications(notificationsRes.value.notifications);
      }
      if (subjectsRes.status === 'fulfilled' && subjectsRes.value?.subjects) {
        setSubjects(subjectsRes.value.subjects);
      }
      if (sectionsRes.status === 'fulfilled' && sectionsRes.value?.sections) {
        setSections(sectionsRes.value.sections);
      }
    } catch (e) {
      console.warn('[ERPContext] Error syncing live records:', e.message);
    }
  }, [currentRole]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshAllData();
    }
  }, [isAuthenticated, refreshAllData]);

  // 3. Fetch Role-Specific Dashboard Data
  const fetchDashboard = useCallback(async () => {
    if (!apiClient.getToken()) return;
    setDashboardLoading(true);
    setDashboardError(null);

    try {
      let res = null;
      if (currentRole === 'student') {
        res = await dashboardApi.getStudentDashboard();
      } else if (currentRole === 'teacher') {
        res = await dashboardApi.getTeacherDashboard();
      } else if (currentRole === 'tg') {
        res = await dashboardApi.getTgDashboard();
      } else if (currentRole === 'hod') {
        res = await dashboardApi.getHodDashboard();
      } else if (currentRole === 'admin') {
        res = await dashboardApi.getAdminDashboard();
      }

      if (res?.data) {
        setDashboardData(res.data);
      }
    } catch (err) {
      setDashboardError(err.message || 'Unable to load dashboard data. Please try again.');
    } finally {
      setDashboardLoading(false);
    }
  }, [currentRole]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboard();
    }
  }, [isAuthenticated, currentRole, fetchDashboard]);

  // 4. Fetch Section Timetable
  const refreshTimetable = useCallback(async (year = '3rd Year', semester = 5, section = 'A') => {
    try {
      let res;
      if (currentRole === 'teacher' || currentRole === 'faculty' || currentRole === 'tg') {
        try {
          res = await timetableApi.getMyTimetable();
        } catch {
          res = await timetableApi.getTimetable({ year, semester, section });
        }
      } else {
        res = await timetableApi.getTimetable({ year, semester, section });
      }

      let flatSlots = [];
      if (Array.isArray(res?.slots)) {
        flatSlots = res.slots;
      } else if (Array.isArray(res?.timetable)) {
        flatSlots = res.timetable;
      } else if (res?.timetable && typeof res.timetable === 'object') {
        flatSlots = Object.values(res.timetable).flat();
      }

      const grid = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [] };
      flatSlots.forEach((s) => {
        const day = s.day || s.dayOfWeek;
        if (grid[day]) {
          grid[day].push({
            id: s.id,
            period: s.period || s.periodNumber,
            time: s.time || `${s.startTime || s.start_time || ''} - ${s.endTime || s.end_time || ''}`,
            code: s.code || s.subjectCode || (s.subject ? s.subject.split(' ').map((w) => w[0]).join('').slice(0, 5).toUpperCase() : 'CS'),
            subject: s.subject || s.subjectName,
            faculty: s.faculty || s.teacherName,
            room: s.room || s.roomNumber,
            type: s.type || (s.isLab ? 'Lab' : 'Lecture'),
            section: s.section || s.sectionName
          });
        }
      });
      setTimetable(grid);
      return grid;
    } catch (err) {
      console.warn('[ERPContext] Timetable fetch notice:', err.message);
      return { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [] };
    }
  }, [currentRole]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshTimetable();
    }
  }, [isAuthenticated, refreshTimetable]);

  // Login handler with authoritative role verification
  const login = async ({ email, password, role }) => {
    const res = await authApi.login({ email, password, role });
    if (!res || !res.token) {
      throw new Error(res?.message || 'Login failed. Invalid response from server.');
    }

    const user = res.user;
    const combinedUser = {
      ...user,
      ...(user.studentProfile || {}),
      ...(user.facultyProfile || {}),
      id: user.id,
      role: user.role
    };
    // Normalize association objects (section, department) to plain strings
    if (combinedUser.section && typeof combinedUser.section === 'object') {
      combinedUser.section = combinedUser.section.name || 'A';
    }
    if (combinedUser.department && typeof combinedUser.department === 'object') {
      combinedUser.department = combinedUser.department.name || 'CSE';
    }

    let targetRole = (user.role || 'student').toLowerCase();
    const isAppointedTg = Boolean(
      targetRole === 'tg' ||
      user.isTG ||
      user.isTg ||
      combinedUser.isTG ||
      combinedUser.isTg ||
      (user.mentorGroups && user.mentorGroups.length > 0) ||
      (combinedUser.mentorGroups && combinedUser.mentorGroups.length > 0) ||
      (combinedUser.designation || '').toLowerCase().includes('(tg)') ||
      (combinedUser.designation || '').toLowerCase().includes('tg')
    );

    if (targetRole === 'faculty') {
      targetRole = 'teacher';
    } else if (targetRole === 'tg' || ((role || '').toLowerCase() === 'tg' && isAppointedTg)) {
      targetRole = 'tg';
    }

    combinedUser.isTG = isAppointedTg;
    combinedUser.isTg = isAppointedTg;
    combinedUser.isAppointedTg = isAppointedTg;

    setToken(res.token);
    setCurrentUser(combinedUser);
    setCurrentRole(targetRole);
    setIsAuthenticated(true);

    localStorage.setItem('oist_user', JSON.stringify(combinedUser));
    localStorage.setItem('oist_role', targetRole);
    localStorage.setItem('oist_auth', 'true');

    addToast('Authenticated Successfully', `Welcome to OIST CSE ERP, ${combinedUser.name}!`, 'success');
    return combinedUser;
  };

  // Logout handler
  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      apiClient.clearSession();
      setIsAuthenticated(false);
      setCurrentUser(null);
      setDashboardData(null);
      addToast('Logged Out', 'You have been securely signed out of CSE Department ERP.', 'info');
    }
  };

  // =========================================================================
  // Real Backend Mutation Actions
  // =========================================================================

  // Mark Attendance
  const markAttendance = async (data) => {
    const res = await attendanceApi.markAttendance(data);
    addToast('Attendance Recorded', 'Roll call entry saved successfully in database.', 'success');
    refreshAllData();
    fetchDashboard();
    return res;
  };

  const bulkMarkAttendance = async (data) => {
    const res = await attendanceApi.bulkMarkAttendance(data);
    addToast('Bulk Roll Call Saved', 'Section attendance ledger updated in database.', 'success');
    refreshAllData();
    fetchDashboard();
    return res;
  };

  // Attendance Consideration (Duty/Hackathon)
  const submitAttendanceConsideration = async (formData) => {
    const res = await requestApi.submitAttendanceConsideration(formData);
    addToast('Request Submitted', 'Attendance consideration lodged. Forwarded to mentor for verification.', 'success');
    refreshAllData();
    fetchDashboard();
    return res;
  };

  const tgReviewAttendanceConsideration = async (id, recommendation) => {
    const res = await requestApi.tgReviewAttendanceConsideration(id, recommendation);
    addToast('Recommendation Submitted', 'Attendance request verified by TG; forwarded to HOD for clearance.', 'success');
    refreshAllData();
    fetchDashboard();
    return res;
  };

  const hodApproveAttendanceConsideration = async (id) => {
    const res = await requestApi.hodApproveAttendanceConsideration(id);
    addToast('Duty Credit Granted', 'HOD clearance approved. Attendance credit synchronized in database.', 'success');
    refreshAllData();
    fetchDashboard();
    return res;
  };

  const tgRejectAttendanceConsideration = async (id, reason) => {
    const res = await requestApi.tgRejectAttendanceConsideration(id, reason);
    addToast('Request Rejected', 'Attendance consideration rejected by TG.', 'warning');
    refreshAllData();
    fetchDashboard();
    return res;
  };

  const hodRejectAttendanceConsideration = async (id, reason) => {
    const res = await requestApi.hodRejectAttendanceConsideration(id, reason);
    addToast('Request Rejected', 'Attendance consideration request was rejected by HOD.', 'warning');
    refreshAllData();
    fetchDashboard();
    return res;
  };

  // Attendance Query (Dispute absent record)
  const submitAttendanceQuery = async (formData) => {
    const res = await requestApi.submitAttendanceQuery(formData);
    addToast('Dispute Lodged', 'Attendance query lodged. Forwarded for review.', 'info');
    refreshAllData();
    fetchDashboard();
    return res;
  };

  const tgReviewAttendanceQuery = async (id, note) => {
    const res = await requestApi.tgReviewAttendanceQuery(id, note);
    addToast('Dispute Verified', 'Attendance query verified by TG; forwarded to HOD.', 'info');
    refreshAllData();
    fetchDashboard();
    return res;
  };

  const tgRejectAttendanceQuery = async (id, reason) => {
    const res = await requestApi.tgRejectAttendanceQuery(id, reason);
    addToast('Dispute Rejected', 'Attendance query rejected by TG.', 'warning');
    refreshAllData();
    fetchDashboard();
    return res;
  };

  const hodApproveAttendanceQuery = async (id) => {
    const res = await requestApi.hodApproveAttendanceQuery(id);
    addToast('Attendance Corrected', 'Absent record corrected to Present in relational database.', 'success');
    refreshAllData();
    fetchDashboard();
    return res;
  };

  const hodRejectAttendanceQuery = async (id, reason) => {
    const res = await requestApi.hodRejectAttendanceQuery(id, reason);
    addToast('Query Rejected', 'Attendance dispute query was rejected by HOD.', 'warning');
    refreshAllData();
    fetchDashboard();
    return res;
  };

  // Leave Requests
  const applyLeave = async (formData) => {
    const res = await requestApi.applyLeave(formData);
    addToast('Leave Applied', res.message || 'Leave application registered in database.', 'info');
    refreshAllData();
    fetchDashboard();
    return res;
  };

  const tgReviewLeave = async (id, approved = true, comments) => {
    const res = await requestApi.tgReviewLeave(id, approved, comments);
    addToast(approved ? 'Leave Recommended' : 'Leave Rejected', res.message || 'Leave updated.', approved ? 'info' : 'warning');
    refreshAllData();
    fetchDashboard();
    return res;
  };

  const tgRejectLeave = async (id, reason) => {
    const res = await requestApi.tgRejectLeave(id, reason);
    addToast('Leave Rejected', res.message || 'Leave rejected by TG.', 'warning');
    refreshAllData();
    fetchDashboard();
    return res;
  };

  const hodApproveLeave = async (id, comments) => {
    const res = await requestApi.hodApproveLeave(id, comments);
    addToast('Leave Granted', 'Leave officially approved by HOD.', 'success');
    refreshAllData();
    fetchDashboard();
    return res;
  };

  const hodRejectLeave = async (id, reason) => {
    const res = await requestApi.hodRejectLeave(id, reason);
    addToast('Leave Rejected', 'Leave application was rejected by HOD.', 'warning');
    refreshAllData();
    fetchDashboard();
    return res;
  };

  // Google Live Sheet Actions
  const getGoogleSheetConfig = async () => {
    try {
      const res = await requestApi.getGoogleSheetConfig();
      return res?.config || res;
    } catch (err) {
      console.warn('Failed to fetch Google Sheet config:', err.message);
      return null;
    }
  };

  const saveGoogleSheetConfig = async (config) => {
    const res = await requestApi.saveGoogleSheetConfig(config);
    addToast('Sheet Settings Saved', 'Google Live Sheet integration settings updated.', 'success');
    return res;
  };

  const syncAllToGoogleSheet = async (params) => {
    const res = await requestApi.syncAllToGoogleSheet(params);
    addToast('Sync Complete', res.message || 'Records synchronized to Google Sheet.', 'success');
    return res;
  };

  const testGoogleSheetConnection = async (webhookUrl) => {
    const res = await requestApi.testGoogleSheetConnection(webhookUrl);
    addToast('Connection Verified', res.message || 'Successfully reached Google Sheet webhook!', 'success');
    return res;
  };

  // Timetable AI Actions
  const generateTimetableAI = async (params) => {
    addToast('AI Scheduler Active', 'Generating deterministic collision-free timetable...', 'info');
    const res = await timetableApi.generateTimetable(params);
    addToast('Timetable Generated', `Version v${res?.version || 1} generated successfully.`, 'success');
    refreshTimetable(params.year, params.semester, params.section);
    refreshAllData();
    fetchDashboard();
    return res;
  };

  const approveTimetable = async (id) => {
    const res = await timetableApi.approveTimetable(id);
    addToast('Timetable Approved', 'Timetable version approved by HOD.', 'success');
    refreshTimetable();
    fetchDashboard();
    return res;
  };

  const publishTimetable = async (id) => {
    const res = await timetableApi.publishTimetable(id);
    addToast('Timetable Published', 'Timetable officially published and broadcasted to department!', 'success');
    refreshTimetable();
    fetchDashboard();
    return res;
  };

  // Notices
  const broadcastNotice = async (noticeData) => {
    const res = await noticeApi.createNotice(noticeData);
    addToast('Notice Broadcasted', 'New department notice broadcasted across portals.', 'success');
    refreshAllData();
    return res;
  };

  const deleteNotice = async (id) => {
    try {
      await noticeApi.deleteNotice(id);
      setNotices((prev) => (Array.isArray(prev) ? prev.filter((n) => n.id !== id) : []));
      addToast('Circular Deleted', 'Notice circular has been permanently removed.', 'info');
      refreshAllData();
      return true;
    } catch (err) {
      addToast('Delete Failed', err.message || 'Could not delete notice circular.', 'error');
      throw err;
    }
  };

  // Notifications
  const markNotificationRead = async (id) => {
    await notificationApi.markRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllNotifications = async () => {
    await notificationApi.clearAll(currentRole);
    setNotifications([]);
    addToast('Notifications Cleared', 'All alerts cleared.', 'info');
  };

  // Safe fallback mock-free state for components
  const contextValue = {
    // Auth & Identity
    isAuthenticated,
    loadingAuth,
    currentUser: currentUser || {
      name: 'User',
      email: '',
      role: currentRole,
      department: 'Computer Science & Engineering'
    },
    currentRole,
    users: {
      student: currentRole === 'student' ? currentUser : null,
      teacher: currentRole === 'teacher' ? currentUser : null,
      tg: currentRole === 'tg' ? currentUser : null,
      hod: currentRole === 'hod' ? currentUser : null,
      admin: currentRole === 'admin' ? currentUser : null
    },
    login,
    logout,

    // Real Entities
    students,
    teachers,
    subjects,
    sections,
    academicHierarchy,
    timetable,
    timetableConflicts: [],
    attendanceRequests,
    attendanceQueries,
    leaveRequests,
    notices,
    notifications,

    // Empty initial arrays for assignments, submissions, tests (ready for real backends)
    assignments: [],
    submissions: [],
    tests: [],
    feedbackList: [],
    classes: [],

    // Dashboard
    dashboardData,
    dashboardLoading,
    dashboardError,
    fetchDashboard,
    refreshAllData,
    refreshTimetable,

    // Actions
    markAttendance,
    bulkMarkAttendance,
    submitAttendanceConsideration,
    tgReviewAttendanceConsideration,
    tgRejectAttendanceConsideration,
    hodApproveAttendanceConsideration,
    hodRejectAttendanceConsideration,
    submitAttendanceQuery,
    tgReviewAttendanceQuery,
    tgRejectAttendanceQuery,
    hodApproveAttendanceQuery,
    hodRejectAttendanceQuery,
    applyLeave,
    tgReviewLeave,
    tgRejectLeave,
    hodApproveLeave,
    hodRejectLeave,
    getGoogleSheetConfig,
    saveGoogleSheetConfig,
    syncAllToGoogleSheet,
    testGoogleSheetConnection,
    generateTimetableAI,
    approveTimetable,
    publishTimetable,
    broadcastNotice,
    deleteNotice,
    markNotificationRead,
    clearAllNotifications,

    // UI Feedback
    toasts,
    addToast,
    removeToast,
    openModal,
    closeModal,
    activeModal,
    modalState: activeModal,
    agentModal,
    openAgentModal,
    closeAgentModal
  };

  return <ERPContext.Provider value={contextValue}>{children}</ERPContext.Provider>;
}

export function useERP() {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
}

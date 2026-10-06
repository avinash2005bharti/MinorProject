import React, { useEffect, useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { useNavigate, Link } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboardApi';
import { studentApi } from '../../api/studentApi';
import {
  Users,
  GraduationCap,
  Building2,
  User,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  TrendingUp,
  PieChart,
  Zap,
  UserPlus,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Award,
  CalendarDays,
  Activity,
  CheckSquare,
  Search,
  Phone,
  Mail,
  UserCheck,
  ExternalLink,
  X
} from 'lucide-react';

export default function AdminDashboard() {
  const { currentUser, openModal, addToast } = useERP();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Section Overview (Image 4) States for Admin
  const [selectedSectionLetter, setSelectedSectionLetter] = useState('A');
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [sectionSearchTerm, setSectionSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState(5); // Default to Sem 5 per Image 4

  // Move to Next Semester (Promotion / Shift) States
  const [showMoveSemModal, setShowMoveSemModal] = useState(false);
  const [moveScope, setMoveScope] = useState('SECTION'); // 'SECTION' or 'ALL_SEMESTER'
  const [moveLoading, setMoveLoading] = useState(false);
  const [targetSemester, setTargetSemester] = useState(6);

  // Live Digital Clock
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getAdminDashboard();
      if (res?.data) {
        setDashboard(res.data);
      }
    } catch (err) {
      setError(err.message || 'Unable to load real admin analytics from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Time & Greeting Helpers
  const hour = currentDateTime.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const firstName = currentUser?.name ? currentUser.name.split(' ')[0] : 'Avinash';

  const formattedDate = currentDateTime.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const formattedTime = currentDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // Extract real backend data directly without mock fallbacks
  const d = dashboard || {};
  const counts = {
    totalStudents: d.totalStudents ?? 0,
    totalFaculty: d.totalFaculty ?? 0,
    totalDepartments: d.totalDepartments ?? 0,
    totalUsers: d.totalUsers ?? 0,
    activeAgentsCount: d.activeAgentsCount ?? 0,
    todayClassesCount: d.todayClassesCount ?? 0,
    pendingTodayClasses: d.pendingTodayClasses ?? 0,
    enrolledStudents: d.enrolledStudents ?? 0,
    attendanceRate: d.attendanceRate ?? 0,
    activeTeachers: d.activeTeachers ?? 0,
    pendingApprovals: d.pendingApprovals ?? 0,
    leaveRequests: d.leaveRequests ?? 0,
    studentsGrowth: d.studentsGrowth || `${d.totalStudents ?? 0} registered`,
    facultyGrowth: d.facultyGrowth || `${d.totalFaculty ?? 0} active`,
    departmentsSubtext: d.departmentsSubtext || `${d.totalDepartments ?? 0} active`,
    usersGrowth: d.usersGrowth || `${d.totalUsers ?? 0} user accounts`,
    agentsSubtext: d.agentsSubtext || 'AI agents active',
    todayClassesSubtext: d.todayClassesSubtext || 'From timetable',
    enrolledSubtext: d.enrolledSubtext || 'Active in database',
    attendanceTrend: d.attendanceTrend || (d.attendanceRate > 0 ? `${d.attendanceRate}% verified` : 'No records yet'),
    activeTeachersTrend: d.activeTeachersTrend || `${d.activeTeachers ?? 0} available`,
    pendingApprovalsSubtext: d.pendingApprovalsSubtext || ((d.pendingApprovals ?? 0) > 0 ? 'Requires attention' : 'All clear'),
    leaveRequestsSubtext: d.leaveRequestsSubtext || ((d.leaveRequests ?? 0) > 0 ? 'In queue' : 'Queue empty')
  };

  const monthlyOverview = d.monthlyOverview || [
    { month: 'Oct', students: counts.totalStudents, faculty: counts.totalFaculty }
  ];

  const departmentDistribution = d.departmentDistribution || [];
  const recentActivity = d.recentActivity || [];
  const activeAgents = d.activeAgents || [];

  // Real Section Overview from PostgreSQL (Matching Image 4)
  const rawSectionOverview = useMemo(() => {
    if (d.sectionOverview && d.sectionOverview.length > 0) {
      return d.sectionOverview;
    }
    const sectionCardColors = [
      { text: '#2563EB', bg: '#EFF6FF', border: '#DBEAFE', iconBg: '#DBEAFE' },
      { text: '#7C3AED', bg: '#F5F3FF', border: '#EDE9FE', iconBg: '#EDE9FE' },
      { text: '#059669', bg: '#ECFDF5', border: '#D1FAE5', iconBg: '#D1FAE5' },
      { text: '#EA580C', bg: '#FFF7ED', border: '#FFEDD5', iconBg: '#FFEDD5' }
    ];
    return ['A', 'B', 'C', 'D'].map((letter, idx) => ({
      id: `sec-${letter}`,
      name: `CSE-${letter}`,
      rawName: letter,
      studentCount: 0,
      tgName: 'Prof. HOD CSE',
      students: [],
      status: 'Active',
      color: sectionCardColors[idx].text,
      bg: sectionCardColors[idx].bg,
      border: sectionCardColors[idx].border,
      iconBg: sectionCardColors[idx].iconBg
    }));
  }, [d.sectionOverview]);

  // Filter section students by selectedSemester
  const sectionOverviewFiltered = useMemo(() => {
    return rawSectionOverview.map((sec) => {
      const allStudents = sec.students || [];
      const filteredBySem = selectedSemester === 'ALL'
        ? allStudents
        : allStudents.filter((st) => Number(st.semester) === Number(selectedSemester));
      return {
        ...sec,
        studentCount: filteredBySem.length,
        students: filteredBySem
      };
    });
  }, [rawSectionOverview, selectedSemester]);

  // Active section data for student details view
  const activeSectionData = useMemo(() => {
    return (
      sectionOverviewFiltered.find(
        (s) => (s.rawName || '').toUpperCase() === selectedSectionLetter.toUpperCase()
      ) ||
      sectionOverviewFiltered[0] || {
        name: `CSE-${selectedSectionLetter}`,
        rawName: selectedSectionLetter,
        studentCount: 0,
        tgName: 'Prof. HOD CSE',
        students: []
      }
    );
  }, [sectionOverviewFiltered, selectedSectionLetter]);

  // Filter students by search term within active section
  const filteredSectionStudents = useMemo(() => {
    const list = activeSectionData.students || [];
    if (!sectionSearchTerm.trim()) return list;
    const term = sectionSearchTerm.toLowerCase();
    return list.filter(
      (s) =>
        (s.name || '').toLowerCase().includes(term) ||
        (s.enrollment || '').toLowerCase().includes(term) ||
        (s.email || '').toLowerCase().includes(term) ||
        (s.phone || '').toLowerCase().includes(term)
    );
  }, [activeSectionData, sectionSearchTerm]);

  const handleOpenSectionDetails = (letter) => {
    setSelectedSectionLetter(letter);
    setSectionSearchTerm('');
    setShowSectionModal(true);
  };

  // Count total students across all sections in currently selected semester
  const totalStudentsInCurrentSemester = useMemo(() => {
    const fromSem = selectedSemester === 'ALL' ? 5 : Number(selectedSemester);
    let count = 0;
    rawSectionOverview.forEach((sec) => {
      (sec.students || []).forEach((st) => {
        if (Number(st.semester) === fromSem) count++;
      });
    });
    return count;
  }, [rawSectionOverview, selectedSemester]);

  // Execute Move to Next Semester (Shift / Promotion)
  const handleConfirmMoveSemester = async () => {
    const fromSem = selectedSemester === 'ALL' ? 5 : Number(selectedSemester);
    if (fromSem >= 8) {
      addToast('Final Semester', 'Students in Semester 8 are already in their final graduating semester.', 'warning');
      return;
    }

    setMoveLoading(true);
    try {
      const payload = {
        fromSemester: fromSem,
        toSemester: targetSemester,
        applyToAllInSemester: moveScope === 'ALL_SEMESTER',
        sectionName: moveScope === 'SECTION' ? selectedSectionLetter : undefined
      };

      const res = await studentApi.moveToNextSemester(payload);
      addToast(
        'Semester Shift Successful',
        res.message || `Moved students from Semester ${fromSem} to Semester ${targetSemester}.`,
        'success'
      );

      // Refresh real database data
      await fetchAdminData();

      // Switch active view semester to targetSemester so user immediately sees the promoted students
      setSelectedSemester(targetSemester);
      setShowMoveSemModal(false);
    } catch (err) {
      addToast('Move Failed', err.message || 'Unable to move students to next semester.', 'error');
    } finally {
      setMoveLoading(false);
    }
  };

  // Dynamic Chart Scale derived strictly from real database counts
  const rawChartMax = Math.max(
    ...monthlyOverview.map((m) => Math.max(m.students || 0, m.faculty || 0)),
    8
  );
  // Compute round ceiling for gridlines
  const gridMax = Math.max(10, Math.ceil(rawChartMax / 5) * 5);
  const gridSteps = [0, Math.round(gridMax * 0.33), Math.round(gridMax * 0.66), gridMax];

  // SVG Spline Line Chart Calculations
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const chartWidth = 520;
  const chartHeight = 180;
  const paddingX = 40;
  const paddingY = 25;

  const pointsStudents = useMemo(() => {
    return monthlyOverview.map((item, idx) => {
      const denom = Math.max(1, monthlyOverview.length - 1);
      const x = paddingX + (idx / denom) * (chartWidth - paddingX * 2);
      const y = chartHeight - paddingY - ((item.students || 0) / gridMax) * (chartHeight - paddingY * 2);
      return { x, y, ...item };
    });
  }, [monthlyOverview, gridMax]);

  const pointsFaculty = useMemo(() => {
    return monthlyOverview.map((item, idx) => {
      const denom = Math.max(1, monthlyOverview.length - 1);
      const x = paddingX + (idx / denom) * (chartWidth - paddingX * 2);
      const y = chartHeight - paddingY - ((item.faculty || 0) / gridMax) * (chartHeight - paddingY * 2);
      return { x, y, ...item };
    });
  }, [monthlyOverview, gridMax]);

  // Smooth SVG Path Generator
  const getSplinePath = (pts) => {
    if (!pts.length) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const studentSpline = getSplinePath(pointsStudents);
  const facultySpline = getSplinePath(pointsFaculty);

  const studentArea = pointsStudents.length
    ? `${studentSpline} L ${pointsStudents[pointsStudents.length - 1].x} ${chartHeight - paddingY} L ${pointsStudents[0].x} ${chartHeight - paddingY} Z`
    : '';

  // SVG Donut Chart Calculation
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;
  const donutSlices = departmentDistribution.map((dept) => {
    const strokeDasharray = `${(dept.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += dept.percentage;
    return {
      ...dept,
      strokeDasharray,
      strokeDashoffset
    };
  });

  return (
    <div className="admin-dash-wrapper">
      {/* 1. Header Banner */}
      <div className="admin-header-row">
        <div className="admin-header-greeting">
          <h1>
            <span>{greeting}, {firstName}!</span>
            <span style={{ fontSize: '24px' }}>👋</span>
          </h1>
          <p>Here's what's happening with your college today.</p>
        </div>

        <div className="admin-header-widgets">
          {/* Live Date & Time Widget */}
          <div className="admin-widget-card">
            <div className="admin-widget-icon" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
              <Calendar size={17} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>{formattedDate}</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                {formattedTime}
              </span>
            </div>
          </div>

          {/* College Badge */}
          <div className="admin-widget-card">
            <div className="admin-widget-icon" style={{ backgroundColor: '#F1F5F9', color: '#334155' }}>
              <Building2 size={17} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>OIST CSE</span>
              <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748B' }}>Bhopal, MP</span>
            </div>
          </div>

          {/* Admin Dashboard Pill */}
          <div className="admin-role-pill">
            <Award size={16} />
            <span>Admin Dashboard</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="btn btn-outline"
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '12px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#FFFFFF',
              borderColor: '#E2E8F0',
              color: '#475569'
            }}
            title="Refresh database records"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '12px', backgroundColor: '#FFF1F2', border: '1px solid #FECDD3', color: '#BE123C', fontSize: '12.5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button onClick={fetchAdminData} className="btn btn-sm btn-primary" style={{ fontSize: '11px', padding: '0.2rem 0.5rem' }}>
            Retry
          </button>
        </div>
      )}

      {/* 2. Top Metric Cards (6 cards) */}
      <div className="admin-metrics-grid-top">
        {/* Card 1: Total Students */}
        <div className="admin-stat-card">
          <div className="admin-stat-card-top">
            <span className="admin-stat-label">Total Students</span>
            <div className="admin-stat-icon-wrapper" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
              <Users size={20} />
            </div>
          </div>
          <div className="admin-stat-value">
            {counts.totalStudents.toLocaleString()}
          </div>
          <div className="admin-stat-trend">
            <span style={{ color: '#059669', fontWeight: 600 }}>{counts.studentsGrowth}</span>
          </div>
        </div>

        {/* Card 2: Teaching Faculty */}
        <div className="admin-stat-card">
          <div className="admin-stat-card-top">
            <span className="admin-stat-label">Teaching Faculty</span>
            <div className="admin-stat-icon-wrapper" style={{ backgroundColor: '#ECFDF5', color: '#059669' }}>
              <GraduationCap size={20} />
            </div>
          </div>
          <div className="admin-stat-value">
            {counts.totalFaculty.toLocaleString()}
          </div>
          <div className="admin-stat-trend">
            <span style={{ color: '#059669', fontWeight: 600 }}>{counts.facultyGrowth}</span>
          </div>
        </div>

        {/* Card 3: Departments */}
        <div className="admin-stat-card">
          <div className="admin-stat-card-top">
            <span className="admin-stat-label">Departments</span>
            <div className="admin-stat-icon-wrapper" style={{ backgroundColor: '#F5F3FF', color: '#7C3AED' }}>
              <Building2 size={20} />
            </div>
          </div>
          <div className="admin-stat-value">
            {counts.totalDepartments}
          </div>
          <div className="admin-stat-trend">
            <span style={{ color: '#64748B', fontWeight: 600 }}>{counts.departmentsSubtext}</span>
          </div>
        </div>

        {/* Card 4: Total User Accounts */}
        <div className="admin-stat-card">
          <div className="admin-stat-card-top">
            <span className="admin-stat-label">Total User Accounts</span>
            <div className="admin-stat-icon-wrapper" style={{ backgroundColor: '#FFF7ED', color: '#EA580C' }}>
              <User size={20} />
            </div>
          </div>
          <div className="admin-stat-value">
            {counts.totalUsers.toLocaleString()}
          </div>
          <div className="admin-stat-trend">
            <span style={{ color: '#EA580C', fontWeight: 600 }}>{counts.usersGrowth}</span>
          </div>
        </div>

        {/* Card 5: Autonomous Agents */}
        <div className="admin-stat-card">
          <div className="admin-stat-card-top">
            <span className="admin-stat-label">Autonomous Agents</span>
            <div className="admin-stat-icon-wrapper" style={{ backgroundColor: '#ECFDF5', color: '#10B981' }}>
              <Bot size={20} />
            </div>
          </div>
          <div className="admin-stat-value">
            {counts.activeAgentsCount}
          </div>
          <div className="admin-stat-trend">
            <span style={{ color: '#059669', fontWeight: 600 }}>{counts.agentsSubtext}</span>
          </div>
        </div>

        {/* Card 6: Today's Classes */}
        <div className="admin-stat-card">
          <div className="admin-stat-card-top">
            <span className="admin-stat-label">Today's Classes</span>
            <div className="admin-stat-icon-wrapper" style={{ backgroundColor: '#FFF1F2', color: '#E11D48' }}>
              <Calendar size={20} />
            </div>
          </div>
          <div className="admin-stat-value">
            {counts.todayClassesCount}
          </div>
          <div className="admin-stat-trend">
            <span style={{ color: counts.todayClassesCount > 0 ? '#059669' : '#64748B', fontWeight: 600 }}>
              {counts.todayClassesSubtext}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Middle Section (3-column layout: Overview Chart, Department Donut, Quick Actions) */}
      <div className="admin-middle-grid">
        {/* Column 1: Student & Faculty Overview Line Chart */}
        <div className="admin-panel-card">
          <div className="admin-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} style={{ color: '#2563EB' }} />
              <h3 className="admin-panel-title">Student & Faculty Overview</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '11.5px', fontWeight: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563EB' }} />
                <span style={{ color: '#475569' }}>Students</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                <span style={{ color: '#475569' }}>Faculty</span>
              </div>
            </div>
          </div>

          {/* SVG Smooth Spline Chart */}
          <div style={{ position: 'relative', width: '100%', height: '190px' }}>
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="studentAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines */}
              {gridSteps.map((val) => {
                const y = chartHeight - paddingY - (val / gridMax) * (chartHeight - paddingY * 2);
                return (
                  <g key={val}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="#F1F5F9"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      textAnchor="end"
                      fontSize="9.5"
                      fill="#94A3B8"
                      fontWeight="500"
                    >
                      {val.toLocaleString()}
                    </text>
                  </g>
                );
              })}

              {/* Area Gradient */}
              <path d={studentArea} fill="url(#studentAreaGradient)" />

              {/* Student Curve */}
              <path
                d={studentSpline}
                fill="none"
                stroke="#2563EB"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Faculty Curve */}
              <path
                d={facultySpline}
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Interactive Circles & Month Labels */}
              {pointsStudents.map((pt, i) => (
                <g key={i}>
                  {/* Student Point */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPoint === i ? '5' : '3'}
                    fill="#2563EB"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                    onMouseEnter={() => setHoveredPoint(i)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* Faculty Point */}
                  <circle
                    cx={pointsFaculty[i].x}
                    cy={pointsFaculty[i].y}
                    r={hoveredPoint === i ? '5' : '3'}
                    fill="#10B981"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                    onMouseEnter={() => setHoveredPoint(i)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* X-axis Month Label */}
                  <text
                    x={pt.x}
                    y={chartHeight - 6}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#64748B"
                    fontWeight="600"
                  >
                    {pt.month}
                  </text>
                </g>
              ))}
            </svg>

            {/* Hover Tooltip */}
            {hoveredPoint !== null && (
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: `${(pointsStudents[hoveredPoint].x / chartWidth) * 100}%`,
                  transform: 'translateX(-50%)',
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  pointerEvents: 'none',
                  zIndex: 10,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  whiteSpace: 'nowrap'
                }}
              >
                <div style={{ fontWeight: 700 }}>{monthlyOverview[hoveredPoint].month}</div>
                <div>Students: {monthlyOverview[hoveredPoint].students.toLocaleString()}</div>
                <div>Faculty: {monthlyOverview[hoveredPoint].faculty}</div>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Department Distribution Donut Chart */}
        <div className="admin-panel-card">
          <div className="admin-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChart size={18} style={{ color: '#2563EB' }} />
              <h3 className="admin-panel-title">Department Distribution</h3>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flex: 1 }}>
            {/* SVG Donut */}
            <div style={{ position: 'relative', width: '136px', height: '136px', flexShrink: 0 }}>
              <svg viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                {donutSlices.map((slice, i) => (
                  <circle
                    key={i}
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth="20"
                    strokeDasharray={slice.strokeDasharray}
                    strokeDashoffset={slice.strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.3s ease' }}
                  />
                ))}
              </svg>
              {/* Donut Center Label */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center'
                }}
              >
                <span style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
                  {counts.totalDepartments}
                </span>
                <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                  Departments
                </span>
              </div>
            </div>

            {/* Legend List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: 0 }}>
              {departmentDistribution.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: item.color,
                        flexShrink: 0
                      }}
                    />
                    <span style={{ fontWeight: 600, color: '#334155', truncate: true }}>
                      {item.code}
                    </span>
                  </div>
                  <span style={{ fontWeight: 700, color: '#0F172A', tabularNums: true }}>
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 3: Quick Actions Panel (Real backend data wired) */}
        <div className="admin-panel-card">
          <div className="admin-panel-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Zap size={17} style={{ color: '#2563EB' }} fill="#2563EB" />
                <h3 className="admin-panel-title">Quick Actions</h3>
              </div>
              <p className="admin-panel-subtitle">Manage your college operations</p>
            </div>
            <Link to="/admin/settings" className="admin-panel-action">
              <span>View all</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          {/* 6 Quick Action Tiles (2 cols x 3 rows) */}
          <div className="admin-quick-actions-grid">
            {/* 1. Add Student */}
            <div
              onClick={() => navigate('/admin/students')}
              className="admin-quick-action-tile"
              style={{ backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }}
              title="Add or manage enrolled students"
            >
              <div className="admin-tile-icon-box" style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8' }}>
                <UserPlus size={17} />
              </div>
              <div className="admin-tile-content">
                <span className="admin-tile-title">Add Student</span>
                <span className="admin-tile-hint" style={{ color: '#2563EB' }}>
                  {counts.totalStudents.toLocaleString()} total
                </span>
              </div>
            </div>

            {/* 2. Add Faculty */}
            <div
              onClick={() => navigate('/admin/teachers')}
              className="admin-quick-action-tile"
              style={{ backgroundColor: '#ECFDF5', borderColor: '#D1FAE5' }}
              title="Add or manage faculty directory"
            >
              <div className="admin-tile-icon-box" style={{ backgroundColor: '#D1FAE5', color: '#047857' }}>
                <GraduationCap size={17} />
              </div>
              <div className="admin-tile-content">
                <span className="admin-tile-title">Add Faculty</span>
                <span className="admin-tile-hint" style={{ color: '#059669' }}>
                  {counts.totalFaculty} active
                </span>
              </div>
            </div>

            {/* 3. Generate Timetable */}
            <div
              onClick={() => navigate('/hod/timetable')}
              className="admin-quick-action-tile"
              style={{ backgroundColor: '#F5F3FF', borderColor: '#EDE9FE' }}
              title="Generate optimized clash-free timetable"
            >
              <div className="admin-tile-icon-box" style={{ backgroundColor: '#EDE9FE', color: '#6D28D9' }}>
                <Sparkles size={17} />
              </div>
              <div className="admin-tile-content">
                <span className="admin-tile-title">Generate Timetable</span>
                <span className="admin-tile-hint" style={{ color: '#7C3AED' }}>
                  AI Generator
                </span>
              </div>
            </div>

            {/* 4. Manage Leave */}
            <div
              onClick={() => navigate('/hod/requests')}
              className="admin-quick-action-tile"
              style={{ backgroundColor: '#FFFBEB', borderColor: '#FEF3C7' }}
              title="Review faculty and student leave applications"
            >
              <div className="admin-tile-icon-box" style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}>
                <Clock size={17} />
              </div>
              <div className="admin-tile-content">
                <span className="admin-tile-title">Manage Leave</span>
                <span className="admin-tile-hint" style={{ color: '#D97706' }}>
                  {counts.leaveRequests} in queue
                </span>
              </div>
            </div>

            {/* 5. View Reports */}
            <div
              onClick={() => navigate('/hod/reports')}
              className="admin-quick-action-tile"
              style={{ backgroundColor: '#ECFEFF', borderColor: '#CFFAFE' }}
              title="View institutional analytics and reports"
            >
              <div className="admin-tile-icon-box" style={{ backgroundColor: '#CFFAFE', color: '#0E7490' }}>
                <FileText size={17} />
              </div>
              <div className="admin-tile-content">
                <span className="admin-tile-title">View Reports</span>
                <span className="admin-tile-hint" style={{ color: '#0891B2' }}>
                  Institutional
                </span>
              </div>
            </div>

            {/* 6. AI Assistant */}
            <div
              onClick={() => navigate('/ai-workspace')}
              className="admin-quick-action-tile"
              style={{ backgroundColor: '#FDF2F8', borderColor: '#FCE7F3' }}
              title="Open autonomous agent control center"
            >
              <div className="admin-tile-icon-box" style={{ backgroundColor: '#FCE7F3', color: '#BE185D' }}>
                <Bot size={17} />
              </div>
              <div className="admin-tile-content">
                <span className="admin-tile-title">AI Assistant</span>
                <span className="admin-tile-hint" style={{ color: '#DB2777' }}>
                  {counts.activeAgentsCount} online
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3.5 Section Overview Panel (CSE Only - Image 4 Wireframe) */}
      <div className="admin-panel-card" style={{ marginBottom: '1.5rem' }}>
        <div className="admin-panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users size={18} style={{ color: '#2563EB' }} />
            <div>
              <h3 className="admin-panel-title" style={{ margin: 0 }}>Section Overview (CSE Only)</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>
                Select a section card below to view enrolled students and assigned Tutor Guardian (TG).
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569' }}>Sem</span>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1.5px solid #CBD5E1',
                  backgroundColor: '#F8FAFC',
                  color: '#1E293B',
                  cursor: 'pointer',
                  outline: 'none'
                }}
                title="Filter section overview by semester"
              >
                <option value={5}>Sem 5</option>
                <option value={1}>Sem 1</option>
                <option value={2}>Sem 2</option>
                <option value={3}>Sem 3</option>
                <option value={4}>Sem 4</option>
                <option value={6}>Sem 6</option>
                <option value={7}>Sem 7</option>
                <option value={8}>Sem 8</option>
                <option value="ALL">All Semesters</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => handleOpenSectionDetails(selectedSectionLetter || 'A')}
              className="admin-panel-action"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              title="Inspect section students & TG details"
            >
              <span>View details</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* 4 Section Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          {sectionOverviewFiltered.map((sec) => (
            <div
              key={sec.id}
              onClick={() => handleOpenSectionDetails(sec.rawName || 'A')}
              style={{
                backgroundColor: sec.bg,
                borderColor: sec.border,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                padding: '1.25rem 1rem',
                borderRadius: '12px',
                border: `1.5px solid ${sec.border}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
              title={`Click to view TG and students for ${sec.name}`}
            >
              <div
                style={{
                  backgroundColor: sec.iconBg,
                  color: sec.color,
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.5rem'
                }}
              >
                <Users size={18} />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>{sec.name}</span>
              <span style={{ fontSize: '22px', fontWeight: 800, color: sec.color, marginTop: '2px' }}>{sec.studentCount}</span>
              <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 600 }}>Students</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#16A34A', marginTop: '6px' }}>● Active</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Second Row Metric Cards (5 cards) */}
      <div className="admin-metrics-grid-bottom">
        {/* Card 1: Enrolled Students */}
        <div className="admin-stat-card">
          <div className="admin-stat-card-top">
            <span className="admin-stat-label">Enrolled Students</span>
            <div className="admin-stat-icon-wrapper" style={{ backgroundColor: '#ECFDF5', color: '#10B981' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="admin-stat-value">
            {counts.enrolledStudents.toLocaleString()}
          </div>
          <div className="admin-stat-trend">
            <span style={{ color: '#64748B', fontWeight: 600 }}>{counts.enrolledSubtext}</span>
          </div>
        </div>

        {/* Card 2: Attendance Rate */}
        <div className="admin-stat-card">
          <div className="admin-stat-card-top">
            <span className="admin-stat-label">Attendance Rate</span>
            <div className="admin-stat-icon-wrapper" style={{ backgroundColor: '#F5F3FF', color: '#8B5CF6' }}>
              <Activity size={20} />
            </div>
          </div>
          <div className="admin-stat-value">
            {counts.attendanceRate}%
          </div>
          <div className="admin-stat-trend">
            <span style={{ color: counts.attendanceRate > 0 ? '#059669' : '#64748B', fontWeight: 600 }}>
              {counts.attendanceTrend}
            </span>
          </div>
        </div>

        {/* Card 3: Active Teachers */}
        <div className="admin-stat-card">
          <div className="admin-stat-card-top">
            <span className="admin-stat-label">Active Teachers</span>
            <div className="admin-stat-icon-wrapper" style={{ backgroundColor: '#EFF6FF', color: '#3B82F6' }}>
              <Users size={20} />
            </div>
          </div>
          <div className="admin-stat-value">
            {counts.activeTeachers}
          </div>
          <div className="admin-stat-trend">
            <span style={{ color: '#059669', fontWeight: 600 }}>
              {counts.activeTeachersTrend}
            </span>
          </div>
        </div>

        {/* Card 4: Pending Approvals */}
        <div className="admin-stat-card">
          <div className="admin-stat-card-top">
            <span className="admin-stat-label">Pending Approvals</span>
            <div className="admin-stat-icon-wrapper" style={{ backgroundColor: '#FFF1F2', color: '#E11D48' }}>
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="admin-stat-value">
            {counts.pendingApprovals}
          </div>
          <div className="admin-stat-trend">
            <span style={{ color: counts.pendingApprovals > 0 ? '#E11D48' : '#059669', fontWeight: 600 }}>
              {counts.pendingApprovalsSubtext}
            </span>
          </div>
        </div>

        {/* Card 5: Leave Requests */}
        <div className="admin-stat-card">
          <div className="admin-stat-card-top">
            <span className="admin-stat-label">Leave Requests</span>
            <div className="admin-stat-icon-wrapper" style={{ backgroundColor: '#F0FDFA', color: '#0D9488' }}>
              <Clock size={20} />
            </div>
          </div>
          <div className="admin-stat-value">
            {counts.leaveRequests}
          </div>
          <div className="admin-stat-trend">
            <span style={{ color: counts.leaveRequests > 0 ? '#D97706' : '#64748B', fontWeight: 600 }}>
              {counts.leaveRequestsSubtext}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Bottom Row (2-column layout: Recent Activity Log & Top Active Agents) */}
      <div className="admin-bottom-grid">
        {/* Left: Recent Activity Log */}
        <div className="admin-panel-card">
          <div className="admin-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} style={{ color: '#2563EB' }} />
              <h3 className="admin-panel-title">Recent Activity Log</h3>
            </div>
            <Link to="/admin/settings" className="admin-panel-action">
              <span>View all</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="admin-activity-table">
              <thead>
                <tr>
                  <th style={{ width: '95px' }}>Time</th>
                  <th>Action</th>
                  <th>User</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem', color: '#64748B', fontSize: '13px' }}>
                      No recent activity records found in the database.
                    </td>
                  </tr>
                ) : (
                  recentActivity.map((log) => {
                    const dotColors = {
                      emerald: '#10B981',
                      purple: '#8B5CF6',
                      blue: '#3B82F6',
                      teal: '#0D9488',
                      indigo: '#6366F1',
                      amber: '#F59E0B'
                    };
                    const dotColor = dotColors[log.type] || '#3B82F6';

                    return (
                      <tr key={log.id}>
                        <td style={{ color: '#64748B', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                backgroundColor: dotColor,
                                flexShrink: 0
                              }}
                            />
                            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                              {log.time}
                            </span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
                          {log.action}
                        </td>
                        <td style={{ color: '#334155', fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {log.user}
                        </td>
                        <td style={{ color: '#64748B', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.details}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Top Active Agents */}
        <div className="admin-panel-card">
          <div className="admin-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bot size={18} style={{ color: '#2563EB' }} />
              <h3 className="admin-panel-title">Top Active Agents</h3>
            </div>
            <Link to="/ai-workspace" className="admin-panel-action">
              <span>View all</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="admin-agents-list">
            {activeAgents.map((agent) => {
              const agentThemeMap = {
                emerald: { bg: '#ECFDF5', text: '#059669' },
                cyan: { bg: '#ECFEFF', text: '#0891B2' },
                amber: { bg: '#FFFBEB', text: '#D97706' },
                purple: { bg: '#F5F3FF', text: '#7C3AED' },
                rose: { bg: '#FFF1F2', text: '#E11D48' }
              };
              const theme = agentThemeMap[agent.color] || { bg: '#EFF6FF', text: '#2563EB' };

              return (
                <div key={agent.id} className="admin-agent-row">
                  <div className="admin-agent-info">
                    <div
                      className="admin-agent-avatar"
                      style={{
                        backgroundColor: theme.bg,
                        color: theme.text
                      }}
                    >
                      <Bot size={17} />
                    </div>
                    <div className="admin-agent-meta">
                      <span className="admin-agent-name">{agent.name}</span>
                      <span className="admin-agent-desc">{agent.description}</span>
                    </div>
                  </div>

                  <div className="admin-agent-badges">
                    <span className="admin-badge-active">
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#059669' }} />
                      Active
                    </span>
                    <span className="admin-badge-tasks">{agent.tasksCount} tasks</span>
                    <span className="admin-badge-uptime">Uptime {agent.uptime}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6. Section Overview & Student Details Modal (Exact Image 4 Wireframe) */}
      {showSectionModal && (
        <div className="hod-modal-overlay" onClick={() => setShowSectionModal(false)}>
          <div className="hod-section-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="hod-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} style={{ color: '#2563EB' }} />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                    Section Overview (CSE Only)
                  </h3>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748B' }}>
                  Select a section card below to view enrolled students and assigned Tutor Guardian (TG).
                </p>
              </div>

              {/* Top Right Controls Matching User Request: Current Semester Badge & Move to Next Semester Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Show Current Semester Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>Current:</span>
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 700,
                      backgroundColor: '#EFF6FF',
                      color: '#1D4ED8',
                      border: '1.5px solid #BFDBFE',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      letterSpacing: '0.02em'
                    }}
                    title="Current active semester"
                  >
                    Sem {selectedSemester === 'ALL' ? 'All' : selectedSemester}
                  </span>
                </div>

                {/* Move to Next Semester Button (Promotion / Shift in DB) */}
                <button
                  type="button"
                  onClick={() => {
                    const fromSem = selectedSemester === 'ALL' ? 5 : Number(selectedSemester);
                    setTargetSemester(Math.min(8, fromSem + 1));
                    setShowMoveSemModal(true);
                  }}
                  className="btn btn-primary"
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '5px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 4px rgba(37,99,235,0.2)'
                  }}
                  title="Shift/Promote students of this semester to the next semester in database"
                >
                  <ArrowRight size={14} />
                  <span>Move to Next Semester {selectedSemester !== 'ALL' && selectedSemester < 8 ? `(Sem ${Number(selectedSemester) + 1})` : ''}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSectionModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94A3B8',
                    padding: '4px',
                    borderRadius: '6px'
                  }}
                  title="Close modal"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="hod-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Top 4 Section Cards Grid (Matching Image 4) */}
              <div className="hod-section-tabs-container">
                {sectionOverviewFiltered.map((sec) => {
                  const isSelected = (sec.rawName || '').toUpperCase() === selectedSectionLetter.toUpperCase();
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => {
                        setSelectedSectionLetter(sec.rawName || 'A');
                        setSectionSearchTerm('');
                      }}
                      className={`hod-section-tab-btn ${isSelected ? 'active' : ''}`}
                      style={{
                        backgroundColor: isSelected ? '#EFF6FF' : sec.bg,
                        borderColor: isSelected ? '#2563EB' : sec.border
                      }}
                    >
                      <span
                        className="hod-section-tab-title"
                        style={{ color: isSelected ? '#1D4ED8' : sec.color }}
                      >
                        {sec.name}
                      </span>
                      <span className="hod-section-tab-count">
                        {sec.studentCount} {sec.studentCount === 1 ? 'Student' : 'Students'}
                      </span>
                      {isSelected && (
                        <span
                          style={{
                            marginTop: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#1D4ED8',
                            backgroundColor: '#DBEAFE',
                            padding: '1px 6px',
                            borderRadius: '9999px'
                          }}
                        >
                          Selected
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Student Details Card (Matching Image 4 with student details & TG : TG NAME) */}
              <div className="hod-student-details-box">
                {/* Header: student details on left, TG : TG NAME on right */}
                <div className="hod-student-details-header">
                  <div className="hod-student-details-title">
                    <GraduationCap size={18} style={{ color: '#2563EB' }} />
                    <span style={{ textTransform: 'lowercase' }}>student details</span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#64748B',
                        backgroundColor: '#E2E8F0',
                        padding: '2px 8px',
                        borderRadius: '9999px'
                      }}
                    >
                      {activeSectionData.name} • {activeSectionData.studentCount} Total
                    </span>
                  </div>

                  <div className="hod-student-tg-pill">
                    <UserCheck size={14} />
                    <span>TG : {activeSectionData.tgName || 'Prof. HOD CSE'}</span>
                  </div>
                </div>

                {/* Search Bar for student details */}
                <div
                  style={{
                    padding: '0.75rem 1.25rem',
                    backgroundColor: '#FFFFFF',
                    borderBottom: '1px solid #F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      flex: 1,
                      maxWidth: '380px'
                    }}
                  >
                    <Search
                      size={15}
                      style={{ position: 'absolute', left: '10px', color: '#94A3B8' }}
                    />
                    <input
                      type="text"
                      value={sectionSearchTerm}
                      onChange={(e) => setSectionSearchTerm(e.target.value)}
                      placeholder="Search student by name, enrollment, or email..."
                      style={{
                        width: '100%',
                        padding: '6px 12px 6px 32px',
                        fontSize: '12.5px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        outline: 'none',
                        color: '#0F172A'
                      }}
                    />
                    {sectionSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setSectionSearchTerm('')}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#94A3B8',
                          padding: 0
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                    Showing {filteredSectionStudents.length} of {activeSectionData.studentCount} students
                  </span>
                </div>

                {/* Table: name | enrollment | phone number | email */}
                <div className="hod-student-table-container">
                  {filteredSectionStudents.length === 0 ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '2.5rem 1.5rem',
                        color: '#64748B',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Users size={32} style={{ color: '#CBD5E1' }} />
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '13.5px', color: '#334155' }}>
                        {sectionSearchTerm
                          ? 'No matching students found'
                          : `No students enrolled in ${activeSectionData.name} yet`}
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
                        {sectionSearchTerm
                          ? 'Try adjusting your search criteria'
                          : 'Student records assigned to this section will appear here automatically.'}
                      </p>
                    </div>
                  ) : (
                    <table className="hod-student-table">
                      <thead>
                        <tr>
                          <th style={{ width: '28%' }}>name</th>
                          <th style={{ width: '22%' }}>enrollment</th>
                          <th style={{ width: '22%' }}>phone number</th>
                          <th style={{ width: '28%' }}>email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSectionStudents.map((st) => (
                          <tr key={st.id || st.enrollment}>
                            <td>
                              <div className="hod-student-name-cell">
                                <div className="hod-student-avatar">
                                  {(st.name || 'S').charAt(0).toUpperCase()}
                                </div>
                                <span>{st.name}</span>
                              </div>
                            </td>
                            <td>
                              <span className="hod-student-enrollment-badge">
                                {st.enrollment}
                              </span>
                            </td>
                            <td>
                              {st.phone && st.phone !== 'N/A' ? (
                                <a
                                  href={`tel:${st.phone}`}
                                  style={{
                                    color: '#2563EB',
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    fontWeight: 500
                                  }}
                                  title="Call student"
                                >
                                  <Phone size={12} style={{ color: '#059669' }} />
                                  <span>{st.phone}</span>
                                </a>
                              ) : (
                                <span style={{ color: '#94A3B8' }}>N/A</span>
                              )}
                            </td>
                            <td>
                              {st.email ? (
                                <a
                                  href={`mailto:${st.email}`}
                                  style={{
                                    color: '#2563EB',
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                  }}
                                  title="Send email"
                                >
                                  <Mail size={12} style={{ color: '#64748B' }} />
                                  <span style={{ wordBreak: 'break-all' }}>{st.email}</span>
                                </a>
                              ) : (
                                <span style={{ color: '#94A3B8' }}>N/A</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="hod-modal-footer">
              <Link
                to="/admin/students"
                className="btn btn-outline"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  textDecoration: 'none',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  padding: '0.45rem 1rem',
                  backgroundColor: '#FFFFFF'
                }}
              >
                <span>Manage in Classes Central</span>
                <ExternalLink size={13} />
              </Link>
              <button
                type="button"
                onClick={() => setShowSectionModal(false)}
                className="btn btn-primary"
                style={{
                  fontSize: '12px',
                  padding: '0.45rem 1.25rem',
                  borderRadius: '8px',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Move to Next Semester Confirmation Modal (Semester Promotion in Database) */}
      {showMoveSemModal && (
        <div className="hod-modal-overlay" style={{ zIndex: 1200 }} onClick={() => setShowMoveSemModal(false)}>
          <div
            className="card"
            style={{
              maxWidth: '500px',
              width: '90%',
              padding: '1.5rem',
              borderRadius: '16px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
              border: '1.5px solid #CBD5E1'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowRight size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                    Move to Next Semester
                  </h3>
                  <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                    Institutional Promotion & Student Shift
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMoveSemModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
                title="Cancel"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
                This action promotes enrolled students to the next academic semester directly in the PostgreSQL database.
              </p>

              {/* Transition Banner */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', padding: '0.85rem', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '1rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block', fontWeight: 600 }}>Current</span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B' }}>Semester {selectedSemester === 'ALL' ? 5 : selectedSemester}</span>
                </div>
                <ArrowRight size={20} style={{ color: '#2563EB' }} />
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block', fontWeight: 600 }}>Destination</span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#2563EB' }}>Semester {targetSemester}</span>
                </div>
              </div>

              {/* Target Semester Selector */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Target Semester:
                </label>
                <select
                  value={targetSemester}
                  onChange={(e) => setTargetSemester(Number(e.target.value))}
                  className="input-field"
                  style={{ width: '100%', height: '38px', fontSize: '12.5px', borderRadius: '8px' }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s} disabled={s <= (selectedSemester === 'ALL' ? 5 : Number(selectedSemester))}>
                      Semester {s} {s === (selectedSemester === 'ALL' ? 5 : Number(selectedSemester)) + 1 ? '(Next Semester)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scope Selection */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Promotion Scope:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', color: '#1E293B', cursor: 'pointer', padding: '10px 12px', borderRadius: '8px', border: `1.5px solid ${moveScope === 'SECTION' ? '#2563EB' : '#E2E8F0'}`, backgroundColor: moveScope === 'SECTION' ? '#EFF6FF' : '#FFFFFF' }}>
                    <input
                      type="radio"
                      name="adminMoveScope"
                      checked={moveScope === 'SECTION'}
                      onChange={() => setMoveScope('SECTION')}
                    />
                    <div>
                      <span style={{ fontWeight: 700 }}>Current Section only: CSE-{selectedSectionLetter}</span>
                      <span style={{ display: 'block', fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                        {activeSectionData.studentCount} active students will be moved
                      </span>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', color: '#1E293B', cursor: 'pointer', padding: '10px 12px', borderRadius: '8px', border: `1.5px solid ${moveScope === 'ALL_SEMESTER' ? '#2563EB' : '#E2E8F0'}`, backgroundColor: moveScope === 'ALL_SEMESTER' ? '#EFF6FF' : '#FFFFFF' }}>
                    <input
                      type="radio"
                      name="adminMoveScope"
                      checked={moveScope === 'ALL_SEMESTER'}
                      onChange={() => setMoveScope('ALL_SEMESTER')}
                    />
                    <div>
                      <span style={{ fontWeight: 700 }}>All Sections of Semester {selectedSemester === 'ALL' ? 5 : selectedSemester}</span>
                      <span style={{ display: 'block', fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                        {totalStudentsInCurrentSemester} total students across all CSE sections
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #E2E8F0', paddingTop: '0.85rem' }}>
              <button
                type="button"
                onClick={() => setShowMoveSemModal(false)}
                className="btn btn-outline"
                style={{ fontSize: '12px', padding: '0.45rem 1rem', borderRadius: '8px' }}
                disabled={moveLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMoveSemester}
                className="btn btn-primary"
                style={{ fontSize: '12px', padding: '0.45rem 1.25rem', backgroundColor: '#2563EB', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '8px' }}
                disabled={moveLoading}
              >
                {moveLoading ? (
                  <>
                    <div className="spinner-border spinner-border-sm" role="status" style={{ width: '12px', height: '12px' }} />
                    <span>Moving Students...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight size={13} />
                    <span>Confirm & Move to Sem {targetSemester}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

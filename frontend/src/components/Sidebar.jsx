import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useERP } from '../context/ERPContext';
import { Badge } from './common';
import {
  LayoutDashboard,
  Home,
  CheckSquare,
  Calendar,
  FileText,
  UserCheck,
  Users,
  Building2,
  Sparkles,
  BookOpen,
  Settings,
  Activity,
  Award,
  Clock,
  Megaphone,
  GraduationCap,
  Menu,
  Database,
  Bot,
  ChevronsUpDown
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose, onToggle }) {
  const { currentRole, currentUser, attendanceRequests, leaveRequests, attendanceQueries } = useERP();
  const navigate = useNavigate();
  const location = useLocation();

  const isAppointedTg = Boolean(
    currentUser?.isTG ||
    currentUser?.isTg ||
    (currentUser?.mentorGroups && currentUser?.mentorGroups.length > 0) ||
    (currentUser?.designation || '').toLowerCase().includes('(tg)')
  );

  const isTgMode = location.pathname.startsWith('/tg') || (currentRole === 'tg' && !location.pathname.startsWith('/teacher'));
  const tgPendingCount = (attendanceRequests?.length || 0) + (leaveRequests?.length || 0) + (attendanceQueries?.length || 0);

  const displayName = currentUser?.name || (currentRole === 'hod' ? 'HOD CSE' : (isTgMode ? 'Mentor' : 'Authorized User'));

  const getNavLinks = () => {
    if (isTgMode) {
      return [
        { to: '/tg', label: 'Dashboard', icon: <Home size={19} /> },
        { to: '/ai-workspace', label: 'AI Workspace', icon: <Bot size={19} /> },
        { to: '/tg/students', label: 'My Mentees', icon: <Users size={19} /> },
        { to: '/teacher/attendance', label: 'Attendance', icon: <CheckSquare size={19} /> },
        { to: '/tg/requests', label: 'Requests', icon: <FileText size={19} />, badge: tgPendingCount > 0 ? String(tgPendingCount) : '4' },
        { to: '/tg/notices', label: 'Notices', icon: <Megaphone size={19} /> },
        { to: '/teacher', label: 'Teaching Classes', icon: <GraduationCap size={19} /> }
      ];
    }

    switch (currentRole) {
      case 'admin':
        return [
          { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={19} /> },
          { to: '/ai-workspace', label: 'AI Workspace', icon: <Bot size={19} />, badge: 'Agent' },
          { to: '/admin/master-data', label: 'Master Data & Import', icon: <Database size={19} />, badge: 'Core' },
          { to: '/admin/users', label: 'User & RBAC Accounts', icon: <Users size={19} /> },
          { to: '/admin/students', label: 'Student Roster', icon: <GraduationCap size={19} /> },
          { to: '/admin/teachers', label: 'Faculty Directory', icon: <UserCheck size={19} /> },
          { to: '/admin/departments', label: 'Academic Structure', icon: <Building2 size={19} /> },
          { to: '/admin/settings', label: 'System Settings', icon: <Settings size={19} /> }
        ];
      case 'hod':
        return [
          { to: '/hod', label: 'Dashboard', icon: <LayoutDashboard size={19} /> },
          { to: '/ai-workspace', label: 'AI Workspace', icon: <Bot size={19} />, badge: 'Agent' },
          { to: '/hod/master-data', label: 'Master Data & Import', icon: <Database size={19} />, badge: 'Core' },
          { to: '/hod/teachers', label: 'Teachers', icon: <UserCheck size={19} /> },
          { to: '/hod/classes', label: 'Classes & Sections', icon: <Building2 size={19} /> },
          { to: '/hod/students', label: 'Students', icon: <Users size={19} /> },
          { to: '/hod/requests', label: 'Requests', icon: <FileText size={19} /> },
          { to: '/hod/approvals', label: 'Approvals', icon: <CheckSquare size={19} />, badge: 'Action' },
          { to: '/hod/timetable', label: 'Timetable', icon: <Sparkles size={19} />, badge: 'AI' },
          { to: '/hod/notices', label: 'Notices', icon: <Megaphone size={19} /> },
          { to: '/hod/reports', label: 'Reports', icon: <Activity size={19} /> }
        ];
      case 'tg':
        return [
          { to: '/tg', label: 'TG Dashboard', icon: <LayoutDashboard size={19} />, badge: 'TG' },
          { to: '/ai-workspace', label: 'AI Workspace', icon: <Bot size={19} />, badge: 'Agent' },
          { to: '/tg/students', label: 'Mentee Students', icon: <Users size={19} /> },
          { to: '/tg/requests', label: 'Mentor Requests', icon: <FileText size={19} />, badge: 'Review' },
          { to: '/tg/notices', label: 'Mentor Notices', icon: <Megaphone size={19} /> },
          { to: '/teacher', label: 'Faculty Dashboard', icon: <BookOpen size={19} /> }
        ];
      case 'teacher':
        {
        const teacherLinks = [
          { to: '/teacher', label: 'Dashboard', icon: <LayoutDashboard size={19} /> },
          ...(isAppointedTg ? [{ to: '/tg', label: 'TG Portal', icon: <GraduationCap size={19} />, badge: 'TG' }] : []),
          { to: '/ai-workspace', label: 'AI Workspace', icon: <Bot size={19} />, badge: 'Agent' },
          { to: '/teacher/attendance', label: 'Attendance', icon: <CheckSquare size={19} />, badge: 'Live' },
          { to: '/teacher/lectures', label: 'Lectures', icon: <Clock size={19} /> },
          { to: '/teacher/assignments', label: 'Assignments', icon: <BookOpen size={19} /> },
          { to: '/teacher/tests', label: 'Online Tests', icon: <Activity size={19} /> },
          { to: '/teacher/students', label: 'Students', icon: <Users size={19} /> },
          { to: '/teacher/notices', label: 'Notices', icon: <Megaphone size={19} /> }
        ];
        return teacherLinks;
        }
      case 'student':
      default:
        return [
          { to: '/student', label: 'Dashboard', icon: <LayoutDashboard size={19} /> },
          { to: '/ai-workspace', label: 'AI Workspace', icon: <Bot size={19} />, badge: 'Agent' },
          { to: '/student/attendance', label: 'Attendance', icon: <CheckSquare size={19} /> },
          { to: '/student/timetable', label: 'Timetable', icon: <Calendar size={19} /> },
          { to: '/student/assignments', label: 'Assignments', icon: <BookOpen size={19} /> },
          { to: '/student/requests', label: 'Requests', icon: <FileText size={19} /> },
          { to: '/student/notices', label: 'Notices', icon: <Megaphone size={19} /> },
          { to: '/student/profile', label: 'My Profile', icon: <Award size={19} /> }
        ];
    }
  };

  const navLinks = getNavLinks();

  const handleLinkClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose();
    }
  };

  const getBadgeVariant = (badgeText) => {
    switch (badgeText) {
      case 'AI':
      case 'Agent':
        return 'primary';
      case 'Live':
        return 'danger';
      case 'Action':
        return 'warning';
      case 'Review':
        return 'purple';
      case 'Core':
      default:
        return 'neutral';
    }
  };

  return (
    <>
      {/* Mobile/Tablet Backdrop when slid open */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            zIndex: 90
          }}
          className="lg:hidden"
        />
      )}

      {/* Slidable Sidebar Panel */}
      <aside
        className={`sidebar-container ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}
      >
        {/* Top Branding Section with dedicated Slide-Close button */}
        <div
          style={{
            height: 'var(--header-height)',
            padding: '0 1rem 0 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
            gap: '0.65rem'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              minWidth: 0
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: '#FFFFFF',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--border-subtle)',
                flexShrink: 0
              }}
            >
              <img
                src="/oist.png"
                alt="OIST CSE Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: isTgMode ? '#2563eb' : 'var(--text-primary)', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
                {isTgMode ? 'CampusFlow' : 'OIST CSE'}
              </h2>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                {isTgMode ? 'COLLEGE ERP' : 'Oriental Institute'}
              </span>
            </div>
          </div>

          {/* Sidebar Toggle Button matching header button type & style */}
          <button
            type="button"
            onClick={onToggle || onClose}
            className="tg-sidebar-toggle-btn"
            title="Toggle Navigation Menu"
            aria-label="Toggle Navigation Menu"
            id="sidebar-toggle-btn"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav
          style={{
            flex: 1,
            padding: '1rem 0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.3rem',
            overflowY: 'auto'
          }}
        >
          <div
            style={{
              padding: '0 0.5rem 0.5rem',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            {isTgMode ? 'TG PORTAL' : `${currentRole} portal`}
          </div>

          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/student' || link.to === '/teacher' || link.to === '/tg' || link.to === '/hod' || link.to === '/admin' || link.to === '/ai-workspace'}
              onClick={handleLinkClick}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {link.icon}
                </span>
                <span style={{ whiteSpace: 'nowrap' }}>
                  {link.label}
                </span>
              </div>

              {link.badge && (
                <Badge
                  variant={getBadgeVariant(link.badge)}
                  size="xs"
                  dot={link.badge === 'Live'}
                  pulse={link.badge === 'Live'}
                >
                  {link.badge}
                </Badge>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer User Info */}
        <div
          style={{
            padding: '0.75rem 0.85rem',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--surface-low)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.65rem'
          }}
        >
          {isTgMode ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '12px',
                    flexShrink: 0
                  }}
                >
                  {(displayName || 'TG').split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {displayName}
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#2563eb', whiteSpace: 'nowrap' }}>
                    TG Role
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentUser?.assignedSection || 'CSE · 5th Sem · Section A'}
                  </div>
                </div>
              </div>
              <ChevronsUpDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-100)',
                    color: 'var(--primary-700)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '12px',
                    flexShrink: 0
                  }}
                >
                  {displayName.charAt(0)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {displayName}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                    {currentUser?.designation || `${currentRole} role`}
                  </div>
                </div>
              </div>
              <Badge variant="primary" size="xs">
                {currentRole?.toUpperCase()}
              </Badge>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

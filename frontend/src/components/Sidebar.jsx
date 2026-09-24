import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useERP } from '../context/ERPContext';
import {
  LayoutDashboard,
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
  Compass,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose, onToggle, onOpenDemoGuide }) {
  const { currentRole, logout } = useERP();
  const navigate = useNavigate();

  const getNavLinks = () => {
    switch (currentRole) {
      case 'admin':
        return [
          { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={19} /> },
          { to: '/admin/students', label: 'Users & Roster', icon: <Users size={19} /> },
          { to: '/admin/teachers', label: 'Faculty Directory', icon: <UserCheck size={19} /> },
          { to: '/admin/departments', label: 'Departments', icon: <Building2 size={19} /> },
          { to: '/admin/settings', label: 'System Settings', icon: <Settings size={19} /> },
          { to: '/admin/settings', label: 'AI/Agent Settings', icon: <Sparkles size={19} />, badge: 'AI' }
        ];
      case 'hod':
        return [
          { to: '/hod', label: 'Dashboard', icon: <LayoutDashboard size={19} /> },
          { to: '/hod/teachers', label: 'Teachers', icon: <UserCheck size={19} /> },
          { to: '/hod/classes', label: 'Classes & Sections', icon: <Building2 size={19} /> },
          { to: '/hod/students', label: 'Students', icon: <Users size={19} /> },
          { to: '/hod/requests', label: 'Requests', icon: <FileText size={19} /> },
          { to: '/hod/approvals', label: 'Approvals', icon: <CheckSquare size={19} />, badge: 'Action' },
          { to: '/hod/timetable', label: 'Timetable', icon: <Sparkles size={19} />, badge: 'AI' },
          { to: '/hod/notices', label: 'Notices', icon: <Compass size={19} /> },
          { to: '/hod/reports', label: 'Reports', icon: <Activity size={19} /> }
        ];
      case 'tg':
        return [
          { to: '/tg', label: 'Dashboard', icon: <LayoutDashboard size={19} /> },
          { to: '/tg/students', label: 'Students', icon: <Users size={19} /> },
          { to: '/tg/attendance', label: 'Attendance', icon: <CheckSquare size={19} /> },
          { to: '/tg/requests', label: 'Requests', icon: <FileText size={19} />, badge: 'Review' },
          { to: '/tg/notices', label: 'Notices', icon: <Compass size={19} /> }
        ];
      case 'teacher':
        return [
          { to: '/teacher', label: 'Dashboard', icon: <LayoutDashboard size={19} /> },
          { to: '/teacher/attendance', label: 'Attendance', icon: <CheckSquare size={19} />, badge: 'Live' },
          { to: '/teacher/lectures', label: 'Lectures', icon: <Clock size={19} /> },
          { to: '/teacher/assignments', label: 'Assignments', icon: <BookOpen size={19} /> },
          { to: '/teacher/tests', label: 'Online Tests', icon: <Activity size={19} /> },
          { to: '/teacher/students', label: 'Students', icon: <Users size={19} /> },
          { to: '/teacher/notices', label: 'Notices', icon: <Compass size={19} /> }
        ];
      case 'student':
      default:
        return [
          { to: '/student', label: 'Dashboard', icon: <LayoutDashboard size={19} /> },
          { to: '/student/attendance', label: 'Attendance', icon: <CheckSquare size={19} /> },
          { to: '/student/timetable', label: 'Timetable', icon: <Calendar size={19} /> },
          { to: '/student/assignments', label: 'Assignments', icon: <BookOpen size={19} /> },
          { to: '/student/requests', label: 'Requests', icon: <FileText size={19} /> },
          { to: '/student/notices', label: 'Notices', icon: <Compass size={19} /> },
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
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
                OIST CSE
              </h2>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                Oriental Institute
              </span>
            </div>
          </div>

          {/* Slide-Close Button */}
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--surface-low)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            className="hover:bg-surface-high"
            title="Slide sidebar closed"
            aria-label="Slide sidebar closed"
          >
            <PanelLeftClose size={17} />
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
            {currentRole} portal
          </div>

          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/student' || link.to === '/teacher' || link.to === '/tg' || link.to === '/hod' || link.to === '/admin'}
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
                <span
                  className="badge badge-emerald"
                  style={{
                    fontSize: '10px',
                    padding: '0.15rem 0.45rem',
                    backgroundColor: link.badge === 'AI' ? 'var(--primary)' : undefined,
                    color: link.badge === 'AI' ? '#FFFFFF' : undefined
                  }}
                >
                  {link.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Demo Guide Shortcut Box & Logout */}
        <div
          style={{
            padding: '0.75rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}
        >
          {/* Demo Guide Box */}
          <button
            onClick={onOpenDemoGuide}
            className="card-interactive"
            style={{
              width: '100%',
              backgroundColor: 'var(--surface-low)',
              borderRadius: 'var(--radius-xl)',
              padding: '0.65rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              textAlign: 'left',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--primary-container)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Sparkles size={16} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                Demo Showcase Guide
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                4 Guided Workflows
              </div>
            </div>
          </button>

          {/* Logout Button */}
          <button
            onClick={() => {
              logout();
              onClose?.();
              navigate('/login');
            }}
            className="hover:bg-error-container"
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              borderRadius: 'var(--radius-lg)',
              padding: '0.5rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              color: 'var(--error)',
              fontSize: '12px',
              fontWeight: 600,
              transition: 'background 0.15s ease'
            }}
          >
            <LogOut size={16} />
            <span>Sign Out (Logout)</span>
          </button>
        </div>
      </aside>
    </>
  );
}

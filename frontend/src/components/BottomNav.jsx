import React from 'react';
import { NavLink } from 'react-router-dom';
import { useERP } from '../context/ERPContext';
import { LayoutDashboard, CheckSquare, Calendar, FileText, User } from 'lucide-react';

export default function BottomNav() {
  const { currentRole } = useERP();

  const getBottomLinks = () => {
    switch (currentRole) {
      case 'teacher':
        return [
          { to: '/teacher', label: 'Home', icon: <LayoutDashboard size={20} /> },
          { to: '/teacher/attendance', label: 'Attendance', icon: <CheckSquare size={20} /> },
          { to: '/teacher/timetable', label: 'Timetable', icon: <Calendar size={20} /> },
          { to: '/teacher/classes', label: 'Classes', icon: <FileText size={20} /> }
        ];
      case 'hod':
        return [
          { to: '/hod', label: 'Home', icon: <LayoutDashboard size={20} /> },
          { to: '/hod/attendance', label: 'Approvals', icon: <CheckSquare size={20} /> },
          { to: '/hod/timetable', label: 'Timetable', icon: <Calendar size={20} /> },
          { to: '/hod/requests', label: 'Requests', icon: <FileText size={20} /> }
        ];
      case 'tg':
        return [
          { to: '/tg', label: 'Home', icon: <LayoutDashboard size={20} /> },
          { to: '/tg/students', label: 'Mentees', icon: <User size={20} /> },
          { to: '/tg/requests', label: 'Requests', icon: <FileText size={20} /> },
          { to: '/tg/attendance', label: 'Attendance', icon: <CheckSquare size={20} /> }
        ];
      case 'student':
      default:
        return [
          { to: '/student', label: 'Home', icon: <LayoutDashboard size={20} /> },
          { to: '/student/attendance', label: 'Attendance', icon: <CheckSquare size={20} /> },
          { to: '/student/timetable', label: 'Timetable', icon: <Calendar size={20} /> },
          { to: '/student/requests', label: 'Requests', icon: <FileText size={20} /> },
          { to: '/student/profile', label: 'Profile', icon: <User size={20} /> }
        ];
    }
  };

  const links = getBottomLinks();

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'var(--bottom-nav-height)',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 50,
        boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.05)'
      }}
      className="lg:hidden"
    >
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.to === '/student' || link.to === '/teacher' || link.to === '/tg' || link.to === '/hod' || link.to === '/admin'}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
            fontSize: '11px',
            fontWeight: isActive ? 600 : 500,
            textDecoration: 'none',
            flex: 1,
            height: '100%',
            transition: 'color 0.15s ease'
          })}
        >
          {link.icon}
          <span>{link.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

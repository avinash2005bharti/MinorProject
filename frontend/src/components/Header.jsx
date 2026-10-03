import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { Bell, ShieldCheck, User, Menu, X, Bot, Check, Clock, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function Header({ isSidebarOpen, onToggleSidebar }) {
  const { currentRole, currentUser, notifications, logout } = useERP();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const rolePills = [
    { id: 'student', label: 'Student' },
    { id: 'teacher', label: 'Faculty' },
    { id: 'tg', label: 'TG / Mentor' },
    { id: 'hod', label: 'HOD' },
    { id: 'admin', label: 'Admin' }
  ];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
        boxShadow: '0 1px 8px rgba(0, 0, 0, 0.04)',
        width: '100%'
      }}
    >
      <div
        style={{
          height: 'var(--header-height)',
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          width: '100%'
        }}
      >
        {/* Left: Branding & Universal Slidable Sidebar Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Menu Sliding Button */}
          <button
            onClick={onToggleSidebar}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--surface-low)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              flexShrink: 0
            }}
            className="hover:bg-surface-high hover:scale-105 active:scale-95"
            title={isSidebarOpen ? "Slide Menu Closed" : "Slide Menu Open"}
            aria-label="Toggle Navigation Menu"
            id="btn-sidebar-toggle"
          >
            <Menu size={20} />
          </button>

          <Link
            to={`/${currentRole}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none', cursor: 'pointer' }}
            title="Go to Home Dashboard"
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: '#FFFFFF',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--border-subtle)',
                transition: 'transform 0.15s ease'
              }}
              className="hover:scale-105"
            >
              <img
                src="/oist.png"
                alt="OIST CSE Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                OIST CSE
              </span>
              <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>
                CampusFlow ERP
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Fixed Role Window Session Indicator (Restricted to Logged-in Role) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="fixed-role-window-badge">
            <span style={{ fontSize: '15px' }}>
              {currentRole === 'student' && '🎓'}
              {currentRole === 'teacher' && '👨‍🏫'}
              {currentRole === 'tg' && '🛡️'}
              {currentRole === 'hod' && '🏛️'}
              {currentRole === 'admin' && '⚙️'}
            </span>
            <div className="fixed-role-text">
              <span className="fixed-role-title">
                {currentRole === 'student' && 'Student Portal'}
                {currentRole === 'teacher' && 'Faculty Portal'}
                {currentRole === 'tg' && 'Mentor / TG Desk'}
                {currentRole === 'hod' && 'HOD Administration'}
                {currentRole === 'admin' && 'System Administrator'}
              </span>
              <span className="fixed-role-sub">
                {currentRole === 'student' && `${currentUser?.section || 'Section unassigned'} • B.Tech CSE`}
                {currentRole === 'teacher' && 'Dept. of CSE • Academic Faculty'}
                {currentRole === 'tg' && 'Teacher Guardian'}
                {currentRole === 'hod' && 'Dept. of CSE • Head of Dept'}
                {currentRole === 'admin' && 'CampusFlow ERP Infrastructure'}
              </span>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '0.15rem 0.45rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--primary-container)',
                color: 'var(--primary)',
                fontSize: '10px',
                fontWeight: 700,
                marginLeft: '0.25rem'
              }}
              title="This window is strictly restricted to your logged in role"
            >
              <ShieldCheck size={11} />
              <span>Role Session</span>
            </span>
          </div>

          {/* Switch Role Action -> Redirects to Login with role selection */}
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="switch-role-btn"
            title="Sign out and switch to another role"
          >
            <span>Switch Role</span>
          </button>
        </div>

        {/* Right: Quick Telemetry, Notification Bell & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
          {/* Autonomous Agents Health Indicator & AI Workspace Trigger */}
          <div
            onClick={() => navigate('/ai-workspace')}
            style={{
              cursor: 'pointer',
              display: 'none',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--secondary-container)',
              color: 'var(--on-secondary-container)',
              fontSize: '11px',
              fontWeight: 600,
              transition: 'opacity 0.2s ease'
            }}
            className="md:flex hover:opacity-85"
            title="Open Fullscreen CampusFlow AI Workspace"
          >
            <Bot size={14} />
            <span>AI Workspace</span>
            <span className="agent-pulse" style={{ width: '6px', height: '6px' }} />
          </div>

          {/* Notification Button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                backgroundColor: showNotifications ? 'var(--surface-high)' : 'var(--surface-low)',
                position: 'relative',
                transition: 'all 0.15s ease'
              }}
              aria-label="Notifications"
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--error)',
                    border: '2px solid #FFFFFF'
                  }}
                />
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div
                style={{
                  position: 'absolute',
                  top: '48px',
                  right: 0,
                  width: '320px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-xl)',
                  boxShadow: 'var(--shadow-xl)',
                  border: '1px solid var(--border-subtle)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  zIndex: 60,
                  animation: 'scaleUp 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Campus Notifications
                  </h4>
                  <span className="badge badge-indigo" style={{ fontSize: '10px' }}>
                    {notifications.length} alerts
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      No notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        style={{
                          padding: '0.65rem',
                          borderRadius: 'var(--radius-lg)',
                          backgroundColor: 'var(--surface-low)',
                          fontSize: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{n.title}</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{n.time}</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.3 }}>
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Current User Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '2px 8px 2px 2px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--surface-low)'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-container)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '12px',
                flexShrink: 0
              }}
              title={currentUser.name}
            >
              <User size={16} />
            </div>
            <div style={{ display: 'none', flexDirection: 'column', minWidth: '70px' }} className="sm:flex">
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
                {currentUser.name}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                {currentRole}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--error-container)',
              color: 'var(--error)',
              fontSize: '11px',
              fontWeight: 700,
              border: '1px solid #FECDD3',
              transition: 'all 0.15s ease'
            }}
            title="Sign out of OIST CSE ERP"
          >
            <LogOut size={14} />
            <span style={{ display: 'none' }} className="sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

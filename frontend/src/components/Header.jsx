import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { Bell, ShieldCheck, User, Menu, Bot, LogOut } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function Header({ isSidebarOpen, onToggleSidebar }) {
  const { currentRole, currentUser, notifications, logout } = useERP();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const roleEmojiMap = {
    student: '🎓',
    teacher: '👨‍🏫',
    tg: '🛡️',
    hod: '🏛️',
    admin: '⚙️'
  };

  const roleTitleMap = {
    student: 'Student Portal',
    teacher: 'Faculty Portal',
    tg: 'Mentor / TG Desk',
    hod: 'HOD Administration',
    admin: 'System Administrator'
  };

  const roleSubMap = {
    student: `${currentUser?.section || 'Section unassigned'} • B.Tech CSE`,
    teacher: 'Dept. of CSE • Academic Faculty',
    tg: 'Teacher Guardian',
    hod: 'Dept. of CSE • Head of Dept',
    admin: 'CampusFlow ERP Infrastructure'
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="flex items-center justify-between gap-3 px-4 md:px-6 h-16 w-full">
        {/* Left: Menu Trigger & Branding */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleSidebar}
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200 transition-all cursor-pointer active:scale-95"
            title={isSidebarOpen ? 'Slide Menu Closed' : 'Slide Menu Open'}
            aria-label="Toggle Navigation Menu"
            id="btn-sidebar-toggle"
          >
            <Menu size={18} />
          </button>

          <Link
            to={`/${currentRole}`}
            className="flex items-center gap-2.5 no-underline cursor-pointer group"
            title="Go to Home Dashboard"
          >
            <div className="w-9 h-9 rounded-lg bg-white p-0.5 flex items-center justify-center border border-slate-200 shadow-xs group-hover:scale-105 transition-transform">
              <img
                src="/oist.png"
                alt="OIST CSE Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-sm font-extrabold text-slate-900 leading-tight">
                OIST CSE
              </span>
              <span className="text-xs text-primary font-semibold leading-none">
                CampusFlow ERP
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Role Session Window Badge (Visible on md+ screens) */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full shadow-xs">
            <span className="text-sm shrink-0">
              {roleEmojiMap[currentRole] || '🎓'}
            </span>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {roleTitleMap[currentRole] || 'Academic Portal'}
              </span>
              <span className="text-xs text-slate-400 leading-none">
                {roleSubMap[currentRole] || 'Session Active'}
              </span>
            </div>
            <span className="badge badge-indigo text-xs ml-1 py-0.5 px-2">
              <ShieldCheck size={10} className="mr-0.5" />
              Verified
            </span>
          </div>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-300 text-slate-600 hover:text-primary hover:border-blue-300 hover:bg-blue-50 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            title="Sign out and switch to another role"
          >
            Switch Role
          </button>
        </div>

        {/* Right: AI Workspace, Notification Bell, User & Logout */}
        <div className="flex items-center gap-2 shrink-0 relative">
          {/* AI Workspace Shortcut */}
          <button
            onClick={() => navigate('/ai-workspace')}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold transition-all cursor-pointer"
            title="Open CampusFlow AI Workspace"
          >
            <Bot size={14} className="text-emerald-600" />
            <span>AI Workspace</span>
            <span className="agent-pulse w-1.5 h-1.5" />
          </button>

          {/* Notification Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
                showNotifications ? 'bg-slate-200 text-slate-900' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
              aria-label="Notifications"
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-600 ring-2 ring-white" />
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute top-12 right-0 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 flex flex-col gap-3 z-50 animate-scale-up">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900 m-0">
                    Notifications
                  </h4>
                  <span className="badge badge-indigo text-xs">
                    {notifications.length} alerts
                  </span>
                </div>

                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                      >
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="font-semibold text-slate-800">{n.title}</span>
                          <span className="text-xs text-slate-400">{n.time}</span>
                        </div>
                        <p className="text-slate-500 m-0 leading-snug">
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
            <div
              className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0"
              title={currentUser?.name}
            >
              <User size={14} />
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-tight whitespace-nowrap max-w-[120px] truncate">
                {currentUser?.name || 'User'}
              </span>
              <span className="text-xs text-slate-500 capitalize leading-none">
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-all cursor-pointer"
            title="Sign out of OIST CSE ERP"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

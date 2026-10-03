import React, { useState, useEffect } from 'react';
import { useERP } from '../context/ERPContext';
import { useNavigate } from 'react-router-dom';
import { noticeApi } from '../api/noticeApi';
import NoticeDetailModal from './modals/NoticeDetailModal';
import {
  Calendar,
  Clock,
  Megaphone,
  Bell,
  ArrowRight,
  Pin,
  ExternalLink,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  FileText,
  Eye
} from 'lucide-react';

export default function QuickDisplay() {
  const erp = useERP();
  const {
    currentRole = 'student',
    currentUser = {},
    students = [],
    leaveRequests = [],
    attendanceRequests = [],
    assignments = [],
    timetable = {},
    timetableConflicts = [],
    notices: erpNotices = []
  } = erp || {};

  const navigate = useNavigate();

  const [localNotices, setLocalNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);

  // Per-user persistent read tracking
  const storageKey = `erp_read_notices_${currentUser?.id || 'guest'}`;
  const [readNoticeIds, setReadNoticeIds] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const isNoticeRead = (notice) => {
    return Boolean(notice?.isRead || (notice?.id && readNoticeIds.includes(notice.id)));
  };

  const handleMarkNoticeRead = (id, isRead) => {
    setReadNoticeIds((prev) => {
      const updated = isRead ? Array.from(new Set([...prev, id])) : prev.filter((item) => item !== id);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setLocalNotices((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead } : n))
    );
  };

  useEffect(() => {
    let isMounted = true;
    const fetchFreshNotices = async () => {
      try {
        setLoadingNotices(true);
        const res = await noticeApi.getNotices();
        if (isMounted) {
          const fetched = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.notices) ? res.notices : []);
          if (fetched.length > 0) {
            setLocalNotices(fetched);
          }
        }
      } catch (err) {
        // Fallback silently to context notices
      } finally {
        if (isMounted) setLoadingNotices(false);
      }
    };
    fetchFreshNotices();
    return () => { isMounted = false; };
  }, [erpNotices]);

  // Defensive array normalizations
  const safeLeaveRequests = Array.isArray(leaveRequests) ? leaveRequests : [];
  const safeAttendanceRequests = Array.isArray(attendanceRequests) ? attendanceRequests : [];
  const safeAssignments = Array.isArray(assignments) ? assignments : [];

  // Pending counts
  const pendingLeaves = safeLeaveRequests.filter((l) => l && String(l.status || '').toLowerCase().startsWith('pending')).length;
  const pendingAttReqs = safeAttendanceRequests.filter((a) => a && String(a.status || '').toLowerCase().startsWith('pending')).length;
  const pendingAssignmentsCount = safeAssignments.filter((a) => a && String(a.status || '').toLowerCase() === 'active').length;

  // Dynamic day of week
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = daysOfWeek[new Date().getDay()];
  const effectiveDay = todayDayName === 'Sunday' ? 'Monday' : todayDayName;

  let todayClasses = [];
  if (timetable) {
    if (Array.isArray(timetable[effectiveDay])) {
      todayClasses = timetable[effectiveDay];
    } else if (Array.isArray(timetable)) {
      todayClasses = timetable.filter((s) => s?.day === effectiveDay);
    }
  }

  // Combine fresh notices and sort strictly by latest created
  const displayNotices = (localNotices.length > 0 ? localNotices : (Array.isArray(erpNotices) ? erpNotices : []))
    .filter(Boolean)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const latestNotice = displayNotices[0];
  const previousNotices = displayNotices.slice(1, 3);

  const getNoticesPath = () => {
    switch (currentRole) {
      case 'student':
        return '/student/notices';
      case 'teacher':
        return '/teacher/notices';
      case 'tg':
        return '/tg/notices';
      case 'hod':
        return '/hod/notices';
      case 'admin':
        return '/admin/notices';
      default:
        return '/student/notices';
    }
  };

  const handleOpenAttachment = (e, notice) => {
    e.stopPropagation();
    const url = notice.attachmentUrl || notice.linkUrl;
    if (url) {
      const fullUrl = url.startsWith('http') || url.startsWith('//') ? url : `http://localhost:5000${url}`;
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <div className="quick-display-grid">
        {/* CARD 1: TODAY'S SCHEDULE */}
        <div className="quick-display-card">
          <div className="quick-display-card-header">
            <div className="flex items-center gap-2">
              <span className="qd-badge-pill qd-badge-blue">
                <Calendar size={13} />
                <span>TODAY</span>
              </span>
              <span className="text-xs text-secondary font-medium">{effectiveDay}</span>
            </div>
            <span className="agent-pulse" />
          </div>

          <div className="quick-display-schedule-list">
            {todayClasses.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                No lectures scheduled for today.
              </div>
            ) : (
              todayClasses.slice(0, 3).map((item, idx) => {
                const timeDisplay = item?.time ? String(item.time).split(' - ')[0] : (item?.period ? `Period ${item.period}` : 'Slot');
                const facultyDisplay = typeof item?.faculty === 'string'
                  ? item.faculty.split(' ')[0]
                  : (item?.faculty?.name ? item.faculty.name.split(' ')[0] : 'Faculty');
                const roomDisplay = item?.room || item?.roomNumber || 'Room';
                const subjectDisplay = item?.subject || item?.courseName || 'Subject';

                return (
                  <div key={idx} className={`qd-schedule-item ${item?.isLive ? 'qd-schedule-live' : ''}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="qd-time-slot tabular-nums">{timeDisplay}</span>
                      <div className="truncate">
                        <span className="qd-subject-name truncate">{subjectDisplay}</span>
                        <span className="qd-meta-info truncate">{roomDisplay} • {facultyDisplay}</span>
                      </div>
                    </div>
                    {item?.isLive ? (
                      <span className="badge badge-emerald text-[10px] py-0.5 px-2">Live</span>
                    ) : (
                      <span className="qd-period-tag">P{item?.period || idx + 1}</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CARD 2: PENDING REVIEWS & SUBMISSIONS */}
        <div className="quick-display-card">
          <div className="quick-display-card-header">
            <div className="flex items-center gap-2">
              <span className="qd-badge-pill qd-badge-amber">
                <Clock size={13} />
                <span>PENDING</span>
              </span>
              <span className="text-xs text-muted font-medium">Needs Action</span>
            </div>
            <span
              className="text-xs text-primary font-semibold hover:underline cursor-pointer"
              onClick={() => {
                if (currentRole === 'student') navigate('/student/requests');
                else if (currentRole === 'tg') navigate('/tg/requests');
                else if (currentRole === 'hod') navigate('/hod/requests');
                else navigate('/teacher/assignments');
              }}
            >
              Review all
            </span>
          </div>

          <div className="quick-display-stat-rows">
            <div
              className="qd-stat-row cursor-pointer"
              onClick={() => navigate(currentRole === 'student' ? '/student/requests' : currentRole === 'tg' ? '/tg/requests' : '/hod/requests')}
            >
              <div className="flex items-center gap-2">
                <span className="qd-row-dot bg-amber-500" />
                <span className="text-xs font-semibold text-primary">Leave Requests</span>
              </div>
              <span className="qd-stat-count bg-amber-50 text-amber-700">{pendingLeaves} in queue</span>
            </div>

            <div
              className="qd-stat-row cursor-pointer"
              onClick={() => navigate(currentRole === 'student' ? '/student/attendance' : currentRole === 'tg' ? '/tg/requests' : '/hod/requests')}
            >
              <div className="flex items-center gap-2">
                <span className="qd-row-dot bg-blue-500" />
                <span className="text-xs font-semibold text-primary">Attendance Considerations</span>
              </div>
              <span className="qd-stat-count bg-blue-50 text-blue-700">{pendingAttReqs} active</span>
            </div>

            <div
              className="qd-stat-row cursor-pointer"
              onClick={() => navigate(currentRole === 'student' ? '/student/assignments' : '/teacher/assignments')}
            >
              <div className="flex items-center gap-2">
                <span className="qd-row-dot bg-indigo-500" />
                <span className="text-xs font-semibold text-primary">Active Course Assignments</span>
              </div>
              <span className="qd-stat-count bg-indigo-50 text-indigo-700">{pendingAssignmentsCount} due soon</span>
            </div>
          </div>
        </div>

        {/* CARD 3: REAL NOTICE BOARD (FOCUSED ON LATEST CIRCULAR) */}
        <div className="quick-display-card">
          <div className="quick-display-card-header">
            <div className="flex items-center gap-2">
              <span className="qd-badge-pill qd-badge-rose" style={{ backgroundColor: '#FFE4E6', color: '#E11D48' }}>
                <Megaphone size={13} />
                <span>NOTICE BOARD</span>
              </span>
              <span className="text-xs text-muted font-medium">Official Circulars</span>
            </div>
            <span
              className="text-xs text-primary font-semibold hover:underline cursor-pointer flex items-center gap-1"
              onClick={() => navigate(getNoticesPath())}
            >
              <span>View all ({displayNotices.length})</span>
              <ArrowRight size={11} />
            </span>
          </div>

          <div className="quick-display-alerts-list">
            {!latestNotice ? (
              <div style={{ padding: '1.25rem 0.5rem', textAlign: 'center', color: '#94A3B8', fontSize: '12px' }}>
                <Bell size={22} style={{ margin: '0 auto 0.4rem', opacity: 0.4 }} />
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No active circulars</div>
                <div style={{ fontSize: '10px', marginTop: '2px', color: '#94A3B8' }}>
                  Official notices from HOD, Admin & Faculty appear here live.
                </div>
              </div>
            ) : (
              <>
                {/* PRIMARY FEATURED LATEST NOTICE */}
                {(() => {
                  const read = isNoticeRead(latestNotice);
                  const isUrgent = latestNotice.priority === 'urgent' || latestNotice.type === 'ALERT';
                  const hasDoc = Boolean(latestNotice.attachmentUrl || latestNotice.linkUrl);
                  const dateDisplay = latestNotice.date || (latestNotice.createdAt ? new Date(latestNotice.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Today');

                  return (
                    <div
                      key={latestNotice.id}
                      onClick={() => setSelectedNotice(latestNotice)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-xl)',
                        backgroundColor: read ? '#F8FAFC' : isUrgent ? '#FFF1F2' : '#EFF6FF',
                        border: read ? '1px solid #E2E8F0' : isUrgent ? '1px solid #FECDD3' : '1px solid #BFDBFE',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: read ? 'none' : '0 2px 6px rgba(0,0,0,0.03)'
                      }}
                      className="hover:shadow-md"
                    >
                      {/* Top Header Pill Row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 800,
                              backgroundColor: isUrgent ? '#BE123C' : '#2563EB',
                              color: '#FFFFFF',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              letterSpacing: '0.04em'
                            }}
                          >
                            LATEST
                          </span>

                          {!read ? (
                            <span
                              style={{
                                fontSize: '9.5px',
                                fontWeight: 700,
                                backgroundColor: '#FEF3C7',
                                color: '#B45309',
                                border: '1px solid #FDE68A',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#D97706' }} />
                              UNREAD
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '9.5px',
                                fontWeight: 600,
                                backgroundColor: '#E2E8F0',
                                color: '#475569',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <CheckCircle2 size={10} className="text-emerald-600" />
                              READ
                            </span>
                          )}

                          {hasDoc && (
                            <span
                              style={{
                                fontSize: '9.5px',
                                fontWeight: 600,
                                backgroundColor: '#EEF2FF',
                                color: '#4338CA',
                                border: '1px solid #C7D2FE',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px'
                              }}
                            >
                              <Paperclip size={10} />
                              DOC
                            </span>
                          )}
                        </div>

                        <span style={{ fontSize: '9.5px', color: '#64748B', whiteSpace: 'nowrap' }}>
                          {dateDisplay}
                        </span>
                      </div>

                      {/* Title */}
                      <h4
                        style={{
                          fontSize: '12.5px',
                          fontWeight: read ? 700 : 800,
                          color: '#0F172A',
                          margin: 0,
                          lineHeight: 1.3
                        }}
                      >
                        {latestNotice.title || 'Official Department Notice'}
                      </h4>

                      {/* Message preview */}
                      <p
                        style={{
                          fontSize: '11px',
                          color: '#475569',
                          margin: 0,
                          lineHeight: 1.35,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {latestNotice.content || latestNotice.message || 'Department circular announcement.'}
                      </p>

                      {/* Action Bar */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          marginTop: '2px',
                          paddingTop: '4px',
                          borderTop: '1px solid rgba(0,0,0,0.05)'
                        }}
                      >
                        <span style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 600 }}>
                          {latestNotice.authorRole || 'HOD / Admin'} • {latestNotice.targetValue || 'Campus'}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {hasDoc && (
                            <button
                              type="button"
                              onClick={(e) => handleOpenAttachment(e, latestNotice)}
                              className="btn btn-outline"
                              style={{
                                fontSize: '10px',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                              title="Open attached document"
                            >
                              <ExternalLink size={10} />
                              <span>File</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedNotice(latestNotice)}
                            className="btn btn-primary"
                            style={{
                              fontSize: '10px',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <Eye size={11} />
                            <span>View Details</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* COMPACT SUB-FEED FOR PREVIOUS CIRCULARS (IF ANY) */}
                {previousNotices.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Recent Circulars
                    </span>

                    {previousNotices.map((notice) => {
                      const read = isNoticeRead(notice);
                      const hasDoc = Boolean(notice.attachmentUrl || notice.linkUrl);

                      return (
                        <div
                          key={notice.id}
                          onClick={() => setSelectedNotice(notice)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.4rem 0.6rem',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: 'var(--radius-lg)',
                            cursor: 'pointer',
                            fontSize: '11px',
                            transition: 'all 0.1s ease'
                          }}
                          className="hover:bg-slate-50"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: read ? '#94A3B8' : '#2563EB',
                                flexShrink: 0
                              }}
                              title={read ? 'Read' : 'Unread'}
                            />
                            <span
                              style={{
                                fontWeight: read ? 500 : 700,
                                color: read ? '#475569' : '#0F172A',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {notice.title}
                            </span>
                            {hasDoc && <Paperclip size={11} className="text-slate-400 shrink-0" />}
                          </div>

                          <span style={{ fontSize: '9.5px', color: '#94A3B8', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                            {notice.date || 'Live'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: VIEW NOTICE DETAILS & OPEN ATTACHMENT */}
      {selectedNotice && (
        <NoticeDetailModal
          notice={{
            ...selectedNotice,
            isRead: isNoticeRead(selectedNotice)
          }}
          onClose={() => setSelectedNotice(null)}
          onReadChange={handleMarkNoticeRead}
          onDelete={() => setSelectedNotice(null)}
        />
      )}
    </>
  );
}

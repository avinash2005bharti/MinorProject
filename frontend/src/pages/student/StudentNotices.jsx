import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import NoticeDetailModal from '../../components/modals/NoticeDetailModal';
import {
  Compass,
  Bell,
  AlertTriangle,
  Pin,
  Calendar,
  User,
  Search,
  Paperclip,
  ExternalLink,
  CheckCircle2,
  Eye
} from 'lucide-react';

export default function StudentNotices() {
  const { notices, currentUser } = useERP();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedNotice, setSelectedNotice] = useState(null);

  // Per-user read tracking
  const storageKey = `erp_read_notices_${currentUser?.id || 'student'}`;
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
  };

  const safeNotices = (Array.isArray(notices) ? notices : [])
    .filter(Boolean)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const filteredNotices = safeNotices.filter((n) => {
    if (!n) return false;
    const title = (n.title || '').toLowerCase();
    const content = (n.content || n.message || '').toLowerCase();
    const term = (search || '').toLowerCase();
    const matchesSearch = title.includes(term) || content.includes(term);
    if (!matchesSearch) return false;

    const read = isNoticeRead(n);
    if (filter === 'unread') return !read;
    if (filter === 'urgent') return n.priority === 'urgent';
    if (filter === 'section') return n.targetType === 'Section';
    if (filter === 'department') return n.targetType === 'Department';
    return true;
  });

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
      <div className="page-wrapper">
        <div className="flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Campus Notices & Circulars</h1>
                <span className="badge badge-emerald">Live Telemetry</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Official institutional notifications, exam dates & department announcements
              </p>
            </div>

            <span className="text-xs text-slate-500">
              Active Circulars: <strong>{safeNotices.length}</strong>
            </span>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {[
                { id: 'all', label: 'All Notices' },
                { id: 'unread', label: 'Unread Only' },
                { id: 'section', label: `Section ${currentUser?.section || 'A'}` },
                { id: 'department', label: 'Department Wide' },
                { id: 'urgent', label: 'Urgent Circulars' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`py-1.5 px-3.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                    filter === tab.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search circulars..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field text-xs h-9"
              />
            </div>
          </div>

          {/* Notices List */}
          <div className="flex flex-col gap-3.5">
            {filteredNotices.length === 0 ? (
              <div className="card text-center py-12 text-slate-400">
                <Compass size={36} className="mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="text-sm font-semibold">No circulars found matching your criteria.</p>
              </div>
            ) : (
              filteredNotices.map((notice) => {
                const read = isNoticeRead(notice);
                const hasDoc = Boolean(notice.attachmentUrl || notice.linkUrl);

                return (
                  <div
                    key={notice.id}
                    onClick={() => setSelectedNotice(notice)}
                    className={`card flex flex-col gap-2.5 transition-all cursor-pointer hover:shadow-md ${
                      !read ? 'border-blue-300 bg-blue-50/15' : notice.pinned ? 'border-indigo-200' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {notice.pinned && (
                          <span className="badge badge-indigo text-xs flex items-center gap-1">
                            <Pin size={11} /> Pinned
                          </span>
                        )}

                        {!read ? (
                          <span className="badge badge-amber text-xs flex items-center gap-1 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            UNREAD
                          </span>
                        ) : (
                          <span className="badge badge-slate text-xs flex items-center gap-1">
                            <CheckCircle2 size={11} className="text-emerald-600" />
                            READ
                          </span>
                        )}

                        <span
                          className={`badge text-xs ${
                            notice.priority === 'urgent'
                              ? 'badge-rose'
                              : notice.priority === 'info'
                              ? 'badge-slate'
                              : 'badge-amber'
                          }`}
                        >
                          {(notice.priority || 'general').toUpperCase()}
                        </span>

                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          To: {notice.targetType || 'Department'} ({notice.targetValue || 'Campus'})
                        </span>

                        {hasDoc && (
                          <span className="badge badge-indigo text-xs flex items-center gap-1">
                            <Paperclip size={11} /> Document Attached
                          </span>
                        )}
                      </div>

                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {notice.date || (notice.createdAt ? new Date(notice.createdAt).toLocaleDateString() : 'Today')}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {notice.title || 'Department Notice'}
                    </h3>

                    <p className="text-xs text-slate-700 leading-relaxed">
                      {notice.content || notice.message || ''}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500 flex-wrap gap-2">
                      <span className="flex items-center gap-1.5">
                        <User size={13} className="text-slate-400" />
                        Issued by: <strong className="text-slate-700">{notice.authorName || 'Administration'}</strong> ({notice.authorRole || 'Faculty / HOD'})
                      </span>

                      <div className="flex items-center gap-2">
                        {hasDoc && (
                          <button
                            type="button"
                            onClick={(e) => handleOpenAttachment(e, notice)}
                            className="btn btn-outline text-xs py-1 px-2.5 flex items-center gap-1"
                          >
                            <ExternalLink size={12} />
                            <span>Open File</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedNotice(notice)}
                          className="btn btn-primary text-xs py-1 px-3 flex items-center gap-1"
                        >
                          <Eye size={12} />
                          <span>View Details</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {selectedNotice && (
        <NoticeDetailModal
          notice={{
            ...selectedNotice,
            isRead: isNoticeRead(selectedNotice)
          }}
          onClose={() => setSelectedNotice(null)}
          onReadChange={handleMarkNoticeRead}
        />
      )}
    </>
  );
}

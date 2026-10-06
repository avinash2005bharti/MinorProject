import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import NoticeDetailModal from '../../components/modals/NoticeDetailModal';
import { getBackendUrl } from '../../api/client';
import {
  Send,
  PlusCircle,
  Compass,
  Pin,
  User,
  Paperclip,
  ExternalLink,
  CheckCircle2,
  Eye,
  Trash2
} from 'lucide-react';

export default function HodNotices() {
  const { notices, openModal, currentUser, deleteNotice, addToast } = useERP();
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Per-user read tracking
  const storageKey = `erp_read_notices_${currentUser?.id || 'hod'}`;
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

  const handleOpenAttachment = (e, notice) => {
    e.stopPropagation();
    const url = notice.attachmentUrl || notice.linkUrl;
    if (url) {
      window.open(getBackendUrl(url), '_blank', 'noopener,noreferrer');
    }
  };

  const handleDeleteNotice = async (e, notice) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete this circular:\n"${notice.title || 'Department Notice'}"?\nThis cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(notice.id);
    try {
      await deleteNotice(notice.id);
      if (selectedNotice?.id === notice.id) {
        setSelectedNotice(null);
      }
    } catch (err) {
      console.error('Failed to delete circular:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Department Circulars & Bulletins</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Broadcast administrative decrees, exam schedules & student advisories with documents
              </p>
            </div>

            <button
              onClick={() => openModal('sendNotice', { defaultTarget: 'Department', targetValue: 'All Students & Faculty' })}
              className="btn btn-primary text-xs py-2 px-4 shadow-sm"
              id="btn-hod-send-notice"
            >
              <Send size={15} />
              <span>Broadcast Circular</span>
            </button>
          </div>

          <div className="flex flex-col gap-3.5">
            {safeNotices.length === 0 ? (
              <div className="card text-center py-12 text-slate-400">
                <Compass size={36} className="mx-auto mb-2 opacity-40 text-slate-400" />
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>No circulars published yet.</h3>
                <p className="text-xs text-slate-500 mt-1">Broadcast official notices to students and faculty using the button above.</p>
              </div>
            ) : (
              safeNotices.map((notice) => {
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

                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          Scope: {notice.targetType || 'Department'} ({notice.targetValue || 'Campus'})
                        </span>

                        {hasDoc && (
                          <span className="badge badge-indigo text-xs flex items-center gap-1">
                            <Paperclip size={11} /> Document Attached
                          </span>
                        )}
                      </div>

                      <span className="text-xs text-slate-400">
                        {notice.date || (notice.createdAt ? new Date(notice.createdAt).toLocaleDateString() : 'Today')}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{notice.title || 'Department Notice'}</h3>
                    <p className="text-xs text-slate-700 leading-relaxed">{notice.content || notice.message || ''}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500 flex-wrap gap-2">
                      <span className="flex items-center gap-1.5">
                        <User size={13} className="text-slate-400" />
                        Origin: <strong className="text-slate-700">{notice.authorName || 'Administration'}</strong> ({notice.authorRole || 'HOD / Admin'})
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

                        <button
                          type="button"
                          disabled={deletingId === notice.id}
                          onClick={(e) => handleDeleteNotice(e, notice)}
                          className="btn btn-outline text-xs py-1 px-2.5 flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          title="Permanently delete this circular"
                        >
                          <Trash2 size={12} className="text-red-600" />
                          <span>{deletingId === notice.id ? 'Deleting...' : 'Delete'}</span>
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
          onDelete={(id) => {
            if (selectedNotice?.id === id) {
              setSelectedNotice(null);
            }
          }}
        />
      )}
    </>
  );
}

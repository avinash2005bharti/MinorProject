import React, { useEffect, useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { noticeApi } from '../../api/noticeApi';
import {
  X,
  Megaphone,
  Calendar,
  Clock,
  User,
  Paperclip,
  ExternalLink,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  ShieldCheck,
  Building2,
  Eye,
  EyeOff,
  Trash2
} from 'lucide-react';

export default function NoticeDetailModal({ notice, onClose, onReadChange, onDelete }) {
  const { currentUser, currentRole, deleteNotice, addToast } = useERP();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!notice) return null;

  const rawUrl = notice.attachmentUrl || notice.linkUrl;
  const isUrgent = notice.priority === 'urgent' || notice.type === 'ALERT';

  // Construct absolute URL for local /uploads paths
  const fileUrl = rawUrl
    ? rawUrl.startsWith('http') || rawUrl.startsWith('//')
      ? rawUrl
      : `http://localhost:5000${rawUrl}`
    : null;

  const fileName =
    notice.attachmentName ||
    (rawUrl ? decodeURIComponent(rawUrl.split('/').pop().split('?')[0]) : 'Attached Document');

  const ext = rawUrl ? rawUrl.split('.').pop().toLowerCase() : '';
  const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext);
  const isPdf = ext === 'pdf';

  // Automatically mark as read when opened if unread
  useEffect(() => {
    if (notice?.id && !notice?.isRead) {
      noticeApi.markRead(notice.id).catch(() => {});
      if (onReadChange) {
        onReadChange(notice.id, true);
      }
    }
  }, [notice?.id]);

  const handleToggleRead = async () => {
    try {
      if (notice.isRead) {
        await noticeApi.markUnread(notice.id);
        if (onReadChange) onReadChange(notice.id, false);
        addToast('Marked as Unread', 'Circular marked as unread.', 'info');
      } else {
        await noticeApi.markRead(notice.id);
        if (onReadChange) onReadChange(notice.id, true);
        addToast('Marked as Read', 'Circular marked as read.', 'success');
      }
    } catch (err) {
      console.warn('Read status toggle:', err.message);
    }
  };

  const handleOpenFile = () => {
    if (fileUrl) {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const role = (currentRole || currentUser?.role || currentUser?.roleName || '').toLowerCase();
  const canDelete = role === 'hod' || role === 'admin' || Boolean(currentUser?.isHOD);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete this circular:\n"${notice.title || 'Department Notice'}"?\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      if (deleteNotice) {
        await deleteNotice(notice.id);
      }
      if (onDelete) {
        onDelete(notice.id);
      }
      onClose();
    } catch (err) {
      console.error('Delete notice error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '620px',
          width: '94%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Header Banner */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: isUrgent
              ? 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)'
              : 'linear-gradient(135deg, #EFF6FF 0%, #EEF2FF 100%)',
            borderBottom: isUrgent ? '1px solid #FECDD3' : '1px solid #E0E7FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: isUrgent ? '#E11D48' : '#2563EB',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isUrgent ? '0 4px 12px rgba(225, 29, 72, 0.3)' : '0 4px 12px rgba(37, 99, 235, 0.3)'
              }}
            >
              <Megaphone size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: isUrgent ? '#BE123C' : '#1D4ED8'
                  }}
                >
                  Official Circular Notice
                </span>
                <span
                  className={`badge ${isUrgent ? 'badge-rose' : 'badge-indigo'}`}
                  style={{ fontSize: '10px', padding: '1px 7px' }}
                >
                  {(notice.priority || 'general').toUpperCase()}
                </span>
              </div>
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-lg)',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: '2px 0 0 0',
                  lineHeight: 1.3
                }}
              >
                {notice.title || 'Department Notice'}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {canDelete && (
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="modal-close-btn"
                style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
                title="Permanently delete circular"
                aria-label="Delete circular"
              >
                <Trash2 size={16} />
              </button>
            )}

            <button
              onClick={onClose}
              className="modal-close-btn"
              style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Notice Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Metadata Cards Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '0.75rem',
              backgroundColor: '#F8FAFC',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid #E2E8F0'
            }}
          >
            <div>
              <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600, display: 'block' }}>ISSUED BY</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={13} className="text-blue-600" />
                {notice.authorName || 'Administration'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600, display: 'block' }}>RECIPIENT SCOPE</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Building2 size={13} className="text-emerald-600" />
                {notice.targetValue || notice.recipientRole || 'All Students & Faculty'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600, display: 'block' }}>DATE & TIME</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={13} className="text-amber-600" />
                {notice.date || (notice.createdAt ? new Date(notice.createdAt).toLocaleDateString() : 'Today')}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600, display: 'block' }}>STATUS</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: notice.isRead ? '#15803D' : '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {notice.isRead ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                {notice.isRead ? 'Marked as Read' : 'New / Unread'}
              </span>
            </div>
          </div>

          {/* Official Content */}
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
              Announcement Details
            </h4>
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem 1.25rem',
                fontSize: '13.5px',
                lineHeight: 1.65,
                color: '#1E293B',
                whiteSpace: 'pre-wrap'
              }}
            >
              {notice.content || notice.message || 'No description provided for this notice.'}
            </div>
          </div>

          {/* Attached Document Section */}
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Paperclip size={14} />
              <span>Official Attached Document</span>
            </h4>

            {fileUrl ? (
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: 'var(--radius-xl)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        backgroundColor: isPdf ? '#FEE2E2' : isImage ? '#E0F2FE' : '#F1F5F9',
                        color: isPdf ? '#DC2626' : isImage ? '#0284C7' : '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {isPdf ? <FileText size={20} /> : isImage ? <ImageIcon size={20} /> : <Paperclip size={20} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#0F172A',
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {fileName}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>
                        {isPdf ? 'Portable Document Format (PDF)' : isImage ? 'Image Document' : 'Official Attachment'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={handleOpenFile}
                      className="btn btn-primary"
                      style={{ fontSize: '11.5px', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <ExternalLink size={13} />
                      <span>Open Document</span>
                    </button>

                    <a
                      href={fileUrl}
                      download={fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline"
                      style={{ fontSize: '11.5px', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Download size={13} />
                      <span>Download</span>
                    </a>
                  </div>
                </div>

                {/* Inline Image Preview if Image */}
                {isImage && (
                  <div
                    style={{
                      marginTop: '0.5rem',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      border: '1px solid #E2E8F0',
                      maxHeight: '260px',
                      backgroundColor: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <img
                      src={fileUrl}
                      alt={fileName}
                      style={{ maxWidth: '100%', maxHeight: '260px', objectFit: 'contain' }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: '#F8FAFC',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px dashed #CBD5E1',
                  color: '#64748B',
                  fontSize: '12px',
                  textAlign: 'center'
                }}
              >
                No document attached to this circular.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleToggleRead}
              className="btn btn-outline"
              style={{ fontSize: '12px', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              {notice.isRead ? <EyeOff size={14} className="text-amber-600" /> : <Eye size={14} className="text-emerald-600" />}
              <span>{notice.isRead ? 'Mark as Unread' : 'Mark as Read'}</span>
            </button>

            {canDelete && (
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="btn btn-outline"
                style={{
                  fontSize: '12px',
                  padding: '0.45rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: '#DC2626',
                  borderColor: '#FECDD3',
                  backgroundColor: '#FFF1F2'
                }}
                title="Delete this notice circular permanently"
              >
                <Trash2 size={14} className="text-red-600" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Circular'}</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
            style={{ fontSize: '12px', padding: '0.45rem 1.25rem' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

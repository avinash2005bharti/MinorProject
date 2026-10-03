import React, { useState, useRef } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  X,
  Send,
  Bot,
  AlertTriangle,
  Users,
  Building2,
  Bell,
  Paperclip,
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle2
} from 'lucide-react';

export default function SendNoticeModal({ data, onClose }) {
  const { broadcastNotice, sections = [], classes = [], currentRole, currentUser, addToast } = useERP();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetType, setTargetType] = useState(data?.defaultTarget || (currentRole === 'hod' ? 'Department' : 'Section'));
  const [targetValue, setTargetValue] = useState(data?.targetValue || (targetType === 'Department' ? currentUser?.department || 'CSE' : ''));
  const [priority, setPriority] = useState('normal');
  const [pinned, setPinned] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        addToast('File too large', 'Please choose a file smaller than 20MB.', 'warning');
        return;
      }
      setAttachmentFile(file);
    }
  };

  const handleRemoveFile = () => {
    setAttachmentFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !targetValue.trim()) {
      addToast('Notice Incomplete', 'Enter the notice and select a recipient.', 'warning');
      return;
    }

    setSaving(true);
    try {
      if (attachmentFile) {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('message', content);
        formData.append('targetType', targetType);
        formData.append('targetValue', targetValue);
        formData.append('recipientRole', targetValue);
        formData.append('priority', priority);
        formData.append('pinned', pinned);
        formData.append('attachment', attachmentFile);
        await broadcastNotice(formData);
      } else {
        await broadcastNotice({
          title,
          content,
          message: content,
          targetType,
          targetValue,
          recipientRole: targetValue,
          priority,
          pinned
        });
      }
      onClose();
    } catch (err) {
      addToast('Unable to Send Notice', err.message || 'The notice could not be saved.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px', width: '92%', maxHeight: '92vh', overflowY: 'auto' }}
      >
        <div className="modal-header">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Send size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">Broadcast Official Notice</h3>
              <p className="text-xs text-slate-500">Autonomous delivery with document attachment</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Notice Agent Telemetry Banner */}
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs flex items-center gap-2 text-slate-700">
          <Bot size={16} className="text-blue-600 shrink-0" />
          <span>
            <strong>Notice Agent:</strong> Targeted circulars & attachments are instantly dispatched to all student and faculty notification hubs in PostgreSQL.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mt-2">
          {/* Target Type Selector */}
          <div className="form-group mb-0">
            <label className="form-label">Delivery Scope</label>
            <div className="grid grid-cols-4 gap-2">
              {['Section', 'Class', 'Department', 'Student'].map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => {
                    setTargetType(type);
                    if (type === 'Department') setTargetValue(currentUser?.department || 'CSE');
                    else if (type === 'Section') setTargetValue(sections?.[0]?.name || 'A');
                    else setTargetValue('');
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                    targetType === type
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Target Specific Selection */}
          <div className="form-group mb-0">
            <label className="form-label">Target Recipient ({targetType})</label>
            {targetType === 'Section' && (
              <select
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select a section</option>
                {(Array.isArray(sections) ? sections : []).map((sec) => (
                  <option key={sec.id} value={sec.name}>
                    Section {sec.name}
                  </option>
                ))}
              </select>
            )}

            {targetType === 'Class' && (
              <select
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select a class</option>
                {(Array.isArray(classes) ? classes : []).map((cls) => (
                  <option key={cls.id} value={cls.name}>
                    {cls.name} ({cls.semester})
                  </option>
                ))}
              </select>
            )}

            {targetType === 'Department' && (
              <input
                type="text"
                value={targetValue}
                readOnly
                className="input-field bg-slate-50"
              />
            )}

            {targetType === 'Student' && (
              <input
                type="text"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="Student Name or Roll Number"
                className="input-field"
                required
              />
            )}
          </div>

          {/* Title */}
          <div className="form-group mb-0">
            <label className="form-label">Notice Headline</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Mid-Sem Exam Schedule / RGPV Practical Guidelines"
              className="input-field"
              required
              id="input-notice-title"
            />
          </div>

          {/* Content */}
          <div className="form-group mb-0">
            <label className="form-label">Circular Content & Instructions</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="State notice body, instructions, dates, and requirements clearly..."
              className="input-field"
              rows={3}
              required
            />
          </div>

          {/* Document Attachment Upload Section */}
          <div className="form-group mb-0">
            <label className="form-label flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Paperclip size={13} className="text-slate-600" />
                <span>Attach Circular Document (PDF, Image, Doc)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Optional • Max 20MB</span>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.pptx,.txt"
              style={{ display: 'none' }}
              id="notice-file-input"
            />

            {!attachmentFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '1.5px dashed #CBD5E1',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: '#F8FAFC',
                  transition: 'all 0.15s ease'
                }}
                className="hover:border-blue-400 hover:bg-blue-50/20"
              >
                <UploadCloud size={24} className="mx-auto text-blue-500 mb-1" />
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                  Click to select file or drag & drop here
                </div>
                <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>
                  Supports PDF circulars, official images, notices, and spreadsheets
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: 'var(--radius-lg)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                  <FileText size={18} className="text-blue-600 shrink-0" />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#1E40AF',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {attachmentFile.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748B' }}>
                      {(attachmentFile.size / 1024).toFixed(1)} KB • Ready for upload
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: '#EF4444',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                  title="Remove attachment"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Priority & Pin Options */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Priority:</span>
              <button
                type="button"
                onClick={() => setPriority('normal')}
                className={`py-1 px-3 rounded-lg text-xs font-semibold border ${
                  priority === 'normal' ? 'bg-slate-200 border-slate-300 text-slate-800' : 'bg-white text-slate-500'
                }`}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => setPriority('urgent')}
                className={`py-1 px-3 rounded-lg text-xs font-semibold border ${
                  priority === 'urgent' ? 'bg-rose-100 border-rose-300 text-rose-800' : 'bg-white text-slate-500'
                }`}
              >
                Urgent
              </button>
            </div>

            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="rounded"
              />
              <span>Pin to Portal Header</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} disabled={saving} className="btn btn-outline text-xs py-2 px-4">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary text-xs py-2 px-5 font-bold shadow-sm"
              id="btn-send-notice-confirm"
            >
              {saving ? 'Publishing Circular...' : 'Broadcast Notice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

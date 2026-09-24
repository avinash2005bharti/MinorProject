import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { X, Send, Bot, AlertTriangle, Users, Building2, Bell } from 'lucide-react';

export default function SendNoticeModal({ data, onClose }) {
  const { sendNotice, sections, classes, currentRole } = useERP();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetType, setTargetType] = useState(data?.defaultTarget || (currentRole === 'hod' ? 'Department' : 'Section'));
  const [targetValue, setTargetValue] = useState(data?.targetValue || (targetType === 'Section' ? 'CSE-3A' : 'All Students & Faculty'));
  const [priority, setPriority] = useState('normal');
  const [pinned, setPinned] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Please fill out both title and content.');
      return;
    }

    sendNotice({
      title,
      content,
      targetType,
      targetValue,
      priority,
      pinned
    });

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '540px', width: '92%' }}
      >
        <div className="modal-header">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Send size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">Broadcast Notice</h3>
              <p className="text-xs text-slate-500">Autonomous delivery via Notice Agent</p>
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
            <strong>Notice Agent:</strong> Targeted circulars are automatically dispatched to all relevant student mobile and desktop notification centers instantly.
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
                    if (type === 'Section') setTargetValue('CSE-3A');
                    else if (type === 'Class') setTargetValue('CSE 3rd Year');
                    else if (type === 'Department') setTargetValue('All Students & Faculty');
                    else setTargetValue('Rahul Sharma (21CSE084)');
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
              >
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.name}>
                    {sec.name} ({sec.className})
                  </option>
                ))}
              </select>
            )}

            {targetType === 'Class' && (
              <select
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="input-field"
              >
                {classes.map((cls) => (
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
              placeholder="e.g., Mandatory Lab Session / Exam Seating Announcement"
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
            <button type="button" onClick={onClose} className="btn btn-outline text-xs py-2 px-4">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary text-xs py-2 px-5 font-bold shadow-sm" id="btn-send-notice-confirm">
              Broadcast Notice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

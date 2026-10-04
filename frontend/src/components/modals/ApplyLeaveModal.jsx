import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { X, Calendar, FileText, Upload, AlertTriangle, ShieldCheck, Check } from 'lucide-react';
import DocumentUploader from '../common/DocumentUploader';

export default function ApplyLeaveModal({ onClose }) {
  const { applyLeave } = useERP();

  const [leaveType, setLeaveType] = useState('Medical');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [uploadedFile, setUploadedFile] = useState({ name: '', size: '', file: null });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a reason for the leave application.');
      return;
    }

    applyLeave({
      leaveType,
      startDate,
      endDate,
      dateRangeLabel: `${startDate} to ${endDate}`,
      reason,
      file: uploadedFile.file || null,
      supportingDoc: uploadedFile.file || null
    });

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', width: '92%' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center flex-shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="modal-title">Apply for Student Leave</h3>
              <p className="modal-subtitle">Autonomous 3-stage academic clearance</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mt-2">
          {/* Leave Type */}
          <div className="form-group mb-0">
            <label className="form-label">Leave Category</label>
            <div className="grid grid-cols-3 gap-2">
              {['Medical', 'Duty / OD', 'Personal'].map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setLeaveType(type)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    leaveType === type
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group mb-0">
              <label className="form-label">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>

          {/* Reason */}
          <div className="form-group mb-0">
            <label className="form-label">Reason / Justification</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Prescribed medical rest due to viral fever / Attending official Hackathon..."
              className="input-field"
              rows={3}
              required
            />
          </div>

          {/* Supporting Document */}
          <div className="form-group mb-0">
            <DocumentUploader
              label="Supporting Document (Medical certificate / OD approval)"
              hint="Attach doctor prescription, hospital slip, or proof (PDF/PNG/JPG)"
              selectedFileName={uploadedFile.name}
              selectedFileSize={uploadedFile.size}
              onFileSelect={(fileInfo) => setUploadedFile({ name: fileInfo.name, size: fileInfo.size, file: fileInfo.file })}
              onFileRemove={() => setUploadedFile({ name: '', size: '', file: null })}
            />
          </div>

          {/* Action Buttons */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline text-xs py-2 px-4 font-semibold">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary text-xs py-2 px-5 font-bold shadow-sm" id="btn-submit-leave-confirm">
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

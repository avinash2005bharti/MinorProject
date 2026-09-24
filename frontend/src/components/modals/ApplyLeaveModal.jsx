import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { X, Calendar, FileText, Upload, AlertTriangle, ShieldCheck, Check } from 'lucide-react';

export default function ApplyLeaveModal({ onClose }) {
  const { applyLeave, currentUser, tgAvailable } = useERP();

  const [leaveType, setLeaveType] = useState('Medical');
  const [startDate, setStartDate] = useState('2025-09-28');
  const [endDate, setEndDate] = useState('2025-09-30');
  const [reason, setReason] = useState('');
  const [fileUploaded, setFileUploaded] = useState(false);

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
      supportingDoc: fileUploaded ? 'Medical_Prescription_Document.pdf' : 'student_declaration.pdf'
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
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">Apply for Student Leave</h3>
              <p className="text-xs text-slate-500">Autonomous 3-stage academic clearance</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* TG Telemetry Banner */}
        <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${tgAvailable ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          {tgAvailable ? (
            <>
              <ShieldCheck size={17} className="shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <strong>Standard 3-Stage Pipeline Active:</strong> Request routes to Mentor <strong>{currentUser.tgName}</strong>, then forwarded to HOD for final sign-off.
              </div>
            </>
          ) : (
            <>
              <AlertTriangle size={17} className="shrink-0 text-amber-600 mt-0.5" />
              <div>
                <strong>Autonomous Fallback Routing:</strong> Mentor Prof. K. Sen is marked unavailable. Your leave will route <strong>directly to HOD Dr. S. Roy</strong> to prevent administrative delay.
              </div>
            </>
          )}
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
            <label className="form-label">Supporting Document (Medical certificate / OD approval)</label>
            <div
              onClick={() => setFileUploaded(!fileUploaded)}
              className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all ${
                fileUploaded ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-blue-400 bg-slate-50/50'
              }`}
            >
              {fileUploaded ? (
                <div className="flex items-center justify-center gap-2 text-emerald-700 text-xs font-semibold">
                  <Check size={16} />
                  <span>Document Attached: Medical_Prescription_Document.pdf</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-slate-500 text-xs">
                  <Upload size={18} className="text-slate-400" />
                  <span>Click to attach document (PDF/PNG)</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn btn-outline text-xs py-2 px-4">
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

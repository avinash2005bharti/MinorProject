import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { X, Sparkles, ShieldCheck, ArrowRight, AlertTriangle, Calendar, Award } from 'lucide-react';
import DocumentUploader from '../common/DocumentUploader';

export default function RequestConsiderationModal({ onClose }) {
  const { submitAttendanceConsideration, currentUser, tgAvailable } = useERP();

  const [category, setCategory] = useState('Hackathon / Project Competition');
  const [startDate, setStartDate] = useState('2025-09-10');
  const [endDate, setEndDate] = useState('2025-09-15');
  const [reason, setReason] = useState('Official representation of OIST CSE Department at the National Smart India Hackathon Grand Finale.');
  const [uploadedDoc, setUploadedDoc] = useState({
    name: 'SIH_Official_Participation_Invitation.pdf',
    size: '1.4 MB'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a reason or activity details for your consideration request.');
      return;
    }

    submitAttendanceConsideration({
      startDate,
      endDate,
      dateRangeLabel: `${startDate} to ${endDate}`,
      reason: `[${category}] ${reason}`,
      supportingDoc: uploadedDoc.name || 'official_od_certificate.pdf',
      category
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
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">Request Attendance Consideration (OD)</h3>
              <p className="text-xs text-slate-500">Autonomous credit request for missed classes</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Mentor Pipeline Status Badge */}
        <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${tgAvailable ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          {tgAvailable ? (
            <>
              <ShieldCheck size={17} className="shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <strong>Autonomous Workflow Active:</strong> Verified by Mentor <strong>{currentUser.tgName}</strong> $\rightarrow$ Forwarded to HOD <strong>Dr. S. Roy</strong> for official attendance amendment.
              </div>
            </>
          ) : (
            <>
              <AlertTriangle size={17} className="shrink-0 text-amber-600 mt-0.5" />
              <div>
                <strong>Direct HOD Expedited Routing:</strong> Mentor is currently marked off-duty. Request routes directly to HOD to prevent semester audit disruption.
              </div>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mt-2">
          {/* Consideration Category */}
          <div className="form-group mb-0">
            <label className="form-label">Consideration Category / Nature of Absence</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="select-field"
            >
              <option value="Academic On-Duty (OD)">Academic On-Duty (OD) / Workshop</option>
              <option value="Hackathon / Project Competition">Hackathon / Project Competition</option>
              <option value="Technical Symposium / Conference">Technical Symposium / Conference Presentation</option>
              <option value="Sports & Cultural Representation">Inter-College Sports & Cultural Representation</option>
              <option value="Medical Consideration">Medical & Health Consideration</option>
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group mb-0">
              <label className="form-label">Absence Start Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Absence End Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>
          </div>

          {/* Reason / Narrative */}
          <div className="form-group mb-0">
            <label className="form-label">Activity Description & Justification</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Participated as Lead Developer in Smart India Hackathon..."
              className="input-field"
              rows={3}
              required
            />
          </div>

          {/* Workable Real Document Uploader */}
          <div className="form-group mb-0">
            <DocumentUploader
              label="Supporting Certificate / Invitation / Medical Slip"
              hint="Attach official OD pass, hackathon letter, or certificate (PDF/PNG/DOCX)"
              selectedFileName={uploadedDoc.name}
              selectedFileSize={uploadedDoc.size}
              onFileSelect={(fileInfo) => {
                setUploadedDoc({
                  name: fileInfo.name,
                  size: fileInfo.size
                });
              }}
              onFileRemove={() => {
                setUploadedDoc({ name: '', size: '' });
              }}
              required={false}
            />
          </div>

          {/* Projected Impact Preview Card */}
          <div style={{ backgroundColor: 'var(--primary-container)', padding: '0.85rem', borderRadius: 'var(--radius-xl)', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Projected Attendance Standing</span>
              <span className="badge badge-emerald">Safe Eligibility</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Current: {currentUser.attendance || 72}%</span>
              <ArrowRight size={12} color="var(--primary)" />
              <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>Projected: 84% after HOD clearance</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn btn-outline text-xs py-2 px-4">
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary text-xs py-2 px-5 font-bold shadow-sm"
              id="btn-submit-consideration-confirm"
            >
              Submit Consideration Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

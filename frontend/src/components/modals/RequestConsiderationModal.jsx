import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useERP } from '../../context/ERPContext';
import {
  X,
  Sparkles,
  ShieldCheck,
  Calendar,
  Clock,
  Award,
  Check,
  CheckCircle2,
  Layers
} from 'lucide-react';
import DocumentUploader from '../common/DocumentUploader';

const AVAILABLE_PERIODS = [
  { id: 'P1', label: 'Period 1', time: '10:00 AM – 10:50 AM' },
  { id: 'P2', label: 'Period 2', time: '10:50 AM – 11:40 AM' },
  { id: 'P3', label: 'Period 3', time: '11:40 AM – 12:30 PM' },
  { id: 'P4', label: 'Period 4', time: '12:30 PM – 01:20 PM' },
  { id: 'P5', label: 'Period 5', time: '02:00 PM – 02:50 PM' },
  { id: 'P6', label: 'Period 6', time: '02:50 PM – 03:40 PM' },
  { id: 'P7', label: 'Period 7', time: '03:40 PM – 04:30 PM' }
];

export default function RequestConsiderationModal({ onClose }) {
  const { submitAttendanceConsideration, addToast } = useERP();

  const [category, setCategory] = useState('Hackathon / Technical Competition');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [selectedPeriods, setSelectedPeriods] = useState(['P2', 'P3', 'P4']);
  const [uploadedDoc, setUploadedDoc] = useState({
    name: '',
    size: ''
  });

  // Body scroll locking and ESC key handler
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const togglePeriod = (pId) => {
    setSelectedPeriods((prev) =>
      prev.includes(pId) ? prev.filter((id) => id !== pId) : [...prev, pId].sort()
    );
  };

  const handleSelectAllPeriods = () => {
    setSelectedPeriods(AVAILABLE_PERIODS.map((p) => p.id));
  };

  const handleSelectMorning = () => {
    setSelectedPeriods(['P1', 'P2', 'P3', 'P4']);
  };

  const handleSelectAfternoon = () => {
    setSelectedPeriods(['P5', 'P6', 'P7']);
  };

  const handleClearPeriods = () => {
    setSelectedPeriods([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      addToast?.('Missing Justification', 'Please provide a reason or activity details for your consideration request.', 'warning');
      return;
    }

    if (selectedPeriods.length === 0) {
      addToast?.('Select Periods', 'Please select at least one period with time slot for consideration.', 'warning');
      return;
    }

    const periodsTimingString = selectedPeriods
      .map((pId) => {
        const found = AVAILABLE_PERIODS.find((p) => p.id === pId);
        return found ? `${found.id} (${found.time})` : pId;
      })
      .join(', ');

    submitAttendanceConsideration({
      startDate,
      endDate,
      dateRangeLabel: `${startDate} to ${endDate}`,
      reason: `[${category}] ${reason}`,
      supportingDoc: uploadedDoc.name || null,
      category,
      periodsCount: selectedPeriods.length,
      selectedPeriods,
      periodsTiming: periodsTimingString
    });

    onClose();
  };

  const modalNode = (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1050 }}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '580px',
          width: '94%',
          maxHeight: 'calc(100vh - 2.5rem)',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="modal-title">Request Attendance Consideration (OD)</h3>
              <p className="modal-subtitle">Autonomous credit request for missed classes</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
            <X size={18} />
          </button>
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

          {/* Number of Periods & Exact Time Slots Selection */}
          <div
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: '#F8FAFC',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <label className="form-label mb-0" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} className="text-purple-600" />
                <span>Periods & Lecture Times Required ({selectedPeriods.length} selected)</span>
              </label>

              {/* Quick Select Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  onClick={handleSelectAllPeriods}
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '6px',
                    backgroundColor: '#EDE9FE',
                    color: '#6D28D9',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  All 7
                </button>
                <button
                  type="button"
                  onClick={handleSelectMorning}
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 600,
                    padding: '2px 7px',
                    borderRadius: '6px',
                    backgroundColor: '#EFF6FF',
                    color: '#1D4ED8',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Morning (P1-P4)
                </button>
                <button
                  type="button"
                  onClick={handleSelectAfternoon}
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 600,
                    padding: '2px 7px',
                    borderRadius: '6px',
                    backgroundColor: '#EFF6FF',
                    color: '#1D4ED8',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Afternoon (P5-P7)
                </button>
                {selectedPeriods.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearPeriods}
                    style={{
                      fontSize: '10.5px',
                      color: '#94A3B8',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px 4px'
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Period Cards Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '0.45rem'
              }}
            >
              {AVAILABLE_PERIODS.map((p) => {
                const isSelected = selectedPeriods.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePeriod(p.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '0.45rem 0.65rem',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: isSelected ? '#FAF5FF' : '#FFFFFF',
                      border: isSelected ? '1.5px solid #9333EA' : '1px solid var(--border-subtle)',
                      boxShadow: isSelected ? '0 2px 6px rgba(147, 51, 234, 0.12)' : 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '6px',
                        backgroundColor: isSelected ? '#9333EA' : '#F1F5F9',
                        color: isSelected ? '#FFFFFF' : '#64748B',
                        fontSize: '11px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {isSelected ? <Check size={13} /> : p.id.replace('P', '')}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? '#581C87' : 'var(--text-primary)' }}>
                        {p.label}
                      </div>
                      <div style={{ fontSize: '10px', color: isSelected ? '#7E22CE' : 'var(--text-tertiary)' }}>
                        {p.time}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedPeriods.length > 0 && (
              <div style={{ fontSize: '11px', color: '#6D28D9', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} />
                <span>
                  <strong>{selectedPeriods.length} Lecture Period{selectedPeriods.length > 1 ? 's' : ''}</strong> will be logged for autonomous attendance credit.
                </span>
              </div>
            )}
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

          {/* Buttons */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline text-xs py-2 px-4 font-semibold">
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary text-xs py-2 px-5 font-bold shadow-sm"
              id="btn-submit-consideration-confirm"
            >
              Submit Consideration Request ({selectedPeriods.length} Periods)
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import RequestCard from '../../components/RequestCard';
import DocumentUploader from '../../components/common/DocumentUploader';
import {
  FileText,
  PlusCircle,
  Clock,
  CheckCircle2,
  Calendar,
  Award,
  BookOpen,
  Home,
  ShieldCheck,
  Upload,
  X,
  Sparkles
} from 'lucide-react';

export default function StudentRequests() {
  const { attendanceRequests, leaveRequests, attendanceQueries, applyLeave, tgAvailable } = useERP();
  const [filter, setFilter] = useState('all');
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  // Leave form state
  const [leaveType, setLeaveType] = useState('Medical');
  const [startDate, setStartDate] = useState('2025-09-28');
  const [endDate, setEndDate] = useState('2025-09-30');
  const [reason, setReason] = useState('Viral fever and doctor-prescribed clinical recovery.');
  const [supportingDoc, setSupportingDoc] = useState('Doctor_Medical_Certificate.pdf');

  const handleLeaveSubmit = (e) => {
    e.preventDefault();
    applyLeave({
      leaveType,
      startDate,
      endDate,
      dateRangeLabel: `${startDate} to ${endDate}`,
      reason,
      supportingDoc
    });
    setLeaveModalOpen(false);
  };

  // Combine requests
  const allRequests = [
    ...attendanceRequests,
    ...leaveRequests,
    ...attendanceQueries.map((q) => ({
      ...q,
      title: `Attendance Query: ${q.subject}`,
      type: 'attendance_query'
    }))
  ];

  const filteredRequests = allRequests.filter((req) => {
    if (filter === 'active') return req.status.includes('pending') || req.status === 'processing_agent';
    if (filter === 'completed') return req.status === 'completed' || req.status === 'approved';
    return true;
  });

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Top Action Area (Matching Stitch requests_approvals_workflow) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Requests & Approvals
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Real-time academic governance & autonomous clearance tracking
            </p>
          </div>

          <button
            onClick={() => setLeaveModalOpen(true)}
            className="btn btn-primary"
            style={{ borderRadius: 'var(--radius-full)', padding: '0.65rem 1.25rem' }}
          >
            <PlusCircle size={18} />
            <span>+ Apply Leave / New Request</span>
          </button>
        </div>

        {/* Transparent Workflow Journey Explainer Card (Matching Stitch 3-Step Visual Diagram) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Clearance Protocol
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="agent-pulse" style={{ width: '6px', height: '6px' }} />
              Avg. 24h Autonomous Turnaround
            </span>
          </div>

          {/* 3-Step Journey Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center', position: 'relative' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-fixed)',
                  color: 'var(--on-primary-fixed)',
                  fontWeight: 700,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                1
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Student Submits
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Digital e-Form</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-fixed)',
                  color: 'var(--on-primary-fixed)',
                  fontWeight: 700,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                2
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Mentor / TG Review
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {tgAvailable ? 'Verification' : 'Auto-Bypass if Unavailable'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-fixed)',
                  color: 'var(--on-primary-fixed)',
                  fontWeight: 700,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                3
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                HOD Clearance & Sync
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Agent Auto-Update</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs (Matching Stitch) */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--surface-high)',
            borderRadius: 'var(--radius-full)',
            padding: '4px',
            gap: '4px'
          }}
        >
          {[
            { id: 'all', label: `All (${allRequests.length})` },
            { id: 'active', label: `Active (${allRequests.filter((r) => r.status.includes('pending') || r.status === 'processing_agent').length})` },
            { id: 'completed', label: `Completed (${allRequests.filter((r) => r.status === 'completed' || r.status === 'approved').length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                flex: 1,
                padding: '0.45rem 1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: filter === tab.id ? 700 : 500,
                backgroundColor: filter === tab.id ? '#FFFFFF' : 'transparent',
                color: filter === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: filter === tab.id ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Request Cards Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filteredRequests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              showActions={false}
              role="student"
            />
          ))}
        </div>

        {/* Quick Launchers (Action Tray matching Stitch) */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Quick Request Launchers
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Frequently Used</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }} className="sm:grid-cols-4">
            <button
              onClick={() => setLeaveModalOpen(true)}
              className="card card-interactive"
              style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-xl)',
                  backgroundColor: 'var(--primary-fixed)',
                  color: 'var(--on-primary-fixed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Calendar size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Leave Application</h4>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Medical & OD Duty</span>
              </div>
            </button>

            <button
              className="card card-interactive"
              style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-xl)',
                  backgroundColor: 'var(--tertiary-fixed)',
                  color: 'var(--on-tertiary-fixed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Award size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Bonafide Certificate</h4>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Passports & Education Loans</span>
              </div>
            </button>

            <button
              className="card card-interactive"
              style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-xl)',
                  backgroundColor: 'var(--secondary-fixed)',
                  color: 'var(--on-secondary-fixed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FileText size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Hall Ticket Clearance</h4>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Exam Portal Authorization</span>
              </div>
            </button>

            <button
              className="card card-interactive"
              style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-xl)',
                  backgroundColor: 'var(--surface-high)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <BookOpen size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Library NOC Slip</h4>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Dues & Book Return Slip</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {leaveModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--primary-container)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Apply for Student Leave
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    3-Tier Clearance with Autonomous Routing
                  </p>
                </div>
              </div>

              <button onClick={() => setLeaveModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Banner showing TG Availability telemetry */}
            {!tgAvailable && (
              <div
                style={{
                  backgroundColor: 'var(--tertiary-container)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-xl)',
                  fontSize: '12px',
                  color: 'var(--on-tertiary-container)',
                  marginBottom: '0.75rem',
                  border: '1px solid #FDE68A'
                }}
              >
                <strong>Autonomous Fallback Routing Active:</strong> Mentor Prof. K. Sen is marked on leave. This application will be routed directly to HOD Dr. S. Roy.
              </div>
            )}

            <form onSubmit={handleLeaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">Leave Type</label>
                <select
                  className="input-field"
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                >
                  <option value="Medical">Medical Leave (Doctor verified)</option>
                  <option value="Duty">On-Duty / Academic Representation</option>
                  <option value="Personal">Personal / Family Emergency</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea
                  className="input-field"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  required
                />
              </div>

              <div className="form-group">
                <DocumentUploader
                  label="Supporting Document (Certificate / Prescription)"
                  hint="Attach official hospital slip, medical certificate, or OD approval"
                  selectedFileName={supportingDoc}
                  onFileSelect={(fileInfo) => setSupportingDoc(fileInfo.name)}
                  onFileRemove={() => setSupportingDoc('')}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setLeaveModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

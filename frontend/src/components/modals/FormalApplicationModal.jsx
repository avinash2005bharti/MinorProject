import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Award,
  Building2,
  FileCheck,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function FormalApplicationModal({ request, onClose }) {
  if (!request) return null;

  // Prevent background scrolling and support ESC key
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

  const isLeave = request.type === 'leave_request' || Boolean(request.leaveType);
  const isConsideration = request.type === 'attendance_consideration' || Boolean(request.category);

  const refNumber = `OIST/CSE/2026/SANCTION-${String(request.id || '0000').slice(-6)}`;
  const sanctionedDate = new Date(request.updatedAt || request.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const studentName = request.studentName || request.applicantName || 'Student';
  const rollNo = request.rollNo || request.enrollmentNo || '0103CS221001';
  const semester = request.semester || 5;
  const section = request.section || 'A';
  const category = request.category || request.leaveType || (isLeave ? 'Academic Medical Leave' : 'On-Duty Attendance Credit');
  const dateRange = request.dateRangeLabel || request.dates || `${request.startDate || ''} to ${request.endDate || ''}`.trim() || request.appliedAt;
  const reason = request.reason || request.title || 'Official Departmental Activity';

  // Periods information for consideration
  const periodsCount = request.approvedPeriodsCount ?? request.periodsCount ?? (isConsideration ? 4 : null);
  const periodsTiming = request.periodsTiming || (request.selectedPeriods ? request.selectedPeriods.join(', ') : 'P2 (10:50-11:40), P3 (11:40-12:30), P4 (12:30-01:20)');

  const handlePrint = () => {
    window.print();
  };

  const modalNode = (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        overflowY: 'auto'
      }}
    >
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '720px',
          width: '100%',
          maxHeight: 'calc(100vh - 2.5rem)',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: 'var(--radius-2xl)',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          overflow: 'hidden',
          margin: 'auto'
        }}
      >
        {/* Action Bar Header (Screen only) */}
        <div
          className="print-hide"
          style={{
            padding: '0.85rem 1.5rem',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                display: 'inline-block'
              }}
              className="animate-pulse"
            />
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Formal Sanctioned Application Document
            </span>
            <span className="badge badge-emerald" style={{ fontSize: '10px', padding: '2px 8px' }}>
              OFFICIALLY SANCTIONED
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handlePrint}
              className="btn btn-sm btn-outline"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 700,
                borderColor: '#10B981',
                color: '#047857',
                backgroundColor: '#ECFDF5'
              }}
              id="btn-print-formal-app"
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="modal-close-btn"
              aria-label="Close modal"
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Official Document Body (Printable) */}
        <div
          id="formal-document-print-area"
          style={{
            padding: '2.25rem 2.5rem',
            overflowY: 'auto',
            flex: 1,
            backgroundColor: '#FFFFFF',
            fontFamily: 'Inter, system-ui, sans-serif',
            color: '#1E293B',
            lineHeight: 1.5
          }}
        >
          {/* Institutional Crest & Letterhead */}
          <div
            style={{
              textAlign: 'center',
              borderBottom: '2px solid #0F172A',
              paddingBottom: '1.25rem',
              marginBottom: '1.5rem'
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: '#64748B', textTransform: 'uppercase' }}>
              Autonomous Academic Nexus • Departmental Administration
            </div>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 900,
                color: '#0F172A',
                margin: '4px 0',
                letterSpacing: '-0.02em',
                fontFamily: 'var(--font-heading)'
              }}
            >
              ORIENTAL INSTITUTE OF SCIENCE & TECHNOLOGY (OIST)
            </h2>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1D4ED8' }}>
              DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
              Approved by AICTE, New Delhi & Affiliated to RGPV, Bhopal (M.P.)
            </div>
          </div>

          {/* Reference Meta Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
              fontSize: '11.5px',
              borderBottom: '1px dashed #CBD5E1',
              paddingBottom: '0.75rem'
            }}
          >
            <div>
              <span style={{ color: '#64748B', fontWeight: 600 }}>Ref. No: </span>
              <strong style={{ color: '#0F172A' }}>{refNumber}</strong>
            </div>
            <div>
              <span style={{ color: '#64748B', fontWeight: 600 }}>Date of Sanction: </span>
              <strong style={{ color: '#0F172A' }}>{sanctionedDate}</strong>
            </div>
          </div>

          {/* Document Title Banner */}
          <div
            style={{
              textAlign: 'center',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '0.65rem 1rem',
              marginBottom: '1.5rem'
            }}
          >
            <h3
              style={{
                fontSize: '15px',
                fontWeight: 800,
                color: '#0F172A',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              {isLeave
                ? 'OFFICIAL LEAVE SANCTION & CLEARANCE ORDER'
                : 'OFFICIAL ATTENDANCE ON-DUTY (OD) SANCTION ORDER'}
            </h3>
            <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
              <ShieldCheck size={13} /> Formally Authorized & Digitally Certified in CampusFlow ERP
            </span>
          </div>

          {/* Student Particulars Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.85rem',
              padding: '1rem 1.25rem',
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '10px',
              marginBottom: '1.5rem',
              fontSize: '12.5px'
            }}
          >
            <div>
              <div style={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Student Name</div>
              <strong style={{ color: '#065F46', fontSize: '14px' }}>{studentName}</strong>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Enrollment / Roll No.</div>
              <strong style={{ color: '#065F46', fontSize: '14px' }}>{rollNo}</strong>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Class & Section</div>
              <strong style={{ color: '#0F172A' }}>Semester {semester} — Section {section}</strong>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Clearance Nature</div>
              <strong style={{ color: '#0F172A' }}>{category}</strong>
            </div>
          </div>

          {/* Formal Body Paragraph */}
          <div style={{ fontSize: '13px', lineHeight: 1.6, marginBottom: '1.25rem', textAlign: 'justify' }}>
            <p style={{ margin: '0 0 0.85rem 0' }}>
              This is to formally certify that the academic clearance application submitted by{' '}
              <strong>{studentName}</strong> (Roll No: <strong>{rollNo}</strong>) has been verified and evaluated in accordance
              with the institution's autonomous academic regulations. The application has been scrutinized by the appointed
              Teacher Guardian (TG) and formally sanctioned by the Head of the Department (HOD CSE).
            </p>

            {isConsideration && (
              <div
                style={{
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  marginBottom: '0.85rem'
                }}
              >
                <div style={{ fontWeight: 700, color: '#1E3A8A', fontSize: '12px', marginBottom: '4px' }}>
                  Sanctioned Attendance Consideration & Timings:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: '#64748B' }}>Periods Approved: </span>
                    <strong style={{ color: '#1D4ED8' }}>{periodsCount} Lecture Period{periodsCount > 1 ? 's' : ''}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Time Slots Covered: </span>
                    <strong style={{ color: '#0F172A' }}>{periodsTiming}</strong>
                  </div>
                </div>
              </div>
            )}

            <p style={{ margin: '0 0 0.85rem 0' }}>
              <strong>Sanctioned Schedule / Dates:</strong> {dateRange}
            </p>

            <p style={{ margin: 0 }}>
              <strong>Activity Justification & Particulars:</strong> {reason}
            </p>
          </div>

          {/* Attached Supporting Proof Confirmation */}
          {(request.proofDocumentUrl || request.docUrl || request.supportingDoc) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.5rem 0.85rem',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                fontSize: '11px',
                color: '#475569',
                marginBottom: '1.5rem'
              }}
            >
              <FileCheck size={14} className="text-emerald-600" />
              <span>
                <strong>Verified Document on Record:</strong>{' '}
                {typeof request.supportingDoc === 'string' ? request.supportingDoc : 'Official Certificate / Event OD Pass'}
              </span>
            </div>
          )}

          {/* Institutional Sign-off & Seal Block */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '2rem',
              marginTop: '2.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid #E2E8F0'
            }}
          >
            {/* Teacher Guardian Seal */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#059669',
                  backgroundColor: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '10px',
                  fontWeight: 700,
                  marginBottom: '8px'
                }}
              >
                <CheckCircle2 size={11} /> VERIFIED & RECOMMENDED
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                {request.tgName || 'Teacher Guardian (TG)'}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                Mentor, Section {section} • Dept. of CSE
              </div>
              <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>
                CampusFlow Digital ID Verification
              </div>
            </div>

            {/* HOD Seal */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#1D4ED8',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '10px',
                  fontWeight: 700,
                  marginBottom: '8px'
                }}
              >
                <ShieldCheck size={11} /> DIGITALLY SIGNED & SANCTIONED
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                Head of Department (HOD)
              </div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                Computer Science & Engineering • OIST
              </div>
              <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>
                Synchronized into Departmental Live Master Register
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}

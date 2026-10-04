import React from 'react';
import { useERP } from '../context/ERPContext';
import ApprovalStatus from './ApprovalStatus';
import WorkflowTimeline from './WorkflowTimeline';
import { FileText, ArrowRight, CheckCircle2, UserCheck, Calendar, ArrowUpRight, Zap, ShieldCheck, Clock } from 'lucide-react';

export default function RequestCard({
  request,
  onViewDetails,
  onApprove,
  onReject,
  onRecommend,
  showActions = false,
  role = 'student'
}) {
  const { openModal } = useERP();
  if (!request) return null;

  const normStatus = String(request.status || '').toLowerCase();
  const isApproved = ['approved', 'completed', 'approved_hod', 'approved_by_hod'].includes(normStatus);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', minWidth: 0 }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: request.type === 'attendance_consideration' ? 'var(--primary-fixed)' : request.type === 'leave_request' ? 'var(--secondary-fixed)' : 'var(--tertiary-fixed)',
              color: request.type === 'attendance_consideration' ? 'var(--on-primary-fixed)' : request.type === 'leave_request' ? 'var(--on-secondary-fixed)' : 'var(--on-tertiary-fixed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <FileText size={20} />
          </div>

          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.25 }}>
              {request.title || request.reason}
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
              {request.studentName ? `${request.studentName} (${request.rollNo})` : ''} • #{request.id}
            </span>
          </div>
        </div>

        <div style={{ flexShrink: 0 }}>
          <ApprovalStatus status={request.status} />
        </div>
      </div>

      {/* Date & Meta */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Calendar size={14} />
          {request.dateRangeLabel || request.date || request.appliedAt}
        </span>
        {request.status === 'completed' ? (
          <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>Completed & Synced</span>
        ) : (
          <span style={{ color: 'var(--tertiary)', fontWeight: 500 }}>Est. resolution today</span>
        )}
      </div>

      {/* Reason Box */}
      {request.reason && (
        <div style={{ backgroundColor: 'var(--surface-low)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-lg)', fontSize: '12px' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Reason: </span>
          <span style={{ color: 'var(--text-secondary)' }}>{request.reason}</span>
        </div>
      )}

      {/* TG Recommendation Note if present */}
      {request.tgRecommendation && (
        <div style={{ backgroundColor: 'var(--primary-container)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-lg)', fontSize: '12px', borderLeft: '3px solid var(--primary)' }}>
          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>TG Note: </span>
          <span style={{ color: 'var(--text-primary)' }}>{request.tgRecommendation}</span>
        </div>
      )}

      {/* Supporting Document Proof Link (Test 5 fix: HOD can open uploaded proof) */}
      {(request.proofDocumentUrl || request.docUrl || (typeof request.supportingDoc === 'string' && request.supportingDoc.includes('.'))) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '12px', padding: '0.45rem 0.85rem', backgroundColor: 'var(--surface-high)', borderRadius: 'var(--radius-lg)' }}>
          <FileText size={15} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Attached Proof:</span>
          <a
            href={
              (request.proofDocumentUrl || request.docUrl || request.supportingDoc).startsWith('http')
                ? (request.proofDocumentUrl || request.docUrl || request.supportingDoc)
                : `http://localhost:5000${(request.proofDocumentUrl || request.docUrl || request.supportingDoc).startsWith('/') ? '' : '/'}${request.proofDocumentUrl || request.docUrl || request.supportingDoc}`
            }
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
            id={`btn-open-doc-${request.id}`}
          >
            <span>View Supporting Document</span>
            <ArrowUpRight size={13} />
          </a>
        </div>
      )}

      {/* Consideration Periods & Timing Breakdown */}
      {(request.periodsCount || request.selectedPeriods || request.periodsTiming || request.periods) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '11.5px',
            color: '#1D4ED8',
            backgroundColor: '#EFF6FF',
            padding: '0.45rem 0.85rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid #BFDBFE'
          }}
        >
          <Clock size={14} className="text-blue-600 shrink-0" />
          <span>
            <strong>Requested Periods:</strong>{' '}
            {request.periodsCount
              ? `${request.periodsCount} Period${request.periodsCount > 1 ? 's' : ''}`
              : Array.isArray(request.periods)
                ? `${request.periods.length} Period${request.periods.length > 1 ? 's' : ''}`
                : ''}{' '}
            {request.periodsTiming
              ? `• ${request.periodsTiming}`
              : request.selectedPeriods
                ? `• ${Array.isArray(request.selectedPeriods) ? request.selectedPeriods.join(', ') : request.selectedPeriods}`
                : Array.isArray(request.periods)
                  ? `• ${request.periods.map(p => typeof p === 'object' ? (p.time || p.label || p.id) : p).join(', ')}`
                  : ''}
          </span>
        </div>
      )}

      {/* Formal Sanctioned Application Banner (Becomes formal document after approval) */}
      {isApproved && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.65rem 0.95rem',
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: 'var(--radius-xl)',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#065F46' }}>
            <ShieldCheck size={17} className="text-emerald-600 shrink-0" />
            <div>
              <div style={{ fontWeight: 800 }}>Official Sanction Order Issued</div>
              <div style={{ fontSize: '11px', color: '#047857' }}>
                {request.approvedPeriodsCount ? `${request.approvedPeriodsCount} Lecture Periods Credited • ` : ''}
                Formally sanctioned by Department of CSE
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openModal('formalApplication', { request })}
            className="btn btn-sm btn-success"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 700,
              padding: '0.35rem 0.85rem'
            }}
            id={`btn-view-formal-app-${request.id}`}
          >
            <FileText size={13} />
            <span>View Formal Application</span>
          </button>
        </div>
      )}

      {/* Stepper Timeline */}
      {request.timeline && (
        <WorkflowTimeline timeline={request.timeline} />
      )}

      {/* Action buttons */}
      {showActions && (
        <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.25rem' }}>
          {onRecommend && (
            <button onClick={onRecommend} className="btn btn-sm btn-primary" style={{ flex: 1 }}>
              <UserCheck size={14} />
              <span>Recommend & Forward</span>
            </button>
          )}

          {onApprove && (
            <button
              onClick={onApprove}
              className="btn btn-sm btn-success"
              style={{
                flex: 1,
                backgroundColor: role === 'hod' && request.status === 'pending_tg' ? 'var(--primary)' : undefined,
                color: '#FFFFFF'
              }}
              id={`btn-approve-request-${request.id}`}
            >
              {role === 'hod' && request.status === 'pending_tg' ? (
                <>
                  <Zap size={14} color="#FFFFFF" />
                  <span style={{ color: '#FFFFFF' }}>Direct Approve (Bypass TG)</span>
                </>
              ) : request.type === 'leave_request' || request.leaveType ? (
                <>
                  <ShieldCheck size={14} color="#FFFFFF" />
                  <span style={{ color: '#FFFFFF' }}>Grant Leave Approval</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} color="#FFFFFF" />
                  <span style={{ color: '#FFFFFF' }}>Approve & Sync Agent</span>
                </>
              )}
            </button>
          )}

          {onReject && (
            <button
              onClick={onReject}
              className="btn btn-sm btn-outline"
              style={{ color: 'var(--error)', backgroundColor: '#FFFFFF', borderColor: '#FECDD3' }}
              id={`btn-reject-request-${request.id}`}
            >
              Reject
            </button>
          )}

          {onViewDetails && (
            <button onClick={onViewDetails} className="btn btn-sm btn-secondary" style={{ flex: onApprove || onRecommend ? 0 : 1, backgroundColor: '#FFFFFF' }}>
              <span>Details</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

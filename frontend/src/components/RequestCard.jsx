import React from 'react';
import ApprovalStatus from './ApprovalStatus';
import WorkflowTimeline from './WorkflowTimeline';
import { FileText, ArrowRight, CheckCircle2, UserCheck, Calendar, ArrowUpRight } from 'lucide-react';

export default function RequestCard({
  request,
  onViewDetails,
  onApprove,
  onReject,
  onRecommend,
  showActions = false,
  role = 'student'
}) {
  if (!request) return null;

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
            <button onClick={onApprove} className="btn btn-sm btn-success" style={{ flex: 1 }}>
              <CheckCircle2 size={14} />
              <span>Approve (Trigger Agent)</span>
            </button>
          )}

          {onReject && (
            <button onClick={onReject} className="btn btn-sm btn-outline" style={{ color: 'var(--error)' }}>
              Reject
            </button>
          )}

          {onViewDetails && (
            <button onClick={onViewDetails} className="btn btn-sm btn-secondary" style={{ flex: onApprove || onRecommend ? 0 : 1 }}>
              <span>Details</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

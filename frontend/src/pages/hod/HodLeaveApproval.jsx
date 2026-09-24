import React from 'react';
import { useERP } from '../../context/ERPContext';
import RequestCard from '../../components/RequestCard';
import { FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function HodLeaveApproval() {
  const { leaveRequests, hodApproveLeave } = useERP();

  const directFallbackLeaves = leaveRequests.filter((l) => l.tgUnavailable || l.status === 'pending_hod_direct');

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Leave Management & Clearance
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Digital sign-off on 3-tier and direct-routed student leaves
          </p>
        </div>

        {/* Direct Routing Highlight Banner */}
        {directFallbackLeaves.length > 0 && (
          <div
            style={{
              backgroundColor: 'var(--tertiary-container)',
              padding: '1rem',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid #FDE68A',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <AlertTriangle size={20} color="var(--tertiary)" style={{ flexShrink: 0 }} />
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--on-tertiary-container)' }}>
                Direct HOD Clearance Queue ({directFallbackLeaves.length} items)
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--on-tertiary-container)', opacity: 0.9 }}>
                These leave applications were routed directly to you because the mentor/TG was marked on leave/unavailable.
              </p>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {leaveRequests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              showActions={req.status !== 'completed'}
              role="hod"
              onApprove={() => hodApproveLeave(req.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

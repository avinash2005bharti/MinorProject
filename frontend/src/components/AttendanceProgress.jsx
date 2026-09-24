import React from 'react';
import { attendanceService } from '../services/attendanceService';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export default function AttendanceProgress({ percentage = 75, showDetails = true, showThreshold = true }) {
  const status = attendanceService.getStatusThreshold(percentage);

  let icon = <CheckCircle2 size={15} color={status.color} />;
  if (percentage < 65) {
    icon = <XCircle size={15} color={status.color} />;
  } else if (percentage < 75) {
    icon = <AlertTriangle size={15} color={status.color} />;
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {showDetails && (
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '28px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                lineHeight: 1
              }}
              className="tabular-nums"
            >
              {percentage}
            </span>
            <span style={{ fontSize: '16px', fontWeight: 700, color: status.color }}>%</span>
          </div>

          <span className={`badge ${status.badgeClass}`} style={{ fontSize: '11px' }}>
            <span className="agent-pulse" style={{ backgroundColor: status.color, width: '6px', height: '6px' }} />
            {status.label}
          </span>
        </div>
      )}

      {/* Progress Track */}
      <div
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: 'var(--surface-high)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          display: 'flex'
        }}
      >
        <div
          style={{
            width: `${Math.min(100, Math.max(0, percentage))}%`,
            height: '100%',
            backgroundColor: status.color,
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />
      </div>

      {showThreshold && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: status.color, fontWeight: 500 }}>
            {icon}
            <span>{status.sublabel}</span>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Min. 75% required</span>
        </div>
      )}
    </div>
  );
}

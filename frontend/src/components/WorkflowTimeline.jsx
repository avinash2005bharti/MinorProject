import React from 'react';
import { Check, Clock, AlertTriangle, Bot } from 'lucide-react';

export default function WorkflowTimeline({ timeline = [], currentStepIndex = 1 }) {
  if (!timeline || timeline.length === 0) return null;

  return (
    <div
      style={{
        backgroundColor: 'var(--surface-low)',
        borderRadius: 'var(--radius-xl)',
        padding: '0.85rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Clearance Stepper (3-Tier & Agent Sync)
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Autonomous Tracking
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {timeline.map((item, index) => {
          const isDone = item.completed;
          const isActive = item.active;
          const isWarning = item.warning;

          return (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                fontSize: '12px'
              }}
            >
              {/* Stepper Icon */}
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  backgroundColor: isDone
                    ? 'var(--secondary)'
                    : isWarning
                    ? 'var(--error)'
                    : isActive
                    ? 'var(--tertiary)'
                    : 'var(--surface-high)',
                  color: isDone || isWarning || isActive ? '#FFFFFF' : 'var(--text-muted)',
                  fontSize: '11px',
                  fontWeight: 700
                }}
              >
                {isDone ? (
                  <Check size={12} strokeWidth={3} />
                ) : isWarning ? (
                  <AlertTriangle size={12} />
                ) : isActive ? (
                  <Clock size={12} />
                ) : (
                  index + 1
                )}
              </div>

              {/* Step info */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontWeight: isDone || isActive ? 600 : 400,
                    color: isWarning ? 'var(--error)' : isActive ? 'var(--text-primary)' : isDone ? 'var(--text-primary)' : 'var(--text-muted)',
                    lineHeight: 1.2
                  }}
                >
                  {item.step}
                </span>
                {item.actor && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.2 }}>
                    {item.actor}
                  </span>
                )}
              </div>

              {/* Time stamp */}
              <span
                style={{
                  fontSize: '11px',
                  color: isActive ? 'var(--tertiary)' : 'var(--text-muted)',
                  fontWeight: isActive ? 600 : 400
                }}
              >
                {item.time}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

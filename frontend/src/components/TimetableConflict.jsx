import React from 'react';
import { AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';

export default function TimetableConflict({ conflicts = [], onResolveAuto }) {
  if (!conflicts || conflicts.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.85rem 1rem',
          backgroundColor: 'var(--secondary-container)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid #A7F3D0'
        }}
      >
        <CheckCircle2 size={20} color="var(--secondary)" />
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--on-secondary-container)' }}>
            Zero Scheduling Collisions Detected
          </h4>
          <p style={{ fontSize: '12px', color: 'var(--on-secondary-container)', opacity: 0.9 }}>
            All faculty availability constraints, classroom capacities, and mandatory break intervals are satisfied.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        padding: '1rem',
        backgroundColor: 'var(--tertiary-container)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid #FDE68A'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={20} color="var(--tertiary)" />
          <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--on-tertiary-container)' }}>
            {conflicts.length} Scheduling Conflicts Flagged by AI
          </h4>
        </div>

        {onResolveAuto && (
          <button
            onClick={onResolveAuto}
            className="btn btn-sm btn-primary"
            style={{
              backgroundColor: 'var(--tertiary)',
              color: '#FFFFFF',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Sparkles size={14} />
            <span>Resolve Automatically</span>
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {conflicts.map((conf) => (
          <div
            key={conf.id}
            style={{
              backgroundColor: '#FFFFFF',
              padding: '0.75rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              fontSize: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, color: 'var(--error)' }}>{conf.title}</span>
              <span className="badge badge-amber" style={{ fontSize: '10px' }}>{conf.time}</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginTop: '3px' }}>{conf.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

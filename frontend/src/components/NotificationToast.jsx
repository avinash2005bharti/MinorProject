import React from 'react';
import { useERP } from '../context/ERPContext';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export default function NotificationToast() {
  const { toasts, removeToast } = useERP();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '1.25rem',
        right: '1.25rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        maxWidth: '380px',
        width: 'calc(100vw - 2.5rem)',
        pointerEvents: 'none'
      }}
    >
      {toasts.map((toast) => {
        let icon = <Info size={18} color="#1D4ED8" />;
        let borderLeftColor = '#1D4ED8';

        if (toast.type === 'success') {
          icon = <CheckCircle2 size={18} color="#059669" />;
          borderLeftColor = '#059669';
        } else if (toast.type === 'warning') {
          icon = <AlertTriangle size={18} color="#D97706" />;
          borderLeftColor = '#D97706';
        } else if (toast.type === 'error') {
          icon = <XCircle size={18} color="#E11D48" />;
          borderLeftColor = '#E11D48';
        }

        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              padding: '0.85rem 1rem',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--border-subtle)',
              borderLeft: `4px solid ${borderLeftColor}`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <div style={{ marginTop: '2px', flexShrink: 0 }}>{icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h5 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                {toast.title}
              </h5>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                color: 'var(--text-muted)',
                padding: '2px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

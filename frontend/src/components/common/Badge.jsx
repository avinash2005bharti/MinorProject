import React from 'react';

/**
 * Standard Design System Badge / Tag Primitive
 * Supports variants: primary | success | warning | danger | neutral | purple | cyan
 * Supports sizes: sm | md
 */
export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  pulse = false,
  icon = null,
  className = '',
  ...props
}) {
  const variantClass = {
    primary: 'badge-indigo',
    success: 'badge-emerald',
    warning: 'badge-amber',
    danger: 'badge-rose',
    neutral: 'badge-slate',
    purple: 'badge-purple',
    cyan: 'badge-cyan'
  }[variant] || 'badge-slate';

  const sizeStyle = size === 'xs'
    ? { fontSize: '10px', padding: '0.1rem 0.45rem', borderRadius: '9999px', fontWeight: 700 }
    : size === 'sm'
    ? { fontSize: '11px', padding: '0.15rem 0.5rem' }
    : {};

  return (
    <span
      className={`badge ${variantClass} ${className}`.trim()}
      style={sizeStyle}
      {...props}
    >
      {dot && (
        <span
          className={`badge-dot ${pulse ? 'agent-pulse' : ''}`}
          style={{
            width: size === 'sm' ? '5px' : '6px',
            height: size === 'sm' ? '5px' : '6px',
            borderRadius: '50%',
            backgroundColor: 'currentColor',
            display: 'inline-block',
            flexShrink: 0
          }}
        />
      )}
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

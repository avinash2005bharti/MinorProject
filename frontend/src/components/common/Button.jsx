import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Standard Design System Button Primitive
 * Supports variants: primary | secondary | outline | success | danger | warning | ghost
 * Supports sizes: xs | sm | md | lg
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon = null,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  pill = false,
  className = '',
  type = 'button',
  ...props
}) {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    success: 'btn-success',
    danger: 'btn-danger',
    warning: 'btn-warning',
    ghost: 'btn-ghost'
  }[variant] || 'btn-primary';

  const sizeClass = {
    xs: 'btn-xs',
    sm: 'btn-sm',
    md: '', // default 42px height
    lg: 'btn-lg'
  }[size] || '';

  const classes = [
    'btn',
    variantClass,
    sizeClass,
    pill ? 'btn-pill' : '',
    fullWidth ? 'w-full' : '',
    loading ? 'btn-loading' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 size={size === 'xs' || size === 'sm' ? 14 : 16} className="animate-spin" />
          {children && <span>{children}</span>}
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="inline-flex shrink-0">{icon}</span>}
          {children && <span>{children}</span>}
          {icon && iconPosition === 'right' && <span className="inline-flex shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
}

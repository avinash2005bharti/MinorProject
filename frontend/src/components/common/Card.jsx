import React from 'react';

/**
 * Standard Design System Card Component with Sub-components
 * Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
 */

export function Card({
  children,
  interactive = false,
  compact = false,
  className = '',
  ...props
}) {
  return (
    <div
      className={`card ${interactive ? 'card-interactive' : ''} ${className}`.trim()}
      style={compact ? { padding: '1rem' } : undefined}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = '',
  action = null,
  ...props
}) {
  return (
    <div
      className={`flex items-start justify-between gap-3 mb-4 ${className}`.trim()}
      {...props}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardTitle({
  children,
  className = '',
  as = 'h3',
  ...props
}) {
  const Component = as;
  return (
    <Component
      className={`text-base font-bold text-slate-900 tracking-tight leading-snug m-0 ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
}

export function CardDescription({
  children,
  className = '',
  ...props
}) {
  return (
    <p
      className={`text-xs text-slate-500 mt-1 mb-0 leading-normal ${className}`.trim()}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({
  children,
  className = '',
  ...props
}) {
  return (
    <div className={`w-full ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className = '',
  ...props
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 pt-3 mt-4 border-t border-slate-200 text-xs text-slate-500 ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;

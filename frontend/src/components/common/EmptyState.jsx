import React from 'react';

/**
 * Standard Design System Empty State Primitive
 */
export default function EmptyState({
  icon = null,
  title = 'No Records Found',
  description = 'There are no items matching the current selection.',
  action = null,
  className = ''
}) {
  return (
    <div
      className={`card text-center p-8 md:p-12 flex flex-col items-center justify-center border-dashed ${className}`.trim()}
    >
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3 shrink-0">
          {icon}
        </div>
      )}
      <h4 className="text-base font-bold text-slate-800 tracking-tight m-0">
        {title}
      </h4>
      {description && (
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4 leading-normal">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

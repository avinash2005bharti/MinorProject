import React from 'react';

/**
 * Standard Design System Page Header
 * Ensures consistent page title, badge, description, and action button toolbar across all role dashboards
 */
export default function PageHeader({
  title,
  badge = null,
  description = null,
  actions = null,
  breadcrumbs = null,
  className = ''
}) {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200 mb-6 ${className}`.trim()}
    >
      <div className="min-w-0 flex-1">
        {breadcrumbs && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            {breadcrumbs}
          </div>
        )}
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight m-0">
            {title}
          </h1>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
        {description && (
          <p className="text-xs text-slate-500 mt-1 mb-0 leading-normal max-w-3xl">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

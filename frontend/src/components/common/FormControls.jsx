import React from 'react';

/**
 * Standard Design System Form Field Wrappers
 */

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required = false,
  children,
  className = ''
}) {
  return (
    <div className={`form-group ${className}`.trim()}>
      {label && (
        <label htmlFor={htmlFor} className="form-label flex items-center justify-between">
          <span>
            {label}
            {required && <span className="text-rose-600 ml-1" aria-hidden="true">*</span>}
          </span>
        </label>
      )}
      {children}
      {hint && !error && <small className="form-helper text-xs text-slate-500 mt-1">{hint}</small>}
      {error && <small className="text-xs text-rose-600 font-medium mt-1">{error}</small>}
    </div>
  );
}

export function Input({
  id,
  type = 'text',
  icon = null,
  error = null,
  className = '',
  ...props
}) {
  if (icon) {
    return (
      <div className="relative w-full">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none inline-flex items-center"
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        >
          {icon}
        </span>
        <input
          id={id}
          type={type}
          className={`input-field pl-10 ${error ? 'border-rose-600 focus:border-rose-600' : ''} ${className}`.trim()}
          style={{ paddingLeft: '2.5rem' }}
          {...props}
        />
      </div>
    );
  }

  return (
    <input
      id={id}
      type={type}
      className={`input-field ${error ? 'border-rose-600 focus:border-rose-600' : ''} ${className}`.trim()}
      {...props}
    />
  );
}

export function Select({
  id,
  options = [],
  children,
  error = null,
  className = '',
  ...props
}) {
  return (
    <select
      id={id}
      className={`form-select ${error ? 'border-rose-600' : ''} ${className}`.trim()}
      {...props}
    >
      {options.length > 0
        ? options.map((opt) => (
            <option key={opt.value ?? opt} value={opt.value ?? opt}>
              {opt.label ?? opt}
            </option>
          ))
        : children}
    </select>
  );
}

export function Textarea({
  id,
  rows = 3,
  error = null,
  className = '',
  ...props
}) {
  return (
    <textarea
      id={id}
      rows={rows}
      className={`input-field ${error ? 'border-rose-600' : ''} ${className}`.trim()}
      {...props}
    />
  );
}

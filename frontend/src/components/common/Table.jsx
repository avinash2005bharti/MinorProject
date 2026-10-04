import React from 'react';

/**
 * Standard Design System Table Primitives
 * Ensures responsive horizontal scrolling, consistent header styling, and zebra/hover states
 */

export function Table({ children, className = '', ...props }) {
  return (
    <div className="table-responsive w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className={`w-full text-left border-collapse text-xs md:text-sm ${className}`.trim()} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '', ...props }) {
  return (
    <thead className={`bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-xs ${className}`.trim()} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '', ...props }) {
  return (
    <tbody className={`divide-y divide-slate-100 text-slate-800 ${className}`.trim()} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, isSelected = false, className = '', ...props }) {
  return (
    <tr
      className={`transition-colors duration-150 hover:bg-slate-50/80 ${isSelected ? 'bg-blue-50/60' : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '', ...props }) {
  return (
    <th className={`py-3 px-4 text-xs font-bold text-slate-700 whitespace-nowrap ${className}`.trim()} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '', ...props }) {
  return (
    <td className={`py-3 px-4 align-middle whitespace-nowrap ${className}`.trim()} {...props}>
      {children}
    </td>
  );
}

export default Table;

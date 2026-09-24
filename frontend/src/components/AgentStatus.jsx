import React from 'react';
import { Bot } from 'lucide-react';

export default function AgentStatus({ name = 'Autonomous Agents', status = 'Active', pulse = true }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        padding: '0.3rem 0.75rem',
        backgroundColor: 'var(--surface-container)',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--border-subtle)',
        fontSize: '12px',
        fontWeight: 600,
        color: 'var(--primary)'
      }}
    >
      <Bot size={15} />
      <span>{name}</span>
      {pulse && <span className="agent-pulse" style={{ width: '6px', height: '6px' }} />}
    </div>
  );
}

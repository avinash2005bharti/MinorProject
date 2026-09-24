import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { Bot, CheckCircle2, Calendar, Clock, Bell, Sparkles, Filter } from 'lucide-react';

export default function AgentActivity({ maxItems = 10, compact = false }) {
  const { agentActivityLogs } = useERP();
  const [filter, setFilter] = useState('all');

  const filteredLogs = agentActivityLogs.filter((log) => {
    if (filter === 'all') return true;
    return log.type === filter;
  });

  const displayLogs = filteredLogs.slice(0, maxItems);

  const getAgentIcon = (type) => {
    switch (type) {
      case 'attendance':
        return <CheckCircle2 size={16} color="var(--primary)" />;
      case 'leave':
        return <Calendar size={16} color="var(--secondary)" />;
      case 'timetable':
        return <Clock size={16} color="var(--tertiary)" />;
      case 'notification':
      default:
        return <Bell size={16} color="var(--primary)" />;
    }
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--primary-container)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Bot size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Agent Activity Stream
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Continuous Autonomous Telemetry & Auditing
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span className="agent-pulse" />
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--secondary)' }}>
            4 Agents Online
          </span>
        </div>
      </div>

      {/* Filter Chips */}
      {!compact && (
        <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '2px' }}>
          {[
            { id: 'all', label: 'All Events' },
            { id: 'attendance', label: 'Attendance' },
            { id: 'leave', label: 'Leave' },
            { id: 'timetable', label: 'Timetable' },
            { id: 'notification', label: 'Notices' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className="btn btn-sm"
              style={{
                backgroundColor: filter === item.id ? 'var(--primary)' : 'var(--surface-low)',
                color: filter === item.id ? '#FFFFFF' : 'var(--text-secondary)',
                fontSize: '11px',
                padding: '0.2rem 0.65rem',
                minHeight: '26px'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Activity List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {displayLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '13px' }}>
            No agent actions recorded for this filter.
          </div>
        ) : (
          displayLogs.map((log) => (
            <div
              key={log.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.75rem 0.85rem',
                backgroundColor: 'var(--surface-low)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-subtle)',
                transition: 'all 0.15s ease'
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {getAgentIcon(log.type)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {log.agentName}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.timestamp}</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500, marginTop: '2px', lineHeight: 1.3 }}>
                  {log.summary}
                </p>
                {log.details && (
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.3 }}>
                    {log.details}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

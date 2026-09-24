import React from 'react';
import { useERP } from '../../context/ERPContext';
import AgentActivity from '../../components/AgentActivity';
import {
  Users,
  UserCheck,
  Building2,
  Bot,
  Activity,
  ShieldCheck,
  Server,
  Sparkles
} from 'lucide-react';

export default function AdminDashboard() {
  const { currentUser } = useERP();

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Central Institutional Administration
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              OIST CSE Enterprise ERP • Autonomous College Infrastructure
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.85rem',
              backgroundColor: 'var(--secondary-container)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--on-secondary-container)',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            <span className="agent-pulse" />
            <span>ERP Cloud Core: 99.98% Uptime</span>
          </div>
        </div>

        {/* Global Statistics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '1rem' }} className="sm:grid-cols-4">
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-xl)',
                backgroundColor: 'var(--primary-container)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Users size={20} />
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Total Students</span>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                1,420
              </div>
              <span style={{ fontSize: '10px', color: 'var(--secondary)' }}>Active across 5 branches</span>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-xl)',
                backgroundColor: 'var(--secondary-container)',
                color: 'var(--on-secondary-container)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <UserCheck size={20} />
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Teaching Faculty</span>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                84
              </div>
              <span style={{ fontSize: '10px', color: 'var(--secondary)' }}>100% verified</span>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-xl)',
                backgroundColor: 'var(--tertiary-container)',
                color: 'var(--tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Building2 size={20} />
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Academic Depts</span>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                5
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>CSE, ECE, ME, CE, EE</span>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-xl)',
                backgroundColor: 'var(--primary-fixed)',
                color: 'var(--on-primary-fixed)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Bot size={20} />
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Autonomous Agents</span>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>
                4 / 4
              </div>
              <span style={{ fontSize: '10px', color: 'var(--secondary)' }}>All telemetry green</span>
            </div>
          </div>
        </div>

        {/* 4 Agent Status Cards */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Autonomous Multi-Agent Fleet Status
            </h3>
            <span className="badge badge-emerald">Real-time Coordination</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '0.75rem' }} className="sm:grid-cols-2 lg:grid-cols-4">
            <div style={{ backgroundColor: 'var(--surface-low)', padding: '0.85rem', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>Attendance Agent</span>
                <span className="agent-pulse" />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Auditing section ledgers & automating HOD consideration rollouts.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--surface-low)', padding: '0.85rem', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>Leave Agent</span>
                <span className="agent-pulse" />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Monitoring mentor telemetry & executing direct fallback routing.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--surface-low)', padding: '0.85rem', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>Timetable Agent</span>
                <span className="agent-pulse" />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Solving multi-variable scheduling constraints and collision healing.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--surface-low)', padding: '0.85rem', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>Notification Agent</span>
                <span className="agent-pulse" />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Pushing cross-role alerts and clearance letters automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Global Agent Activity Feed */}
        <AgentActivity maxItems={8} />
      </div>
    </div>
  );
}

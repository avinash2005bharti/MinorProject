import React from 'react';
import { useERP } from '../../context/ERPContext';
import { Link } from 'react-router-dom';
import AgentActivity from '../../components/AgentActivity';
import QuickActions from '../../components/QuickActions';
import {
  Users,
  UserCheck,
  Building2,
  Bot,
  Activity,
  ShieldCheck,
  Server,
  Sparkles,
  GraduationCap,
  ChevronRight,
  BookOpen
} from 'lucide-react';

export default function AdminDashboard() {
  const { currentUser } = useERP();

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Department of Computer Science & Engineering
              </h1>
              <span className="badge badge-indigo">CSE Administration</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              OIST CSE Institutional ERP • Exclusively Provisioned for Computer Science Engineering
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link
              to="/admin/departments"
              className="btn btn-primary text-xs py-2 px-3.5 shadow-sm"
            >
              <GraduationCap size={15} />
              <span>Academic Structure (Year → Section)</span>
            </Link>

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
              <span>Core Uptime: 99.98%</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <QuickActions role="admin" />

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
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Enrolled CSE Students</span>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                340
              </div>
              <span style={{ fontSize: '10px', color: 'var(--secondary)' }}>Active across 8 semesters</span>
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
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>CSE Teaching Faculty</span>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                24
              </div>
              <span style={{ fontSize: '10px', color: 'var(--secondary)' }}>100% verified</span>
            </div>
          </div>

          <Link
            to="/admin/departments"
            className="card card-interactive"
            style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', textDecoration: 'none' }}
          >
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
              <GraduationCap size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>CSE Academic Scope</span>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                4 Years
              </div>
              <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                8 Semesters • Section A & B <ChevronRight size={10} />
              </span>
            </div>
          </Link>

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

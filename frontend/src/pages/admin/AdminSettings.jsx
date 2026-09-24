import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Settings, Bot, ShieldCheck, Save, Sparkles, Activity, CheckCircle2, Zap, Database } from 'lucide-react';

export default function AdminSettings() {
  const { addToast } = useERP();
  const [autoSyncInterval, setAutoSyncInterval] = useState('Real-Time (Instantaneous Webhooks)');
  const [tgFallbackThreshold, setTgFallbackThreshold] = useState('Immediate Fallback on Unavailability');
  const [timetableHealingEngine, setTimetableHealingEngine] = useState('Heuristic Multi-Variable Solver');
  const [auditLogRetention, setAuditLogRetention] = useState('180 Days (Autonomous Academic Archive)');

  const handleSave = () => {
    addToast('Settings Saved', 'Autonomous agent telemetry & parameters updated successfully across OIST cloud.', 'success');
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        {/* Header Section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                ERP Agent Automation Settings
              </h1>
              <span className="badge badge-emerald">Autonomous Core v3.2</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Configure autonomous background agents, escalation rules, and institutional self-healing routines
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button onClick={handleSave} className="btn btn-primary" style={{ borderRadius: 'var(--radius-full)' }}>
              <Save size={16} />
              <span>Save Agent Configuration</span>
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Grid across full window */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }} className="lg:grid-cols-3">
          {/* Main 2-Span Column: Behavior Matrix */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="lg:col-span-2">
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Bot size={22} color="var(--primary)" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Autonomous Agent Behavior Matrix
                </h3>
              </div>

              <div className="form-group">
                <label className="form-label">Attendance Agent Synchronization Protocol</label>
                <select className="input-field" value={autoSyncInterval} onChange={(e) => setAutoSyncInterval(e.target.value)}>
                  <option value="Real-Time (Instantaneous Webhooks)">Real-Time (Instantaneous Webhooks & Ledger Sync)</option>
                  <option value="Hourly Batch">Hourly Batch Reconciliation</option>
                  <option value="Nightly Audit">Nightly Reconciliation</option>
                </select>
                <span className="form-helper">Controls how quickly HOD consideration approvals propagate section-wise.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Leave Agent Mentor Fallback Rule</label>
                <select className="input-field" value={tgFallbackThreshold} onChange={(e) => setTgFallbackThreshold(e.target.value)}>
                  <option value="Immediate Fallback on Unavailability">Immediate Direct HOD Route if TG is marked on leave</option>
                  <option value="24-Hour Grace Period">24-Hour Grace Period before Escalation to HOD</option>
                  <option value="Manual Escalation Only">Strict 3-Tier Only</option>
                </select>
                <span className="form-helper">Determines whether leave requests bypass TG when TG is unavailable.</span>
              </div>

              <div className="form-group">
                <label className="form-label">AI Timetable Healing Algorithm</label>
                <select className="input-field" value={timetableHealingEngine} onChange={(e) => setTimetableHealingEngine(e.target.value)}>
                  <option value="Heuristic Multi-Variable Solver">Heuristic Multi-Variable Constraint Solver</option>
                  <option value="Genetic Optimization">Genetic Combinatorial Algorithm</option>
                </select>
                <span className="form-helper">Used by Timetable Agent to automatically heal double-booking collisions.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Audit Log Retention Policy</label>
                <select className="input-field" value={auditLogRetention} onChange={(e) => setAuditLogRetention(e.target.value)}>
                  <option value="180 Days (Autonomous Academic Archive)">180 Days (Autonomous Academic Archive)</option>
                  <option value="365 Days (Full Academic Year)">365 Days (Full Academic Year)</option>
                  <option value="Permanent Compliance Ledger">Permanent Immutable Compliance Ledger</option>
                </select>
                <span className="form-helper">Retention timeline for biometric and attendance modification logs.</span>
              </div>
            </div>
          </div>

          {/* Right Column: Status & Security Telemetry */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Live Agents Status */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Active Agent Daemons
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--surface-low)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="agent-pulse" />
                    <span style={{ fontWeight: 600 }}>Attendance Agent</span>
                  </div>
                  <span className="badge badge-emerald" style={{ fontSize: '10px' }}>Operational</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--surface-low)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="agent-pulse" />
                    <span style={{ fontWeight: 600 }}>Leave Router Agent</span>
                  </div>
                  <span className="badge badge-emerald" style={{ fontSize: '10px' }}>Operational</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--surface-low)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="agent-pulse" />
                    <span style={{ fontWeight: 600 }}>Timetable Solver</span>
                  </div>
                  <span className="badge badge-emerald" style={{ fontSize: '10px' }}>Operational</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--surface-low)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="agent-pulse" />
                    <span style={{ fontWeight: 600 }}>Proxy Attendance Sentinel</span>
                  </div>
                  <span className="badge badge-emerald" style={{ fontSize: '10px' }}>Armed</span>
                </div>
              </div>
            </div>

            {/* Cloud Ledger Security */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={18} color="var(--secondary)" />
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Compliance & Safeguards
                </h3>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                All agent actions generate cryptographically timestamped records adhering to autonomous college governance standards.
              </p>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} color="var(--secondary)" />
                <span>RGPV Autonomous Compliance Checked</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

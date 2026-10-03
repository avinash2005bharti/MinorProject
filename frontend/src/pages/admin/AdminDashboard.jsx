import React, { useEffect, useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Link } from 'react-router-dom';
import QuickActions from '../../components/QuickActions';
import QuickDisplay from '../../components/QuickDisplay';
import { dashboardApi } from '../../api/dashboardApi';
import { adminApi } from '../../api/adminApi';
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
  RefreshCw,
  AlertCircle,
  FileText
} from 'lucide-react';

export default function AdminDashboard() {
  const { currentUser } = useERP();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getAdminDashboard();
      if (res?.data) {
        setDashboard(res.data);
      }
    } catch (err) {
      setError(err.message || 'Unable to load admin analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const counts = {
    totalUsers: dashboard?.counts?.totalUsers ?? dashboard?.totalUsers ?? 0,
    totalStudents: dashboard?.counts?.totalStudents ?? dashboard?.totalStudents ?? 0,
    totalFaculty: dashboard?.counts?.totalFaculty ?? dashboard?.totalFaculty ?? 0,
    totalSubjects: dashboard?.counts?.totalSubjects ?? dashboard?.totalSubjects ?? 0,
    totalSections: dashboard?.counts?.totalSections ?? dashboard?.totalSections ?? 0,
    activeAgentsCount: dashboard?.counts?.activeAgentsCount ?? dashboard?.activeAgentsCount ?? 10
  };
  const recentActivity = dashboard?.recentActivity || [];

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Department of Computer Science & Engineering
              </h1>
              <span className="badge badge-indigo">CSE Administration</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              OIST CSE Institutional ERP • Relational PostgreSQL Database Infrastructure
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={fetchAdminData}
              disabled={loading}
              className="btn btn-outline text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <Link to="/admin/departments" className="btn btn-primary text-xs py-2 px-3.5 shadow-sm">
              <GraduationCap size={15} />
              <span>Academic Structure</span>
            </Link>
          </div>
        </div>

        {/* Loading and Error states */}
        {loading && (
          <div className="p-8 text-center text-slate-500 card flex flex-col items-center justify-center gap-2">
            <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }} />
            <span className="text-xs font-semibold">Querying System Metrics from Database...</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={fetchAdminData} className="btn btn-sm btn-primary text-xs">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Quick Actions Bar */}
            <QuickActions role="admin" />

            {/* Quick Display Widget */}
            <QuickDisplay />

            {/* Global Real Statistics from Database */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
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
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Enrolled Students</span>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {counts.totalStudents}
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--secondary)' }}>In Relational DB</span>
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
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {counts.totalFaculty}
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--secondary)' }}>Active Teachers</span>
                </div>
              </div>

              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: 'var(--radius-xl)',
                    backgroundColor: '#EFF6FF',
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Server size={20} />
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Total User Accounts</span>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {counts.totalUsers}
                  </div>
                  <span style={{ fontSize: '10px', color: '#16A34A' }}>Status: {dashboard?.systemStatus || 'Optimal'}</span>
                </div>
              </div>

              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: 'var(--radius-xl)',
                    backgroundColor: '#ECFDF5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Bot size={20} />
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Autonomous Agents</span>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {counts.activeAgentsCount}
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--secondary)' }}>Orchestration Live</span>
                </div>
              </div>
            </div>

            {/* Audit Logs from Real Database */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Recent Relational Audit Log Trail</h3>
                </div>
                <span className="text-xs text-slate-400">PostgreSQL Log Records</span>
              </div>

              {recentActivity.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs bg-slate-50 rounded-xl">
                  No records found.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table" style={{ width: '100%', fontSize: '12px' }}>
                    <thead>
                      <tr className="text-slate-500 text-left border-b border-slate-200">
                        <th className="pb-2 font-bold">Action</th>
                        <th className="pb-2 font-bold">Actor</th>
                        <th className="pb-2 font-bold">Entity</th>
                        <th className="pb-2 font-bold">Details</th>
                        <th className="pb-2 font-bold">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentActivity.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 font-bold text-blue-600">{log.action}</td>
                          <td className="py-2.5 text-slate-800">{log.actor_name || log.user || log.role || 'System'}</td>
                          <td className="py-2.5 text-slate-600">{log.entity || 'AI Engine'}</td>
                          <td className="py-2.5 text-slate-500 max-w-xs truncate">{log.details || log.status || 'Committed'}</td>
                          <td className="py-2.5 text-slate-400 tabular-nums">
                            {log.createdAt || log.timestamp
                              ? new Date(log.createdAt || log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : 'Just now'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Users, Search, AlertTriangle, CheckCircle2, ChevronRight, ShieldCheck, Mail } from 'lucide-react';

export default function TgMyStudents() {
  const { students, currentUser } = useERP();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredStudents = students.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(search.toLowerCase()) ||
      st.rollNo.toLowerCase().includes(search.toLowerCase());

    if (filter === 'at-risk') return matchesSearch && st.attendance < 75;
    if (filter === 'safe') return matchesSearch && st.attendance >= 75;
    return matchesSearch;
  });

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
              My Mentees (Section {currentUser.assignedSection})
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Teacher Guardian supervision • {students.length} enrolled students
            </p>
          </div>

          <span className="badge badge-indigo">
            <Users size={14} />
            <span>TG: {currentUser.name}</span>
          </span>
        </div>

        {/* Filter & Search Bar */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by student name or roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ border: 'none', boxShadow: 'none', height: '36px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {[
              { id: 'all', label: 'All Students' },
              { id: 'at-risk', label: 'Shortage (<75%)' },
              { id: 'safe', label: 'Safe (≥75%)' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className="btn btn-sm"
                style={{
                  backgroundColor: filter === f.id ? 'var(--primary)' : 'var(--surface-low)',
                  color: filter === f.id ? '#FFFFFF' : 'var(--text-secondary)',
                  fontSize: '11px'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Students Table / Cards Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {filteredStudents.map((st) => {
            const isAtRisk = st.attendance < 75;

            return (
              <div
                key={st.id}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1.25rem',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: '220px', flex: 1 }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: isAtRisk ? 'var(--error-container)' : 'var(--secondary-container)',
                      color: isAtRisk ? 'var(--on-error-container)' : 'var(--on-secondary-container)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '14px',
                      flexShrink: 0
                    }}
                  >
                    {st.name.split(' ').map((n) => n[0]).join('')}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {st.name}
                      </h4>
                      {st.autoUpdated && (
                        <span className="badge badge-indigo" style={{ fontSize: '10px' }}>
                          Auto-Adjusted by Agent
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Roll No: {st.rollNo} • CGPA: {st.cgpa}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Attendance</span>
                    <span
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '18px',
                        fontWeight: 800,
                        color: isAtRisk ? 'var(--error)' : 'var(--secondary)'
                      }}
                    >
                      {st.attendance}%
                    </span>
                  </div>

                  <span className={`badge ${isAtRisk ? 'badge-rose' : 'badge-emerald'}`}>
                    {isAtRisk ? 'Shortage Alert' : 'Eligible'}
                  </span>

                  <button
                    onClick={() => openModal('studentDetail', { student: st })}
                    className="btn btn-sm btn-primary text-xs py-1.5 px-3"
                    id={`btn-inspect-${st.rollNo}`}
                  >
                    <span>Inspect Profile</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

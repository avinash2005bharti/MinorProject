import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Users, Search, PlusCircle, ShieldCheck } from 'lucide-react';

export default function AdminStudents() {
  const { students } = useERP();
  const [search, setSearch] = useState('');

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Institutional Student Registry
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Master enrollment database across all academic branches
            </p>
          </div>

          <button className="btn btn-primary" style={{ borderRadius: 'var(--radius-full)' }}>
            <PlusCircle size={16} />
            <span>Enroll New Student</span>
          </button>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search students by roll number or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ border: 'none', boxShadow: 'none', height: '36px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {filtered.map((st) => (
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-container)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '13px'
                  }}
                >
                  {st.name.split(' ').map((n) => n[0]).join('')}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{st.name}</h4>
                    <span className="badge badge-indigo">CSE-3A</span>
                    {st.autoUpdated && <span className="badge badge-emerald" style={{ fontSize: '10px' }}>Auto-Synced</span>}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Roll: {st.rollNo} • CGPA: {st.cgpa} • Dept: Computer Science & Engineering
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: st.attendance >= 75 ? 'var(--secondary)' : 'var(--error)' }}>
                  {st.attendance}% Attendance
                </span>
                <span className={`badge ${st.attendance >= 75 ? 'badge-emerald' : 'badge-rose'}`}>
                  {st.attendance >= 75 ? 'Active' : 'Shortage'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

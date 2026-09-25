import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Users, Search, PlusCircle, ShieldCheck, X, CheckCircle2 } from 'lucide-react';

export default function AdminStudents() {
  const { students, addToast } = useERP();
  const [studentList, setStudentList] = useState(students);
  const [search, setSearch] = useState('');
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [section, setSection] = useState('CSE-3A');
  const [cgpa, setCgpa] = useState('8.5');
  const [attendance, setAttendance] = useState('85');

  const filtered = studentList.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(search.toLowerCase())
  );

  const handleEnrollStudent = (e) => {
    e.preventDefault();
    if (!name || !rollNo) return;
    const newStudent = {
      id: `st-${Date.now()}`,
      name,
      rollNo,
      section,
      cgpa: parseFloat(cgpa) || 8.0,
      attendance: parseInt(attendance, 10) || 80,
      autoUpdated: true
    };
    setStudentList([newStudent, ...studentList]);
    setIsEnrollModalOpen(false);
    setName('');
    setRollNo('');
    if (addToast) {
      addToast('Student Enrolled', `${name} (${rollNo}) added to ${section} master registry.`, 'success');
    }
  };

  return (
    <div className="page-wrapper" style={{ paddingBottom: 'calc(var(--ai-dock-height, 90px) + 3.5rem)' }}>
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

          <button
            onClick={() => setIsEnrollModalOpen(true)}
            className="btn btn-primary"
            style={{ borderRadius: 'var(--radius-full)' }}
          >
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

      {/* Enrollment Modal */}
      {isEnrollModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 95, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-subtle)', maxWidth: '440px', width: '100%', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PlusCircle size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>Enroll Student</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>CSE Master Registry</span>
                </div>
              </div>
              <button onClick={() => setIsEnrollModalOpen(false)} className="btn-icon" title="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEnrollStudent} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '12.5px' }}>
              <div>
                <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aryan Mehra"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Roll Number</label>
                  <input
                    type="text"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value.toUpperCase())}
                    placeholder="e.g. 21CSE091"
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', outline: 'none', fontFamily: 'monospace' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Class Section</label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', backgroundColor: '#FFFFFF' }}
                  >
                    <option value="CSE-1A">CSE-1A</option>
                    <option value="CSE-1B">CSE-1B</option>
                    <option value="CSE-2A">CSE-2A</option>
                    <option value="CSE-2B">CSE-2B</option>
                    <option value="CSE-3A">CSE-3A</option>
                    <option value="CSE-3B">CSE-3B</option>
                    <option value="CSE-4A">CSE-4A</option>
                    <option value="CSE-4B">CSE-4B</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={cgpa}
                    onChange={(e) => setCgpa(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Attendance (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={attendance}
                    onChange={(e) => setAttendance(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button type="button" onClick={() => setIsEnrollModalOpen(false)} className="btn btn-sm btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-primary">
                  Enroll Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

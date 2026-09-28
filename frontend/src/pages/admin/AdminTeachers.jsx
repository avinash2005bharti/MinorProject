import React, { useState } from 'react';
import { teacherService } from '../../services/teacherService';
import { useERP } from '../../context/ERPContext';
import { UserCheck, PlusCircle, Search, X } from 'lucide-react';

export default function AdminTeachers() {
  const { addToast } = useERP();
  const [teachers, setTeachers] = useState(() => teacherService.getDepartmentFaculty());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [email, setEmail] = useState('');
  const [assignedSections, setAssignedSections] = useState('CSE-3A, CSE-3B');
  const [weeklyHours, setWeeklyHours] = useState('16');

  const handleAddFaculty = (e) => {
    e.preventDefault();
    if (!name || !email) return;

    const newFaculty = {
      id: `fac-${Date.now()}`,
      facultyId: `OIST-FAC-${Math.floor(100 + Math.random() * 900)}`,
      name,
      designation,
      email,
      department: 'Computer Science & Engineering',
      status: 'Active',
      assignedSections: assignedSections.split(',').map((s) => s.trim()),
      weeklyHours: parseInt(weeklyHours, 10) || 16
    };

    setTeachers([newFaculty, ...teachers]);
    setIsAddModalOpen(false);
    setName('');
    setEmail('');
    if (addToast) {
      addToast('Faculty Added', `${name} (${designation}) added to CSE faculty directory.`, 'success');
    }
  };

  return (
    <div className="page-wrapper" style={{ paddingBottom: 'calc(var(--ai-dock-height, 90px) + 3.5rem)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Faculty & Staff Directory
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Department of Computer Science & Engineering • Faculty roster and workload assignments
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary"
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            <PlusCircle size={16} />
            <span>Add Faculty Member</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {teachers.map((t) => (
            <div key={t.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>{t.name}</h3>
                  <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>{t.designation}</span>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{t.email} • {t.facultyId}</p>
                </div>
                <span className="badge badge-emerald">{t.status}</span>
              </div>

              <div style={{ backgroundColor: 'var(--surface-low)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div><strong>Dept:</strong> {t.department}</div>
                <div><strong>Assigned Sections:</strong> {t.assignedSections.join(', ')}</div>
                <div><strong>Weekly Teaching Hours:</strong> {t.weeklyHours} hrs</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Faculty Modal */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 95, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-subtle)', maxWidth: '440px', width: '100%', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PlusCircle size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>Add Faculty Member</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>CSE Department</span>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="btn-icon" title="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddFaculty} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '12.5px' }}>
              <div>
                <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Ramesh Gupta"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Designation</label>
                <select
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', backgroundColor: '#FFFFFF' }}
                >
                  <option value="Professor & Head">Professor & Head</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Senior Lecturer">Senior Lecturer</option>
                  <option value="Lab Instructor">Lab Instructor</option>
                </select>
              </div>

              <div>
                <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Official Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ramesh.gupta@oist.edu.in"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Assigned Sections</label>
                  <input
                    type="text"
                    value={assignedSections}
                    onChange={(e) => setAssignedSections(e.target.value)}
                    placeholder="CSE-3A, CSE-3B"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Weekly Hours</label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-sm btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-primary">
                  Save Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

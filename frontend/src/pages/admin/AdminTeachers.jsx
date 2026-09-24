import React from 'react';
import { teacherService } from '../../services/teacherService';
import { UserCheck, PlusCircle, Search } from 'lucide-react';

export default function AdminTeachers() {
  const teachers = teacherService.getDepartmentFaculty();

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Faculty & Staff Directory
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              University-wide faculty roster and workload assignments
            </p>
          </div>

          <button className="btn btn-primary" style={{ borderRadius: 'var(--radius-full)' }}>
            <PlusCircle size={16} />
            <span>Add Faculty Member</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '1rem' }} className="sm:grid-cols-2">
          {teachers.map((t) => (
            <div key={t.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>{t.name}</h3>
                  <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>{t.designation}</span>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t.email} • {t.facultyId}</p>
                </div>
                <span className="badge badge-emerald">{t.status}</span>
              </div>

              <div style={{ backgroundColor: 'var(--surface-low)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', fontSize: '12px' }}>
                <div><strong>Dept:</strong> {t.department}</div>
                <div><strong>Assigned Sections:</strong> {t.assignedSections.join(', ')}</div>
                <div><strong>Weekly Teaching Hours:</strong> {t.weeklyHours} hrs</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

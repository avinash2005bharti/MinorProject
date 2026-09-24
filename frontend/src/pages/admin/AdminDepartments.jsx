import React from 'react';
import { Building2, Users, UserCheck, ShieldCheck } from 'lucide-react';

export default function AdminDepartments() {
  const departments = [
    { code: 'CSE', name: 'Computer Science & Engineering', hod: 'Dr. S. Roy', facultyCount: 24, studentCount: 340, labsCount: 6 },
    { code: 'ECE', name: 'Electronics & Communication Engineering', hod: 'Dr. B. K. Das', facultyCount: 18, studentCount: 280, labsCount: 5 },
    { code: 'ME', name: 'Mechanical Engineering', hod: 'Dr. P. Chetia', facultyCount: 16, studentCount: 260, labsCount: 7 },
    { code: 'CE', name: 'Civil Engineering', hod: 'Dr. R. Brahma', facultyCount: 14, studentCount: 270, labsCount: 4 },
    { code: 'EE', name: 'Electrical Engineering', hod: 'Dr. M. Narzary', facultyCount: 12, studentCount: 270, labsCount: 4 }
  ];

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Academic Departments
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Institutional faculty departments & HOD assignments
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '1rem' }} className="sm:grid-cols-2">
          {departments.map((d) => (
            <div key={d.code} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 size={20} color="var(--primary)" />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{d.name}</h3>
                </div>
                <span className="badge badge-indigo">{d.code}</span>
              </div>

              <div style={{ backgroundColor: 'var(--surface-low)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-lg)', fontSize: '12px' }}>
                <div><strong>HOD:</strong> {d.hod}</div>
                <div style={{ marginTop: '2px', color: 'var(--text-secondary)' }}>
                  {d.facultyCount} Faculty • {d.studentCount} Students • {d.labsCount} Laboratories
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

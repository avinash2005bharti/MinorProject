import React, { useState } from 'react';
import { teacherService } from '../../services/teacherService';
import { UserCheck, BookOpen, Clock, Calendar, Search, ShieldCheck } from 'lucide-react';

export default function HodTeacherManagement() {
  const [facultyList] = useState(teacherService.getDepartmentFaculty());
  const [search, setSearch] = useState('');

  const filteredFaculty = facultyList.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.specialization.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Faculty & Teacher Management
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Department of Computer Science & Engineering • Workload & Section Allocations
            </p>
          </div>

          <span className="badge badge-emerald">
            <UserCheck size={14} />
            <span>{facultyList.length} Active Faculty Members</span>
          </span>
        </div>

        {/* Search */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search faculty by name, specialization, or courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ border: 'none', boxShadow: 'none', height: '36px' }}
          />
        </div>

        {/* Faculty Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '1rem' }} className="sm:grid-cols-2">
          {filteredFaculty.map((fac) => (
            <div key={fac.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {fac.name}
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>
                    {fac.designation}
                  </span>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {fac.email} • {fac.facultyId}
                  </p>
                </div>

                <span className="badge badge-emerald">{fac.status}</span>
              </div>

              <div style={{ backgroundColor: 'var(--surface-low)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-lg)', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>
                  Specialization
                </span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {fac.specialization}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '12px' }}>
                <div style={{ backgroundColor: 'var(--surface-low)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Assigned Sections</span>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {fac.assignedSections.join(', ')}
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--surface-low)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Weekly Workload</span>
                  <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    {fac.weeklyHours} hrs / week
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                <strong>Course Responsibility: </strong>{fac.attendanceResponsibility}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useERP } from '../../context/ERPContext';
import { Link } from 'react-router-dom';
import { BookOpen, Users, CheckSquare, Calendar, ArrowRight } from 'lucide-react';

export default function TeacherClasses() {
  const { currentUser, students } = useERP();

  const courses = [
    { code: 'CS301', name: 'Data Structures & Algorithms', section: 'CSE-3A', studentsCount: students.length, syllabusProgress: '68%', hoursPerWeek: 4, room: 'Room 204' },
    { code: 'CS306', name: 'Advanced Algorithms Lab', section: 'CSE-3A', studentsCount: students.length, syllabusProgress: '60%', hoursPerWeek: 3, room: 'Lab-3' },
    { code: 'CS301', name: 'Data Structures & Algorithms', section: 'CSE-3B', studentsCount: 40, syllabusProgress: '64%', hoursPerWeek: 4, room: 'Room 205' }
  ];

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
            My Assigned Classes & Cohorts
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Teaching courses, laboratory sessions, and active cohorts
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '1rem' }} className="sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course, idx) => (
            <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>
                    {course.code}
                  </span>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {course.name}
                  </h3>
                </div>
                <span className="badge badge-indigo">{course.section}</span>
              </div>

              <div style={{ backgroundColor: 'var(--surface-low)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-lg)', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Room / Venue</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{course.room}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Syllabus Completion</span>
                  <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>{course.syllabusProgress}</span>
                </div>
              </div>

              <Link to="/teacher/attendance" className="btn btn-sm btn-outline" style={{ width: '100%', justifyContent: 'space-between' }}>
                <span>Take Live Attendance</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

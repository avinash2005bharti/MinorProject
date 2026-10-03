import React from 'react';
import { useERP } from '../../context/ERPContext';
import { Link } from 'react-router-dom';
import { BookOpen, Users, CheckSquare, Calendar, ArrowRight, Clock } from 'lucide-react';

export default function TeacherClasses() {
  const { currentUser, students, timetable, dashboardData, subjects } = useERP();

  // Extract assigned courses from timetable slots
  const allSlots = [
    ...(timetable.Monday || []),
    ...(timetable.Tuesday || []),
    ...(timetable.Wednesday || []),
    ...(timetable.Thursday || []),
    ...(timetable.Friday || [])
  ];

  // Map unique courses
  const courseMap = {};
  allSlots.forEach((slot) => {
    const key = `${slot.subject}-${slot.room}`;
    if (!courseMap[key]) {
      courseMap[key] = {
        code: slot.code || 'CS',
        name: slot.subject,
        room: slot.room || 'Room not assigned',
        type: slot.type || 'Lecture',
        faculty: slot.faculty,
        timeSlots: []
      };
    }
    courseMap[key].timeSlots.push(slot.time);
  });

  const courseList = Object.values(courseMap);

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
            My Assigned Classes & Cohorts
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Teaching courses, laboratory sessions, and active classroom assignments
          </p>
        </div>

        {courseList.length === 0 ? (
          <div className="card text-center" style={{ padding: '3rem', color: 'var(--text-secondary)' }}>
            <BookOpen size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>No records found.</h3>
            <p style={{ fontSize: '13px', margin: '0.25rem 0 0' }}>
              No teaching classes or laboratory cohorts assigned in current timetable.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {courseList.map((course, idx) => (
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
                  <span className="badge badge-indigo">{course.type}</span>
                </div>

                <div style={{ backgroundColor: 'var(--surface-low)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-lg)', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Assigned Venue</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{course.room}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Weekly Sessions</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{course.timeSlots.length} periods/week</span>
                  </div>
                </div>

                <Link
                  to="/teacher/attendance"
                  className="btn btn-sm btn-outline"
                  style={{ width: '100%', justifyContent: 'space-between', textDecoration: 'none' }}
                >
                  <span>Take Live Attendance</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

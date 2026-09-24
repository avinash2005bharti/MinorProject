import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Sparkles } from 'lucide-react';

export default function TeacherTimetable() {
  const [selectedDay, setSelectedDay] = useState('Wednesday');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const schedule = {
    Monday: [
      { period: 1, time: '09:00 - 10:00', code: 'CS301', subject: 'Data Structures & Algorithms', section: 'CSE-3A', room: 'Room 204' },
      { period: 5, time: '02:15 - 04:15', code: 'CS306', subject: 'DSA Lab (Batch A1)', section: 'CSE-3A', room: 'Lab-3' }
    ],
    Tuesday: [
      { period: 2, time: '10:00 - 11:00', code: 'CS301', subject: 'Data Structures & Algorithms', section: 'CSE-3A', room: 'Room 204' }
    ],
    Wednesday: [
      { period: 2, time: '10:30 - 11:30', code: 'CS301', subject: 'Data Structures & Algorithms', section: 'CSE-3A', room: 'Room 204', isLive: true }
    ],
    Thursday: [
      { period: 3, time: '11:15 - 12:15', code: 'CS301', subject: 'Data Structures & Algorithms', section: 'CSE-3A', room: 'Room 204' }
    ],
    Friday: [
      { period: 2, time: '10:00 - 11:00', code: 'CS301', subject: 'Data Structures & Algorithms', section: 'CSE-3B', room: 'Room 205' }
    ]
  };

  const daySchedule = schedule[selectedDay] || [];

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Faculty Schedule & Timetable
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Dr. Rajesh Verma • 14 Teaching Hours / Week
            </p>
          </div>

          <span className="badge badge-emerald">
            <Sparkles size={14} /> Workload Balanced by AI
          </span>
        </div>

        {/* Day Pills */}
        <div style={{ display: 'flex', backgroundColor: 'var(--surface-high)', borderRadius: 'var(--radius-full)', padding: '4px', gap: '4px', overflowX: 'auto' }}>
          {days.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              style={{
                flex: 1,
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: selectedDay === day ? 700 : 500,
                backgroundColor: selectedDay === day ? '#FFFFFF' : 'transparent',
                color: selectedDay === day ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: selectedDay === day ? 'var(--shadow-sm)' : 'none'
              }}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Schedule */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {daySchedule.map((cls, idx) => (
            <div
              key={idx}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                gap: '1rem',
                backgroundColor: cls.isLive ? 'var(--primary-container)' : '#FFFFFF',
                borderColor: cls.isLive ? '#BFDBFE' : 'var(--border-subtle)',
                flexWrap: 'wrap'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>{cls.code}</span>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{cls.subject}</h4>
                  <span className="badge badge-indigo">{cls.section}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={13} /> {cls.time}</span>
                  <span>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={13} /> {cls.room}</span>
                </div>
              </div>

              {cls.isLive && (
                <span className="badge badge-emerald">
                  <span className="agent-pulse" style={{ width: '6px', height: '6px' }} />
                  Live Slot
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

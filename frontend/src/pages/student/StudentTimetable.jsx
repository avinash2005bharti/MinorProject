import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Calendar, Clock, MapPin, User, Sparkles } from 'lucide-react';

export default function StudentTimetable() {
  const { timetable, currentUser } = useERP();
  const [selectedDay, setSelectedDay] = useState('Wednesday');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const dayClasses = timetable[selectedDay] || [];

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Weekly Timetable
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Section {currentUser.section} • Semester {currentUser.semester} • OIST Academic Cloud
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              backgroundColor: 'var(--secondary-container)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--on-secondary-container)',
              fontSize: '11px',
              fontWeight: 600
            }}
          >
            <Sparkles size={14} />
            <span>AI Optimized Schedule</span>
          </div>
        </div>

        {/* Day Selector Pills */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--surface-high)',
            borderRadius: 'var(--radius-full)',
            padding: '4px',
            gap: '4px',
            overflowX: 'auto'
          }}
        >
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
                boxShadow: selectedDay === day ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Day Schedule Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {dayClasses.map((item, index) => {
            const isLab = item.type === 'Lab';
            const isLive = item.isLive;

            return (
              <div
                key={index}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  gap: '1rem',
                  backgroundColor: isLive ? 'var(--primary-container)' : '#FFFFFF',
                  borderColor: isLive ? '#BFDBFE' : 'var(--border-subtle)',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '240px', flex: 1 }}>
                  {/* Left indicator strip */}
                  <div
                    style={{
                      width: '4px',
                      height: '48px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: isLab ? 'var(--secondary)' : isLive ? 'var(--primary)' : 'var(--border-subtle)',
                      flexShrink: 0
                    }}
                  />

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>
                        {item.code}
                      </span>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.subject}
                      </h4>
                      {isLive && (
                        <span className="badge badge-indigo" style={{ fontSize: '10px' }}>
                          <span className="agent-pulse" style={{ width: '6px', height: '6px' }} />
                          Current Class
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={13} />
                        {item.time}
                      </span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={13} />
                        {item.room}
                      </span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <User size={13} />
                        {item.faculty}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    className={`badge ${isLab ? 'badge-emerald' : 'badge-slate'}`}
                    style={{ fontSize: '11px' }}
                  >
                    {item.type}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

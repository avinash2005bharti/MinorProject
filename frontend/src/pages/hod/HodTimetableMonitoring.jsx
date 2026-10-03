import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Activity, Clock, MapPin, User, CheckCircle2, Calendar } from 'lucide-react';

export default function HodTimetableMonitoring() {
  const { timetable } = useERP();

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const todayDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
  const defaultDay = daysOfWeek.includes(todayDayName) ? todayDayName : 'Monday';

  const [selectedDay, setSelectedDay] = useState(defaultDay);

  const daySlots = timetable[selectedDay] || [];

  // Group slots by Room
  const roomMap = {};
  daySlots.forEach((slot) => {
    const roomName = slot.room || 'Classroom';
    if (!roomMap[roomName]) {
      roomMap[roomName] = [];
    }
    roomMap[roomName].push(slot);
  });

  const roomsList = Object.keys(roomMap);

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Live Timetable & Room Monitoring
              </h1>
              <span className="agent-pulse" />
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Real-time classroom telemetry, live active periods, and faculty tracking from database timetable
            </p>
          </div>

          {/* Day Selector */}
          <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto' }}>
            {daysOfWeek.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className="btn btn-sm"
                style={{
                  backgroundColor: selectedDay === day ? 'var(--primary)' : '#FFFFFF',
                  color: selectedDay === day ? '#FFFFFF' : 'var(--text-secondary)',
                  border: selectedDay === day ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                  fontSize: '11px',
                  fontWeight: selectedDay === day ? 700 : 500,
                  boxShadow: selectedDay === day ? '0 2px 6px rgba(29, 78, 216, 0.2)' : 'none'
                }}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {roomsList.length === 0 ? (
          <div className="card text-center" style={{ padding: '3rem', color: 'var(--text-secondary)' }}>
            <Calendar size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>No records found.</h3>
            <p style={{ fontSize: '13px', margin: '0.25rem 0 0' }}>
              No classroom sessions scheduled in timetable database for {selectedDay}.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {roomsList.map((roomName) => {
              const sessions = roomMap[roomName] || [];
              const primarySession = sessions[0];

              return (
                <div key={roomName} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={18} color="var(--primary)" />
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {roomName}
                      </h3>
                    </div>
                    <span className="badge badge-indigo">
                      {sessions.length} Scheduled Sessions
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {sessions.map((s, idx) => (
                      <div
                        key={s.id || idx}
                        style={{
                          backgroundColor: 'var(--surface-low)',
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-lg)',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>
                            Period {s.period} ({s.time})
                          </span>
                          <span className="badge badge-slate" style={{ fontSize: '10px' }}>
                            {s.type || 'Lecture'}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                          {s.subject}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={12} />
                          <span>Faculty: <strong>{s.faculty}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

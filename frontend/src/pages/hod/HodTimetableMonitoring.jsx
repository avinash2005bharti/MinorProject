import React from 'react';
import { useERP } from '../../context/ERPContext';
import { Activity, Clock, MapPin, User, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function HodTimetableMonitoring() {
  const rooms = [
    { room: 'Room 204', capacity: 70, currentClass: 'Data Structures & Algorithms (CS301)', section: 'CSE-3A', faculty: 'Dr. Rajesh Verma', status: 'Active Lecture', occupancy: '92%' },
    { room: 'Room 205', capacity: 60, currentClass: 'Computer Networks (CS304)', section: 'CSE-3B', faculty: 'Prof. Amit K.', status: 'Active Lecture', occupancy: '88%' },
    { room: 'Room 302', capacity: 65, currentClass: 'Free Period / Study Hall', section: 'None', faculty: 'None', status: 'Vacant', occupancy: '0%' },
    { room: 'Lab-3 (Ground Floor)', capacity: 40, currentClass: 'Algorithms Practical (Batch A1)', section: 'CSE-3A', faculty: 'Dr. Rajesh Verma', status: 'Active Lab', occupancy: '100%' },
    { room: 'Seminar Hall B', capacity: 150, currentClass: 'Guest Lecture Prep', section: 'Open', faculty: 'Academic Cell', status: 'Reserved', occupancy: '25%' }
  ];

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Live Timetable & Room Monitoring
            </h1>
            <span className="agent-pulse" />
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Real-time classroom telemetry, live active periods, and faculty tracking
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '1rem' }} className="sm:grid-cols-2">
          {rooms.map((r, idx) => {
            const isActive = r.status.includes('Active');
            return (
              <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={18} color="var(--primary)" />
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {r.room}
                    </h3>
                  </div>
                  <span className={`badge ${isActive ? 'badge-emerald' : 'badge-slate'}`}>
                    {isActive && <span className="agent-pulse" style={{ width: '6px', height: '6px' }} />}
                    {r.status}
                  </span>
                </div>

                <div style={{ backgroundColor: 'var(--surface-low)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Current Session
                  </span>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {r.currentClass}
                  </div>
                  {r.section !== 'None' && (
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Section: {r.section} • Faculty: {r.faculty}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span>Capacity: {r.capacity} seats</span>
                  <span>Occupancy: <strong>{r.occupancy}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

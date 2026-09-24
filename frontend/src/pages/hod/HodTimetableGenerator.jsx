import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import TimetableConflict from '../../components/TimetableConflict';
import {
  Sparkles,
  Bot,
  Calendar,
  Clock,
  MapPin,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export default function HodTimetableGenerator() {
  const {
    timetable,
    timetableConflicts,
    isTimetableConflictResolved,
    generateTimetableAI,
    resolveTimetableConflictsAI
  } = useERP();

  // Generator form constraints
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [semester, setSemester] = useState('6th');
  const [sections, setSections] = useState('CSE-3A, CSE-3B');
  const [rooms, setRooms] = useState('Room 204, Room 205, Room 302, Lab-1, Lab-3');
  const [maxClassesPerDay, setMaxClassesPerDay] = useState(5);
  const [workingDays, setWorkingDays] = useState(5);

  const [selectedDay, setSelectedDay] = useState('Wednesday');
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const dayClasses = timetable[selectedDay] || [];

  const handleGenerate = (e) => {
    e.preventDefault();
    generateTimetableAI({
      department,
      semester,
      sections,
      rooms,
      maxClassesPerDay,
      workingDays
    });
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                AI Timetable Generator & Optimizer
              </h1>
              <span className="badge badge-indigo">
                <Sparkles size={13} />
                <span>Heuristic AI Engine</span>
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Autonomous multi-variable scheduling with collision detection and self-healing
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.85rem',
              backgroundColor: 'var(--secondary-container)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--on-secondary-container)',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            <Bot size={16} />
            <span>Timetable Agent: Ready</span>
          </div>
        </div>

        {/* Constraint Input Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Curriculum & Faculty Constraints Matrix
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Department of CSE
            </span>
          </div>

          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '0.75rem' }} className="sm:grid-cols-3">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Department</label>
                <input
                  type="text"
                  className="input-field"
                  value={department}
                  disabled
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Target Semester</label>
                <select
                  className="input-field"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                >
                  <option value="6th">6th Semester (Spring 2025)</option>
                  <option value="4th">4th Semester</option>
                  <option value="2nd">2nd Semester</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Sections Included</label>
                <input
                  type="text"
                  className="input-field"
                  value={sections}
                  onChange={(e) => setSections(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '0.75rem' }} className="sm:grid-cols-3">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Allocated Rooms & Labs</label>
                <input
                  type="text"
                  className="input-field"
                  value={rooms}
                  onChange={(e) => setRooms(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Max Classes / Day per Section</label>
                <input
                  type="number"
                  className="input-field"
                  value={maxClassesPerDay}
                  onChange={(e) => setMaxClassesPerDay(Number(e.target.value))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Active Working Days / Week</label>
                <input
                  type="number"
                  className="input-field"
                  value={workingDays}
                  onChange={(e) => setWorkingDays(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Active Constraints summary tags */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <span className="badge badge-slate">✓ No Teacher Double-Booking</span>
              <span className="badge badge-slate">✓ No Room Collisions</span>
              <span className="badge badge-slate">✓ Mandatory 30-min Midday Break</span>
              <span className="badge badge-slate">✓ Max 4h Faculty Load / Day</span>
              <span className="badge badge-slate">✓ Lab Specialization Match</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ borderRadius: 'var(--radius-xl)' }}
              >
                <Sparkles size={18} />
                <span>Generate Timetable with AI</span>
              </button>
            </div>
          </form>
        </div>

        {/* AI Conflict Detection & Autonomous Resolution Box */}
        <div>
          <TimetableConflict
            conflicts={timetableConflicts}
            onResolveAuto={resolveTimetableConflictsAI}
          />
        </div>

        {/* Generated Timetable Weekly Grid Preview */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Master Timetable Grid (Section CSE-3A)
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Status: {isTimetableConflictResolved ? '100% Conflict-Free & Published' : '2 Collisions Need Resolution'}
              </span>
            </div>

            {/* Day Selector */}
            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--surface-low)', padding: '3px', borderRadius: 'var(--radius-full)' }}>
              {days.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11px',
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
          </div>

          {/* Schedule Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {dayClasses.map((item, index) => {
              const isLab = item.type === 'Lab';
              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    backgroundColor: 'var(--surface-low)',
                    borderRadius: 'var(--radius-xl)',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: '220px', flex: 1 }}>
                    <div
                      style={{
                        width: '4px',
                        height: '42px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: isLab ? 'var(--secondary)' : 'var(--primary)'
                      }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>
                          {item.code}
                        </span>
                        <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {item.subject}
                        </h4>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                        {item.time} • {item.room} • {item.faculty}
                      </span>
                    </div>
                  </div>

                  <span className={`badge ${isLab ? 'badge-emerald' : 'badge-indigo'}`} style={{ fontSize: '11px' }}>
                    {item.type}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

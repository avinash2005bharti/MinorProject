import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { timetableApi } from '../../api/timetableApi';
import { Calendar, Clock, MapPin, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

export default function TeacherTimetable() {
  const { currentUser } = useERP();
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const fetchTimetable = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await timetableApi.getTimetable();
      let allSlots = [];
      if (Array.isArray(res?.slots)) {
        allSlots = res.slots;
      } else if (Array.isArray(res?.timetable)) {
        allSlots = res.timetable;
      } else if (res?.timetable && typeof res.timetable === 'object') {
        allSlots = Object.values(res.timetable).flat();
      }

      // Filter by logged-in teacher's name if present, or show department slots
      const teacherName = currentUser?.name ? currentUser.name.replace(/dr\.|prof\./gi, '').trim().toLowerCase() : '';
      const filtered = teacherName
        ? allSlots.filter((s) => s?.faculty?.toLowerCase().includes(teacherName) || s?.teacherName?.toLowerCase().includes(teacherName))
        : allSlots;
      setSlots(filtered.length > 0 ? filtered : allSlots);
    } catch (err) {
      setError(err.message || 'Unable to load teacher schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [currentUser]);

  const subjectNameMap = {
    'CS501': 'Database Management Systems',
    'CS502': 'Operating Systems',
    'CS503': 'Computer Networks',
    'CS504': 'Theory of Computation',
    'CS505': 'Database & OS Lab',
    'CS506': 'Computer Networks Lab',
    'CS301': 'Data Structures & Algorithms',
    'CS302': 'Digital Electronics',
    'CS303': 'Discrete Mathematics',
    'CS304': 'Object Oriented Programming (Java)',
    'CS305': 'Data Structures Lab',
    'CS401': 'Analysis & Design of Algorithms',
    'CS402': 'Software Engineering',
    'CS403': 'Computer Organization & Architecture',
    'CS404': 'Analog & Digital Communication',
    'CS405': 'Algorithms Lab',
    'CS601': 'Compiler Design',
    'CS602': 'Web Development & Frameworks',
    'CS603': 'Cloud Computing',
    'CS604': 'Cyber Security',
    'CS701': 'Artificial Intelligence & Machine Learning',
    'CS702': 'Big Data Analytics',
    'CS703': 'Internet of Things (IoT)',
    'CS704': 'Major Project Phase-I',
    'CS801': 'Deep Learning & Neural Networks',
    'CS802': 'Distributed Systems',
    'CS803': 'Major Project Phase-II'
  };

  const resolveSubjectName = (sub) => {
    if (!sub) return 'Scheduled Lecture';
    const clean = String(sub).trim();
    if (subjectNameMap[clean.toUpperCase()]) {
      return `${subjectNameMap[clean.toUpperCase()]} (${clean.toUpperCase()})`;
    }
    return clean;
  };

  const daySchedule = Array.isArray(slots) ? slots.filter((s) => s && s.day === selectedDay) : [];

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Faculty Schedule & Timetable
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {currentUser.name || 'Faculty Member'} • Relational Workload Ledger
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={fetchTimetable}
              disabled={loading}
              className="btn btn-outline text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <span className="badge badge-emerald">
              <Sparkles size={14} /> Synced with PostgreSQL
            </span>
          </div>
        </div>

        {/* Loading / Error states */}
        {loading && (
          <div className="p-8 text-center text-slate-500 card flex flex-col items-center justify-center gap-2">
            <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }} />
            <span className="text-xs font-semibold">Loading Teaching Schedule from Database...</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={fetchTimetable} className="btn btn-sm btn-primary text-xs">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Day Pills */}
            <div style={{ display: 'flex', backgroundColor: '#F1F5F9', borderRadius: '9999px', padding: '4px', gap: '4px', overflowX: 'auto' }}>
              {days.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  style={{
                    flex: 1,
                    padding: '0.5rem 1rem',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: selectedDay === day ? 700 : 500,
                    backgroundColor: selectedDay === day ? '#FFFFFF' : 'transparent',
                    color: selectedDay === day ? '#1D4ED8' : '#64748B',
                    boxShadow: selectedDay === day ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Schedule */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {daySchedule.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs card bg-slate-50">
                  No timetable available
                </div>
              ) : (
                daySchedule.map((cls, idx) => (
                  <div
                    key={idx}
                    className="card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem',
                      gap: '1rem',
                      backgroundColor: '#FFFFFF',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB' }}>
                          Period {cls.period}
                        </span>
                        <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                          {resolveSubjectName(cls.subject)}
                        </h4>
                        <span className="badge badge-indigo">Sec {cls.section}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '4px', fontSize: '12px', color: '#64748B' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={13} /> {cls.start_time} - {cls.end_time}
                        </span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MapPin size={13} /> {cls.room}
                        </span>
                      </div>
                    </div>

                    <span className="badge badge-emerald">
                      {cls.type || 'Lecture'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

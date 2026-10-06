import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { timetableApi } from '../../api/timetableApi';
import { Calendar, Clock, MapPin, User, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

export default function StudentTimetable() {
  const { currentUser } = useERP();
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const fetchTimetable = async () => {
    setLoading(true);
    setError(null);
    try {
      const section = typeof currentUser?.section === 'object' && currentUser?.section !== null ? (currentUser.section.name || 'A') : (currentUser?.section || 'A');
      const semester = currentUser?.semester || 5;
      const year = currentUser?.year || '3rd Year';

      const res = await timetableApi.getTimetable({ section, semester, year });
      let flatSlots = [];
      if (Array.isArray(res?.slots)) {
        flatSlots = res.slots;
      } else if (Array.isArray(res?.timetable)) {
        flatSlots = res.timetable;
      } else if (res?.timetable && typeof res.timetable === 'object') {
        flatSlots = Object.values(res.timetable).flat();
      }
      setTimetableSlots(flatSlots);
    } catch (err) {
      setError(err.message || 'Unable to load timetable records.');
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

  const dayClasses = Array.isArray(timetableSlots)
    ? timetableSlots.filter((s) => s && s.day === selectedDay)
    : [];

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Weekly Academic Timetable
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Section {typeof currentUser?.section === 'object' && currentUser?.section !== null ? (currentUser.section.name || 'A') : (currentUser?.section || 'A')} • Semester {currentUser?.semester || 5} • Relational Schedule Ledger
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
              <span>AI Synced</span>
            </div>
          </div>
        </div>

        {/* Loading / Error states */}
        {loading && (
          <div className="p-8 text-center text-slate-500 card flex flex-col items-center justify-center gap-2">
            <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }} />
            <span className="text-xs font-semibold">Loading Section Schedule from Database...</span>
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
            {/* Day Selector Pills */}
            <div
              style={{
                display: 'flex',
                backgroundColor: '#F1F5F9',
                borderRadius: '9999px',
                padding: '4px',
                gap: '4px',
                overflowX: 'auto'
              }}
            >
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

            {/* Day Schedule Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {dayClasses.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs card bg-slate-50">
                  No timetable available
                </div>
              ) : (
                dayClasses.map((item, index) => {
                  const isLab = item.type === 'Lab';
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
                        backgroundColor: '#FFFFFF',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '240px', flex: 1 }}>
                        <div
                          style={{
                            width: '4px',
                            height: '48px',
                            borderRadius: '9999px',
                            backgroundColor: isLab ? '#4F46E5' : '#2563EB',
                            flexShrink: 0
                          }}
                        />

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB' }}>
                              Period {item.period}
                            </span>
                            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                              {resolveSubjectName(item.subject)}
                            </h4>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '4px', fontSize: '12px', color: '#64748B' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock size={13} />
                              {item.start_time} - {item.end_time}
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

                      <span className={`badge ${isLab ? 'badge-indigo' : 'badge-emerald'}`}>
                        {item.type || 'Lecture'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

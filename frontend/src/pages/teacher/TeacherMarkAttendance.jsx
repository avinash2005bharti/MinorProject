import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Check,
  X,
  Lock,
  Save,
  RotateCcw,
  Sparkles,
  Bot
} from 'lucide-react';

export default function TeacherMarkAttendance() {
  const {
    currentUser,
    students,
    markStudentAttendance,
    markAllStudentsPresent,
    submitTeacherAttendanceRollCall
  } = useERP();

  const [unsavedChanges, setUnsavedChanges] = useState(0);

  const presentCount = students.filter((s) => s.status === 'present').length;
  const absentCount = students.filter((s) => s.status === 'absent').length;

  const handleToggle = (studentId, newStatus) => {
    markStudentAttendance(studentId, newStatus);
    setUnsavedChanges((prev) => prev + 1);
  };

  const handleMarkAll = () => {
    markAllStudentsPresent();
    setUnsavedChanges((prev) => prev + 1);
  };

  const handleSubmit = () => {
    submitTeacherAttendanceRollCall({
      subject: 'Data Structures & Algorithms (CS301)',
      section: 'CSE-3A',
      period: 'Period 2'
    });
    setUnsavedChanges(0);
  };

  return (
    <div className="page-wrapper" style={{ paddingBottom: '7rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Session Header Card (Matching Stitch teacher_attendance_marking) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-fixed)',
                  color: 'var(--on-primary-fixed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <BookOpen size={16} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)' }}>
                {currentUser.name} • Dept. of CSE
              </span>
            </div>

            <span className="badge badge-emerald">
              <span className="agent-pulse" style={{ width: '6px', height: '6px' }} />
              Live Session
            </span>
          </div>

          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Mark Attendance Roll Call
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Section CSE 3A • Data Structures & Algorithms (CS301)
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--surface-low)',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-lg)',
              fontSize: '12px',
              color: 'var(--text-primary)'
            }}
          >
            <Clock size={16} color="var(--primary)" />
            <span>Today, 30 Mar • Period 2 (10:30 AM - 11:30 AM) • Room 204</span>
          </div>
        </div>

        {/* Realtime Tally Banner (Matching Stitch) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Live Roll Call Status
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--secondary)', fontWeight: 600 }}>
              <span className="agent-pulse" style={{ width: '6px', height: '6px' }} />
              Ready to sync
            </span>
          </div>

          {/* 3 Metric Blocks */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
            <div style={{ backgroundColor: 'var(--surface-low)', padding: '0.65rem', borderRadius: 'var(--radius-lg)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Enrolled</span>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {students.length}
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--secondary-container)', padding: '0.65rem', borderRadius: 'var(--radius-lg)' }}>
              <span style={{ fontSize: '11px', color: 'var(--on-secondary-container)', fontWeight: 600 }}>Present</span>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800, color: 'var(--secondary)' }}>
                {presentCount}
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--error-container)', padding: '0.65rem', borderRadius: 'var(--radius-lg)' }}>
              <span style={{ fontSize: '11px', color: 'var(--on-error-container)', fontWeight: 600 }}>Absent</span>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800, color: 'var(--error)' }}>
                {absentCount}
              </div>
            </div>
          </div>

          {/* Shortcuts Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.25rem' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Toggle status pills for individual students
            </span>

            <button
              onClick={handleMarkAll}
              className="btn btn-sm btn-primary"
              style={{ borderRadius: 'var(--radius-full)', padding: '0.35rem 0.85rem' }}
            >
              <CheckCircle2 size={14} />
              <span>Mark All Present</span>
            </button>
          </div>
        </div>

        {/* Student Roll List (Roster matching Stitch) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.25rem' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Enrolled Students (CSE-3A Roster)
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Sorted by Roll Number
            </span>
          </div>

          {students.map((st) => {
            const isPresent = st.status === 'present';

            return (
              <div
                key={st.id}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  gap: '0.75rem',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '220px', flex: 1 }}>
                  {/* Avatar Ring */}
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: isPresent ? 'var(--secondary-container)' : 'var(--error-container)',
                      color: isPresent ? 'var(--on-secondary-container)' : 'var(--on-error-container)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '13px',
                      flexShrink: 0
                    }}
                  >
                    {st.name.split(' ').map((n) => n[0]).join('')}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {st.name}
                      </h4>
                      {st.autoUpdated && (
                        <span className="badge badge-indigo" style={{ fontSize: '10px' }}>
                          <Bot size={11} /> Auto-Credited by Agent
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Roll: {st.rollNo} • Current: {st.attendance}%
                    </span>
                  </div>
                </div>

                {/* Toggle Present / Absent Buttons (Matching Stitch) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'var(--surface-low)',
                    padding: '3px',
                    borderRadius: 'var(--radius-xl)',
                    gap: '4px'
                  }}
                >
                  <button
                    onClick={() => handleToggle(st.id, 'present')}
                    style={{
                      minWidth: '68px',
                      height: '38px',
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: 700,
                      backgroundColor: isPresent ? 'var(--secondary)' : 'transparent',
                      color: isPresent ? '#FFFFFF' : 'var(--text-secondary)',
                      boxShadow: isPresent ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Check size={14} strokeWidth={3} />
                    <span>Pres</span>
                  </button>

                  <button
                    onClick={() => handleToggle(st.id, 'absent')}
                    style={{
                      minWidth: '68px',
                      height: '38px',
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: 700,
                      backgroundColor: !isPresent ? 'var(--error)' : 'transparent',
                      color: !isPresent ? '#FFFFFF' : 'var(--text-secondary)',
                      boxShadow: !isPresent ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <X size={14} strokeWidth={3} />
                    <span>Abs</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Sticky Action Bar (Matching Stitch teacher_attendance_marking) */}
        <div
          style={{
            position: 'fixed',
            bottom: '72px',
            left: 0,
            right: 0,
            padding: '0 1rem',
            zIndex: 45,
            pointerEvents: 'none'
          }}
        >
          <div
            style={{
              maxWidth: '560px',
              margin: '0 auto',
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(12px)',
              borderRadius: 'var(--radius-2xl)',
              padding: '0.85rem 1rem',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              pointerEvents: 'auto'
            }}
          >
            <button
              onClick={handleSubmit}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', borderRadius: 'var(--radius-xl)' }}
            >
              <Lock size={18} />
              <span>Submit & Lock Attendance ({presentCount} Present)</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', padding: '0 0.25rem' }}>
              <span>Unsaved changes: <strong style={{ color: 'var(--primary)' }}>{unsavedChanges}</strong></span>
              <span>OIST Central Synchronizer Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

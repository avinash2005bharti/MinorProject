import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { studentApi } from '../../api/studentApi';
import { academicApi } from '../../api/academicApi';
import { attendanceApi } from '../../api/attendanceApi';
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
  QrCode,
  AlertCircle,
  RefreshCw,
  Users
} from 'lucide-react';

export default function TeacherMarkAttendance() {
  const { currentUser, addToast } = useERP();

  // Session Selector States
  const [section, setSection] = useState('A');
  const [period, setPeriod] = useState(1);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [subjectId, setSubjectId] = useState('');
  const [subjectsList, setSubjectsList] = useState([]);
  const [students, setStudents] = useState([]);
  const [statuses, setStatuses] = useState({}); // { studentId: 'Present' | 'Absent' | 'Late' }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qrSession, setQrSession] = useState(null);
  const [generatingQr, setGeneratingQr] = useState(false);
  const [error, setError] = useState(null);

  // 1. Fetch Subjects and Students
  useEffect(() => {
    let isMounted = true;
    const loadSubjects = async () => {
      try {
        const res = await academicApi.getSubjects();
        if (isMounted && res?.subjects) {
          setSubjectsList(res.subjects);
          if (res.subjects.length > 0) {
            setSubjectId(res.subjects[0].id);
          }
        }
      } catch (err) {
        console.warn('Failed to load subjects:', err.message);
      }
    };
    loadSubjects();
    return () => { isMounted = false; };
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentApi.getStudents({ section, limit: 100 });
      const list = res?.students || [];
      setStudents(list);

      // Initialize statuses to 'Present' by default
      const initialMap = {};
      list.forEach((st) => {
        initialMap[st.id] = 'Present';
      });
      setStatuses(initialMap);
    } catch (err) {
      setError(err.message || 'Unable to load student roll call list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [section]);

  const toggleStatus = (id, newStatus) => {
    setStatuses((prev) => ({ ...prev, [id]: newStatus }));
  };

  const handleMarkAllPresent = () => {
    const updated = {};
    students.forEach((st) => {
      updated[st.id] = 'Present';
    });
    setStatuses(updated);
    addToast('Marked All Present', 'All students set to Present.', 'info');
  };

  const handleSubmitRollCall = async (e) => {
    e.preventDefault();
    if (!subjectId) {
      addToast('Subject Required', 'Please select a subject.', 'warning');
      return;
    }

    setSaving(true);
    const records = students.map((st) => ({
      studentId: st.id,
      status: statuses[st.id] || 'Present'
    }));

    try {
      await attendanceApi.bulkMarkAttendance({
        subjectId: Number(subjectId),
        date,
        period: Number(period),
        section,
        records
      });

      addToast('Attendance Saved', `Roll call recorded for ${students.length} students in Section ${section}.`, 'success');
    } catch (err) {
      addToast('Save Failed', err.message || 'Error recording attendance.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateQr = async () => {
    if (!subjectId) return;
    setGeneratingQr(true);
    try {
      const res = await attendanceApi.generateQrSession({
        subjectId: Number(subjectId),
        section,
        date,
        period: Number(period)
      });
      setQrSession(res.session);
      addToast('QR Session Active', 'Dynamic QR session generated for student portal scanning.', 'success');
    } catch (err) {
      addToast('QR Error', err.message || 'Failed to generate QR session.', 'error');
    } finally {
      setGeneratingQr(false);
    }
  };

  const presentCount = Object.values(statuses).filter((s) => s === 'Present').length;
  const absentCount = Object.values(statuses).filter((s) => s === 'Absent').length;

  return (
    <div className="page-wrapper" style={{ paddingBottom: '5rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Header */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <BookOpen size={16} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#2563EB' }}>
                {currentUser.name || 'Faculty Member'} • Dept. of CSE
              </span>
            </div>

            <span className="badge badge-emerald">
              <span className="agent-pulse" style={{ width: '6px', height: '6px' }} />
              Live Relational Attendance
            </span>
          </div>

          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Mark Attendance Roll Call
            </h1>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px', marginBottom: 0 }}>
              Record attendance directly into PostgreSQL database records.
            </p>
          </div>

          {/* Session Parameters Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
            <div>
              <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Section</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="input-field"
                style={{ marginBottom: 0 }}
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Subject / Course</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="input-field"
                style={{ marginBottom: 0 }}
              >
                {subjectsList.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code}: {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-field"
                style={{ marginBottom: 0 }}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Period / Slot</label>
              <select
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
                className="input-field"
                style={{ marginBottom: 0 }}
              >
                <option value={1}>Period 1 (09:30 AM - 10:30 AM)</option>
                <option value={2}>Period 2 (10:30 AM - 11:30 AM)</option>
                <option value={3}>Period 3 (11:45 AM - 12:45 PM)</option>
                <option value={4}>Period 4 (01:30 PM - 02:30 PM)</option>
                <option value={5}>Period 5 (02:30 PM - 03:30 PM)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Live Roll Call Tally Banner */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Roll Call Counter (Section {section})
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="btn btn-sm btn-outline text-xs py-1 px-2.5"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={handleGenerateQr}
                disabled={generatingQr}
                className="btn btn-sm btn-primary text-xs py-1 px-2.5 flex items-center gap-1"
              >
                <QrCode size={13} />
                <span>{generatingQr ? 'Generating...' : 'Launch QR Code'}</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
            <div style={{ backgroundColor: '#F8FAFC', padding: '0.65rem', borderRadius: '12px' }}>
              <span style={{ fontSize: '11px', color: '#64748B' }}>Total Enrolled</span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A' }}>
                {students.length}
              </div>
            </div>

            <div style={{ backgroundColor: '#ECFDF5', padding: '0.65rem', borderRadius: '12px' }}>
              <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>Present</span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#059669' }}>
                {presentCount}
              </div>
            </div>

            <div style={{ backgroundColor: '#FFF1F2', padding: '0.65rem', borderRadius: '12px' }}>
              <span style={{ fontSize: '11px', color: '#E11D48', fontWeight: 600 }}>Absent</span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#E11D48' }}>
                {absentCount}
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Active Display Banner */}
        {qrSession && (
          <div className="card p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white rounded-xl shadow-xs">
                <QrCode size={36} className="text-indigo-600" />
              </div>
              <div>
                <span className="badge badge-indigo text-xs">Active QR Session</span>
                <h4 className="font-bold text-indigo-950 text-sm mt-0.5">Session ID: {qrSession.session_id}</h4>
                <p className="text-[11px] text-indigo-700">Expires at: {new Date(qrSession.expires_at).toLocaleTimeString()}</p>
              </div>
            </div>
            <button
              onClick={() => setQrSession(null)}
              className="btn btn-sm btn-outline text-xs"
            >
              Close QR Session
            </button>
          </div>
        )}

        {/* Loading / Error states */}
        {loading && (
          <div className="p-8 text-center text-slate-500 card flex flex-col items-center justify-center gap-2">
            <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }} />
            <span className="text-xs font-semibold">Loading Section {section} Students...</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={loadStudents} className="btn btn-sm btn-primary text-xs">
              Try Again
            </button>
          </div>
        )}

        {/* Students Roll Call List */}
        {!loading && !error && (
          <div className="card">
            {students.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No students enrolled in Section {section}.
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100">
                {students.map((st) => {
                  const currentStatus = statuses[st.id] || 'Present';
                  return (
                    <div key={st.id} className="py-3 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                          {st.name?.slice(0, 2).toUpperCase() || 'ST'}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">{st.name}</div>
                          <div className="text-[11px] font-mono text-slate-500">{st.enrollment_no}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleStatus(st.id, 'Present')}
                          className={`btn btn-sm ${currentStatus === 'Present' ? 'btn-success' : 'btn-outline'} text-xs py-1 px-3`}
                        >
                          <Check size={13} />
                          <span>Present</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleStatus(st.id, 'Absent')}
                          className={`btn btn-sm ${currentStatus === 'Absent' ? 'btn-danger' : 'btn-outline'} text-xs py-1 px-3`}
                        >
                          <X size={13} />
                          <span>Absent</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Bottom Save Action Bar */}
        {!loading && students.length > 0 && (
          <div
            style={{
              position: 'fixed',
              bottom: '1.5rem',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 50,
              backgroundColor: '#FFFFFF',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
              padding: '0.85rem 1.5rem',
              borderRadius: '9999px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem'
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
              <span>{presentCount} Present</span>
              <span style={{ margin: '0 0.5rem', color: '#CBD5E1' }}>•</span>
              <span style={{ color: '#E11D48' }}>{absentCount} Absent</span>
            </div>

            <button
              type="button"
              onClick={handleSubmitRollCall}
              disabled={saving}
              className="btn btn-primary"
              style={{
                borderRadius: '9999px',
                padding: '0.6rem 1.25rem',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              id="btn-save-roll-call"
            >
              <Save size={15} />
              <span>{saving ? 'Saving to Database...' : 'Save & Sync Roll Call'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

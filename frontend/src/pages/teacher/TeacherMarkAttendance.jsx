import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { studentApi } from '../../api/studentApi';
import { academicApi } from '../../api/academicApi';
import { attendanceApi } from '../../api/attendanceApi';
import { PageHeader, Card, Badge, Button, EmptyState } from '../../components/common';
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
    <div className="page-wrapper" style={{ paddingBottom: '6rem' }}>
      <div className="flex flex-col gap-5">
        {/* Header */}
        <PageHeader
          title="Mark Attendance Roll Call"
          description={`Record live class session attendance directly into relational PostgreSQL database records.`}
          badge={<Badge variant="primary" size="sm" dot pulse>Live Session</Badge>}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllPresent}
              >
                Mark All Present
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerateQr}
                disabled={generatingQr}
                loading={generatingQr}
                leftIcon={<QrCode size={14} />}
              >
                Launch QR Code
              </Button>
            </div>
          }
        />

        {/* Session Parameters Selector Card */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={16} className="text-primary-600" />
            <h3 className="text-sm font-bold text-slate-900 m-0">Session Parameters</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="form-label text-xs font-bold text-slate-700 mb-1 block">Section</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="input-field mb-0 text-xs"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>

            <div>
              <label className="form-label text-xs font-bold text-slate-700 mb-1 block">Subject / Course</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="input-field mb-0 text-xs"
              >
                {subjectsList.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code}: {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label text-xs font-bold text-slate-700 mb-1 block">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-field mb-0 text-xs"
              />
            </div>

            <div>
              <label className="form-label text-xs font-bold text-slate-700 mb-1 block">Period / Slot</label>
              <select
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
                className="input-field mb-0 text-xs"
              >
                <option value={1}>Period 1 (09:30 AM - 10:30 AM)</option>
                <option value={2}>Period 2 (10:30 AM - 11:30 AM)</option>
                <option value={3}>Period 3 (11:45 AM - 12:45 PM)</option>
                <option value={4}>Period 4 (01:30 PM - 02:30 PM)</option>
                <option value={5}>Period 5 (02:30 PM - 03:30 PM)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Live Roll Call Tally Banner */}
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Roll Call Counter (Section {section})
            </span>
            <Badge variant="neutral" size="xs">
              Period {period}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 block mb-0.5">Total Enrolled</span>
              <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                {students.length}
              </div>
            </div>

            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
              <span className="text-xs text-emerald-700 font-semibold block mb-0.5">Present</span>
              <div className="text-2xl font-extrabold text-emerald-700 tabular-nums">
                {presentCount}
              </div>
            </div>

            <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
              <span className="text-xs text-rose-700 font-semibold block mb-0.5">Absent</span>
              <div className="text-2xl font-extrabold text-rose-700 tabular-nums">
                {absentCount}
              </div>
            </div>
          </div>
        </Card>

        {/* QR Code Active Display Banner */}
        {qrSession && (
          <div className="card p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white rounded-xl shadow-xs border border-indigo-100">
                <QrCode size={36} className="text-primary-600" />
              </div>
              <div>
                <Badge variant="purple" size="xs">Active QR Session</Badge>
                <h4 className="font-bold text-indigo-950 text-sm mt-1 mb-0">Session ID: {qrSession.session_id}</h4>
                <p className="text-xs text-indigo-700 m-0">Expires at: {new Date(qrSession.expires_at).toLocaleTimeString()}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQrSession(null)}
            >
              Close QR Session
            </Button>
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
          <div className="p-4 rounded-2xl bg-danger-50 border border-danger-200 text-danger-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-danger-600 shrink-0" />
              <span>{error}</span>
            </div>
            <Button variant="primary" size="sm" onClick={loadStudents}>
              Try Again
            </Button>
          </div>
        )}

        {/* Students Roll Call List */}
        {!loading && !error && (
          <Card>
            {students.length === 0 ? (
              <EmptyState
                icon={<Users size={36} className="text-slate-400" />}
                title="No Students Found"
                description={`No students enrolled in Section ${section}.`}
              />
            ) : (
              <div className="flex flex-col divide-y divide-slate-100">
                {students.map((st) => {
                  const currentStatus = statuses[st.id] || 'Present';
                  return (
                    <div key={st.id} className="py-3 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-800 font-bold flex items-center justify-center text-xs">
                          {st.name?.slice(0, 2).toUpperCase() || 'ST'}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">{st.name}</div>
                          <div className="text-[11px] font-mono text-slate-500">{st.enrollment_no}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant={currentStatus === 'Present' ? 'success' : 'outline'}
                          size="xs"
                          onClick={() => toggleStatus(st.id, 'Present')}
                          leftIcon={<Check size={13} />}
                        >
                          Present
                        </Button>

                        <Button
                          variant={currentStatus === 'Absent' ? 'danger' : 'outline'}
                          size="xs"
                          onClick={() => toggleStatus(st.id, 'Absent')}
                          leftIcon={<X size={13} />}
                        >
                          Absent
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* Bottom Floating Save Action Bar */}
        {!loading && students.length > 0 && (
          <div
            style={{
              position: 'fixed',
              bottom: '1.5rem',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 50,
              backgroundColor: 'var(--surface)',
              boxShadow: 'var(--shadow-xl)',
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem'
            }}
          >
            <div className="text-xs font-semibold text-slate-900 flex items-center gap-2">
              <span className="text-emerald-700 font-bold tabular-nums">{presentCount} Present</span>
              <span className="text-slate-300">•</span>
              <span className="text-rose-700 font-bold tabular-nums">{absentCount} Absent</span>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmitRollCall}
              disabled={saving}
              loading={saving}
              leftIcon={<Save size={15} />}
              id="btn-save-roll-call"
            >
              Save & Sync Roll Call
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

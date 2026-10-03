import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { studentApi } from '../../api/studentApi';
import {
  Users,
  Search,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  Filter,
  RefreshCw,
  AlertCircle,
  PlusCircle,
  Trash2,
  Mail,
  Phone,
  GraduationCap,
  X
} from 'lucide-react';

export default function HodStudents() {
  const { addToast, sections: ctxSections } = useERP();
  const [studentsList, setStudentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [deletingId, setDeletingId] = useState(null);

  // Enroll Student Modal State
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [semester, setSemester] = useState('5');
  const [section, setSection] = useState('A');
  const [admissionYear, setAdmissionYear] = useState('2023');
  const [status, setStatus] = useState('ACTIVE');

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentApi.getStudents({ limit: 150 });
      if (res?.students) {
        setStudentsList(res.students);
      }
    } catch (err) {
      setError(err.message || 'Unable to load students from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = studentsList.filter((st) => {
    const sName = (st.name || `${st.firstName || ''} ${st.lastName || ''}`).toLowerCase();
    const sRoll = (st.enrollmentNo || st.enrollment_no || st.rollNo || '').toLowerCase();
    const sEmail = (st.email || '').toLowerCase();
    const q = search.toLowerCase();
    const matchesSearch = sName.includes(q) || sRoll.includes(q) || sEmail.includes(q);

    const secName = st.sectionName || st.section?.name || st.section;
    const matchesSection = selectedSection === 'ALL' || secName === selectedSection;
    return matchesSearch && matchesSection;
  });

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    if (!name.trim() || !rollNo.trim() || !email.trim()) {
      addToast('Validation Error', 'Name, email, and enrollment number are required.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await studentApi.createStudent({
        enrollmentNo: rollNo.trim().toUpperCase(),
        enrollment_no: rollNo.trim().toUpperCase(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        semester: parseInt(semester, 10) || 5,
        section: section.trim().toUpperCase(),
        sectionName: section.trim().toUpperCase(),
        admissionYear: parseInt(admissionYear, 10) || 2023,
        status: status || 'ACTIVE'
      });

      addToast('Student Enrolled', `${name} (${rollNo.toUpperCase()}) added to department roster.`, 'success');
      setIsEnrollModalOpen(false);
      setName('');
      setRollNo('');
      setEmail('');
      setPhone('');
      setSemester('5');
      setSection('A');
      setAdmissionYear('2023');
      setStatus('ACTIVE');

      fetchStudents();
    } catch (err) {
      addToast('Enrollment Error', err.message || 'Unable to enroll student.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to permanently remove student ${studentName || ''}? All attendance and enrollment records will be cleared.`)) {
      return;
    }

    setDeletingId(studentId);
    try {
      await studentApi.deleteStudent(studentId);
      addToast('Student Deleted', `${studentName || 'Student'} successfully removed.`, 'info');
      setStudentsList((prev) => prev.filter((s) => s.id !== studentId));
    } catch (err) {
      addToast('Delete Failed', err.message || 'Could not delete student record.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Department Student Directory
              </h1>
              <span className="badge badge-indigo">
                {studentsList.length} Enrolled
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Official student roster and section allocations under HOD supervision
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchStudents}
              disabled={loading}
              className="btn btn-outline text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setIsEnrollModalOpen(true)}
              className="btn btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
              id="btn-hod-enroll-student"
            >
              <PlusCircle size={15} />
              <span>Enroll New Student</span>
            </button>
          </div>
        </div>

        {/* Loading / Error states */}
        {loading && (
          <div className="p-8 text-center text-slate-500 card flex flex-col items-center justify-center gap-2">
            <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }} />
            <span className="text-xs font-semibold">Loading Student Records from Relational Database...</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={fetchStudents} className="btn btn-sm btn-primary text-xs">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Search & Section Filter Bar */}
            <div className="card flex items-center justify-between gap-3 py-2.5 flex-wrap">
              <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
                <Search size={18} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search student by name, email, or enrollment number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-xs outline-none bg-transparent"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-bold">Section:</span>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="input-field text-xs py-1 px-2.5"
                  style={{ width: 'auto', marginBottom: 0 }}
                >
                  <option value="ALL">All Sections</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>
            </div>

            {/* Student Cards Grid */}
            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs card">
                No students found matching current filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredStudents.map((st) => {
                  const displayName = st.name || `${st.firstName || ''} ${st.lastName || ''}`.trim() || 'Student';
                  const roll = st.enrollmentNo || st.enrollment_no || st.rollNo || 'N/A';
                  const secName = st.sectionName || st.section?.name || st.section || 'A';
                  const sem = st.semester || 5;
                  const isDeleting = deletingId === st.id;

                  return (
                    <div key={st.id} className="card flex flex-col justify-between gap-3 p-4">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 font-extrabold flex items-center justify-center text-sm shrink-0">
                              {displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">{displayName}</h4>
                              <span className="text-[11px] font-mono text-slate-500 font-semibold">{roll}</span>
                            </div>
                          </div>

                          <span className={`badge ${st.status === 'ACTIVE' || st.status === 'Active' ? 'badge-emerald' : 'badge-amber'} text-xs`}>
                            {st.status || 'Active'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Academic Class</span>
                            <span className="text-xs font-bold text-slate-800">Batch {st.admissionYear || '2023'} • Sec {secName}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Semester</span>
                            <span className="text-xs font-bold text-blue-600">Semester {sem}</span>
                          </div>
                        </div>

                        <div className="mt-2 text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                          <Mail size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{st.email}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <span className="font-semibold text-slate-600 flex items-center gap-1">
                          {st.phone ? (
                            <>
                              <Phone size={11} className="text-slate-400" />
                              <span>{st.phone}</span>
                            </>
                          ) : (
                            <span>No phone</span>
                          )}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleDeleteStudent(st.id, displayName)}
                          disabled={isDeleting}
                          className="btn btn-sm"
                          style={{
                            padding: '0.25rem 0.5rem',
                            color: '#DC2626',
                            backgroundColor: '#FEF2F2',
                            border: '1px solid #FECDD3',
                            borderRadius: 'var(--radius-md)',
                            cursor: isDeleting ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 600
                          }}
                          title="Delete Student Record"
                        >
                          <Trash2 size={12} />
                          <span>{isDeleting ? '...' : 'Delete'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Enroll Student Modal */}
      {isEnrollModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 95,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            padding: '1rem'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-subtle)',
              maxWidth: '480px',
              width: '100%',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: '#EFF6FF',
                    color: '#1D4ED8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <PlusCircle size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Enroll Department Student
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Add student record to PostgreSQL department roster
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEnrollModalOpen(false)}
                className="btn-icon"
                title="Close"
                style={{ border: 'none', background: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEnrollStudent} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '12.5px' }}>
              <div>
                <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                  Full Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aryan Mehra"
                  className="input-field"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    Enrollment Number <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value.toUpperCase())}
                    placeholder="e.g. 21CSE091"
                    className="input-field"
                    style={{ fontFamily: 'monospace' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    Class Section <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="input-field"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    Official Email <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. aryan@college.edu"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    Semester
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="input-field"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    Admission Year
                  </label>
                  <input
                    type="number"
                    value={admissionYear}
                    onChange={(e) => setAdmissionYear(e.target.value)}
                    placeholder="2023"
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="input-field"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="GRADUATED">GRADUATED</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="btn btn-sm btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary"
                  disabled={submitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {submitting && <RefreshCw size={12} className="animate-spin" />}
                  <span>{submitting ? 'Enrolling...' : 'Enroll Student'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { studentApi } from '../../api/studentApi';
import { PageHeader, Card, Badge, Button, EmptyState } from '../../components/common';
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
  Edit3,
  CheckCircle2,
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

  // Edit Student Modal State (HOD: No Password Field)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    email: '',
    rollNo: '',
    phone: '',
    semester: '5',
    section: 'A',
    status: 'ACTIVE'
  });

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

  const handleOpenEditStudent = (st) => {
    setEditingStudent(st);
    setEditForm({
      id: st.id,
      name: st.name || `${st.firstName || ''} ${st.lastName || ''}`.trim(),
      email: st.email || '',
      rollNo: st.enrollmentNo || st.enrollment_no || st.rollNo || '',
      phone: st.phone || '',
      semester: String(st.semester || 5),
      section: st.sectionName || st.section?.name || st.section || 'A',
      status: st.status || 'ACTIVE'
    });
    setIsEditModalOpen(true);
  };

  const handleEditStudentSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.rollNo.trim()) {
      addToast('Validation Error', 'Name, email, and enrollment number are required.', 'warning');
      return;
    }

    setEditSubmitting(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        email: editForm.email.trim().toLowerCase(),
        enrollmentNo: editForm.rollNo.trim().toUpperCase(),
        enrollment_no: editForm.rollNo.trim().toUpperCase(),
        phone: editForm.phone.trim() || undefined,
        semester: parseInt(editForm.semester, 10) || 5,
        section: editForm.section.trim().toUpperCase(),
        sectionName: editForm.section.trim().toUpperCase(),
        status: editForm.status
      };

      await studentApi.updateStudent(editForm.id, payload);
      addToast('Student Updated', `${editForm.name} details successfully updated.`, 'success');
      setIsEditModalOpen(false);
      setEditingStudent(null);
      fetchStudents();
    } catch (err) {
      addToast('Update Failed', err.message || 'Unable to update student.', 'error');
    } finally {
      setEditSubmitting(false);
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
      <div className="flex flex-col gap-5">
        {/* Header */}
        <PageHeader
          title="Department Student Directory"
          description="Official student roster and section allocations under HOD supervision."
          badge={<Badge variant="primary" size="sm">{studentsList.length} Enrolled</Badge>}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchStudents}
                disabled={loading}
                loading={loading}
                leftIcon={<RefreshCw size={13} />}
              >
                Refresh
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsEnrollModalOpen(true)}
                leftIcon={<PlusCircle size={15} />}
                id="btn-hod-enroll-student"
              >
                Enroll New Student
              </Button>
            </div>
          }
        />

        {/* Loading / Error states */}
        {loading && (
          <div className="p-8 text-center text-slate-500 card flex flex-col items-center justify-center gap-2">
            <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }} />
            <span className="text-xs font-semibold">Loading Student Records from Relational Database...</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-danger-50 border border-danger-200 text-danger-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-danger-600 shrink-0" />
              <span>{error}</span>
            </div>
            <Button variant="primary" size="sm" onClick={fetchStudents}>
              Try Again
            </Button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Search & Section Filter Bar */}
            <Card className="flex items-center justify-between gap-3 py-2.5 flex-wrap">
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
            </Card>

            {/* Student Cards Grid */}
            {filteredStudents.length === 0 ? (
              <Card className="text-center py-10">
                <EmptyState
                  icon={<Users size={36} className="text-slate-400" />}
                  title="No Students Found"
                  description="No students match the current filter criteria."
                />
              </Card>
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

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditStudent(st)}
                            className="btn btn-sm"
                            style={{
                              padding: '0.25rem 0.5rem',
                              color: '#2563EB',
                              backgroundColor: '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              borderRadius: 'var(--radius-md)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              fontWeight: 600
                            }}
                            title="Edit Student Details"
                          >
                            <Edit3 size={11} />
                            <span>Edit</span>
                          </button>

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
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEnrollModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={submitting}
                  disabled={submitting}
                >
                  Enroll Student
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal for HOD (No Password Field Allowed) */}
      {isEditModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem'
          }}
          onClick={() => setIsEditModalOpen(false)}
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
              gap: '1rem',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
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
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Edit Student Details
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Department Record Update for {editingStudent?.enrollmentNo || editingStudent?.email}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="btn-icon"
                title="Close"
                style={{ border: 'none', background: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '12.5px' }}>
              <div>
                <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="e.g. Ayushi Sahu"
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    Enrollment No *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.rollNo}
                    onChange={(e) => setEditForm({ ...editForm, rollNo: e.target.value })}
                    placeholder="0105CS241113"
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="GRADUATED">GRADUATED</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="student@college.edu"
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="+91..."
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    Semester
                  </label>
                  <select
                    value={editForm.semester}
                    onChange={(e) => setEditForm({ ...editForm, semester: e.target.value })}
                    className="input-field"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={String(s)}>Semester {s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    Section
                  </label>
                  <select
                    value={editForm.section}
                    onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                    className="input-field"
                  >
                    {['A', 'B', 'C', 'D'].map((sec) => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={editSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={editSubmitting}
                  disabled={editSubmitting}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

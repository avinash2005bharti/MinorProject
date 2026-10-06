import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { studentApi } from '../../api';
import {
  Users,
  Search,
  PlusCircle,
  ShieldCheck,
  X,
  Trash2,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  Layers,
  RefreshCw,
  AlertCircle,
  Edit3,
  KeyRound,
  CheckCircle2
} from 'lucide-react';

export default function AdminStudents() {
  const { students: ctxStudents, sections: ctxSections, addToast, refreshAllData } = useERP();
  const [studentList, setStudentList] = useState(ctxStudents || []);
  const [sectionsList, setSectionsList] = useState(ctxSections || []);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Modal State & Form Fields (Enroll)
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

  // Edit Modal State
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
    status: 'ACTIVE',
    password: ''
  });

  // Sync with ERP Context
  useEffect(() => {
    if (ctxStudents && ctxStudents.length > 0) {
      setStudentList(ctxStudents);
    }
  }, [ctxStudents]);

  useEffect(() => {
    if (ctxSections && ctxSections.length > 0) {
      setSectionsList(ctxSections);
    }
  }, [ctxSections]);

  // Direct fetch function
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await studentApi.getStudents({ limit: 150 });
      if (res?.students) {
        setStudentList(res.students);
      }
    } catch (err) {
      addToast('Error', err.message || 'Unable to load student registry.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filtered = studentList.filter((s) => {
    const sName = (s.name || `${s.firstName || ''} ${s.lastName || ''}`).toLowerCase();
    const sRoll = (s.enrollmentNo || s.enrollment_no || s.rollNo || '').toLowerCase();
    const sEmail = (s.email || '').toLowerCase();
    const q = search.toLowerCase();
    return sName.includes(q) || sRoll.includes(q) || sEmail.includes(q);
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

      addToast('Student Enrolled', `${name} (${rollNo.toUpperCase()}) added to master registry.`, 'success');
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
      if (refreshAllData) refreshAllData();
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
      status: st.status || 'ACTIVE',
      password: ''
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

      if (editForm.password && editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }

      await studentApi.updateStudent(editForm.id, payload);
      addToast('Student Updated', `${editForm.name} details successfully updated in database.`, 'success');
      setIsEditModalOpen(false);
      setEditingStudent(null);
      fetchStudents();
      if (refreshAllData) refreshAllData();
    } catch (err) {
      addToast('Update Failed', err.message || 'Unable to update student.', 'error');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to permanently delete student ${studentName || ''}? All related records will be removed.`)) {
      return;
    }

    setDeletingId(studentId);
    try {
      await studentApi.deleteStudent(studentId);
      addToast('Student Removed', `${studentName || 'Student'} deleted from database.`, 'info');
      setStudentList((prev) => prev.filter((s) => s.id !== studentId));
      if (refreshAllData) refreshAllData();
    } catch (err) {
      addToast('Delete Failed', err.message || 'Could not delete student record.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Institutional Student Registry
              </h1>
              <span className="badge badge-indigo">
                {studentList.length} Registered
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Master enrollment database across all departmental classes and batches
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={fetchStudents}
              disabled={loading}
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
              title="Refresh Registry"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setIsEnrollModalOpen(true)}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: 'var(--radius-full)' }}
              id="btn-admin-enroll-student"
            >
              <PlusCircle size={16} />
              <span>Enroll New Student</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 1rem' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search students by enrollment number, name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ border: 'none', boxShadow: 'none', height: '36px', width: '100%', fontSize: '13px' }}
          />
        </div>

        {/* Students List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {filtered.length === 0 ? (
            <div className="card text-center" style={{ padding: '3rem', color: 'var(--text-secondary)' }}>
              <Users size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>No students found</h3>
              <p style={{ fontSize: '13px', margin: '0.25rem 0 0' }}>
                {search ? `No student matched "${search}".` : 'No enrolled students registered in database.'}
              </p>
            </div>
          ) : (
            filtered.map((st) => {
              const displayName = st.name || `${st.firstName || ''} ${st.lastName || ''}`.trim() || 'Student';
              const roll = st.enrollmentNo || st.enrollment_no || st.rollNo || 'N/A';
              const secName = st.sectionName || st.section?.name || st.section || 'A';
              const sem = st.semester || 5;
              const isDeleting = deletingId === st.id;

              return (
                <div
                  key={st.id}
                  className="card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1.25rem',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    borderRadius: 'var(--radius-lg)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        backgroundColor: 'var(--primary-container)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '14px',
                        flexShrink: 0
                      }}
                    >
                      {displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          {displayName}
                        </h4>
                        <span className="badge badge-indigo">
                          Sem {sem} • Sec {secName}
                        </span>
                        <span
                          className={`badge ${st.status === 'ACTIVE' || st.status === 'Active' ? 'badge-emerald' : 'badge-amber'}`}
                          style={{ fontSize: '10px' }}
                        >
                          {st.status || 'Active'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '3px', flexWrap: 'wrap', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                          {roll}
                        </span>
                        <span>•</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Mail size={12} />
                          {st.email}
                        </span>
                        {st.phone && (
                          <>
                            <span>•</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <Phone size={12} />
                              {st.phone}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>Batch: {st.admissionYear || '2023'}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEditStudent(st)}
                      className="btn btn-sm"
                      style={{
                        padding: '0.4rem 0.65rem',
                        color: '#2563EB',
                        backgroundColor: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        borderRadius: 'var(--radius-md)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      title="Edit Student Details"
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteStudent(st.id, displayName)}
                      disabled={isDeleting}
                      className="btn btn-sm"
                      style={{
                        padding: '0.4rem 0.65rem',
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
                      title="Delete Student"
                    >
                      <Trash2 size={13} />
                      <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Enrollment Modal (Matching Backend Prisma Schema) */}
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
                    Enroll New Student
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Add student record to PostgreSQL master database
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
                    {sectionsList.length > 0 ? (
                      sectionsList.map((sec) => (
                        <option key={sec.id} value={sec.name || sec.section_name}>
                          Section {sec.name || sec.section_name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                      </>
                    )}
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

      {/* Edit Student Modal (Direct PostgreSQL Database Update) */}
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
                    Edit Student Information
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Directly modifying database record for {editingStudent?.enrollmentNo || editingStudent?.email}
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

              {/* Admin Direct Password Update Field */}
              <div style={{ backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <KeyRound size={12} className="text-amber-600" />
                    <span>Reset Password (Admin Direct)</span>
                  </label>
                  <span style={{ fontSize: '10px', color: '#64748B' }}>Optional</span>
                </div>
                <input
                  type="text"
                  placeholder="Leave empty to keep existing password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="input-field"
                  style={{ backgroundColor: '#FFFFFF' }}
                />
                <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginTop: '4px' }}>
                  Entering a password will immediately bcrypt-hash and overwrite the student's password in the database.
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn btn-sm btn-secondary"
                  disabled={editSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary"
                  disabled={editSubmitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {editSubmitting ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

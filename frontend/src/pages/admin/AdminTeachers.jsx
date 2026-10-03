import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { teacherApi } from '../../api';
import { leaveApi } from '../../api/leaveApi';
import {
  UserCheck,
  PlusCircle,
  Search,
  X,
  Users,
  Mail,
  Phone,
  BookOpen,
  Trash2,
  ShieldCheck,
  RefreshCw,
  Clock
} from 'lucide-react';

export default function AdminTeachers() {
  const { teachers: ctxTeachers, addToast, refreshAllData } = useERP();
  const [facultyList, setFacultyList] = useState(ctxTeachers || []);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Add Faculty Modal State & Fields (Matching Backend Schema)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [email, setEmail] = useState('');
  const [specialization, setSpecialization] = useState('Computer Science & Engineering');
  const [phone, setPhone] = useState('');
  const [isTG, setIsTG] = useState(false);
  const [maxPeriodsPerDay, setMaxPeriodsPerDay] = useState(4);
  const [maxPeriodsPerWeek, setMaxPeriodsPerWeek] = useState(18);

  useEffect(() => {
    if (ctxTeachers && ctxTeachers.length > 0) {
      setFacultyList(ctxTeachers);
    }
  }, [ctxTeachers]);

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const res = await teacherApi.getFaculty();
      if (res?.faculty) {
        setFacultyList(res.faculty);
      }
    } catch (err) {
      addToast('Error', err.message || 'Unable to fetch faculty records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = facultyList.filter((t) => {
    const tName = (t.name || `${t.firstName || ''} ${t.lastName || ''}`).toLowerCase();
    const tEmail = (t.email || '').toLowerCase();
    const tSpec = (t.specialization || '').toLowerCase();
    const tEmp = (t.employeeId || '').toLowerCase();
    const q = search.toLowerCase();
    return tName.includes(q) || tEmail.includes(q) || tSpec.includes(q) || tEmp.includes(q);
  });

  const handleAddFaculty = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      addToast('Validation Error', 'Name and official email are required.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await teacherApi.createFaculty({
        name: name.trim(),
        employeeId: employeeId.trim() ? employeeId.trim().toUpperCase() : undefined,
        email: email.trim().toLowerCase(),
        designation,
        specialization: specialization.trim() || 'Computer Science & Engineering',
        phone: phone.trim() || undefined,
        isTG: Boolean(isTG),
        maxPeriodsPerDay: parseInt(maxPeriodsPerDay, 10) || 4,
        maxPeriodsPerWeek: parseInt(maxPeriodsPerWeek, 10) || 18
      });

      addToast('Faculty Registered', `${name} (${designation}) added to departmental database.`, 'success');
      setIsAddModalOpen(false);
      setName('');
      setEmployeeId('');
      setEmail('');
      setPhone('');
      setSpecialization('Computer Science & Engineering');
      setIsTG(false);
      setMaxPeriodsPerDay(4);
      setMaxPeriodsPerWeek(18);

      fetchFaculty();
      if (refreshAllData) refreshAllData();
    } catch (err) {
      addToast('Error Adding Faculty', err.message || 'Unable to register faculty member.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFaculty = async (teacherId, teacherName) => {
    if (!window.confirm(`Are you sure you want to permanently remove ${teacherName || 'this faculty member'}? All timetable slots and TG associations will be unlinked.`)) {
      return;
    }

    setDeletingId(teacherId);
    try {
      await teacherApi.deleteFaculty(teacherId);
      addToast('Faculty Removed', `${teacherName || 'Faculty member'} successfully deleted.`, 'info');
      setFacultyList((prev) => prev.filter((f) => f.id !== teacherId));
      if (refreshAllData) refreshAllData();
    } catch (err) {
      addToast('Delete Failed', err.message || 'Could not delete faculty record.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleLeave = async (faculty) => {
    try {
      setTogglingId(faculty.id);
      const isCurrentlyOnLeave = faculty.availability_status === 'On Leave' || faculty.status === 'ON_LEAVE';
      const nextStatus = !isCurrentlyOnLeave;

      await leaveApi.toggleLeave(faculty.id, {
        onLeave: nextStatus,
        reason: nextStatus ? 'Marked on leave by Administrator' : ''
      });

      setFacultyList((prev) =>
        prev.map((f) => {
          if (f.id === faculty.id) {
            return {
              ...f,
              status: nextStatus ? 'ON_LEAVE' : 'ACTIVE',
              availability_status: nextStatus ? 'On Leave' : 'Available'
            };
          }
          return f;
        })
      );

      addToast(
        nextStatus ? 'Status Updated: On Leave' : 'Status Updated: Available',
        `${faculty.name} is now ${nextStatus ? 'ON LEAVE 🔴' : 'AVAILABLE 🟢'} for today.`,
        nextStatus ? 'warning' : 'success'
      );
    } catch (err) {
      addToast('Error Toggling Status', err.message || 'Unable to update faculty leave status.', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Faculty & Staff Directory
              </h1>
              <span className="badge badge-indigo">
                {facultyList.length} Appointed
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Department of Computer Science & Engineering • Official academic appointments and workload roster
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={fetchFaculty}
              disabled={loading}
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
              title="Refresh Faculty List"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: 'var(--radius-full)' }}
              id="btn-admin-add-faculty"
            >
              <PlusCircle size={16} />
              <span>Add Faculty Member</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 1rem' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search faculty by name, employee ID, email, or specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ border: 'none', boxShadow: 'none', height: '36px', width: '100%', fontSize: '13px' }}
          />
        </div>

        {filteredTeachers.length === 0 ? (
          <div className="card text-center" style={{ padding: '3rem', color: 'var(--text-secondary)' }}>
            <Users size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>No teachers found</h3>
            <p style={{ fontSize: '13px', margin: '0.25rem 0 0' }}>
              {search ? `No faculty matched "${search}".` : 'No faculty members registered in department database.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
            {filteredTeachers.map((t) => {
              const displayName = t.name || `${t.firstName || ''} ${t.lastName || ''}`.trim() || 'Faculty';
              const onLeave = t.availability_status === 'On Leave' || t.status === 'ON_LEAVE';
              const isDeleting = deletingId === t.id;
              const isToggling = togglingId === t.id;

              return (
                <div key={t.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                            {displayName}
                          </h3>
                          {t.isTG && (
                            <span className="badge badge-emerald" style={{ fontSize: '10px', fontWeight: 700 }}>
                              <ShieldCheck size={11} style={{ marginRight: '2px' }} />
                              TG
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700 }}>
                          {t.designation}
                        </span>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                          ID: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{t.employeeId || 'FAC-CSE'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Interactive 1-Click Leave Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleLeave(t)}
                      disabled={isToggling}
                      className="btn btn-sm"
                      style={{
                        padding: '4px 10px',
                        borderRadius: '16px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: isToggling ? 'not-allowed' : 'pointer',
                        border: onLeave ? '1px solid #10B981' : '1px solid #EF4444',
                        backgroundColor: onLeave ? '#ECFDF5' : '#FEF2F2',
                        color: onLeave ? '#065F46' : '#991B1B',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s'
                      }}
                      title="Click to toggle teacher leave status for today"
                    >
                      <span>{onLeave ? '🔴 On Leave' : '🟢 Available'}</span>
                      {isToggling && <RefreshCw size={10} className="animate-spin" />}
                    </button>
                  </div>

                  <div style={{ backgroundColor: 'var(--surface-low)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                      <Mail size={13} style={{ flexShrink: 0 }} />
                      <span className="truncate">{t.email}</span>
                    </div>
                    {t.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                        <Phone size={13} style={{ flexShrink: 0 }} />
                        <span>{t.phone}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                      <BookOpen size={13} style={{ flexShrink: 0 }} />
                      <span className="truncate">Specialization: {t.specialization || 'CSE'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', fontSize: '11px' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      Workload: {t.max_periods_per_day || t.maxPeriodsPerDay || 4} slots/day • {t.max_periods_per_week || t.maxPeriodsPerWeek || 18} hrs/wk
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteFaculty(t.id, displayName)}
                      disabled={isDeleting}
                      className="btn btn-sm"
                      style={{
                        padding: '0.35rem 0.65rem',
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
                      title="Delete Faculty Member"
                    >
                      <Trash2 size={12} />
                      <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Faculty Modal (Matching Backend Schema) */}
      {isAddModalOpen && (
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
              maxWidth: '480px',
              width: '100%',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)'
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
                    Add Faculty Member
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Register academic staff in PostgreSQL database
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddFaculty} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '12.5px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    Full Name <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Ramesh Gupta"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                    placeholder="e.g. EMP4091"
                    className="input-field"
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    Designation
                  </label>
                  <select
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="input-field"
                  >
                    <option value="Professor & Head">Professor & Head</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Senior Lecturer">Senior Lecturer</option>
                    <option value="Lab Instructor">Lab Instructor</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    Official Email <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. ramesh@college.edu"
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    Specialization / Domain
                  </label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. AI & Distributed Systems"
                    className="input-field"
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    Max Periods / Day
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={maxPeriodsPerDay}
                    onChange={(e) => setMaxPeriodsPerDay(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    Max Periods / Week
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={maxPeriodsPerWeek}
                    onChange={(e) => setMaxPeriodsPerWeek(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
                <input
                  type="checkbox"
                  id="chk-is-tg"
                  checked={isTG}
                  onChange={(e) => setIsTG(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="chk-is-tg" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Designate as Tutor Guardian (TG) for Student Mentorship
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
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
                  <span>{submitting ? 'Registering...' : 'Save Faculty'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

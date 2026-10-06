import React, { useState, useEffect, useCallback } from 'react';
import { useERP } from '../../context/ERPContext';
import { adminApi } from '../../api/adminApi';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Building2,
  GraduationCap,
  Briefcase,
  Award,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Edit3,
  X
} from 'lucide-react';

export default function AdminUsers() {
  const { addToast } = useERP();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [resetResult, setResetResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Edit User Form State
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    role: 'student',
    status: 'ACTIVE',
    phone: '',
    enrollment_no: '',
    roll_no: '',
    semester: 5,
    section: 'A',
    employee_id: '',
    designation: 'Assistant Professor',
    isTG: false
  });

  // Create User Form State
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'faculty',
    employee_id: '',
    enrollment_no: '',
    designation: 'Assistant Professor',
    specialization: 'Computer Science & Engineering',
    semester: 1,
    phone: ''
  });
  const [createLoading, setCreateLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getUsers({
        q: search.trim(),
        role: roleFilter,
        status: statusFilter,
        page,
        limit: 25
      });
      if (res?.users) {
        setUsers(res.users);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.count || 0);
      }
    } catch (err) {
      setError(err.message || 'Unable to load user accounts from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  // Handle Create User
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.name || !createForm.email || !createForm.password) {
      addToast('Validation Error', 'Name, email and password are required.', 'warning');
      return;
    }

    setCreateLoading(true);
    try {
      const res = await adminApi.createUser(createForm);
      addToast('User Created', res.message || `Account for ${createForm.name} created.`, 'success');
      setIsCreateModalOpen(false);
      setCreateForm({
        name: '',
        email: '',
        password: '',
        role: 'faculty',
        employee_id: '',
        enrollment_no: '',
        designation: 'Assistant Professor',
        specialization: 'Computer Science & Engineering',
        semester: 1,
        phone: ''
      });
      fetchUsers();
    } catch (err) {
      addToast('Creation Failed', err.message || 'Error creating user account.', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle Toggle Status (Activate / Deactivate)
  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await adminApi.updateUserStatus(user.id, nextStatus);
      addToast(
        'Account Updated',
        `User ${user.email} marked as ${nextStatus}.`,
        nextStatus === 'ACTIVE' ? 'success' : 'warning'
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u))
      );
    } catch (err) {
      addToast('Status Update Failed', err.message || 'Unable to change status.', 'error');
    }
  };

  // Handle Open Edit Modal
  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      password: '', // blank to keep current
      role: (user.role || 'student').toLowerCase(),
      status: user.status || (user.isActive ? 'ACTIVE' : 'INACTIVE'),
      phone: user.phone || user.studentProfile?.phone || user.teacherProfile?.phone || '',
      enrollment_no: user.studentProfile?.enrollment_no || user.studentProfile?.enrollmentNo || '',
      roll_no: user.studentProfile?.roll_no || user.studentProfile?.rollNo || '',
      semester: user.studentProfile?.semester || user.semester || 5,
      section: user.studentProfile?.sectionName || user.studentProfile?.section?.name || user.section || 'A',
      employee_id: user.teacherProfile?.employee_id || user.teacherProfile?.employeeId || '',
      designation: user.teacherProfile?.designation || 'Assistant Professor',
      isTG: Boolean(user.teacherProfile?.isTG)
    });
    setIsEditModalOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.email.trim()) {
      addToast('Validation Error', 'Name and email are required.', 'warning');
      return;
    }

    setEditLoading(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        email: editForm.email.trim().toLowerCase(),
        role: editForm.role,
        status: editForm.status,
        isActive: editForm.status === 'ACTIVE',
        phone: editForm.phone.trim() || undefined
      };

      if (editForm.password && editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }

      if (editForm.role === 'student') {
        payload.enrollment_no = editForm.enrollment_no.trim().toUpperCase();
        payload.enrollmentNo = editForm.enrollment_no.trim().toUpperCase();
        payload.roll_no = editForm.roll_no.trim();
        payload.rollNo = editForm.roll_no.trim();
        payload.semester = Number(editForm.semester) || 5;
        payload.section = (editForm.section || 'A').trim().toUpperCase();
        payload.sectionName = (editForm.section || 'A').trim().toUpperCase();
      } else if (['faculty', 'teacher', 'tg', 'hod'].includes(editForm.role)) {
        payload.employee_id = editForm.employee_id.trim().toUpperCase();
        payload.employeeId = editForm.employee_id.trim().toUpperCase();
        payload.designation = editForm.designation;
        payload.isTG = Boolean(editForm.isTG);
      }

      await adminApi.updateUser(editForm.id, payload);
      addToast('User Updated', `${editForm.name}'s account details updated in PostgreSQL database.`, 'success');
      setIsEditModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      addToast('Update Failed', err.message || 'Unable to update user in database.', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle Admin Password Reset
  const handleResetPassword = async (user) => {
    try {
      const res = await adminApi.resetUserPassword(user.id);
      setResetResult({
        user,
        tempPassword: res.tempPassword,
        instructions: res.instructions
      });
      setIsResetModalOpen(true);
      setCopied(false);
      addToast('Password Reset', `Temporary password generated for ${user.email}.`, 'success');
    } catch (err) {
      addToast('Reset Failed', err.message || 'Unable to reset password.', 'error');
    }
  };

  // Handle Assign / Remove HOD
  const handleToggleHod = async (user) => {
    const teacherId = user.facultyProfile?.id;
    if (!teacherId) {
      addToast('Action Unavailable', 'This user does not have a linked faculty profile.', 'warning');
      return;
    }

    const isCurrentHod = (user.role || '').toLowerCase() === 'hod';
    try {
      if (isCurrentHod) {
        await adminApi.removeHod(null, teacherId);
        addToast('HOD Revoked', `HOD role removed for ${user.name}. Reverted to FACULTY.`, 'info');
      } else {
        await adminApi.assignHod(teacherId);
        addToast('HOD Appointed', `${user.name} is now the official HOD of the department.`, 'success');
      }
      fetchUsers();
    } catch (err) {
      addToast('HOD Assignment Error', err.message || 'Error updating HOD designation.', 'error');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRoleBadge = (role) => {
    const r = (role || '').toLowerCase();
    switch (r) {
      case 'admin':
        return <span className="badge badge-rose flex items-center gap-1"><ShieldCheck size={11} /> Admin</span>;
      case 'hod':
        return <span className="badge badge-purple flex items-center gap-1"><Building2 size={11} /> HOD</span>;
      case 'tg':
        return <span className="badge badge-amber flex items-center gap-1"><Award size={11} /> TG / Mentor</span>;
      case 'faculty':
      case 'teacher':
        return <span className="badge badge-blue flex items-center gap-1"><Briefcase size={11} /> Faculty</span>;
      case 'student':
      default:
        return <span className="badge badge-emerald flex items-center gap-1"><GraduationCap size={11} /> Student</span>;
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                User & RBAC Accounts
              </h1>
              <span className="badge badge-indigo">PostgreSQL Central Identity</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Authoritative institutional account ledger, role-based authorization, HOD appointment & password management
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="btn btn-outline text-xs py-2 px-3 flex items-center gap-1.5"
              id="btn-admin-refresh-users"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-primary text-xs py-2 px-3.5 shadow-sm flex items-center gap-1.5"
              id="btn-admin-create-user"
            >
              <UserPlus size={15} />
              <span>Create Account</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', padding: '1rem' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="input-field"
              style={{ paddingLeft: '2.4rem', height: '38px', fontSize: '13px' }}
              id="input-admin-search-users"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Filter size={14} className="text-slate-400" />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="input-field"
                style={{ height: '38px', fontSize: '12px', padding: '0 0.75rem' }}
                id="select-admin-role-filter"
              >
                <option value="ALL">All Roles</option>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="tg">TG / Mentor</option>
                <option value="hod">HOD</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="input-field"
                style={{ height: '38px', fontSize: '12px', padding: '0 0.75rem' }}
                id="select-admin-status-filter"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={fetchUsers} className="btn btn-sm btn-primary text-xs">
              Try Again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="card p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }} />
            <span className="text-xs font-semibold">Querying Authoritative Database Accounts...</span>
          </div>
        )}

        {/* User Table */}
        {!loading && !error && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={16} className="text-blue-600" />
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Active Directory Records
                </h3>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Showing {users.length} of {totalCount} users
              </span>
            </div>

            {users.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Users size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>No records found.</h4>
                <p style={{ fontSize: '13px', margin: '0.25rem 0 0' }}>
                  No accounts found matching the current search & filter criteria.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table" style={{ width: '100%', fontSize: '12.5px', marginBottom: 0 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: '#F8FAFC' }}>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>User</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Role</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Institutional ID</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Status</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#475569' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => {
                      const idVal =
                        u.studentProfile?.enrollment_no ||
                        u.facultyProfile?.employee_id ||
                        'System User';
                      const isFaculty = ['faculty', 'teacher', 'tg', 'hod'].includes((u.role || '').toLowerCase());
                      const isHod = (u.role || '').toLowerCase() === 'hod';
                      const isActive = u.status === 'ACTIVE';

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{u.name}</span>
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{u.email}</span>
                            </div>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>{getRoleBadge(u.role)}</td>
                          <td style={{ padding: '0.85rem 1rem', color: '#475569', fontFamily: 'monospace', fontSize: '12px' }}>
                            {idVal}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span
                              className={`badge ${
                                isActive ? 'badge-emerald' : 'badge-slate'
                              }`}
                            >
                              {u.status || 'ACTIVE'}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                              {/* Edit User Details directly in Database */}
                              <button
                                onClick={() => handleOpenEdit(u)}
                                className="btn btn-outline text-xs py-1 px-2.5 flex items-center gap-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                                title="Edit user details & permissions directly in database"
                                id={`btn-edit-user-${u.id}`}
                              >
                                <Edit3 size={12} className="text-blue-600" />
                                <span>Edit</span>
                              </button>

                              {/* Reset Password Button */}
                              <button
                                onClick={() => handleResetPassword(u)}
                                className="btn btn-outline text-xs py-1 px-2.5 flex items-center gap-1"
                                title="Generate temporary password for user"
                              >
                                <KeyRound size={12} className="text-amber-600" />
                                <span>Reset Pass</span>
                              </button>

                              {/* Toggle HOD Appointment (if faculty) */}
                              {isFaculty && (
                                <button
                                  onClick={() => handleToggleHod(u)}
                                  className={`btn text-xs py-1 px-2.5 flex items-center gap-1 ${
                                    isHod ? 'btn-outline border-purple-300 text-purple-700' : 'btn-outline'
                                  }`}
                                  title={isHod ? 'Revoke HOD appointment' : 'Appoint as department HOD'}
                                >
                                  <Building2 size={12} className={isHod ? 'text-purple-600' : 'text-slate-400'} />
                                  <span>{isHod ? 'Remove HOD' : 'Make HOD'}</span>
                                </button>
                              )}

                              {/* Toggle Status (Active / Inactive) */}
                              <button
                                onClick={() => handleToggleStatus(u)}
                                className={`btn text-xs py-1 px-2 flex items-center gap-1 ${
                                  isActive ? 'btn-outline text-rose-600' : 'btn-outline text-emerald-600'
                                }`}
                                title={isActive ? 'Deactivate account' : 'Activate account'}
                              >
                                {isActive ? <UserX size={12} /> : <UserCheck size={12} />}
                                <span>{isActive ? 'Deactivate' : 'Activate'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="btn btn-outline text-xs py-1 px-3"
                >
                  Previous
                </button>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="btn btn-outline text-xs py-1 px-3"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
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
        >
          <div className="card" style={{ maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={20} className="text-primary" />
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Create Institutional User Account
                </h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label text-xs font-bold text-slate-700">Account Role</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="input-field"
                  style={{ fontSize: '13px' }}
                >
                  <option value="faculty">Faculty / Teacher</option>
                  <option value="tg">TG / Mentor</option>
                  <option value="hod">HOD (Head of Department)</option>
                  <option value="student">Student</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="form-label text-xs font-bold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Kumar"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="input-field"
                  style={{ fontSize: '13px' }}
                />
              </div>

              <div>
                <label className="form-label text-xs font-bold text-slate-700">Official Email</label>
                <input
                  type="email"
                  required
                  placeholder="rajesh.kumar@college.edu"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="input-field"
                  style={{ fontSize: '13px' }}
                />
              </div>

              <div>
                <label className="form-label text-xs font-bold text-slate-700">Initial Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="input-field"
                  style={{ fontSize: '13px' }}
                />
              </div>

              {/* Conditional Profile Fields */}
              {createForm.role === 'student' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="form-label text-xs font-bold text-slate-700">Enrollment / Roll No</label>
                    <input
                      type="text"
                      placeholder="0103CS231001"
                      value={createForm.enrollment_no}
                      onChange={(e) => setCreateForm({ ...createForm, enrollment_no: e.target.value })}
                      className="input-field"
                      style={{ fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label className="form-label text-xs font-bold text-slate-700">Current Semester</label>
                    <select
                      value={createForm.semester}
                      onChange={(e) => setCreateForm({ ...createForm, semester: Number(e.target.value) })}
                      className="input-field"
                      style={{ fontSize: '13px' }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>
                          Semester {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="form-label text-xs font-bold text-slate-700">Employee ID</label>
                    <input
                      type="text"
                      placeholder="FAC-201"
                      value={createForm.employee_id}
                      onChange={(e) => setCreateForm({ ...createForm, employee_id: e.target.value })}
                      className="input-field"
                      style={{ fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label className="form-label text-xs font-bold text-slate-700">Designation</label>
                    <input
                      type="text"
                      placeholder="Associate Professor"
                      value={createForm.designation}
                      onChange={(e) => setCreateForm({ ...createForm, designation: e.target.value })}
                      className="input-field"
                      style={{ fontSize: '13px' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn btn-outline text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="btn btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                >
                  {createLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL (Admin Direct Database Editing) */}
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
            padding: '1rem',
            overflowY: 'auto'
          }}
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="card"
            style={{ maxWidth: '520px', width: '100%', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Edit3 size={19} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Edit User & RBAC Identity
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                    Updating PostgreSQL record for {editingUser?.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="btn btn-icon text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Role & Status Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label text-xs font-bold text-slate-700">Role & Access</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="input-field"
                    style={{ fontSize: '13px' }}
                    id="edit-user-role"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty / Teacher</option>
                    <option value="tg">TG / Mentor</option>
                    <option value="hod">HOD (Head of Department)</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="form-label text-xs font-bold text-slate-700">Account Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="input-field"
                    style={{ fontSize: '13px' }}
                    id="edit-user-status"
                  >
                    <option value="ACTIVE">ACTIVE (Enabled)</option>
                    <option value="INACTIVE">INACTIVE (Disabled)</option>
                  </select>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="form-label text-xs font-bold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="input-field"
                  style={{ fontSize: '13px' }}
                  id="edit-user-name"
                />
              </div>

              {/* Email & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label text-xs font-bold text-slate-700">Official Email</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="input-field"
                    style={{ fontSize: '13px' }}
                    id="edit-user-email"
                  />
                </div>
                <div>
                  <label className="form-label text-xs font-bold text-slate-700">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91..."
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="input-field"
                    style={{ fontSize: '13px' }}
                    id="edit-user-phone"
                  />
                </div>
              </div>

              {/* Admin Direct Password Update Field */}
              <div style={{ backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label className="form-label text-xs font-bold text-slate-700" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <KeyRound size={12} className="text-amber-600" />
                    <span>Change Password (Admin Exclusive)</span>
                  </label>
                  <span style={{ fontSize: '10px', color: '#64748B' }}>Optional</span>
                </div>
                <input
                  type="text"
                  placeholder="Leave empty to keep existing password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="input-field"
                  style={{ fontSize: '13px', backgroundColor: '#FFFFFF' }}
                  id="edit-user-password"
                />
                <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginTop: '4px' }}>
                  Entering a new password here will immediately bcrypt-hash and overwrite the password in the database.
                </span>
              </div>

              {/* Student Fields */}
              {editForm.role === 'student' && (
                <div style={{ backgroundColor: '#EFF6FF', padding: '0.85rem', borderRadius: '8px', border: '1px solid #DBEAFE', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Student Academic Attributes
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    <div>
                      <label className="form-label text-xs font-bold text-slate-700">Enrollment No</label>
                      <input
                        type="text"
                        placeholder="0105CS241101"
                        value={editForm.enrollment_no}
                        onChange={(e) => setEditForm({ ...editForm, enrollment_no: e.target.value })}
                        className="input-field"
                        style={{ fontSize: '13px', backgroundColor: '#FFFFFF' }}
                      />
                    </div>
                    <div>
                      <label className="form-label text-xs font-bold text-slate-700">Roll No</label>
                      <input
                        type="text"
                        placeholder="Roll No"
                        value={editForm.roll_no}
                        onChange={(e) => setEditForm({ ...editForm, roll_no: e.target.value })}
                        className="input-field"
                        style={{ fontSize: '13px', backgroundColor: '#FFFFFF' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    <div>
                      <label className="form-label text-xs font-bold text-slate-700">Semester</label>
                      <select
                        value={editForm.semester}
                        onChange={(e) => setEditForm({ ...editForm, semester: Number(e.target.value) })}
                        className="input-field"
                        style={{ fontSize: '13px', backgroundColor: '#FFFFFF' }}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label text-xs font-bold text-slate-700">Section</label>
                      <select
                        value={editForm.section}
                        onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                        className="input-field"
                        style={{ fontSize: '13px', backgroundColor: '#FFFFFF' }}
                      >
                        {['A', 'B', 'C', 'D'].map((sec) => (
                          <option key={sec} value={sec}>Section {sec}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Faculty / Teacher Fields */}
              {['faculty', 'teacher', 'tg', 'hod'].includes(editForm.role) && (
                <div style={{ backgroundColor: '#F5F3FF', padding: '0.85rem', borderRadius: '8px', border: '1px solid #EDE9FE', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#6D28D9', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Faculty Academic Attributes
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    <div>
                      <label className="form-label text-xs font-bold text-slate-700">Employee ID</label>
                      <input
                        type="text"
                        placeholder="EMP-HOD-01"
                        value={editForm.employee_id}
                        onChange={(e) => setEditForm({ ...editForm, employee_id: e.target.value })}
                        className="input-field"
                        style={{ fontSize: '13px', backgroundColor: '#FFFFFF' }}
                      />
                    </div>
                    <div>
                      <label className="form-label text-xs font-bold text-slate-700">Designation</label>
                      <input
                        type="text"
                        placeholder="Professor & Head"
                        value={editForm.designation}
                        onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                        className="input-field"
                        style={{ fontSize: '13px', backgroundColor: '#FFFFFF' }}
                      />
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '4px' }}>
                    <input
                      type="checkbox"
                      checked={editForm.isTG}
                      onChange={(e) => setEditForm({ ...editForm, isTG: e.target.checked })}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                      Designated Tutor Guardian (TG / Mentor)
                    </span>
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn btn-outline text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="btn btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                  id="btn-save-edit-user"
                >
                  {editLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" />
                      <span>Saving in Database...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PASSWORD RESET RESULT MODAL */}
      {isResetModalOpen && resetResult && (
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
        >
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <KeyRound size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Password Reset Successful
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                  Account: <strong>{resetResult.user?.email}</strong>
                </p>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, marginBottom: '1rem' }}>
              A new temporary password has been cryptographically generated and saved to the database. Share this password with the user:
            </p>

            {/* Password Display Box */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                backgroundColor: '#F8FAFC',
                border: '1px dashed #CBD5E1',
                borderRadius: '10px',
                marginBottom: '1rem'
              }}
            >
              <code style={{ fontSize: '16px', fontWeight: 800, color: '#1D4ED8', letterSpacing: '0.05em' }}>
                {resetResult.tempPassword}
              </code>
              <button
                type="button"
                onClick={() => copyToClipboard(resetResult.tempPassword)}
                className="btn btn-outline text-xs py-1.5 px-2.5 flex items-center gap-1"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <p style={{ fontSize: '11px', color: '#64748B', marginBottom: '1.25rem' }}>
              Security Note: The user can now sign in using this temporary password.
            </p>

            <button
              onClick={() => {
                setIsResetModalOpen(false);
                setResetResult(null);
              }}
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '13px', padding: '0.65rem' }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

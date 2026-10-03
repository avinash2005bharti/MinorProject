import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { academicApi } from '../../api';
import {
  GraduationCap,
  Building2,
  BookOpen,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Layers,
  Calendar,
  X,
  PlusCircle,
  Hash,
  Users
} from 'lucide-react';

export default function AdminDepartments() {
  const { addToast } = useERP();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hierarchy, setHierarchy] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);

  // Selected Navigation
  const [selectedSemester, setSelectedSemester] = useState(5);

  // Modals state
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionBatch, setNewSectionBatch] = useState('2023-2027');

  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCredits, setNewSubjectCredits] = useState(4);
  const [newSubjectHours, setNewSubjectHours] = useState(4);
  const [newSubjectType, setNewSubjectType] = useState('Theory');

  const [actionProcessing, setActionProcessing] = useState(false);

  const fetchAcademicData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [hRes, sRes, secRes] = await Promise.all([
        academicApi.getHierarchy(),
        academicApi.getSubjects(),
        academicApi.getSections()
      ]);

      if (hRes) setHierarchy(hRes);
      if (sRes?.subjects) setSubjects(sRes.subjects);
      if (secRes?.sections) setSections(secRes.sections);
    } catch (err) {
      setError(err.message || 'Unable to load academic structure from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademicData();
  }, []);

  // Filter sections and subjects for selected semester
  const semesterSections = sections.filter((s) => Number(s.semester) === Number(selectedSemester));
  const semesterSubjects = subjects.filter((s) => Number(s.semester) === Number(selectedSemester));

  // Determine year for semester
  const getYearName = (sem) => {
    if (sem <= 2) return '1st Year (Freshman)';
    if (sem <= 4) return '2nd Year (Sophomore)';
    if (sem <= 6) return '3rd Year (Junior)';
    return '4th Year (Senior)';
  };

  // Handle Add Section
  const handleCreateSection = async (e) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;

    setActionProcessing(true);
    try {
      await academicApi.createSection({
        name: newSectionName.trim().toUpperCase(),
        section_name: newSectionName.trim().toUpperCase(),
        semester: Number(selectedSemester),
        academic_year: newSectionBatch.trim() || '2026-27',
        academicYear: newSectionBatch.trim() || '2026-27',
        capacity: 60
      });
      addToast('Section Created', `Section ${newSectionName.toUpperCase()} added to Semester ${selectedSemester}.`, 'success');
      setIsAddSectionOpen(false);
      setNewSectionName('');
      fetchAcademicData();
    } catch (err) {
      addToast('Error', err.message || 'Failed to create section.', 'error');
    } finally {
      setActionProcessing(false);
    }
  };

  // Handle Delete Section
  const handleDeleteSection = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove Section ${name}?`)) return;

    try {
      await academicApi.deleteSection(id);
      addToast('Section Deleted', `Section ${name} removed from database.`, 'info');
      fetchAcademicData();
    } catch (err) {
      addToast('Error', err.message || 'Failed to delete section.', 'error');
    }
  };

  // Handle Add Subject
  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectCode.trim() || !newSubjectName.trim()) return;

    setActionProcessing(true);
    try {
      await academicApi.createSubject({
        code: newSubjectCode.trim().toUpperCase(),
        name: newSubjectName.trim(),
        semester: Number(selectedSemester),
        credits: Number(newSubjectCredits) || 4,
        hours_per_week: Number(newSubjectHours) || 4,
        type: newSubjectType
      });
      addToast('Subject Created', `Course ${newSubjectCode.toUpperCase()} (${newSubjectName}) created.`, 'success');
      setIsAddSubjectOpen(false);
      setNewSubjectCode('');
      setNewSubjectName('');
      fetchAcademicData();
    } catch (err) {
      addToast('Error', err.message || 'Failed to create subject.', 'error');
    } finally {
      setActionProcessing(false);
    }
  };

  // Handle Delete Subject
  const handleDeleteSubject = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete course ${code}?`)) return;

    try {
      await academicApi.deleteSubject(id);
      addToast('Subject Deleted', `Course ${code} removed from database.`, 'info');
      fetchAcademicData();
    } catch (err) {
      addToast('Error', err.message || 'Failed to delete subject.', 'error');
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
                Academic Structure & Curriculum
              </h1>
              <span className="badge badge-indigo">CSE Department</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Real-time curriculum, semester divisions, sections, and subject mapping in PostgreSQL
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={fetchAcademicData}
              disabled={loading}
              className="btn btn-outline text-xs py-2 px-3"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setIsAddSectionOpen(true)}
              className="btn btn-outline text-xs py-2 px-3"
            >
              <Plus size={14} />
              <span>Add Section</span>
            </button>

            <button
              onClick={() => setIsAddSubjectOpen(true)}
              className="btn btn-primary text-xs py-2 px-3.5"
            >
              <PlusCircle size={15} />
              <span>Add Course / Subject</span>
            </button>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="card text-center py-12 text-slate-500">
            <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem', margin: '0 auto 0.75rem' }} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Loading live academic hierarchy from PostgreSQL...</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={fetchAcademicData} className="btn btn-sm btn-primary text-xs">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* 8-Semester Selector Tabs */}
            <div className="card" style={{ padding: '0.75rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Select Academic Semester (4 Years • 8 Semesters)
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>
                  {getYearName(selectedSemester)}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                  const isSelected = selectedSemester === sem;
                  return (
                    <button
                      key={sem}
                      onClick={() => setSelectedSemester(sem)}
                      style={{
                        padding: '0.65rem 0.5rem',
                        borderRadius: '12px',
                        border: isSelected ? '1px solid #1D4ED8' : '1px solid #E2E8F0',
                        backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                        color: isSelected ? '#1D4ED8' : '#475569',
                        fontWeight: isSelected ? 800 : 600,
                        fontSize: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>Semester {sem}</span>
                      <span style={{ fontSize: '10px', color: isSelected ? '#2563EB' : '#94A3B8' }}>
                        {sem % 2 === 1 ? 'Odd Term' : 'Even Term'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Sections in this Semester */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 size={18} className="text-blue-600" />
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Active Sections in Semester {selectedSemester} ({semesterSections.length})
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddSectionOpen(true)}
                  className="btn btn-outline btn-xs"
                >
                  <Plus size={12} />
                  <span>New Section</span>
                </button>
              </div>

              {semesterSections.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                  No sections registered for Semester {selectedSemester} in PostgreSQL. Click "New Section" to add one.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                  {semesterSections.map((sec) => (
                    <div
                      key={sec.id}
                      style={{
                        padding: '1rem',
                        borderRadius: '14px',
                        border: '1px solid #E2E8F0',
                        backgroundColor: '#F8FAFC',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                            Section {sec.name || sec.section_name}
                          </span>
                          <span className="badge badge-blue text-[10px]">Active</span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginTop: '2px' }}>
                          Batch: {sec.academicYear || sec.academic_year || 'Current'} • Capacity: {sec.capacity || 60}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteSection(sec.id || sec.name, sec.name || sec.section_name)}
                        style={{
                          color: '#E11D48',
                          padding: '6px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#FEE2E2',
                          border: 'none'
                        }}
                        title={`Delete Section ${sec.name || sec.section_name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Subjects / Courses in this Semester */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BookOpen size={18} className="text-indigo-600" />
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Curriculum Subjects for Semester {selectedSemester} ({semesterSubjects.length})
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddSubjectOpen(true)}
                  className="btn btn-primary btn-xs"
                >
                  <Plus size={12} />
                  <span>Add Subject</span>
                </button>
              </div>

              {semesterSubjects.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                  No courses recorded for Semester {selectedSemester}. Click "Add Subject" to configure courses.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table" style={{ width: '100%', fontSize: '12px' }}>
                    <thead>
                      <tr>
                        <th>Course Code</th>
                        <th>Subject Title</th>
                        <th>Credits</th>
                        <th>Weekly Hours</th>
                        <th>Type</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {semesterSubjects.map((sub) => (
                        <tr key={sub.id}>
                          <td>
                            <span style={{ fontWeight: 800, color: '#1D4ED8' }}>{sub.code}</span>
                          </td>
                          <td style={{ fontWeight: 600, color: '#0F172A' }}>{sub.name}</td>
                          <td>{sub.credits} Credits</td>
                          <td>{sub.hours_per_week || sub.credits} hrs/week</td>
                          <td>
                            <span className={`badge ${sub.type === 'Practical' ? 'badge-amber' : 'badge-emerald'} text-[10px]`}>
                              {sub.type || 'Theory'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => handleDeleteSubject(sub.id, sub.code)}
                              style={{
                                color: '#E11D48',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                backgroundColor: '#FEE2E2',
                                border: 'none',
                                fontSize: '11px',
                                fontWeight: 600
                              }}
                            >
                              <Trash2 size={12} />
                              <span>Remove</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add Section Modal */}
      {isAddSectionOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={20} className="text-blue-600" />
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                  Add Section to Semester {selectedSemester}
                </h3>
              </div>
              <button onClick={() => setIsAddSectionOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSection} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Section Identifier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A, B, C, or CSE-A"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="form-label">Academic Batch</label>
                <input
                  type="text"
                  placeholder="e.g. 2023-2027"
                  value={newSectionBatch}
                  onChange={(e) => setNewSectionBatch(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddSectionOpen(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionProcessing}
                  className="btn btn-primary"
                >
                  {actionProcessing ? 'Creating...' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {isAddSubjectOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={20} className="text-indigo-600" />
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                  Add Course to Semester {selectedSemester}
                </h3>
              </div>
              <button onClick={() => setIsAddSubjectOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Course Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS501"
                  value={newSubjectCode}
                  onChange={(e) => setNewSubjectCode(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="form-label">Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Theory of Computation"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newSubjectCredits}
                    onChange={(e) => setNewSubjectCredits(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="form-label">Weekly Hours</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={newSubjectHours}
                    onChange={(e) => setNewSubjectHours(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="form-label">Type</label>
                  <select
                    value={newSubjectType}
                    onChange={(e) => setNewSubjectType(e.target.value)}
                    className="input-field"
                  >
                    <option value="Theory">Theory</option>
                    <option value="Practical">Practical</option>
                    <option value="Elective">Elective</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddSubjectOpen(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionProcessing}
                  className="btn btn-primary"
                >
                  {actionProcessing ? 'Creating...' : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

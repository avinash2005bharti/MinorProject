import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { academicApi } from '../../api';
import {
  Building2,
  PlusCircle,
  Users,
  MapPin,
  BookOpen,
  Layers,
  ChevronRight,
  GraduationCap,
  X,
  Trash2,
  Clock
} from 'lucide-react';

export default function HodClassesSections() {
  const { addToast } = useERP();

  const [loading, setLoading] = useState(true);
  const [hierarchy, setHierarchy] = useState(null);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState(null);

  // Selected year and semester
  const [selectedYear, setSelectedYear] = useState('3rd Year');
  const [selectedSem, setSelectedSem] = useState(5);

  // Section Modal
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionYear, setNewSectionYear] = useState('3rd Year');
  const [newSectionSem, setNewSectionSem] = useState(5);
  const [newSectionCapacity, setNewSectionCapacity] = useState(60);

  // Subject Modal
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectSem, setNewSubjectSem] = useState(5);
  const [newSubjectCredits, setNewSubjectCredits] = useState(4);

  const fetchAcademicData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [hierRes, secRes, subRes] = await Promise.all([
        academicApi.getHierarchy(),
        academicApi.getSections(),
        academicApi.getSubjects()
      ]);

      if (hierRes?.years) setHierarchy(hierRes.years);
      if (secRes?.sections) setSections(secRes.sections);
      if (subRes?.subjects) setSubjects(subRes.subjects);
    } catch (err) {
      console.warn('[HodClassesSections] Error loading academic data:', err.message);
      setError('Unable to load academic structure from backend. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademicData();
  }, []);

  const handleCreateSection = async (e) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;

    try {
      await academicApi.createSection({
        name: newSectionName.trim().toUpperCase(),
        section_name: newSectionName.trim().toUpperCase(),
        semester: parseInt(newSectionSem, 10),
        academicYear: newSectionYear,
        year: newSectionYear,
        capacity: parseInt(newSectionCapacity, 10) || 60
      });
      addToast('Section Created', `Section ${newSectionName.toUpperCase()} provisioned for ${newSectionYear} (Sem ${newSectionSem}) with capacity ${newSectionCapacity}.`, 'success');
      setIsSectionModalOpen(false);
      setNewSectionName('');
      setNewSectionCapacity(60);
      fetchAcademicData();
    } catch (err) {
      addToast('Error Creating Section', err.message || 'Unable to create section.', 'error');
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectCode.trim() || !newSubjectName.trim()) return;

    try {
      await academicApi.createSubject({
        code: newSubjectCode.trim().toUpperCase(),
        name: newSubjectName.trim(),
        semester: parseInt(newSubjectSem, 10),
        credits: parseInt(newSubjectCredits, 10) || 4
      });
      addToast('Subject Added', `${newSubjectCode.toUpperCase()} added to Semester ${newSubjectSem} curriculum.`, 'success');
      setIsSubjectModalOpen(false);
      setNewSubjectCode('');
      setNewSubjectName('');
      fetchAcademicData();
    } catch (err) {
      addToast('Error Adding Subject', err.message || 'Unable to add subject.', 'error');
    }
  };

  const handleDeleteSection = async (sectionId, secName) => {
    if (!window.confirm(`Are you sure you want to remove Section ${secName}?`)) return;
    try {
      await academicApi.deleteSection(sectionId);
      addToast('Section Removed', `Section ${secName} has been successfully deleted.`, 'info');
      fetchAcademicData();
    } catch (err) {
      addToast('Error Deleting Section', err.message || 'Unable to remove section.', 'error');
    }
  };

  const handleDeleteSubject = async (subjectId, subName) => {
    if (!window.confirm(`Are you sure you want to remove Course ${subName}?`)) return;
    try {
      await academicApi.deleteSubject(subjectId);
      addToast('Subject Removed', `Course ${subName} removed from curriculum.`, 'info');
      fetchAcademicData();
    } catch (err) {
      addToast('Error Deleting Course', err.message || 'Unable to remove course.', 'error');
    }
  };

  const currentYearData = hierarchy?.find((y) => y.year === selectedYear) || hierarchy?.[2];
  const activeSemesterData = currentYearData?.semesters?.find((s) => s.semester === selectedSem) || currentYearData?.semesters?.[0];

  const currentSections = sections.filter((s) => s.semester === selectedSem);
  const currentSubjects = subjects.filter((s) => s.semester === selectedSem);

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Classes, Sections & Curriculum Management
              </h1>
              <span className="badge badge-emerald">CSE Department</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Master academic hierarchy across 4 undergraduate years (8 Semesters) with active section quotas
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setIsSectionModalOpen(true)}
              className="btn btn-primary"
              style={{ borderRadius: 'var(--radius-full)' }}
              id="btn-hod-add-section"
            >
              <PlusCircle size={16} />
              <span>+ Provision Section</span>
            </button>
            <button
              onClick={() => setIsSubjectModalOpen(true)}
              className="btn btn-outline"
              style={{ borderRadius: 'var(--radius-full)' }}
              id="btn-hod-add-subject"
            >
              <PlusCircle size={16} />
              <span>+ Add Course</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="card" style={{ backgroundColor: '#FEF2F2', borderColor: '#FECDD3', color: '#991B1B', padding: '1rem' }}>
            {error}
          </div>
        )}

        {/* Year Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '2px' }}>
          {['1st Year', '2nd Year', '3rd Year', '4th Year'].map((yr, idx) => (
            <button
              key={yr}
              onClick={() => {
                setSelectedYear(yr);
                setSelectedSem(idx * 2 + 1);
              }}
              className="btn btn-sm"
              style={{
                backgroundColor: selectedYear === yr ? 'var(--primary)' : '#FFFFFF',
                color: selectedYear === yr ? '#FFFFFF' : 'var(--text-secondary)',
                border: selectedYear === yr ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                fontSize: '12px',
                fontWeight: selectedYear === yr ? 700 : 500,
                boxShadow: selectedYear === yr ? '0 2px 6px rgba(29, 78, 216, 0.2)' : 'var(--shadow-sm)'
              }}
            >
              {yr}
            </button>
          ))}
        </div>

        {/* Semester Tabs under selected year */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {currentYearData?.semesters?.map((semObj) => (
            <button
              key={semObj.semester}
              onClick={() => setSelectedSem(semObj.semester)}
              className="btn btn-sm"
              style={{
                backgroundColor: selectedSem === semObj.semester ? 'var(--surface-high)' : 'transparent',
                color: selectedSem === semObj.semester ? 'var(--primary)' : 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                fontSize: '12px',
                fontWeight: 700
              }}
            >
              Semester {semObj.semester}
            </button>
          ))}
        </div>

        {/* Main 2-Column Content: Sections & Subjects */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* Active Sections */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Active Sections ({selectedYear} - Sem {selectedSem})
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {currentSections.length} sections registered in database
                </span>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading sections...
              </div>
            ) : currentSections.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No records found. Click "+ Provision Section" to create one.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {currentSections.map((sec) => (
                  <div
                    key={sec.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      backgroundColor: 'var(--surface-low)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                          Section {sec.name || sec.section_name}
                        </h4>
                        <span className="badge badge-indigo">Sem {sec.semester}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Academic Year: {sec.academicYear || sec.year || '2026-27'} • Capacity: {sec.capacity || 60}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge badge-emerald" style={{ fontSize: '11px' }}>
                        Roster Active
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteSection(sec.id || sec.name, sec.name || sec.section_name)}
                        className="btn btn-sm"
                        style={{ padding: '0.35rem 0.55rem', color: '#DC2626', border: '1px solid #FECDD3', backgroundColor: '#FEF2F2', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                        title={`Delete Section ${sec.name || sec.section_name}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Curriculum Subjects */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Curriculum Courses (Semester {selectedSem})
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {currentSubjects.length} subjects in department curriculum
                </span>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading courses...
              </div>
            ) : currentSubjects.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No records found. Click "+ Add Course" to register subjects.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {currentSubjects.map((sub) => (
                  <div
                    key={sub.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      backgroundColor: 'var(--surface-low)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="badge badge-indigo" style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '11px' }}>
                        {sub.code}
                      </span>
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {sub.name}
                        </h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Credits: {sub.credits} • Dept: CSE
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge badge-slate" style={{ fontSize: '10px' }}>
                        Core Subject
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubject(sub.id, sub.name)}
                        className="btn btn-sm"
                        style={{ padding: '0.3rem 0.5rem', color: '#DC2626', border: '1px solid #FECDD3', backgroundColor: '#FEF2F2', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                        title="Delete Course"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Provision Section Modal */}
      {isSectionModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 95, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', maxWidth: '440px', width: '100%', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PlusCircle size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>Provision Section</h3>
              </div>
              <button onClick={() => setIsSectionModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSection} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label className="form-label">Academic Year</label>
                <select className="input-field" value={newSectionYear} onChange={(e) => setNewSectionYear(e.target.value)}>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>

              <div>
                <label className="form-label">Semester</label>
                <select className="input-field" value={newSectionSem} onChange={(e) => setNewSectionSem(e.target.value)}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Section Identifier</label>
                <input
                  type="text"
                  placeholder="e.g. A, B, C, D"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value.toUpperCase())}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="form-label">Student Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  placeholder="e.g. 60"
                  value={newSectionCapacity}
                  onChange={(e) => setNewSectionCapacity(e.target.value)}
                  className="input-field"
                  required
                />
                <span style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', display: 'block' }}>
                  Maximum student seats allocated to this section
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsSectionModalOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Create Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {isSubjectModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 95, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', maxWidth: '440px', width: '100%', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PlusCircle size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>Add Curriculum Course</h3>
              </div>
              <button onClick={() => setIsSubjectModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label className="form-label">Subject Code</label>
                <input
                  type="text"
                  placeholder="e.g. CS501"
                  value={newSubjectCode}
                  onChange={(e) => setNewSubjectCode(e.target.value.toUpperCase())}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="form-label">Subject Name</label>
                <input
                  type="text"
                  placeholder="e.g. Database Management Systems"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label className="form-label">Semester</label>
                  <select className="input-field" value={newSubjectSem} onChange={(e) => setNewSubjectSem(e.target.value)}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={newSubjectCredits}
                    onChange={(e) => setNewSubjectCredits(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsSubjectModalOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Add Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

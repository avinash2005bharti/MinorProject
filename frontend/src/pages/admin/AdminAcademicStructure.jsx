import React, { useState } from 'react';
import {
  CSE_YEARS,
  CSE_SEMESTERS,
  RESOURCE_CATEGORIES,
  loadAcademicStructure,
  saveAcademicStructure,
  loadSemesterSectionsList,
  saveSemesterSectionsList,
  generateDefaultAcademicStructure
} from '../../data/cseStructureData';
import DocumentUploader from '../../components/common/DocumentUploader';
import {
  GraduationCap,
  Layers,
  BookOpen,
  FileText,
  HelpCircle,
  CheckSquare,
  FlaskConical,
  FileCheck,
  Bookmark,
  Calendar,
  Bell,
  Globe,
  Plus,
  PlusCircle,
  Trash2,
  Edit3,
  Download,
  Upload,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Clock,
  User,
  MapPin,
  ExternalLink,
  X,
  FileSpreadsheet,
  Printer,
  Eye,
  RotateCcw,
  Users
} from 'lucide-react';

export default function AdminAcademicStructure() {
  // Navigation: Year -> Semester -> Section
  const [selectedYearId, setSelectedYearId] = useState('year-3');
  const [selectedSemId, setSelectedSemId] = useState('sem-5');
  const [selectedSectionLetter, setSelectedSectionLetter] = useState('A');

  // Academic Structure State (persisted to localStorage)
  const [academicData, setAcademicData] = useState(() => loadAcademicStructure());
  const [semesterSections, setSemesterSections] = useState(() => loadSemesterSectionsList());

  // Active Category Tab
  const [activeCategory, setActiveCategory] = useState('subjects');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [newSectionLetter, setNewSectionLetter] = useState('');
  const [newSectionRoom, setNewSectionRoom] = useState('Room 210');
  const [newSectionMentor, setNewSectionMentor] = useState('Dr. S. Roy');

  const [isAddResourceModalOpen, setIsAddResourceModalOpen] = useState(false);
  const [resourceCategory, setResourceCategory] = useState('notes');
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceSubject, setResourceSubject] = useState('');
  const [resourceDetail, setResourceDetail] = useState('');
  const [attachedFileName, setAttachedFileName] = useState('');
  const [attachedFileSize, setAttachedFileSize] = useState('2.4 MB');

  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubFaculty, setNewSubFaculty] = useState('Dr. Rajesh Verma');
  const [newSubCredits, setNewSubCredits] = useState('4');

  // Interactive Document Preview Modal
  const [previewModalData, setPreviewModalData] = useState(null);

  // Interactive Edit Modal
  const [editModalData, setEditModalData] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editDetail, setEditDetail] = useState('');

  // Interactive Add Timetable Slot Modal
  const [isAddSlotModalOpen, setIsAddSlotModalOpen] = useState(false);
  const [slotDay, setSlotDay] = useState('Monday');
  const [slotTime, setSlotTime] = useState('11:30 AM - 12:30 PM');
  const [slotSubject, setSlotSubject] = useState('');
  const [slotFaculty, setSlotFaculty] = useState('Dr. Rajesh Verma');
  const [slotRoom, setSlotRoom] = useState('Room 204');

  // Interactive Edit Timetable Slot Modal
  const [editSlotIdx, setEditSlotIdx] = useState(null);
  const [isEditSlotModalOpen, setIsEditSlotModalOpen] = useState(false);
  const [editSlotDay, setEditSlotDay] = useState('Monday');
  const [editSlotTime, setEditSlotTime] = useState('');
  const [editSlotSubject, setEditSlotSubject] = useState('');
  const [editSlotFaculty, setEditSlotFaculty] = useState('');
  const [editSlotRoom, setEditSlotRoom] = useState('');

  // Interactive Assignment Submissions Modal
  const [submissionsModalData, setSubmissionsModalData] = useState(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Synchronize Semester when Year changes
  const handleYearChange = (yearId) => {
    setSelectedYearId(yearId);
    const yr = CSE_YEARS.find((y) => y.id === yearId);
    if (yr && yr.semesters.length > 0) {
      const firstSem = yr.semesters[0];
      setSelectedSemId(firstSem);
      const available = semesterSections[firstSem] || ['A', 'B'];
      setSelectedSectionLetter(available[0] || 'A');
    }
  };

  // Synchronize Section when Semester changes
  const handleSemChange = (semId) => {
    setSelectedSemId(semId);
    const available = semesterSections[semId] || ['A', 'B'];
    if (!available.includes(selectedSectionLetter)) {
      setSelectedSectionLetter(available[0] || 'A');
    }
  };

  // Active Context
  const activeYear = CSE_YEARS.find((y) => y.id === selectedYearId) || CSE_YEARS[2];
  const activeSem = CSE_SEMESTERS.find((s) => s.id === selectedSemId) || CSE_SEMESTERS[4];
  const availableSections = semesterSections[selectedSemId] || ['A', 'B'];

  // Current Section Data Key: e.g. "year-3_sem-5_sec-a"
  const sectionKey = `${selectedYearId}_${selectedSemId}_sec-${selectedSectionLetter.toLowerCase()}`;
  const sectionData = academicData[sectionKey] || {
    sectionId: `sec-${selectedSectionLetter.toLowerCase()}`,
    sectionName: `Section ${selectedSectionLetter}`,
    sectionLetter: selectedSectionLetter,
    studentsCount: 40,
    room: 'Room 204',
    mentor: 'Prof. K. Sen',
    subjects: [],
    notes: [],
    pyqs: [],
    assignments: [],
    labManuals: [],
    practicalFiles: [],
    syllabus: [],
    timetable: [],
    announcements: [],
    resources: []
  };

  // Persist whenever academicData changes
  const updateAcademicData = (updater) => {
    setAcademicData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveAcademicStructure(next);
      return next;
    });
  };

  // Real File Download Utility (Creates actual file in browser)
  const triggerBrowserDownload = (item, fileExtension = 'pdf') => {
    const filename = (item.title || item.name || 'document').replace(/[^a-zA-Z0-9_-]/g, '_') + `.${fileExtension}`;
    const fileContent = `================================================================================
ORIENTAL INSTITUTE OF SCIENCE & TECHNOLOGY (OIST) BHOPAL
DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING (CSE)
Official Course Material & Section Repository
================================================================================
Document Title  : ${item.title || item.name}
Category        : ${item.category || activeCategory.toUpperCase()}
Academic Year   : ${activeYear.name} (${activeYear.title})
Semester        : ${activeSem.name} (${activeSem.activeTerm})
Section         : Section ${selectedSectionLetter}
Classroom Venue : ${sectionData.room || 'Room 204'}
Mentor / TG     : ${sectionData.mentor || 'Prof. K. Sen'}
Subject / Scope : ${item.subject || item.code || 'Computer Science Engineering Core'}
Verification    : Verified by CSE Academic Administration
Generated On    : ${new Date().toLocaleString()}
================================================================================

CURRICULUM OVERVIEW & CHAPTER NOTES:
1. Fundamental Principles & Architecture Overview
2. Theoretical Framework, Algorithms, and Core Equations
3. Practical Implementation Details & Laboratory Exercises
4. Previous Year Examination Questions & Solution Benchmarks
5. Self-Assessment Exercises and Reference Bibliography

[This is an official instructional repository asset released exclusively for Section ${selectedSectionLetter} students]`;

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`📥 Downloaded "${filename}" to your computer!`);
  };

  // Timetable Real CSV Export
  const handleExportTimetableCSV = () => {
    const slots = sectionData.timetable || [];
    let csv = 'Day,Time Slot,Subject,Code,Faculty,Room\n';
    slots.forEach((s) => {
      csv += `"${s.day}","${s.time}","${s.subject}","${s.code}","${s.faculty}","${s.room}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CSE_${activeYear.name.replace(/\s+/g, '_')}_${activeSem.name.replace(/\s+/g, '_')}_Section_${selectedSectionLetter}_Schedule.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`📥 Exported Section ${selectedSectionLetter} Weekly Timetable CSV!`);
  };

  // Add Section (e.g., Section C, Section D)
  const handleCreateSection = (e) => {
    e.preventDefault();
    const letter = (newSectionLetter || String.fromCharCode(65 + availableSections.length)).toUpperCase().trim();
    if (!letter) return;

    if (availableSections.includes(letter)) {
      showToast(`⚠️ Section ${letter} already exists for ${activeSem.name}!`);
      return;
    }

    const updatedSections = [...availableSections, letter];
    const newSemSections = {
      ...semesterSections,
      [selectedSemId]: updatedSections
    };

    setSemesterSections(newSemSections);
    saveSemesterSectionsList(newSemSections);

    const newKey = `${selectedYearId}_${selectedSemId}_sec-${letter.toLowerCase()}`;
    const baseSubjects = (sectionData.subjects || []).map((s) => ({
      ...s,
      id: `sub-${letter}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      room: newSectionRoom
    }));

    updateAcademicData((prev) => ({
      ...prev,
      [newKey]: {
        sectionId: `sec-${letter.toLowerCase()}`,
        sectionName: `Section ${letter}`,
        sectionLetter: letter,
        studentsCount: 36,
        room: newSectionRoom,
        mentor: newSectionMentor,
        subjects: baseSubjects,
        notes: [],
        pyqs: [],
        assignments: [],
        labManuals: [],
        practicalFiles: [],
        syllabus: sectionData.syllabus || [],
        timetable: [
          { day: 'Monday', time: '10:00 - 11:00 AM', subject: baseSubjects[0]?.name || 'CSE Core', code: baseSubjects[0]?.code || 'CS501', faculty: baseSubjects[0]?.faculty || newSectionMentor, room: newSectionRoom }
        ],
        announcements: [
          { id: `ann-${Date.now()}`, title: `Welcome to Section ${letter}`, content: `Section ${letter} cohort provisioned under ${newSectionMentor}.`, date: 'Today', priority: 'Important', author: newSectionMentor }
        ],
        resources: []
      }
    }));

    setSelectedSectionLetter(letter);
    setIsAddSectionModalOpen(false);
    setNewSectionLetter('');
    showToast(`✅ Section ${letter} successfully added to ${activeSem.name}!`);
  };

  // Delete Section
  const handleDeleteSection = (secLetter) => {
    if (availableSections.length <= 1) {
      showToast('⚠️ A semester must have at least one section.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete Section ${secLetter} from ${activeSem.name}? All its separate materials will be removed.`)) {
      return;
    }

    const updated = availableSections.filter((l) => l !== secLetter);
    const newSemSections = {
      ...semesterSections,
      [selectedSemId]: updated
    };

    setSemesterSections(newSemSections);
    saveSemesterSectionsList(newSemSections);

    const keyToRemove = `${selectedYearId}_${selectedSemId}_sec-${secLetter.toLowerCase()}`;
    updateAcademicData((prev) => {
      const copy = { ...prev };
      delete copy[keyToRemove];
      return copy;
    });

    setSelectedSectionLetter(updated[0]);
    showToast(`🗑️ Section ${secLetter} removed from ${activeSem.name}.`);
  };

  // Add Subject
  const handleAddSubject = (e) => {
    e.preventDefault();
    if (!newSubCode || !newSubName) return;

    const newSubject = {
      id: `sub-${Date.now()}`,
      code: newSubCode.trim().toUpperCase(),
      name: newSubName.trim(),
      faculty: newSubFaculty.trim(),
      credits: parseInt(newSubCredits, 10) || 4,
      hours: 4,
      room: sectionData.room
    };

    updateAcademicData((prev) => ({
      ...prev,
      [sectionKey]: {
        ...sectionData,
        subjects: [...(sectionData.subjects || []), newSubject]
      }
    }));

    setNewSubCode('');
    setNewSubName('');
    setIsAddSubjectModalOpen(false);
    showToast(`✅ Subject ${newSubject.code} added to Section ${selectedSectionLetter}!`);
  };

  // Delete Subject
  const handleDeleteSubject = (subId) => {
    updateAcademicData((prev) => ({
      ...prev,
      [sectionKey]: {
        ...sectionData,
        subjects: sectionData.subjects.filter((s) => s.id !== subId)
      }
    }));
    showToast('🗑️ Subject removed from section.');
  };

  // Upload Resource
  const handleUploadResource = (e) => {
    e.preventDefault();
    const effectiveTitle = resourceTitle.trim() || (attachedFileName ? attachedFileName.replace(/\.[^/.]+$/, '') : `Section ${selectedSectionLetter} Document`);

    const targetCategory = resourceCategory;
    const newItemId = `${targetCategory}-${Date.now()}`;
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    let newItem = {
      id: newItemId,
      title: effectiveTitle,
      subject: resourceSubject || sectionData.subjects[0]?.name || 'CSE Core',
      uploadedAt: dateStr,
      author: 'Administrator',
      fileSize: attachedFileSize || '1.8 MB',
      fileType: 'PDF'
    };

    if (targetCategory === 'pyqs') {
      newItem.year = resourceDetail || '2024';
      newItem.examType = 'End-Semester';
      newItem.hasSolution = true;
    } else if (targetCategory === 'assignments') {
      newItem.dueDate = resourceDetail || '15 Oct 2025';
      newItem.totalMarks = 25;
      newItem.submissionsCount = 0;
      newItem.totalStudents = sectionData.studentsCount;
      newItem.status = 'Active';
    } else if (targetCategory === 'announcements') {
      newItem.content = resourceDetail || resourceTitle;
      newItem.priority = 'Important';
      newItem.date = dateStr;
    } else if (targetCategory === 'resources') {
      newItem.type = 'Resource Link';
      newItem.url = resourceDetail.startsWith('http') ? resourceDetail : 'https://github.com/oist-cse';
      newItem.addedBy = 'Admin Office';
      newItem.date = dateStr;
    }

    const currentList = sectionData[targetCategory] || [];
    updateAcademicData((prev) => ({
      ...prev,
      [sectionKey]: {
        ...sectionData,
        [targetCategory]: [newItem, ...currentList]
      }
    }));

    setResourceTitle('');
    setResourceDetail('');
    setAttachedFileName('');
    setIsAddResourceModalOpen(false);
    setActiveCategory(targetCategory);
    showToast(`✅ Uploaded to Section ${selectedSectionLetter} (${targetCategory})!`);
  };

  // Delete Resource item
  const handleDeleteResourceItem = (categoryKey, itemId) => {
    const currentList = sectionData[categoryKey] || [];
    updateAcademicData((prev) => ({
      ...prev,
      [sectionKey]: {
        ...sectionData,
        [categoryKey]: currentList.filter((item) => item.id !== itemId)
      }
    }));
    showToast('🗑️ Item deleted from section.');
  };

  // Edit Resource item
  const handleOpenEditModal = (item, categoryKey) => {
    setEditModalData({ item, categoryKey });
    setEditTitle(item.title || item.name || '');
    setEditSubject(item.subject || '');
    setEditDetail(
      item.dueDate ||
      item.year ||
      item.content ||
      item.url ||
      item.faculty ||
      item.labRoom ||
      item.format ||
      item.revisionYear ||
      ''
    );
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editModalData || !editTitle) return;

    const { item, categoryKey } = editModalData;
    const currentList = sectionData[categoryKey] || [];

    const updatedList = currentList.map((i) => {
      if (i.id === item.id) {
        const updated = { ...i, title: editTitle, subject: editSubject };
        if (categoryKey === 'assignments') updated.dueDate = editDetail;
        if (categoryKey === 'pyqs') updated.year = editDetail;
        if (categoryKey === 'announcements') updated.content = editDetail;
        if (categoryKey === 'resources') updated.url = editDetail;
        if (categoryKey === 'labManuals') updated.labRoom = editDetail;
        if (categoryKey === 'practicalFiles') updated.format = editDetail;
        if (categoryKey === 'syllabus') updated.revisionYear = editDetail;
        if (categoryKey === 'subjects') {
          updated.name = editTitle;
          updated.faculty = editDetail;
        }
        return updated;
      }
      return i;
    });

    updateAcademicData((prev) => ({
      ...prev,
      [sectionKey]: {
        ...sectionData,
        [categoryKey]: updatedList
      }
    }));

    setEditModalData(null);
    showToast('✏️ Resource updated successfully!');
  };

  // Timetable Slot Edit Handlers
  const handleOpenEditSlot = (slot, idx) => {
    setEditSlotIdx(idx);
    setEditSlotDay(slot.day);
    setEditSlotTime(slot.time);
    setEditSlotSubject(slot.subject);
    setEditSlotFaculty(slot.faculty);
    setEditSlotRoom(slot.room);
    setIsEditSlotModalOpen(true);
  };

  const handleSaveEditSlot = (e) => {
    e.preventDefault();
    if (editSlotIdx === null) return;
    const currentTimetable = [...(sectionData.timetable || [])];
    currentTimetable[editSlotIdx] = {
      day: editSlotDay,
      time: editSlotTime,
      subject: editSlotSubject,
      code: sectionData.subjects.find((s) => s.name === editSlotSubject)?.code || currentTimetable[editSlotIdx].code || 'CS501',
      faculty: editSlotFaculty,
      room: editSlotRoom
    };
    updateAcademicData((prev) => ({
      ...prev,
      [sectionKey]: {
        ...sectionData,
        timetable: currentTimetable
      }
    }));
    setIsEditSlotModalOpen(false);
    setEditSlotIdx(null);
    showToast(`✏️ Timetable slot updated for Section ${selectedSectionLetter}!`);
  };

  // Add Timetable Slot
  const handleAddTimetableSlot = (e) => {
    e.preventDefault();
    if (!slotSubject) return;

    const newSlot = {
      day: slotDay,
      time: slotTime,
      subject: slotSubject,
      code: sectionData.subjects.find((s) => s.name === slotSubject)?.code || 'CS501',
      faculty: slotFaculty,
      room: slotRoom
    };

    updateAcademicData((prev) => ({
      ...prev,
      [sectionKey]: {
        ...sectionData,
        timetable: [...(sectionData.timetable || []), newSlot]
      }
    }));

    setIsAddSlotModalOpen(false);
    showToast(`✅ Class slot added to Section ${selectedSectionLetter} schedule!`);
  };

  const handleDeleteTimetableSlot = (idxToRemove) => {
    updateAcademicData((prev) => ({
      ...prev,
      [sectionKey]: {
        ...sectionData,
        timetable: (sectionData.timetable || []).filter((_, idx) => idx !== idxToRemove)
      }
    }));
    showToast('🗑️ Timetable slot deleted.');
  };

  // Restore Default Mock Data
  const handleRestoreDefaults = () => {
    if (window.confirm('Reset all section materials and restore default Computer Science Engineering sample records?')) {
      const def = generateDefaultAcademicStructure();
      saveAcademicStructure(def);
      setAcademicData(def);
      const defSections = {};
      CSE_SEMESTERS.forEach((s) => { defSections[s.id] = ['A', 'B']; });
      saveSemesterSectionsList(defSections);
      setSemesterSections(defSections);
      showToast('🔄 Initial CSE Academic Structure restored to factory defaults!');
    }
  };

  // Filter Items
  const getFilteredItems = (categoryKey) => {
    const list = sectionData[categoryKey] || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((item) => {
      const matchTitle = (item.title || item.name || '').toLowerCase().includes(q);
      const matchSubject = (item.subject || '').toLowerCase().includes(q);
      const matchCode = (item.code || item.subjectCode || '').toLowerCase().includes(q);
      const matchFaculty = (item.faculty || item.author || '').toLowerCase().includes(q);
      return matchTitle || matchSubject || matchCode || matchFaculty;
    });
  };

  // Category Icon Resolver
  const renderCategoryIcon = (iconName, size = 16) => {
    switch (iconName) {
      case 'BookOpen': return <BookOpen size={size} />;
      case 'FileText': return <FileText size={size} />;
      case 'HelpCircle': return <HelpCircle size={size} />;
      case 'CheckSquare': return <CheckSquare size={size} />;
      case 'FlaskConical': return <FlaskConical size={size} />;
      case 'FileCheck': return <FileCheck size={size} />;
      case 'Bookmark': return <Bookmark size={size} />;
      case 'Calendar': return <Calendar size={size} />;
      case 'Bell': return <Bell size={size} />;
      case 'Globe': default: return <Globe size={size} />;
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
        {/* Toast Alert */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              top: '72px',
              right: '24px',
              zIndex: 110,
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              border: '1px solid #334155',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <CheckCircle2 size={16} color="#34D399" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header: Exclusive CSE Academic Scope */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Computer Science Engineering (CSE)
              </h1>
              <span className="badge badge-indigo">Exclusive CSE Scope</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Academic Hierarchy & Class Section Repository • 4 Years • 8 Semesters • Section-Level Isolation
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setResourceCategory(activeCategory === 'subjects' || activeCategory === 'timetable' ? 'notes' : activeCategory);
                setIsAddResourceModalOpen(true);
              }}
              className="btn btn-primary"
              style={{ fontSize: '12.5px', padding: '0.55rem 1rem', minHeight: '38px' }}
              title="Upload files to currently selected section"
            >
              <Upload size={15} />
              <span>Upload to Section {selectedSectionLetter}</span>
            </button>

            <button
              onClick={() => setIsAddSectionModalOpen(true)}
              className="btn btn-outline"
              style={{ fontSize: '12.5px', padding: '0.55rem 1rem', minHeight: '38px' }}
              title="Add a new section to this semester"
            >
              <PlusCircle size={15} />
              <span>Add New Section</span>
            </button>

            <button
              onClick={handleRestoreDefaults}
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '0.55rem 0.85rem', minHeight: '38px' }}
              title="Restore initial sample data"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* STEP 1: Academic Years Navigation Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Step 1: Select Academic Year
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bachelor of Technology (B.Tech)</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
            {CSE_YEARS.map((yr) => {
              const isActive = selectedYearId === yr.id;
              return (
                <button
                  key={yr.id}
                  onClick={() => handleYearChange(yr.id)}
                  style={{
                    padding: '1rem 1.15rem',
                    borderRadius: '16px',
                    border: isActive ? '2px solid #2563EB' : '1px solid var(--border-subtle)',
                    backgroundColor: isActive ? 'var(--primary-container)' : '#FFFFFF',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    boxShadow: isActive ? '0 4px 14px rgba(29, 78, 216, 0.15)' : 'var(--shadow-sm)',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#EFF6FF';
                      e.currentTarget.style.borderColor = '#93C5FD';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    } else {
                      e.currentTarget.style.backgroundColor = '#BFDBFE';
                      e.currentTarget.style.borderColor = '#1D4ED8';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    } else {
                      e.currentTarget.style.backgroundColor = 'var(--primary-container)';
                      e.currentTarget.style.borderColor = '#2563EB';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '0.2rem 0.65rem',
                        borderRadius: '999px',
                        backgroundColor: isActive ? '#1D4ED8' : '#F1F5F9',
                        color: isActive ? '#FFFFFF' : '#475569'
                      }}
                    >
                      Year {yr.yearNumber}
                    </span>
                    <GraduationCap size={18} color={isActive ? '#1D4ED8' : '#94A3B8'} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: isActive ? '#001551' : 'var(--text-primary)' }}>
                      {yr.name}
                    </h3>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                      {yr.title} • {yr.semesters.map((s) => s.replace('sem-', 'Sem ')).join(' & ')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 2 & 3: Semester & Section Selection Bar */}
        <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Semester Selector Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '4px' }}>
                Step 2 (Semester):
              </span>
              {activeYear.semesters.map((semId) => {
                const semObj = CSE_SEMESTERS.find((s) => s.id === semId);
                const isSemActive = selectedSemId === semId;
                return (
                  <button
                    key={semId}
                    onClick={() => handleSemChange(semId)}
                    className="btn btn-sm"
                    style={{
                      fontSize: '12.5px',
                      padding: '0.45rem 1rem',
                      fontWeight: isSemActive ? 800 : 600,
                      backgroundColor: isSemActive ? '#1D4ED8' : '#F1F5F9',
                      color: isSemActive ? '#FFFFFF' : '#334155',
                      border: isSemActive ? '1px solid #1D4ED8' : '1px solid #E2E8F0',
                      boxShadow: isSemActive ? '0 2px 8px rgba(29, 78, 216, 0.25)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSemActive) {
                        e.currentTarget.style.backgroundColor = '#DBEAFE';
                        e.currentTarget.style.color = '#1D4ED8';
                        e.currentTarget.style.borderColor = '#93C5FD';
                      } else {
                        e.currentTarget.style.backgroundColor = '#1E40AF';
                        e.currentTarget.style.borderColor = '#1E40AF';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSemActive) {
                        e.currentTarget.style.backgroundColor = '#F1F5F9';
                        e.currentTarget.style.color = '#334155';
                        e.currentTarget.style.borderColor = '#E2E8F0';
                      } else {
                        e.currentTarget.style.backgroundColor = '#1D4ED8';
                        e.currentTarget.style.color = '#FFFFFF';
                        e.currentTarget.style.borderColor = '#1D4ED8';
                      }
                    }}
                  >
                    <span>{semObj.name}</span>
                    <span style={{ fontSize: '10px', marginLeft: '4px', opacity: 0.85 }}>({semObj.activeTerm.split(' ')[0]})</span>
                  </button>
                );
              })}
            </div>

            {/* Breadcrumb Trail */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '11.5px', color: 'var(--text-secondary)', backgroundColor: 'var(--surface-low)', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>CSE</span>
              <ChevronRight size={12} color="#94A3B8" />
              <span>{activeYear.name}</span>
              <ChevronRight size={12} color="#94A3B8" />
              <span>{activeSem.name}</span>
              <ChevronRight size={12} color="#94A3B8" />
              <span style={{ fontWeight: 800, color: '#1D4ED8' }}>Section {selectedSectionLetter}</span>
            </div>
          </div>

          {/* Section Selector Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '4px' }}>
                Step 3 (Section):
              </span>
              {availableSections.map((secLetter) => {
                const isSecActive = selectedSectionLetter === secLetter;
                return (
                  <div
                    key={secLetter}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: isSecActive ? '1.5px solid #0F172A' : '1px solid var(--border-subtle)',
                      boxShadow: isSecActive ? '0 2px 8px rgba(15, 23, 42, 0.15)' : 'var(--shadow-sm)'
                    }}
                  >
                    <button
                      onClick={() => setSelectedSectionLetter(secLetter)}
                      style={{
                        padding: '0.45rem 0.95rem',
                        fontSize: '12px',
                        fontWeight: 800,
                        backgroundColor: isSecActive ? '#0F172A' : '#FFFFFF',
                        color: isSecActive ? '#FFFFFF' : '#334155',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSecActive) {
                          e.currentTarget.style.backgroundColor = '#EFF6FF';
                          e.currentTarget.style.color = '#1D4ED8';
                        } else {
                          e.currentTarget.style.backgroundColor = '#1E293B';
                          e.currentTarget.style.color = '#93C5FD';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSecActive) {
                          e.currentTarget.style.backgroundColor = '#FFFFFF';
                          e.currentTarget.style.color = '#334155';
                        } else {
                          e.currentTarget.style.backgroundColor = '#0F172A';
                          e.currentTarget.style.color = '#FFFFFF';
                        }
                      }}
                    >
                      Section {secLetter}
                    </button>
                    {availableSections.length > 1 && (
                      <button
                        onClick={() => handleDeleteSection(secLetter)}
                        style={{
                          padding: '0.45rem 0.55rem',
                          backgroundColor: isSecActive ? '#0F172A' : '#FFFFFF',
                          color: '#94A3B8',
                          border: 'none',
                          borderLeft: isSecActive ? '1px solid #334155' : '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.18s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#FEE2E2';
                          e.currentTarget.style.color = '#DC2626';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isSecActive ? '#0F172A' : '#FFFFFF';
                          e.currentTarget.style.color = '#94A3B8';
                        }}
                        title={`Delete Section ${secLetter}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                );
              })}

              <button
                onClick={() => setIsAddSectionModalOpen(true)}
                className="btn btn-sm btn-outline"
                style={{
                  fontSize: '11.5px',
                  padding: '0.45rem 0.85rem',
                  borderStyle: 'dashed',
                  borderColor: '#93C5FD',
                  color: '#1D4ED8',
                  backgroundColor: '#F8FAFC'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#EFF6FF';
                  e.currentTarget.style.borderColor = '#2563EB';
                  e.currentTarget.style.color = '#1E40AF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F8FAFC';
                  e.currentTarget.style.borderColor = '#93C5FD';
                  e.currentTarget.style.color = '#1D4ED8';
                }}
              >
                <Plus size={13} />
                <span>Add Section</span>
              </button>
            </div>

            {/* Active section info badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <MapPin size={13} color="#64748B" />
                <strong>{sectionData.room || 'Room 204'}</strong>
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <User size={13} color="#64748B" />
                <span>Mentor: <strong>{sectionData.mentor || 'Prof. K. Sen'}</strong></span>
              </span>
              <span>•</span>
              <span style={{ color: '#059669', fontWeight: 700 }}>
                {sectionData.studentsCount || 40} Students Enrolled
              </span>
            </div>
          </div>
        </div>

        {/* SECTION REPOSITORY MAIN CONTAINER */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Section Summary Banner */}
          <div
            style={{
              padding: '1.15rem 1.25rem',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(239, 246, 255, 0.95) 0%, rgba(241, 245, 249, 0.8) 100%)',
              border: '1px solid rgba(191, 219, 254, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-indigo" style={{ fontSize: '11px' }}>
                  {activeYear.name} • {activeSem.name}
                </span>
                <span className="badge badge-emerald" style={{ fontSize: '11px' }}>
                  Separate Workspace: Section {selectedSectionLetter}
                </span>
              </div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                Section {selectedSectionLetter} Academic Repository & Files
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                All curriculum resources, lecture notes, PYQs, and lab manuals are isolated to Section {selectedSectionLetter}.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setIsAddSubjectModalOpen(true)}
                className="btn btn-sm btn-outline"
                style={{ fontSize: '12px', padding: '0.45rem 0.85rem' }}
              >
                <Plus size={13} />
                <span>Add Subject</span>
              </button>
              <button
                onClick={() => {
                  setResourceCategory(activeCategory === 'subjects' || activeCategory === 'timetable' ? 'notes' : activeCategory);
                  setIsAddResourceModalOpen(true);
                }}
                className="btn btn-sm btn-primary"
                style={{ fontSize: '12px', padding: '0.45rem 1rem' }}
              >
                <Upload size={13} />
                <span>Upload File</span>
              </button>
            </div>
          </div>

          {/* 10 Category Navigation Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.35rem', borderBottom: '1px solid var(--border-subtle)' }}>
            {RESOURCE_CATEGORIES.map((cat) => {
              const count = (sectionData[cat.id] || []).length;
              const isCatActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setSearchQuery('');
                  }}
                  className="btn btn-sm"
                  style={{
                    fontSize: '12px',
                    padding: '0.45rem 0.85rem',
                    fontWeight: isCatActive ? 800 : 600,
                    flexShrink: 0,
                    gap: '0.4rem',
                    backgroundColor: isCatActive ? '#1D4ED8' : '#FFFFFF',
                    color: isCatActive ? '#FFFFFF' : '#475569',
                    border: isCatActive ? '1px solid #1D4ED8' : '1px solid var(--border-subtle)',
                    boxShadow: isCatActive ? '0 2px 8px rgba(29, 78, 216, 0.25)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isCatActive) {
                      e.currentTarget.style.backgroundColor = '#EFF6FF';
                      e.currentTarget.style.color = '#1D4ED8';
                      e.currentTarget.style.borderColor = '#93C5FD';
                    } else {
                      e.currentTarget.style.backgroundColor = '#1E40AF';
                      e.currentTarget.style.borderColor = '#1E40AF';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCatActive) {
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                      e.currentTarget.style.color = '#475569';
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    } else {
                      e.currentTarget.style.backgroundColor = '#1D4ED8';
                      e.currentTarget.style.color = '#FFFFFF';
                      e.currentTarget.style.borderColor = '#1D4ED8';
                    }
                  }}
                >
                  {renderCategoryIcon(cat.icon, 14)}
                  <span>{cat.name}</span>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '0.1rem 0.45rem',
                      borderRadius: '999px',
                      fontWeight: 800,
                      backgroundColor: isCatActive ? 'rgba(255, 255, 255, 0.25)' : '#E2E8F0',
                      color: isCatActive ? '#FFFFFF' : '#334155'
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Bar & Action Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '220px', maxWidth: '420px' }}>
              <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Filter ${activeCategory} in Section ${selectedSectionLetter}...`}
                style={{
                  width: '100%',
                  paddingLeft: '32px',
                  paddingRight: searchQuery ? '32px' : '12px',
                  paddingTop: '0.45rem',
                  paddingBottom: '0.45rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '12.5px',
                  backgroundColor: 'var(--surface-low)',
                  outline: 'none'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span>Showing: <strong>{getFilteredItems(activeCategory).length} items</strong></span>
              <span>•</span>
              <span style={{ color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', fontSize: '11px' }}>
                {RESOURCE_CATEGORIES.find((c) => c.id === activeCategory)?.name}
              </span>
            </div>
          </div>

          {/* ===================== TAB 1: SUBJECTS ===================== */}
          {activeCategory === 'subjects' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {getFilteredItems('subjects').length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', backgroundColor: 'var(--surface-low)', borderRadius: '16px', border: '1px dashed var(--border-subtle)', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No curriculum subjects recorded for Section {selectedSectionLetter}.
                  <div style={{ marginTop: '0.75rem' }}>
                    <button onClick={() => setIsAddSubjectModalOpen(true)} className="btn btn-sm btn-primary">
                      <Plus size={13} /> Add First Subject
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
                  {getFilteredItems('subjects').map((sub) => (
                    <div
                      key={sub.id}
                      className="card"
                      style={{
                        padding: '1rem 1.15rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <div>
                          <span className="badge badge-indigo" style={{ fontSize: '10.5px' }}>{sub.code}</span>
                          <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{sub.name}</h4>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                            Faculty: <strong>{sub.faculty}</strong>
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenEditModal(sub, 'subjects')}
                            className="btn-icon"
                            title="Edit Subject"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(sub.id)}
                            className="btn-icon btn-icon-danger"
                            title="Delete Subject"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        <span>Credits: <strong>{sub.credits}</strong> ({sub.hours || 4} hrs/wk)</span>
                        <span style={{ color: 'var(--text-muted)' }}>{sub.room || sectionData.room}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB 2: NOTES ===================== */}
          {activeCategory === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {getFilteredItems('notes').length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', backgroundColor: 'var(--surface-low)', borderRadius: '16px', border: '1px dashed var(--border-subtle)', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No lecture notes uploaded for Section {selectedSectionLetter} yet.
                  <div style={{ marginTop: '0.75rem' }}>
                    <button onClick={() => { setResourceCategory('notes'); setIsAddResourceModalOpen(true); }} className="btn btn-sm btn-primary">
                      <Upload size={13} /> Upload Notes
                    </button>
                  </div>
                </div>
              ) : (
                getFilteredItems('notes').map((note) => (
                  <div
                    key={note.id}
                    style={{
                      padding: '0.85rem 1rem',
                      backgroundColor: 'var(--surface-low)',
                      borderRadius: '14px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      transition: 'all 0.18s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#93C5FD'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-low)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#DBEAFE', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={18} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{note.title}</h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '1px' }}>
                          {note.subject} • {note.fileSize} • Uploaded {note.uploadedAt} by {note.author}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                      <button
                        onClick={() => setPreviewModalData({ ...note, category: 'Lecture Notes' })}
                        className="btn btn-sm btn-outline"
                        style={{ fontSize: '11.5px', padding: '0.35rem 0.75rem', color: '#1D4ED8' }}
                      >
                        <Eye size={12} />
                        <span>Preview</span>
                      </button>

                      <button
                        onClick={() => triggerBrowserDownload(note, 'pdf')}
                        className="btn btn-sm btn-primary"
                        style={{ fontSize: '11.5px', padding: '0.35rem 0.75rem' }}
                      >
                        <Download size={12} />
                        <span>Download</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(note, 'notes')}
                        className="btn-icon"
                        title="Edit note"
                      >
                        <Edit3 size={14} />
                      </button>

                      <button
                        onClick={() => handleDeleteResourceItem('notes', note.id)}
                        className="btn-icon btn-icon-danger"
                        title="Delete note"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ===================== TAB 3: PYQS ===================== */}
          {activeCategory === 'pyqs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {getFilteredItems('pyqs').length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', backgroundColor: 'var(--surface-low)', borderRadius: '16px', border: '1px dashed var(--border-subtle)', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No previous year questions uploaded for Section {selectedSectionLetter}.
                </div>
              ) : (
                getFilteredItems('pyqs').map((pyq) => (
                  <div
                    key={pyq.id}
                    style={{
                      padding: '0.85rem 1rem',
                      backgroundColor: 'var(--surface-low)',
                      borderRadius: '14px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      transition: 'all 0.18s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#FCD34D'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-low)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <HelpCircle size={18} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>{pyq.title}</h4>
                          <span className="badge badge-amber" style={{ fontSize: '10px' }}>{pyq.year}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '1px' }}>
                          {pyq.subject} • {pyq.examType} • {pyq.fileSize} {pyq.hasSolution ? '• Verified Solutions Attached' : ''}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                      <button
                        onClick={() => setPreviewModalData({ ...pyq, category: 'Previous Year Exam Paper' })}
                        className="btn btn-sm btn-outline"
                        style={{ fontSize: '11.5px', padding: '0.35rem 0.75rem' }}
                      >
                        <Eye size={12} />
                        <span>View</span>
                      </button>

                      <button
                        onClick={() => triggerBrowserDownload(pyq, 'pdf')}
                        className="btn btn-sm btn-primary"
                        style={{ fontSize: '11.5px', padding: '0.35rem 0.75rem' }}
                      >
                        <Download size={12} />
                        <span>PDF</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(pyq, 'pyqs')}
                        className="btn-icon"
                        title="Edit PYQ"
                      >
                        <Edit3 size={14} />
                      </button>

                      <button
                        onClick={() => handleDeleteResourceItem('pyqs', pyq.id)}
                        className="btn-icon btn-icon-danger"
                        title="Delete PYQ"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ===================== TAB 4: ASSIGNMENTS ===================== */}
          {activeCategory === 'assignments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {getFilteredItems('assignments').length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', backgroundColor: 'var(--surface-low)', borderRadius: '16px', border: '1px dashed var(--border-subtle)', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No assignments registered for Section {selectedSectionLetter}.
                </div>
              ) : (
                getFilteredItems('assignments').map((asg) => (
                  <div
                    key={asg.id}
                    style={{
                      padding: '0.85rem 1rem',
                      backgroundColor: 'var(--surface-low)',
                      borderRadius: '14px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      transition: 'all 0.18s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#A7F3D0'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-low)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CheckSquare size={18} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>{asg.title}</h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '1px' }}>
                          {asg.subject} • Due: {asg.dueDate} • Max: {asg.totalMarks} Marks • Submissions: {asg.submissionsCount}/{asg.totalStudents}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                      <button
                        onClick={() => setSubmissionsModalData(asg)}
                        className="btn btn-sm btn-outline"
                        style={{ fontSize: '11.5px', padding: '0.35rem 0.75rem' }}
                      >
                        <Users size={12} />
                        <span>Submissions ({asg.submissionsCount})</span>
                      </button>

                      <button
                        onClick={() => triggerBrowserDownload(asg, 'pdf')}
                        className="btn btn-sm btn-secondary"
                        style={{ fontSize: '11.5px', padding: '0.35rem 0.75rem' }}
                      >
                        <Download size={12} />
                        <span>Rubric</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(asg, 'assignments')}
                        className="btn-icon"
                        title="Edit Assignment"
                      >
                        <Edit3 size={14} />
                      </button>

                      <button
                        onClick={() => handleDeleteResourceItem('assignments', asg.id)}
                        className="btn-icon btn-icon-danger"
                        title="Delete Assignment"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ===================== TAB 5: LAB MANUALS ===================== */}
          {activeCategory === 'labManuals' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {getFilteredItems('labManuals').length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', backgroundColor: 'var(--surface-low)', borderRadius: '16px', border: '1px dashed var(--border-subtle)', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No lab manuals recorded for Section {selectedSectionLetter}.
                </div>
              ) : (
                getFilteredItems('labManuals').map((lm) => (
                  <div
                    key={lm.id}
                    style={{
                      padding: '0.85rem 1rem',
                      backgroundColor: 'var(--surface-low)',
                      borderRadius: '14px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      transition: 'all 0.18s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#C7D2FE'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-low)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#E0E7FF', color: '#4338CA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FlaskConical size={18} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>{lm.title}</h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '1px' }}>
                          {lm.subject} • {lm.experimentsCount} Experiments • Lab Venue: {lm.labRoom} • {lm.fileSize}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                      <button
                        onClick={() => setPreviewModalData({ ...lm, category: 'Laboratory Practical Manual' })}
                        className="btn btn-sm btn-outline"
                        style={{ fontSize: '11.5px', padding: '0.35rem 0.75rem' }}
                      >
                        <Eye size={12} />
                        <span>Experiments</span>
                      </button>

                      <button
                        onClick={() => triggerBrowserDownload(lm, 'pdf')}
                        className="btn btn-sm btn-primary"
                        style={{ fontSize: '11.5px', padding: '0.35rem 0.75rem' }}
                      >
                        <Download size={12} />
                        <span>Manual</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(lm, 'labManuals')}
                        className="btn-icon"
                        title="Edit Lab Manual"
                      >
                        <Edit3 size={14} />
                      </button>

                      <button
                        onClick={() => handleDeleteResourceItem('labManuals', lm.id)}
                        className="btn-icon btn-icon-danger"
                        title="Delete Lab Manual"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ===================== TAB 6: PRACTICAL FILES ===================== */}
          {activeCategory === 'practicalFiles' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {getFilteredItems('practicalFiles').length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', backgroundColor: 'var(--surface-low)', borderRadius: '16px', border: '1px dashed var(--border-subtle)', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No practical files format uploaded for Section {selectedSectionLetter}.
                </div>
              ) : (
                getFilteredItems('practicalFiles').map((pf) => (
                  <div
                    key={pf.id}
                    style={{
                      padding: '0.85rem 1rem',
                      backgroundColor: 'var(--surface-low)',
                      borderRadius: '14px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      transition: 'all 0.18s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#A7F3D0'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-low)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileCheck size={18} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>{pf.title}</h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '1px' }}>
                          Format: {pf.format} • {pf.fileSize} • Uploaded {pf.uploadedAt}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                      <button
                        onClick={() => setPreviewModalData({ ...pf, category: 'Practical File Certificate & Viva Sheet' })}
                        className="btn btn-sm btn-outline"
                        style={{ fontSize: '11.5px', padding: '0.35rem 0.75rem' }}
                      >
                        <Eye size={12} />
                        <span>Viva Index</span>
                      </button>

                      <button
                        onClick={() => triggerBrowserDownload(pf, 'docx')}
                        className="btn btn-sm btn-primary"
                        style={{ fontSize: '11.5px', padding: '0.35rem 0.75rem' }}
                      >
                        <Download size={12} />
                        <span>Template</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(pf, 'practicalFiles')}
                        className="btn-icon"
                        title="Edit Practical File"
                      >
                        <Edit3 size={14} />
                      </button>

                      <button
                        onClick={() => handleDeleteResourceItem('practicalFiles', pf.id)}
                        className="btn-icon btn-icon-danger"
                        title="Delete Practical File"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ===================== TAB 7: SYLLABUS ===================== */}
          {activeCategory === 'syllabus' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {getFilteredItems('syllabus').length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', backgroundColor: 'var(--surface-low)', borderRadius: '16px', border: '1px dashed var(--border-subtle)', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No curriculum syllabus mapped for Section {selectedSectionLetter}.
                </div>
              ) : (
                getFilteredItems('syllabus').map((syl) => (
                  <div
                    key={syl.id}
                    style={{
                      padding: '0.85rem 1rem',
                      backgroundColor: 'var(--surface-low)',
                      borderRadius: '14px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      transition: 'all 0.18s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#C7D2FE'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-low)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#E0E7FF', color: '#4338CA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Bookmark size={18} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>{syl.title}</h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '1px' }}>
                          {syl.accreditation} • Revision: {syl.revisionYear} • Size: {syl.fileSize}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                      <button
                        onClick={() => setPreviewModalData({ ...syl, category: 'Curriculum Scheme & Unit Breakdowns' })}
                        className="btn btn-sm btn-outline"
                        style={{ fontSize: '11.5px', padding: '0.35rem 0.75rem' }}
                      >
                        <Eye size={12} />
                        <span>Curriculum</span>
                      </button>

                      <button
                        onClick={() => triggerBrowserDownload(syl, 'pdf')}
                        className="btn btn-sm btn-primary"
                        style={{ fontSize: '11.5px', padding: '0.35rem 0.75rem' }}
                      >
                        <Download size={12} />
                        <span>Syllabus</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(syl, 'syllabus')}
                        className="btn-icon"
                        title="Edit Syllabus"
                      >
                        <Edit3 size={14} />
                      </button>

                      <button
                        onClick={() => handleDeleteResourceItem('syllabus', syl.id)}
                        className="btn-icon btn-icon-danger"
                        title="Delete Syllabus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ===================== TAB 8: TIMETABLE ===================== */}
          {activeCategory === 'timetable' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Weekly Class Schedule for Section {selectedSectionLetter} ({sectionData.room || 'Room 204'})
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => setIsAddSlotModalOpen(true)}
                    className="btn btn-sm btn-outline"
                    style={{ fontSize: '11.5px', padding: '0.35rem 0.75rem' }}
                  >
                    <Plus size={13} />
                    <span>Add Slot</span>
                  </button>
                  <button
                    onClick={handleExportTimetableCSV}
                    className="btn btn-sm btn-primary"
                    style={{ fontSize: '11.5px', padding: '0.35rem 0.85rem' }}
                  >
                    <FileSpreadsheet size={13} />
                    <span>Export Schedule CSV</span>
                  </button>
                  <button
                    onClick={() => {
                      window.print();
                      showToast(`🖨️ Opening Section ${selectedSectionLetter} Timetable print view...`);
                    }}
                    className="btn btn-sm btn-outline"
                    style={{ fontSize: '11.5px', padding: '0.35rem 0.85rem' }}
                  >
                    <Printer size={13} />
                    <span>Print Schedule</span>
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '12.5px', textAlign: 'left', borderCollapse: 'collapse', border: '1px solid var(--border-subtle)', borderRadius: '14px', overflow: 'hidden' }}>
                  <thead style={{ backgroundColor: 'var(--surface-low)', color: 'var(--text-primary)', fontWeight: 800 }}>
                    <tr>
                      <th style={{ padding: '0.65rem 0.85rem', borderBottom: '1px solid var(--border-subtle)' }}>Day</th>
                      <th style={{ padding: '0.65rem 0.85rem', borderBottom: '1px solid var(--border-subtle)' }}>Time Slot</th>
                      <th style={{ padding: '0.65rem 0.85rem', borderBottom: '1px solid var(--border-subtle)' }}>Subject</th>
                      <th style={{ padding: '0.65rem 0.85rem', borderBottom: '1px solid var(--border-subtle)' }}>Code</th>
                      <th style={{ padding: '0.65rem 0.85rem', borderBottom: '1px solid var(--border-subtle)' }}>Faculty</th>
                      <th style={{ padding: '0.65rem 0.85rem', borderBottom: '1px solid var(--border-subtle)' }}>Room</th>
                      <th style={{ padding: '0.65rem 0.85rem', borderBottom: '1px solid var(--border-subtle)', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(sectionData.timetable || []).map((slot, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : 'var(--surface-low)' }}>
                        <td style={{ padding: '0.65rem 0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>{slot.day}</td>
                        <td style={{ padding: '0.65rem 0.85rem', color: 'var(--text-secondary)' }} className="tabular-nums">{slot.time}</td>
                        <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: '#0F172A' }}>{slot.subject}</td>
                        <td style={{ padding: '0.65rem 0.85rem' }}><span className="badge badge-indigo" style={{ fontSize: '10px' }}>{slot.code}</span></td>
                        <td style={{ padding: '0.65rem 0.85rem', color: 'var(--text-secondary)' }}>{slot.faculty}</td>
                        <td style={{ padding: '0.65rem 0.85rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{slot.room}</td>
                        <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              onClick={() => handleOpenEditSlot(slot, idx)}
                              className="btn-icon"
                              title="Edit slot"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteTimetableSlot(idx)}
                              className="btn-icon btn-icon-danger"
                              title="Remove slot"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===================== TAB 9: ANNOUNCEMENTS ===================== */}
          {activeCategory === 'announcements' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {getFilteredItems('announcements').length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', backgroundColor: 'var(--surface-low)', borderRadius: '16px', border: '1px dashed var(--border-subtle)', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No announcements broadcasted for Section {selectedSectionLetter}.
                </div>
              ) : (
                getFilteredItems('announcements').map((ann) => (
                  <div
                    key={ann.id}
                    style={{
                      padding: '1rem',
                      backgroundColor: 'var(--surface-low)',
                      borderRadius: '14px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.45rem',
                      transition: 'all 0.18s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#93C5FD'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-low)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Bell size={15} color="#1D4ED8" />
                        <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)' }}>{ann.title}</h4>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span className="badge badge-amber" style={{ fontSize: '10px' }}>{ann.priority}</span>
                        <button
                          onClick={() => handleOpenEditModal(ann, 'announcements')}
                          className="btn-icon"
                          title="Edit announcement"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteResourceItem('announcements', ann.id)}
                          className="btn-icon btn-icon-danger"
                          title="Delete announcement"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ann.content}</p>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', paddingTop: '0.35rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Issued by: <strong>{ann.author}</strong></span>
                      <span>{ann.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ===================== TAB 10: OTHER RESOURCES ===================== */}
          {activeCategory === 'resources' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {getFilteredItems('resources').length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', backgroundColor: 'var(--surface-low)', borderRadius: '16px', border: '1px dashed var(--border-subtle)', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No supplementary web resources mapped for Section {selectedSectionLetter}.
                </div>
              ) : (
                getFilteredItems('resources').map((res) => (
                  <div
                    key={res.id}
                    style={{
                      padding: '0.85rem 1rem',
                      backgroundColor: 'var(--surface-low)',
                      borderRadius: '14px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      transition: 'all 0.18s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#93C5FD'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-low)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#DBEAFE', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Globe size={18} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>{res.title}</h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {res.type} • {res.url}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-outline"
                        style={{ fontSize: '11.5px', padding: '0.35rem 0.75rem', color: '#1D4ED8' }}
                      >
                        <ExternalLink size={12} />
                        <span>Open Link</span>
                      </a>

                      <button
                        onClick={() => handleOpenEditModal(res, 'resources')}
                        className="btn-icon"
                        title="Edit resource"
                      >
                        <Edit3 size={14} />
                      </button>

                      <button
                        onClick={() => handleDeleteResourceItem('resources', res.id)}
                        className="btn-icon btn-icon-danger"
                        title="Delete resource"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===================== MODAL 1: ADD NEW SECTION ===================== */}
      {isAddSectionModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 95, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-subtle)', maxWidth: '440px', width: '100%', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  +
                </div>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>Provision New Class Section</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{activeYear.name} • {activeSem.name}</span>
                </div>
              </div>
              <button onClick={() => setIsAddSectionModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSection} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '12.5px' }}>
              <div>
                <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Section Letter / Name</label>
                <input
                  type="text"
                  value={newSectionLetter}
                  onChange={(e) => setNewSectionLetter(e.target.value.toUpperCase())}
                  placeholder={`e.g. ${String.fromCharCode(65 + availableSections.length)}`}
                  maxLength={4}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', outline: 'none', fontSize: '13px', fontWeight: 800, fontFamily: 'monospace' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Classroom Venue</label>
                <input
                  type="text"
                  value={newSectionRoom}
                  onChange={(e) => setNewSectionRoom(e.target.value)}
                  placeholder="e.g. Room 212 / Block B"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', outline: 'none', fontSize: '12.5px' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Teacher Guardian (TG Mentor)</label>
                <input
                  type="text"
                  value={newSectionMentor}
                  onChange={(e) => setNewSectionMentor(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Verma"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', outline: 'none', fontSize: '12.5px' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button type="button" onClick={() => setIsAddSectionModalOpen(false)} className="btn btn-sm btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-primary">
                  Create Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: ADD SUBJECT ===================== */}
      {isAddSubjectModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 95, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-subtle)', maxWidth: '440px', width: '100%', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>Add Subject to Section {selectedSectionLetter}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{activeYear.name} • {activeSem.name}</span>
                </div>
              </div>
              <button onClick={() => setIsAddSubjectModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubject} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '12.5px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Subject Code</label>
                  <input
                    type="text"
                    value={newSubCode}
                    onChange={(e) => setNewSubCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CS506"
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', outline: 'none', fontWeight: 800, fontFamily: 'monospace' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Credits</label>
                  <input
                    type="number"
                    value={newSubCredits}
                    onChange={(e) => setNewSubCredits(e.target.value)}
                    min={1}
                    max={8}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', outline: 'none' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Subject Full Name</label>
                <input
                  type="text"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="e.g. Cloud Computing & Virtualization"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Assigned Faculty</label>
                <input
                  type="text"
                  value={newSubFaculty}
                  onChange={(e) => setNewSubFaculty(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Verma"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button type="button" onClick={() => setIsAddSubjectModalOpen(false)} className="btn btn-sm btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-primary">
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 3: UPLOAD RESOURCE ===================== */}
      {isAddResourceModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 95, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-subtle)', maxWidth: '460px', width: '100%', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Upload size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>Upload Resource to Section {selectedSectionLetter}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{activeYear.name} • {activeSem.name}</span>
                </div>
              </div>
              <button onClick={() => setIsAddResourceModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadResource} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '12.5px' }}>
              <div>
                <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Select Resource Category</label>
                <select
                  value={resourceCategory}
                  onChange={(e) => setResourceCategory(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', outline: 'none', backgroundColor: '#FFFFFF' }}
                >
                  {RESOURCE_CATEGORIES.filter((c) => c.id !== 'subjects' && c.id !== 'timetable').map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Title / Document Name</label>
                <input
                  type="text"
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  placeholder="e.g. Unit 3 Advanced Graph Traversal Notes"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Associated Subject</label>
                <select
                  value={resourceSubject}
                  onChange={(e) => setResourceSubject(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', outline: 'none', backgroundColor: '#FFFFFF' }}
                >
                  <option value="">-- General CSE Coursework --</option>
                  {(sectionData.subjects || []).map((s) => (
                    <option key={s.id} value={s.name}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                  {resourceCategory === 'assignments' ? 'Due Date' : resourceCategory === 'pyqs' ? 'Exam Year' : 'Extra Description / Details'}
                </label>
                <input
                  type="text"
                  value={resourceDetail}
                  onChange={(e) => setResourceDetail(e.target.value)}
                  placeholder={resourceCategory === 'assignments' ? 'e.g. 25 Oct 2025' : resourceCategory === 'pyqs' ? 'e.g. 2024 End-Sem' : 'e.g. Practice questions with complete step-by-step solutions'}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', outline: 'none' }}
                />
              </div>

              <div>
                <DocumentUploader
                  label="Attach Coursework File / Resource"
                  hint="Select document, problem set, notes, or syllabus file (PDF, DOCX, ZIP)"
                  selectedFileName={attachedFileName}
                  selectedFileSize={attachedFileSize}
                  onFileSelect={(fileInfo) => {
                    setAttachedFileName(fileInfo.name);
                    setAttachedFileSize(fileInfo.size);
                    if (!resourceTitle.trim()) {
                      setResourceTitle(fileInfo.name.replace(/\.[^/.]+$/, ''));
                    }
                  }}
                  onFileRemove={() => {
                    setAttachedFileName('');
                    setAttachedFileSize('');
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button type="button" onClick={() => setIsAddResourceModalOpen(false)} className="btn btn-sm btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-primary">
                  Upload & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 4: DOCUMENT PREVIEW MODAL ===================== */}
      {previewModalData && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 95, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-subtle)', maxWidth: '580px', width: '100%', maxHeight: '88vh', overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#DBEAFE', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>{previewModalData.title || previewModalData.name}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{previewModalData.category || 'Academic Resource'} • Section {selectedSectionLetter}</span>
                </div>
              </div>
              <button onClick={() => setPreviewModalData(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '0.85rem', backgroundColor: 'var(--surface-low)', borderRadius: '12px', fontSize: '12px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              <div><strong>Subject:</strong> {previewModalData.subject || 'CSE Core'}</div>
              <div><strong>Format:</strong> PDF / Verified</div>
              <div><strong>Size:</strong> {previewModalData.fileSize || '3.4 MB'}</div>
              <div><strong>Authorized For:</strong> Section {selectedSectionLetter} only</div>
            </div>

            {/* Document Abstract & Outline Preview */}
            <div style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', backgroundColor: '#F8FAFC', fontSize: '12.5px', lineHeight: 1.6, color: '#334155' }}>
              <h5 style={{ fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>Curriculum Outline & Abstract:</h5>
              <p>• Detailed examination syllabus breakdown mapped to current RGPV Autonomous academic standards.</p>
              <p>• Step-by-step algorithms, memory addressing diagrams, runtime complexity benchmarks, and practice questions.</p>
              <p>• Experiment guidelines, hardware prerequisites, and test case matrices prepared by Dr. Rajesh Verma.</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  showToast('🖨️ Opening print view...');
                }}
                className="btn btn-sm btn-outline"
                style={{ fontSize: '12px' }}
              >
                <Printer size={13} />
                <span>Print Document</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button type="button" onClick={() => setPreviewModalData(null)} className="btn btn-sm btn-secondary">
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => triggerBrowserDownload(previewModalData, 'pdf')}
                  className="btn btn-sm btn-primary"
                >
                  <Download size={13} />
                  <span>Download Document</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 5: EDIT RESOURCE MODAL ===================== */}
      {editModalData && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 95, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-subtle)', maxWidth: '440px', width: '100%', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Edit3 size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>Edit {editModalData.categoryKey}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Section {selectedSectionLetter}</span>
                </div>
              </div>
              <button onClick={() => setEditModalData(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '12.5px' }}>
              <div>
                <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', outline: 'none' }}
                  required
                />
              </div>

              {editModalData.categoryKey !== 'subjects' && (
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Subject</label>
                  <input
                    type="text"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', outline: 'none' }}
                  />
                </div>
              )}

              <div>
                <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Details / Note / Date</label>
                <input
                  type="text"
                  value={editDetail}
                  onChange={(e) => setEditDetail(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button type="button" onClick={() => setEditModalData(null)} className="btn btn-sm btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-primary">
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 6: ADD TIMETABLE SLOT ===================== */}
      {isAddSlotModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 95, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-subtle)', maxWidth: '440px', width: '100%', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>Add Timetable Slot</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Section {selectedSectionLetter} Schedule</span>
                </div>
              </div>
              <button onClick={() => setIsAddSlotModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTimetableSlot} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '12.5px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Day</label>
                  <select value={slotDay} onChange={(e) => setSlotDay(e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', backgroundColor: '#FFFFFF' }}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Time Slot</label>
                  <input
                    type="text"
                    value={slotTime}
                    onChange={(e) => setSlotTime(e.target.value)}
                    placeholder="e.g. 09:00 - 10:00 AM"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Subject</label>
                <select value={slotSubject} onChange={(e) => setSlotSubject(e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', backgroundColor: '#FFFFFF' }} required>
                  <option value="">-- Choose Subject --</option>
                  {(sectionData.subjects || []).map((s) => (
                    <option key={s.id} value={s.name}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Faculty</label>
                  <input
                    type="text"
                    value={slotFaculty}
                    onChange={(e) => setSlotFaculty(e.target.value)}
                    placeholder="Faculty name"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Room</label>
                  <input
                    type="text"
                    value={slotRoom}
                    onChange={(e) => setSlotRoom(e.target.value)}
                    placeholder="e.g. Room 204"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button type="button" onClick={() => setIsAddSlotModalOpen(false)} className="btn btn-sm btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-primary">
                  Save Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 7: ASSIGNMENT SUBMISSIONS ROSTER ===================== */}
      {submissionsModalData && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 95, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-subtle)', maxWidth: '640px', width: '100%', maxHeight: '88vh', overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>{submissionsModalData.title}</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Section {selectedSectionLetter} Submissions Roster ({submissionsModalData.submissionsCount} of {submissionsModalData.totalStudents} Submitted)</span>
              </div>
              <button onClick={() => setSubmissionsModalData(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--surface-low)', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '0.5rem 0.75rem' }}>Roll No</th>
                    <th style={{ padding: '0.5rem 0.75rem' }}>Student Name</th>
                    <th style={{ padding: '0.5rem 0.75rem' }}>Status</th>
                    <th style={{ padding: '0.5rem 0.75rem' }}>Submission Time</th>
                    <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { roll: '21CSE084', name: 'Rahul Sharma', status: 'Submitted', time: '22 Sept 09:30 AM', score: '24/25' },
                    { roll: '21CSE085', name: 'Bhavna Patel', status: 'Submitted', time: '21 Sept 04:15 PM', score: '25/25' },
                    { roll: '21CSE086', name: 'Chirag Reddy', status: 'Pending', time: '-', score: '-' },
                    { roll: '21CSE087', name: 'Divya Nair', status: 'Submitted', time: '22 Sept 11:20 AM', score: '23/25' },
                    { roll: '21CSE088', name: 'Faizan Ahmed', status: 'Submitted', time: '20 Sept 06:40 PM', score: '22/25' },
                    { roll: '21CSE089', name: 'Gaurav Kulkarni', status: 'Pending', time: '-', score: '-' },
                    { roll: '21CSE090', name: 'Avinash Sharma', status: 'Submitted', time: '21 Sept 02:10 PM', score: '24/25' }
                  ].map((st, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontWeight: 700 }}>{st.roll}</td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>{st.name}</td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <span className={`badge ${st.status === 'Submitted' ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '10px' }}>
                          {st.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>{st.time}</td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 800 }}>{st.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button onClick={() => setSubmissionsModalData(null)} className="btn btn-sm btn-primary">
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 8: EDIT TIMETABLE SLOT ===================== */}
      {isEditSlotModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 95, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-subtle)', maxWidth: '440px', width: '100%', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Edit3 size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>Edit Timetable Slot</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Section {selectedSectionLetter} Schedule</span>
                </div>
              </div>
              <button onClick={() => setIsEditSlotModalOpen(false)} className="btn-icon" title="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditSlot} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '12.5px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Day</label>
                  <select value={editSlotDay} onChange={(e) => setEditSlotDay(e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', backgroundColor: '#FFFFFF' }}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Time Slot</label>
                  <input
                    type="text"
                    value={editSlotTime}
                    onChange={(e) => setEditSlotTime(e.target.value)}
                    placeholder="e.g. 09:00 - 10:00 AM"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Subject</label>
                <select value={editSlotSubject} onChange={(e) => setEditSlotSubject(e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', backgroundColor: '#FFFFFF' }} required>
                  <option value="">-- Choose Subject --</option>
                  {(sectionData.subjects || []).map((s) => (
                    <option key={s.id} value={s.name}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Faculty</label>
                  <input
                    type="text"
                    value={editSlotFaculty}
                    onChange={(e) => setEditSlotFaculty(e.target.value)}
                    placeholder="Faculty name"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Room</label>
                  <input
                    type="text"
                    value={editSlotRoom}
                    onChange={(e) => setEditSlotRoom(e.target.value)}
                    placeholder="e.g. Room 204"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button type="button" onClick={() => setIsEditSlotModalOpen(false)} className="btn btn-sm btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

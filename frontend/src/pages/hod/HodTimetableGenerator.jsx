import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { useERP } from '../../context/ERPContext';
import { timetableApi, academicApi, teacherApi, classroomApi } from '../../api';
import {
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  AlertCircle,
  Plus,
  Trash2,
  BookOpen,
  UserCheck,
  Layers,
  Settings,
  Coffee,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  X,
  ShieldAlert
} from 'lucide-react';

export default function HodTimetableGenerator() {
  const { addToast } = useERP();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialView = searchParams.get('view') === 'generator' ? 'generator' : 'current';
  const [viewMode, setViewMode] = useState(initialView);
  const [showConflictsModal, setShowConflictsModal] = useState(false);
  const [configCollapsed, setConfigCollapsed] = useState(false);

  useEffect(() => {
    const v = searchParams.get('view');
    if (v === 'generator' || v === 'current') {
      setViewMode(v);
    }
  }, [searchParams]);

  // Generator form parameters
  const [department, setDepartment] = useState('CSE');
  const [year, setYear] = useState('3rd Year');
  const [semester, setSemester] = useState(5);
  const [section, setSection] = useState('A');
  const [academicYear, setAcademicYear] = useState('2026-27');

  // Tab navigation for generator configuration
  const [configTab, setConfigTab] = useState('timing'); // timing | breaks | periods | subjects

  // --- 1. College Timing & Working Days Configuration ---
  const [collegeStartTime, setCollegeStartTime] = useState('09:00 AM');
  const [collegeEndTime, setCollegeEndTime] = useState('04:30 PM');
  const [defaultPeriodDuration, setDefaultPeriodDuration] = useState(50);
  const [periodsCountPerDay, setPeriodsCountPerDay] = useState(7);
  const [saturdayWorking, setSaturdayWorking] = useState(true);
  const baseDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const workingDays = saturdayWorking ? [...baseDays, 'Saturday'] : baseDays;

  // --- 2. Break Configuration ---
  const [breaks, setBreaks] = useState([
    { id: 'b1', name: 'Short Break / Tea', startTime: '11:10 AM', endTime: '11:25 AM' },
    { id: 'b2', name: 'Lunch Break', startTime: '01:05 PM', endTime: '01:50 PM' }
  ]);

  // --- 3. Dynamic Period Configuration (arbitrary durations supported) ---
  const [periods, setPeriods] = useState([
    { period: 1, label: 'Period 1', startTime: '09:00 AM', endTime: '09:50 AM', duration: 50 },
    { period: 2, label: 'Period 2', startTime: '09:50 AM', endTime: '10:40 AM', duration: 50 },
    { period: 3, label: 'Period 3', startTime: '10:40 AM', endTime: '11:30 AM', duration: 50 },
    { period: 4, label: 'Period 4', startTime: '11:45 AM', endTime: '12:35 PM', duration: 50 },
    { period: 5, label: 'Period 5', startTime: '12:35 PM', endTime: '01:25 PM', duration: 50 },
    { period: 6, label: 'Period 6', startTime: '02:00 PM', endTime: '02:50 PM', duration: 50 },
    { period: 7, label: 'Period 7', startTime: '02:50 PM', endTime: '03:40 PM', duration: 50 }
  ]);

  // Auto-calculate periods seamlessly from start time, duration, count, and breaks
  const handleAutoCalculatePeriods = (customStart, customDur, customCount, customBreaks) => {
    const sTime = customStart || collegeStartTime || '09:00 AM';
    const dur = parseInt(customDur || defaultPeriodDuration, 10) || 50;
    const count = parseInt(customCount || periodsCountPerDay, 10) || periods.length || 7;
    const brks = customBreaks || breaks;

    const toMins = (t) => {
      if (!t) return 540;
      const match = String(t).trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (!match) return 540;
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const mer = (match[3] || '').toUpperCase();
      if (mer === 'PM' && h < 12) h += 12;
      if (mer === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    };

    const fromMins = (totalMins) => {
      let h = Math.floor(totalMins / 60) % 24;
      const m = totalMins % 60;
      const mer = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      if (h === 0) h = 12;
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(h)}:${pad(m)} ${mer}`;
    };

    let cur = toMins(sTime);
    const sortedBreaks = [...(brks || [])].map((b) => ({
      ...b,
      startM: toMins(b.startTime),
      endM: toMins(b.endTime)
    })).sort((a, b) => a.startM - b.startM);

    const newPeriods = [];
    for (let i = 1; i <= count; i++) {
      for (const brk of sortedBreaks) {
        if (cur >= brk.startM && cur < brk.endM) {
          cur = brk.endM;
        }
      }
      const sStart = cur;
      let sEnd = sStart + dur;

      for (const brk of sortedBreaks) {
        if (sStart < brk.startM && sEnd > brk.startM) {
          if (brk.startM - sStart >= 25) {
            sEnd = brk.startM;
          } else {
            cur = brk.endM;
            sEnd = cur + dur;
          }
        }
      }

      newPeriods.push({
        period: i,
        label: `Period ${i}`,
        startTime: fromMins(sStart),
        endTime: fromMins(sEnd),
        duration: dur
      });

      cur = sEnd;
      for (const brk of sortedBreaks) {
        if (cur >= brk.startM && cur < brk.endM) {
          cur = brk.endM;
        }
      }
    }

    setPeriods(newPeriods);
    addToast('Periods Synchronized', `Auto-aligned ${newPeriods.length} period slots with break gaps starting at ${sTime} (${dur}m).`, 'info');
  };

  // --- 4. Subject Allocation Matrix ---
  const [subjectRows, setSubjectRows] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [classroomsList, setClassroomsList] = useState([]);
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);

  // --- Timetable State & Conflict Warnings ---
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [error, setError] = useState(null);

  // Fetch Faculty and Classrooms
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const [facRes, roomRes] = await Promise.allSettled([
          teacherApi.getFaculty(),
          classroomApi.getClassrooms()
        ]);
        if (facRes.status === 'fulfilled') {
          const list = facRes.value?.faculty || facRes.value?.data || facRes.value || [];
          setFacultyList(Array.isArray(list) ? list : []);
        }
        if (roomRes.status === 'fulfilled') {
          const list = roomRes.value?.data || roomRes.value || [];
          setClassroomsList(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.warn('[TimetableGenerator] Resource fetch warning:', err.message);
      }
    };
    fetchResources();
  }, []);

  // Fetch Curriculum Subjects when Semester changes
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoadingCurriculum(true);
      try {
        const res = await academicApi.getSubjects({ semester });
        const subs = res?.subjects || res?.data || [];
        if (subs.length > 0) {
          const rows = subs.map((s) => ({
            id: s.id,
            code: s.code,
            name: s.name,
            type: s.type || (s.name.toLowerCase().includes('lab') ? 'LAB' : 'THEORY'),
            periodsPerWeek: s.name.toLowerCase().includes('lab') ? 2 : (s.weeklySlots || 4),
            consecutivePeriods: s.name.toLowerCase().includes('lab') ? 2 : 1,
            teacherId: s.faculty?.id || s.teacherId || '',
            teacherName: s.faculty?.name || s.teacherName || '',
            preferredRoom: s.name.toLowerCase().includes('lab') ? 'Lab-1 (Software)' : 'CR-101',
            priority: 'Normal'
          }));
          setSubjectRows(rows);
        } else {
          setSubjectRows([
            { id: '1', code: 'CS501', name: 'Database Management Systems', type: 'THEORY', periodsPerWeek: 4, consecutivePeriods: 1, teacherId: '', teacherName: '', preferredRoom: 'CR-101', priority: 'Normal' },
            { id: '2', code: 'CS502', name: 'Operating Systems', type: 'THEORY', periodsPerWeek: 4, consecutivePeriods: 1, teacherId: '', teacherName: '', preferredRoom: 'CR-101', priority: 'Normal' },
            { id: '3', code: 'CS503', name: 'Computer Networks', type: 'THEORY', periodsPerWeek: 4, consecutivePeriods: 1, teacherId: '', teacherName: '', preferredRoom: 'CR-102', priority: 'Normal' },
            { id: '4', code: 'CS504', name: 'Theory of Computation', type: 'THEORY', periodsPerWeek: 3, consecutivePeriods: 1, teacherId: '', teacherName: '', preferredRoom: 'CR-201', priority: 'Normal' },
            { id: '5', code: 'CS505', name: 'Database & OS Lab', type: 'LAB', periodsPerWeek: 2, consecutivePeriods: 2, teacherId: '', teacherName: '', preferredRoom: 'Lab-1 (Software)', priority: 'High' }
          ]);
        }
      } catch (err) {
        console.warn('[TimetableGenerator] Subjects fetch error:', err.message);
      } finally {
        setLoadingCurriculum(false);
      }
    };
    fetchSubjects();
  }, [semester]);

  // Fetch active Timetable
  const fetchTimetableData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tableRes, conflictsRes] = await Promise.allSettled([
        timetableApi.getTimetable({ year, semester, section }),
        timetableApi.getConflicts({ section, semester })
      ]);

      if (tableRes.status === 'fulfilled') {
        const val = tableRes.value;
        let flatSlots = [];
        if (Array.isArray(val?.slots)) {
          flatSlots = val.slots;
        } else if (Array.isArray(val?.timetable)) {
          flatSlots = val.timetable;
        } else if (val?.timetable && typeof val.timetable === 'object') {
          flatSlots = Object.values(val.timetable).flat();
        }
        setTimetableSlots(flatSlots);

        // Synchronize period slots and timing configuration from backend record
        if (Array.isArray(val?.config?.periods) && val.config.periods.length > 0) {
          const cfgPeriods = val.config.periods.map((p, idx) => ({
            period: parseInt(p.period || p.periodNumber || idx + 1, 10),
            label: p.label || p.name || `Period ${idx + 1}`,
            startTime: p.startTime || p.start_time || '09:00 AM',
            endTime: p.endTime || p.end_time || '09:50 AM',
            duration: parseInt(p.duration || 50, 10)
          }));
          setPeriods(cfgPeriods);
          setPeriodsCountPerDay(cfgPeriods.length);
          if (cfgPeriods[0]?.duration) setDefaultPeriodDuration(cfgPeriods[0].duration);
        }
        if (Array.isArray(val?.config?.breaks) && val.config.breaks.length > 0) {
          setBreaks(val.config.breaks);
        }
        if (val?.config?.collegeTiming?.startTime) {
          setCollegeStartTime(val.config.collegeTiming.startTime);
        }
        if (val?.config?.collegeTiming?.endTime) {
          setCollegeEndTime(val.config.collegeTiming.endTime);
        }
        if (Array.isArray(val?.config?.workingDays) && val.config.workingDays.length > 0) {
          setSaturdayWorking(val.config.workingDays.includes('Saturday'));
        }
      }
      if (conflictsRes.status === 'fulfilled' && conflictsRes.value?.conflicts) {
        setConflicts(conflictsRes.value.conflicts);
      }
    } catch (err) {
      setError(err.message || 'Unable to load timetable records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetableData();
  }, [semester, section]);

  // --- Break Handlers ---
  const handleAddBreak = () => {
    setBreaks((prev) => [
      ...prev,
      {
        id: `brk-${Date.now()}`,
        name: 'New Break',
        startTime: '12:00 PM',
        endTime: '12:30 PM'
      }
    ]);
  };

  const handleUpdateBreak = (idx, field, value) => {
    setBreaks((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleRemoveBreak = (idx) => {
    setBreaks((prev) => prev.filter((_, i) => i !== idx));
  };

  // --- Period Handlers ---
  const handleAddPeriod = () => {
    const nextNum = periods.length + 1;
    setPeriods((prev) => [
      ...prev,
      {
        period: nextNum,
        label: `Period ${nextNum}`,
        startTime: '03:40 PM',
        endTime: '04:30 PM',
        duration: 50
      }
    ]);
  };

  const handleUpdatePeriod = (idx, field, value) => {
    setPeriods((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleRemovePeriod = (idx) => {
    setPeriods((prev) => prev.filter((_, i) => i !== idx));
  };

  // --- Subject Matrix Handlers ---
  const handleUpdateSubjectRow = (index, field, value) => {
    setSubjectRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'teacherId') {
        const fac = facultyList.find((f) => String(f.id) === String(value));
        updated[index].teacherName = fac ? (fac.name || `${fac.first_name || ''} ${fac.last_name || ''}`).trim() : '';
      }
      return updated;
    });
  };

  const handleAddSubjectRow = () => {
    const newIdx = subjectRows.length + 1;
    setSubjectRows((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        code: `CS50${newIdx}`,
        name: 'New Department Subject / Elective',
        type: 'THEORY',
        periodsPerWeek: 4,
        consecutivePeriods: 1,
        teacherId: '',
        teacherName: '',
        preferredRoom: 'CR-101',
        priority: 'Normal'
      }
    ]);
  };

  const handleRemoveSubjectRow = (index) => {
    setSubjectRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  // --- Generate Timetable via Real AI Backend ---
  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setError(null);

    try {
      const customSubjectsPayload = subjectRows.map((row) => ({
        code: row.code,
        name: row.name,
        type: row.type || 'THEORY',
        periods_per_week: parseInt(row.periodsPerWeek, 10) || 4,
        consecutive_periods: parseInt(row.consecutivePeriods, 10) || 1,
        teacher_id: row.teacherId || null,
        teacher_name: row.teacherName || null,
        room: row.preferredRoom || null,
        priority: row.priority || 'Normal',
        is_lab: row.type === 'LAB' || row.type === 'PRACTICAL'
      }));

      const res = await timetableApi.generateTimetable({
        department,
        year,
        semester: Number(semester),
        section: section.toUpperCase(),
        academic_year: academicYear,
        collegeTiming: {
          startTime: collegeStartTime,
          endTime: collegeEndTime,
          saturdayWorking: Boolean(saturdayWorking)
        },
        workingDays,
        breaks: breaks.map((b) => ({ ...b, isBreak: true })),
        periods,
        period_timings: periods,
        start_time: periods[0]?.startTime || collegeStartTime,
        period_duration_minutes: periods[0]?.duration || defaultPeriodDuration || 50,
        periods_per_day: periods.length || periodsCountPerDay || 7,
        custom_subjects: customSubjectsPayload
      });

      if (Array.isArray(res?.slots)) {
        setTimetableSlots(res.slots);
      } else if (Array.isArray(res?.timetable)) {
        setTimetableSlots(res.timetable);
      } else if (res?.timetable && typeof res.timetable === 'object') {
        setTimetableSlots(Object.values(res.timetable).flat());
      }

      if (Array.isArray(res?.conflicts)) {
        setConflicts(res.conflicts);
      }

      addToast(
        'Timetable Generated Successfully',
        `Generated timetable grid across ${workingDays.length} working days adhering strictly to configured periods, breaks, and teacher constraints.`,
        'success'
      );
      await fetchTimetableData();
    } catch (err) {
      setError(err.message || 'Error occurred during timetable generation.');
    } finally {
      setGenerating(false);
    }
  };

  // --- Real PDF Export with 2D Visual Grid Alignment ---
  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      await timetableApi.downloadPdf({
        section,
        semester,
        year,
        slots: timetableSlots,
        config: {
          workingDays,
          breaks: breaks.map((b) => ({ ...b, isBreak: true })),
          periods
        }
      });
      addToast('PDF Downloaded', 'Official timetable PDF matching the visual grid exported successfully.', 'success');
    } catch (err) {
      addToast('Export Failed', err.message || 'Failed to download PDF.', 'error');
    } finally {
      setExportingPdf(false);
    }
  };

  // --- Real Excel Export with 2D Visual Grid Alignment ---
  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      await timetableApi.downloadExcel({
        section,
        semester,
        academicYear,
        slots: timetableSlots,
        config: {
          workingDays,
          breaks: breaks.map((b) => ({ ...b, isBreak: true })),
          periods
        }
      });
      addToast('Excel Downloaded', 'Official timetable spreadsheet matching the visual grid exported successfully.', 'success');
    } catch (err) {
      addToast('Export Failed', err.message || 'Failed to download Excel.', 'error');
    } finally {
      setExportingExcel(false);
    }
  };

  // Helper to find slot for a given day and period
  const getSlot = (dayName, periodNum) => {
    if (!Array.isArray(timetableSlots)) return null;
    return timetableSlots.find(
      (s) => s && s.day === dayName && Number(s.period || s.periodNumber) === Number(periodNum)
    );
  };

  // Helper to resolve full subject name, code, teacher, and room for a slot
  const getResolvedSubject = (slot) => {
    if (!slot) return null;

    let name = slot.subject?.name || slot.subjectName;
    let code = slot.subject?.code || slot.subjectCode || slot.code;
    let type = slot.subject?.type || slot.type;
    let teacherName = slot.teacher?.name || slot.teacherName || slot.faculty;
    let room = slot.classroom?.roomNumber || slot.room;

    if (typeof slot.subject === 'string') {
      if (slot.subject.startsWith('CS') || slot.subject.length <= 6) {
        code = code || slot.subject;
      } else {
        name = name || slot.subject;
      }
    }

    // Match with current subjectRows
    const match = (subjectRows || []).find(
      (s) =>
        (code && (s.code === code || s.id === code)) ||
        (name && s.name?.toLowerCase() === name.toLowerCase()) ||
        (slot.subjectId && s.id === slot.subjectId)
    );

    if (match) {
      name = name || match.name;
      code = code || match.code;
      type = type || match.type;
      if (!teacherName && match.teacherName) teacherName = match.teacherName;
      if (!room && match.preferredRoom) room = match.preferredRoom;
    }

    // Extensive curriculum dictionary mapping for subjects
    const curriculumMap = {
      'CS501': 'Database Management Systems',
      'CS502': 'Operating Systems',
      'CS503': 'Computer Networks',
      'CS504': 'Theory of Computation',
      'CS505': 'Database & OS Lab',
      'CS506': 'Computer Networks Lab',
      'CS301': 'Data Structures & Algorithms',
      'CS302': 'Digital Circuits & Logic Design',
      'CS303': 'Discrete Mathematics',
      'CS304': 'Object Oriented Programming (Java)',
      'CS305': 'Data Structures Lab',
      'CS401': 'Analysis & Design of Algorithms',
      'CS402': 'Software Engineering',
      'CS403': 'Computer Organization & Architecture',
      'CS404': 'Analog & Digital Communication',
      'CS405': 'Algorithms Lab',
      'CS601': 'Compiler Design',
      'CS602': 'Web Development & Frameworks',
      'CS603': 'Cloud Computing',
      'CS604': 'Cyber Security',
      'CS701': 'Artificial Intelligence & Machine Learning',
      'CS702': 'Big Data Analytics',
      'CS703': 'Internet of Things (IoT)',
      'CS704': 'Major Project Phase-I',
      'CS801': 'Deep Learning & Neural Networks',
      'CS802': 'Distributed Systems',
      'CS803': 'Major Project Phase-II'
    };

    if ((!name || name === 'Class' || name === code) && code && curriculumMap[code.toUpperCase()]) {
      name = curriculumMap[code.toUpperCase()];
    }

    if (!name && code) {
      name = code;
    }

    return {
      name: name || 'Scheduled Lecture',
      code: code || 'CS',
      type: type || (name?.toLowerCase().includes('lab') ? 'LAB' : 'THEORY'),
      teacherName: teacherName || 'Faculty Assigned',
      room: room || (type === 'LAB' || name?.toLowerCase().includes('lab') ? 'Lab-1' : 'CR-101')
    };
  };

  // Build the chronological unified grid items (periods and breaks sorted by timing)
  const unifiedGridSchedule = () => {
    const items = [];
    periods.forEach((p) => {
      items.push({
        type: 'period',
        period: p.period,
        label: p.label || `Period ${p.period}`,
        startTime: p.startTime,
        endTime: p.endTime,
        duration: p.duration
      });
    });

    breaks.forEach((b) => {
      items.push({
        type: 'break',
        name: b.name,
        startTime: b.startTime,
        endTime: b.endTime,
        isBreak: true
      });
    });

    // Helper to convert time like "09:00 AM" to minutes from midnight
    const toMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const parts = timeStr.trim().split(' ');
      const [h, m] = (parts[0] || '0:0').split(':').map(Number);
      let mins = (h % 12) * 60 + (m || 0);
      if (parts[1]?.toUpperCase() === 'PM') mins += 12 * 60;
      return mins;
    };

    return items.sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
  };

  const renderTargetSelectors = (extraStyles = {}) => (
    <div className="row g-3 p-3 rounded" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', ...extraStyles }}>
      <div className="col-md-2 col-sm-6">
        <label className="form-label small fw-bold text-muted">Department</label>
        <select className="form-select form-select-sm" value={department} onChange={(e) => setDepartment(e.target.value)}>
          <option value="CSE">Computer Science & Engineering</option>
          <option value="IT">Information Technology</option>
          <option value="ECE">Electronics & Communication</option>
        </select>
      </div>

      <div className="col-md-2 col-sm-6">
        <label className="form-label small fw-bold text-muted">Year of Study</label>
        <select className="form-select form-select-sm" value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="1st Year">1st Year</option>
          <option value="2nd Year">2nd Year</option>
          <option value="3rd Year">3rd Year</option>
          <option value="4th Year">4th Year</option>
        </select>
      </div>

      <div className="col-md-2 col-sm-6">
        <label className="form-label small fw-bold text-muted">Semester</label>
        <select className="form-select form-select-sm" value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
            <option key={s} value={s}>Semester {s}</option>
          ))}
        </select>
      </div>

      <div className="col-md-2 col-sm-6">
        <label className="form-label small fw-bold text-muted">Section</label>
        <select className="form-select form-select-sm" value={section} onChange={(e) => setSection(e.target.value)}>
          <option value="A">Section A</option>
          <option value="B">Section B</option>
          <option value="C">Section C</option>
        </select>
      </div>

      <div className="col-md-4 col-sm-12">
        <label className="form-label small fw-bold text-muted">Academic Session</label>
        <input
          type="text"
          className="form-control form-control-sm"
          value={academicYear}
          onChange={(e) => setAcademicYear(e.target.value)}
          placeholder="e.g. 2026-27"
        />
      </div>
    </div>
  );

  const gridSchedule = unifiedGridSchedule();
  const hasSlots = Array.isArray(timetableSlots) && timetableSlots.length > 0;

  return (
    <div className="container-fluid py-4" style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              {viewMode === 'current' ? 'Official Department Timetable Matrix' : 'Smart AI Timetable Generator & Scheduler'}
            </h2>
            <span className={`badge ${viewMode === 'current' ? 'bg-primary-subtle text-primary border border-primary-subtle' : 'bg-purple-subtle text-purple border border-purple-subtle'}`}>
              {viewMode === 'current' ? (
                <>
                  <Calendar size={14} className="me-1" />
                  Live Active Timetable
                </>
              ) : (
                <>
                  <Sparkles size={14} className="me-1" />
                  Dynamic Grid & Workload Aware
                </>
              )}
            </span>
          </div>
          <p style={{ fontSize: '14px', color: '#64748B', margin: '4px 0 0 0' }}>
            {viewMode === 'current'
              ? `Currently displaying active scheduled timetable for Dept. of ${department} • Semester ${semester} (Section ${section})`
              : 'Full college timing, custom break intervals, variable period durations, teacher workload & classroom constraints'}
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            onClick={handleExportPdf}
            disabled={exportingPdf || !hasSlots}
            className="btn btn-outline-danger d-inline-flex align-items-center gap-2"
            style={{ fontWeight: 600, padding: '8px 16px', borderRadius: '8px', background: '#FFFFFF' }}
            id="btn-export-pdf"
          >
            <FileText size={16} />
            <span>{exportingPdf ? 'Exporting PDF...' : 'Download PDF'}</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={exportingExcel || !hasSlots}
            className="btn btn-outline-success d-inline-flex align-items-center gap-2"
            style={{ fontWeight: 600, padding: '8px 16px', borderRadius: '8px', background: '#FFFFFF' }}
            id="btn-export-excel"
          >
            <FileSpreadsheet size={16} />
            <span>{exportingExcel ? 'Exporting Excel...' : 'Download Excel'}</span>
          </button>

          <button
            onClick={fetchTimetableData}
            disabled={loading}
            className="btn btn-light border d-inline-flex align-items-center gap-1"
            style={{ padding: '8px 12px', borderRadius: '8px' }}
          >
            <RefreshCw size={16} className={loading ? 'fa-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Top View Mode Switcher */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div className="d-flex gap-2 p-1 rounded-3" style={{ backgroundColor: '#F1F5F9' }}>
          <button
            type="button"
            onClick={() => { setViewMode('current'); setSearchParams({ view: 'current' }); }}
            className={`btn btn-sm ${viewMode === 'current' ? 'btn-primary shadow-sm' : 'btn-light border-0 text-secondary'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 18px', fontWeight: 700, borderRadius: '8px' }}
            id="tab-view-current-timetable"
          >
            <Calendar size={16} />
            <span>Current Active Timetable</span>
            <span className={`badge ms-1 ${viewMode === 'current' ? 'bg-white text-primary' : 'bg-primary-subtle text-primary'}`} style={{ fontSize: '11px' }}>
              Live Grid
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setViewMode('generator'); setSearchParams({ view: 'generator' }); }}
            className={`btn btn-sm ${viewMode === 'generator' ? 'btn-primary shadow-sm' : 'btn-light border-0 text-secondary'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 18px', fontWeight: 700, borderRadius: '8px' }}
            id="tab-view-ai-generator"
          >
            <Sparkles size={16} />
            <span>AI Timetable Generator & Settings</span>
            <span className={`badge ms-1 ${viewMode === 'generator' ? 'bg-white text-primary' : 'bg-purple-subtle text-purple'}`} style={{ fontSize: '11px' }}>
              AI Engine
            </span>
          </button>
        </div>

        <span className="small text-muted fw-semibold">
          Department of {department} • Semester {semester} (Section {section}) • Session {academicYear}
        </span>
      </div>

      {/* Target Selector Bar when in Current Timetable Mode */}
      {viewMode === 'current' && (
        <div className="mb-4">
          {renderTargetSelectors()}
        </div>
      )}

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" style={{ borderRadius: '10px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* --- TIMETABLE GENERATION CONFIGURATION CARD (Shown in Generator Mode) --- */}
      {viewMode === 'generator' && (
        <div className="card mb-4" style={{ borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div className="card-header bg-white border-bottom p-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div className="d-flex align-items-center gap-2">
              <Settings size={18} className="text-primary" />
              <h5 className="fw-bold mb-0 text-dark">Timetable Architecture & Constraints Configuration</h5>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              {/* Sub-Tabs for Configuration */}
              <div className="nav nav-pills gap-1">
                {[
                  { id: 'timing', label: '1. Timing & Days', icon: <Clock size={15} /> },
                  { id: 'breaks', label: `2. Breaks (${breaks.length})`, icon: <Coffee size={15} /> },
                  { id: 'periods', label: `3. Periods (${periods.length})`, icon: <Layers size={15} /> },
                  { id: 'subjects', label: `4. Subject Matrix (${subjectRows.length})`, icon: <BookOpen size={15} /> }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => { setConfigTab(tab.id); setConfigCollapsed(false); }}
                    className={`btn btn-sm ${configTab === tab.id && !configCollapsed ? 'btn-primary' : 'btn-light border'}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, borderRadius: '8px' }}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setConfigCollapsed(!configCollapsed)}
                className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
                style={{ borderRadius: '8px', fontWeight: 600, padding: '5px 12px' }}
                title={configCollapsed ? 'Expand Configuration Form' : 'Collapse Configuration Form to focus on grid'}
              >
                {configCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                <span>{configCollapsed ? 'Show Parameters' : 'Collapse'}</span>
              </button>
            </div>
          </div>

          {configCollapsed ? (
            <div className="p-3 bg-light d-flex flex-wrap justify-content-between align-items-center text-muted small px-4 gap-2">
              <span>
                <strong>Parameters Configured:</strong> Dept of {department} • Semester {semester} ({section}) • {periods.length} Periods ({collegeStartTime}–{collegeEndTime}) • {breaks.length} Breaks • {subjectRows.length} Subjects Matrix
              </span>
              <button
                type="button"
                onClick={() => setConfigCollapsed(false)}
                className="btn btn-sm btn-link text-primary fw-bold text-decoration-none p-0"
              >
                Modify Parameters
              </button>
            </div>
          ) : (
            <div className="card-body p-4">
              <form onSubmit={handleGenerate}>
                {/* Global Target Selectors inside generator */}
                <div className="mb-4">
                  {renderTargetSelectors()}
                </div>

            {/* TAB 1: College Timing & Working Days */}
            {configTab === 'timing' && (
              <div className="p-3 border rounded bg-white mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                    <Clock size={16} className="text-primary" />
                    College Timing & Working Days Setup
                  </h6>
                  <button
                    type="button"
                    onClick={() => handleAutoCalculatePeriods(collegeStartTime, defaultPeriodDuration, periodsCountPerDay, breaks)}
                    className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                    title="Auto-calculate periods and slot timings using these parameters"
                  >
                    <Sparkles size={14} />
                    <span>Auto-Align Period Slots</span>
                  </button>
                </div>
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label small fw-bold">College Start Time</label>
                    <input
                      type="text"
                      className="form-control"
                      value={collegeStartTime}
                      onChange={(e) => setCollegeStartTime(e.target.value)}
                      placeholder="e.g. 09:00 AM"
                    />
                    <div className="form-text small">Daily opening bell time</div>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label small fw-bold">College End Time</label>
                    <input
                      type="text"
                      className="form-control"
                      value={collegeEndTime}
                      onChange={(e) => setCollegeEndTime(e.target.value)}
                      placeholder="e.g. 04:30 PM"
                    />
                    <div className="form-text small">Daily closing bell time</div>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label small fw-bold">Period Duration (Minutes)</label>
                    <div className="input-group">
                      <input
                        type="number"
                        min="30"
                        max="120"
                        className="form-control"
                        value={defaultPeriodDuration}
                        onChange={(e) => setDefaultPeriodDuration(parseInt(e.target.value, 10) || 50)}
                      />
                      <span className="input-group-text">min</span>
                    </div>
                    <div className="form-text small">Standard length per lecture</div>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label small fw-bold">Periods Count Per Day</label>
                    <input
                      type="number"
                      min="4"
                      max="10"
                      className="form-control"
                      value={periodsCountPerDay}
                      onChange={(e) => setPeriodsCountPerDay(parseInt(e.target.value, 10) || 7)}
                    />
                    <div className="form-text small">Total lecture slots daily</div>
                  </div>

                  <div className="col-md-12">
                    <label className="form-label small fw-bold">Saturday Working Schedule</label>
                    <div className="d-flex align-items-center gap-3 mt-1">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="satWorkingToggle"
                          checked={saturdayWorking}
                          onChange={(e) => setSaturdayWorking(e.target.checked)}
                          style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                        />
                        <label className="form-check-label ms-2 fw-semibold" htmlFor="satWorkingToggle" style={{ cursor: 'pointer' }}>
                          {saturdayWorking ? '🟢 Saturday Working (6 Days/Week)' : '🔴 Saturday Off (5 Days/Week)'}
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAutoCalculatePeriods(collegeStartTime, defaultPeriodDuration, periodsCountPerDay, breaks)}
                        className="btn btn-sm btn-primary ms-auto d-inline-flex align-items-center gap-2"
                      >
                        <Sparkles size={14} />
                        <span>⚡ Apply Timings & Regenerate Period Slots</span>
                      </button>
                    </div>
                    <div className="form-text small mt-2">
                      Active working days: <span className="fw-bold text-dark">{workingDays.join(', ')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Break Configuration */}
            {configTab === 'breaks' && (
              <div className="p-3 border rounded bg-white mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                    <Coffee size={16} className="text-warning" />
                    Configure Breaks (Lunch, Recess, Tea Break)
                  </h6>
                  <button
                    type="button"
                    onClick={handleAddBreak}
                    className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                  >
                    <Plus size={14} />
                    <span>Add Break</span>
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="table table-sm table-bordered align-middle mb-0">
                    <thead className="table-light small">
                      <tr>
                        <th>Break Name</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th style={{ width: '80px' }} className="text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breaks.map((b, idx) => (
                        <tr key={b.id || idx}>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={b.name}
                              onChange={(e) => handleUpdateBreak(idx, 'name', e.target.value)}
                              placeholder="e.g. Lunch Break"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={b.startTime}
                              onChange={(e) => handleUpdateBreak(idx, 'startTime', e.target.value)}
                              placeholder="12:50 PM"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={b.endTime}
                              onChange={(e) => handleUpdateBreak(idx, 'endTime', e.target.value)}
                              placeholder="01:40 PM"
                            />
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveBreak(idx)}
                              className="btn btn-sm btn-link text-danger p-0"
                              title="Remove Break"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: Period Configuration (Dynamic & Variable Durations) */}
            {configTab === 'periods' && (
              <div className="p-3 border rounded bg-white mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                      <Layers size={16} className="text-primary" />
                      Dynamic Period Structure (Arbitrary Durations Allowed)
                    </h6>
                    <span className="small text-muted">Configure period start/end times and individual durations (e.g. 50 min, 60 min)</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAutoCalculatePeriods(collegeStartTime, defaultPeriodDuration, periodsCountPerDay, breaks)}
                      className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                      title="Re-calculate and align period times around configured breaks"
                    >
                      <Sparkles size={14} className="text-warning" />
                      <span>Auto-Align with Breaks</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddPeriod}
                      className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                    >
                      <Plus size={14} />
                      <span>Add Period</span>
                    </button>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-sm table-bordered align-middle mb-0">
                    <thead className="table-light small">
                      <tr>
                        <th style={{ width: '80px' }}>Period #</th>
                        <th>Period Label</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Duration (Minutes)</th>
                        <th style={{ width: '80px' }} className="text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {periods.map((p, idx) => (
                        <tr key={idx}>
                          <td className="text-center fw-bold">{p.period}</td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={p.label || `Period ${p.period}`}
                              onChange={(e) => handleUpdatePeriod(idx, 'label', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={p.startTime}
                              onChange={(e) => handleUpdatePeriod(idx, 'startTime', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={p.endTime}
                              onChange={(e) => handleUpdatePeriod(idx, 'endTime', e.target.value)}
                            />
                          </td>
                          <td>
                            <div className="input-group input-group-sm">
                              <input
                                type="number"
                                className="form-control"
                                value={p.duration || 50}
                                onChange={(e) => handleUpdatePeriod(idx, 'duration', parseInt(e.target.value, 10))}
                              />
                              <span className="input-group-text">min</span>
                            </div>
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              onClick={() => handleRemovePeriod(idx)}
                              className="btn btn-sm btn-link text-danger p-0"
                              title="Remove Period"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: Subject Configuration Matrix */}
            {configTab === 'subjects' && (
              <div className="p-3 border rounded bg-white mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                      <BookOpen size={16} className="text-primary" />
                      Subject Allocation, Faculty Assignment & Room Constraints
                    </h6>
                    <span className="small text-muted">Define weekly frequency, lab practical consecutive sessions, and assigned teacher</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSubjectRow}
                    className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                  >
                    <Plus size={14} />
                    <span>Add Subject</span>
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="table table-sm table-bordered align-middle mb-0">
                    <thead className="table-light small">
                      <tr>
                        <th>Code</th>
                        <th>Subject Name</th>
                        <th>Type</th>
                        <th style={{ width: '90px' }}>Weekly Slots</th>
                        <th style={{ width: '90px' }}>Consecutive</th>
                        <th>Assigned Faculty</th>
                        <th>Room / Lab</th>
                        <th>Priority</th>
                        <th style={{ width: '60px' }} className="text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjectRows.map((row, idx) => (
                        <tr key={row.id || idx}>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm font-monospace"
                              value={row.code}
                              onChange={(e) => handleUpdateSubjectRow(idx, 'code', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={row.name}
                              onChange={(e) => handleUpdateSubjectRow(idx, 'name', e.target.value)}
                            />
                          </td>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              value={row.type || 'THEORY'}
                              onChange={(e) => handleUpdateSubjectRow(idx, 'type', e.target.value)}
                            >
                              <option value="THEORY">Theory</option>
                              <option value="PRACTICAL">Practical</option>
                              <option value="LAB">Lab</option>
                              <option value="TUTORIAL">Tutorial</option>
                              <option value="ELECTIVE">Elective</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm text-center"
                              value={row.periodsPerWeek}
                              onChange={(e) => handleUpdateSubjectRow(idx, 'periodsPerWeek', parseInt(e.target.value, 10))}
                            />
                          </td>
                          <td>
                            <select
                              className="form-select form-select-sm text-center"
                              value={row.consecutivePeriods || 1}
                              onChange={(e) => handleUpdateSubjectRow(idx, 'consecutivePeriods', parseInt(e.target.value, 10))}
                            >
                              <option value={1}>1 Slot</option>
                              <option value={2}>2 Slots (Lab)</option>
                              <option value={3}>3 Slots</option>
                            </select>
                          </td>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              value={row.teacherId || ''}
                              onChange={(e) => handleUpdateSubjectRow(idx, 'teacherId', e.target.value)}
                            >
                              <option value="">-- Assign Faculty --</option>
                              {facultyList.map((f) => (
                                <option key={f.id} value={f.id}>
                                  {f.name || `${f.first_name || ''} ${f.last_name || ''}`.trim() || f.email}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              value={row.preferredRoom || ''}
                              onChange={(e) => handleUpdateSubjectRow(idx, 'preferredRoom', e.target.value)}
                            >
                              {classroomsList.map((c) => (
                                <option key={c.id} value={c.roomNumber}>
                                  {c.roomNumber} ({c.roomType})
                                </option>
                              ))}
                              <option value="CR-101">CR-101 (Classroom)</option>
                              <option value="Lab-1 (Software)">Lab-1 (Software)</option>
                            </select>
                          </td>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              value={row.priority || 'Normal'}
                              onChange={(e) => handleUpdateSubjectRow(idx, 'priority', e.target.value)}
                            >
                              <option value="Normal">Normal</option>
                              <option value="High">High</option>
                            </select>
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveSubjectRow(idx)}
                              className="btn btn-sm btn-link text-danger p-0"
                              title="Remove Subject"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
              <span className="small text-muted">
                Constraints Active: {periods.length} Periods/Day • {breaks.length} Breaks • {workingDays.length} Days/Week • {subjectRows.length} Subjects
              </span>

              <button
                type="submit"
                disabled={generating}
                className="btn btn-primary d-inline-flex align-items-center gap-2"
                style={{ padding: '10px 24px', borderRadius: '10px', fontWeight: 700 }}
                id="btn-generate-timetable"
              >
                <Sparkles size={18} />
                <span>{generating ? 'Synthesizing Timetable via AI Engine...' : 'Generate Constraint-Aware Timetable'}</span>
              </button>
            </div>
          </form>
            </div>
          )}
        </div>
      )}

      {/* --- 2D VISUAL TIMETABLE GRID (MATCHES DOWNLOAD EXACTLY) --- */}
      <div className="card shadow-sm" style={{ borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div className="card-header bg-white p-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="d-flex align-items-center gap-2">
            <Calendar size={18} className="text-primary" />
            <div>
              <h5 className="fw-bold mb-0 text-dark">
                Timetable Grid — Semester {semester} (Section {section})
              </h5>
              <span className="small text-muted">
                {workingDays.join(', ')} • {periods.length} Periods per day with synchronized break intervals
              </span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            {conflicts.length > 0 ? (
              <button
                type="button"
                onClick={() => setShowConflictsModal(true)}
                className="btn btn-warning btn-sm d-inline-flex align-items-center gap-2 shadow-sm"
                style={{
                  fontWeight: 700,
                  borderRadius: '8px',
                  padding: '6px 14px',
                  backgroundColor: '#FEF3C7',
                  borderColor: '#F59E0B',
                  color: '#92400E'
                }}
                id="btn-inspect-timetable-conflicts"
              >
                <AlertTriangle size={15} className="text-warning" />
                <span>Inspect Conflicts ({conflicts.length})</span>
              </button>
            ) : (
              <span className="badge bg-success-subtle text-success border border-success-subtle fw-semibold px-2 py-1.5 d-inline-flex align-items-center gap-1">
                <CheckCircle2 size={13} />
                <span>Zero Conflicts</span>
              </span>
            )}

            <span className="badge bg-primary-subtle text-primary border border-primary-subtle fw-semibold px-2 py-1.5">
              <CheckCircle2 size={13} className="me-1" />
              {timetableSlots.length} Active Slots
            </span>
            <span className="badge bg-light text-secondary border fw-semibold px-2 py-1.5">
              {workingDays.length} Working Days
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-5 text-center text-muted">
            <RefreshCw size={28} className="fa-spin mb-2" />
            <div>Loading timetable matrix...</div>
          </div>
        ) : !hasSlots ? (
          <div className="p-5 text-center text-muted">
            No timetable generated yet for Semester {semester} Section {section}. Configure the parameters above and click <strong>"Generate Constraint-Aware Timetable"</strong>.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered align-middle text-center mb-0" style={{ minWidth: '900px', fontSize: '13px' }}>
              <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #CBD5E1' }}>
                <tr>
                  <th style={{ width: '140px', padding: '12px 8px', fontWeight: 800, color: '#1E293B', backgroundColor: '#F1F5F9' }}>
                    Period / Time
                  </th>
                  {workingDays.map((day) => (
                    <th key={day} style={{ padding: '12px 8px', fontWeight: 800, color: '#1E293B' }}>
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gridSchedule.map((sched, sIdx) => {
                  if (sched.isBreak) {
                    return (
                      <tr key={`break-${sIdx}`} style={{ backgroundColor: '#FEF3C7', borderTop: '2px solid #FDE68A', borderBottom: '2px solid #FDE68A' }}>
                        <td
                          colSpan={workingDays.length + 1}
                          style={{
                            padding: '10px 16px',
                            fontWeight: 800,
                            color: '#92400E',
                            letterSpacing: '0.04em',
                            fontSize: '13px'
                          }}
                        >
                          ☕ {sched.name.toUpperCase()} ({sched.startTime} – {sched.endTime})
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={`period-${sched.period}`} style={{ height: '70px' }}>
                      {/* Period Header Column */}
                      <td style={{ backgroundColor: '#F8FAFC', fontWeight: 700, borderRight: '2px solid #E2E8F0', padding: '8px' }}>
                        <div className="text-dark">{sched.label}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>{sched.startTime} – {sched.endTime}</div>
                        <span className="badge bg-light text-muted border mt-1" style={{ fontSize: '10px' }}>{sched.duration || 50}m</span>
                      </td>

                      {/* Day Columns */}
                      {workingDays.map((day) => {
                        const slot = getSlot(day, sched.period);
                        if (!slot) {
                          return (
                            <td key={day} style={{ backgroundColor: '#FFFFFF', color: '#CBD5E1' }}>
                              <span style={{ fontSize: '11px' }}>—</span>
                            </td>
                          );
                        }

                        const resolved = getResolvedSubject(slot);
                        const isLab = resolved.type === 'LAB' || resolved.name.toLowerCase().includes('lab');

                        return (
                          <td
                            key={day}
                            style={{
                              backgroundColor: isLab ? '#F0FDF4' : '#EFF6FF',
                              borderLeft: isLab ? '3px solid #16A34A' : '3px solid #2563EB',
                              padding: '8px 6px',
                              verticalAlign: 'middle'
                            }}
                          >
                            <div
                              className="fw-bold text-dark text-truncate"
                              title={resolved.name}
                              style={{ fontSize: '12.5px', lineHeight: '1.25', marginBottom: '3px' }}
                            >
                              {resolved.name}
                            </div>
                            <div className="d-flex justify-content-center align-items-center gap-1 my-1">
                              <span className="badge bg-white text-dark border fw-medium" style={{ fontSize: '10px' }}>
                                {resolved.code}
                              </span>
                              <span className={`badge ${isLab ? 'bg-success text-white' : 'bg-primary text-white'} fw-medium`} style={{ fontSize: '10px' }}>
                                {resolved.room}
                              </span>
                            </div>
                            <div className="text-truncate" title={resolved.teacherName} style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>
                              {resolved.teacherName}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- INSPECT CONFLICTS & CONSTRAINTS MODAL --- */}
      {showConflictsModal && createPortal(
        <div
          className="modal-backdrop-custom d-flex align-items-center justify-content-center p-3"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            zIndex: 99999,
            overflowY: 'auto'
          }}
          onClick={() => setShowConflictsModal(false)}
        >
          <div
            className="card shadow-lg border-0"
            style={{
              maxWidth: '680px',
              width: '100%',
              borderRadius: '16px',
              overflow: 'hidden',
              animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="p-3 px-4 border-bottom d-flex align-items-center justify-content-between"
              style={{ backgroundColor: '#FFFBEB' }}
            >
              <div className="d-flex align-items-center gap-2">
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle"
                  style={{ width: '36px', height: '36px', backgroundColor: '#FEF3C7', color: '#D97706' }}
                >
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h6 className="fw-bold mb-0 text-dark">
                    Timetable Constraints & Conflict Inspection
                  </h6>
                  <span className="small text-muted">
                    Semester {semester} (Section {section}) • {conflicts.length} Constraint Notice{conflicts.length > 1 ? 's' : ''} Identified
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setShowConflictsModal(false)}
              />
            </div>

            {/* Modal Body */}
            <div className="card-body p-4" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              <div className="alert alert-light border d-flex gap-2 mb-3" style={{ fontSize: '12.5px', color: '#475569' }}>
                <Info size={18} className="text-primary flex-shrink-0 mt-0.5" />
                <div>
                  The AI solver analyzes faculty availability collisions, room bookings, and workload limits.
                  Review the notices below and adjust allocations if needed.
                </div>
              </div>

              <div className="d-flex flex-column gap-2">
                {conflicts.map((c, idx) => {
                  const conflictType = c.type || c.category || 'Constraint Notice';
                  const detailText = c.detail || c.description || c.message || (typeof c === 'string' ? c : JSON.stringify(c));
                  const suggestion = c.suggestion || c.resolution || 'Check teacher allocation or shift slot to alternate open period.';

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-3"
                      style={{
                        backgroundColor: '#FFFDF5',
                        border: '1px solid #FDE68A',
                        borderLeft: '4px solid #F59E0B'
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className="badge bg-warning-subtle text-warning border border-warning-subtle fw-bold" style={{ fontSize: '11px' }}>
                          {conflictType}
                        </span>
                        {c.period && (
                          <span className="badge bg-light text-muted border" style={{ fontSize: '10px' }}>
                            Period {c.period} {c.day ? `• ${c.day}` : ''}
                          </span>
                        )}
                      </div>
                      <div className="text-dark fw-semibold mb-1" style={{ fontSize: '13px' }}>
                        {detailText}
                      </div>
                      {suggestion && (
                        <div className="small text-muted mt-1 d-flex align-items-center gap-1" style={{ fontSize: '11.5px' }}>
                          <span className="text-success fw-bold">Suggestion:</span>
                          <span>{suggestion}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 px-4 bg-light border-top d-flex justify-content-between align-items-center">
              <span className="small text-muted">
                Review all constraints before publishing to faculty and students.
              </span>
              <button
                type="button"
                onClick={() => setShowConflictsModal(false)}
                className="btn btn-secondary btn-sm px-4 fw-bold"
                style={{ borderRadius: '8px' }}
              >
                Dismiss & Return to Grid
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

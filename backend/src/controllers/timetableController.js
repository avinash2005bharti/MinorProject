// ============================================================================
// Departmental ERP - Timetable Controller
// Canonical Source of Truth: PostgreSQL via Prisma
// ============================================================================

const axios = require('axios');
const { prisma } = require('../config/postgres');
const timetableAiEngine = require('../services/timetableAiEngine');
const excelService = require('../services/excelService');
const pdfService = require('../services/pdfService');
const { logger } = require('../services/loggerService');

const PYTHON_AI_SERVICE_URL = process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8000';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helper to format slot for frontend components
const formatSlot = (slot) => {
  const teacherName = slot.teacher
    ? `${slot.teacher.firstName} ${slot.teacher.lastName || ''}`.trim()
    : 'TBD';

  return {
    id: slot.id,
    day: slot.dayOfWeek,
    dayOfWeek: slot.dayOfWeek,
    period: slot.periodNumber,
    periodNumber: slot.periodNumber,
    time: `${slot.startTime} - ${slot.endTime}`,
    startTime: slot.startTime,
    endTime: slot.endTime,
    code: slot.subject?.code || 'SUB',
    subjectCode: slot.subject?.code || 'SUB',
    subject: slot.subject?.name || 'Subject',
    subjectName: slot.subject?.name || 'Subject',
    faculty: teacherName,
    teacherName,
    teacherId: slot.teacherId,
    room: slot.classroom?.roomNumber || 'Room 101',
    roomNumber: slot.classroom?.roomNumber || 'Room 101',
    section: slot.section?.name || 'A',
    sectionName: slot.section?.name || 'A',
    isLab: Boolean(slot.isLab)
  };
};

// 1. Get Timetable (Formatted by Days and as Flat Slots)
exports.getTimetable = async (req, res) => {
  try {
    const { semester = 5, section = 'A', academicYear = '2026-27' } = req.query;

    // Prefer ACTIVE timetable (LOGIC-03)
    let timetableRecord = await prisma.timetable.findFirst({
      where: {
        semester: parseInt(semester, 10) || 5,
        academicYear,
        ...(section ? { section: { name: section.toUpperCase() } } : {}),
        status: 'ACTIVE'
      },
      orderBy: { version: 'desc' },
      include: {
        slots: {
          include: {
            subject: true,
            teacher: true,
            classroom: true,
            section: true
          },
          orderBy: [{ periodNumber: 'asc' }]
        }
      }
    });

    if (!timetableRecord) {
      timetableRecord = await prisma.timetable.findFirst({
        where: {
          semester: parseInt(semester, 10) || 5,
          academicYear,
          ...(section ? { section: { name: section.toUpperCase() } } : {})
        },
        orderBy: { version: 'desc' },
        include: {
          slots: {
            include: {
              subject: true,
              teacher: true,
              classroom: true,
              section: true
            },
            orderBy: [{ periodNumber: 'asc' }]
          }
        }
      });
    }

    const slots = timetableRecord?.slots || [];
    const queryDate = req.query?.date ? new Date(req.query.date) : new Date();
    queryDate.setHours(0, 0, 0, 0);

    const slotIds = slots.map(s => s.id);
    const activeSubs = slotIds.length > 0 ? await prisma.dailySubstitution.findMany({
      where: {
        slotId: { in: slotIds },
        date: queryDate,
        status: 'ACTIVE'
      },
      include: {
        substituteTeacher: true,
        originalTeacher: true
      }
    }) : [];

    const subMap = new Map();
    for (const sub of activeSubs) {
      subMap.set(sub.slotId, sub);
    }

    const formattedSlots = slots.map(s => {
      const fmt = formatSlot(s);
      if (subMap.has(s.id)) {
        const sub = subMap.get(s.id);
        fmt.isSubstituted = true;
        fmt.substituteTeacherId = sub.substituteTeacherId;
        fmt.substituteTeacherName = `${sub.substituteTeacher?.firstName} ${sub.substituteTeacher?.lastName || ''}`.trim();
        fmt.originalTeacherName = `${sub.originalTeacher?.firstName} ${sub.originalTeacher?.lastName || ''}`.trim();
        fmt.faculty = fmt.substituteTeacherName;
        fmt.teacher = sub.substituteTeacher;
      }
      return fmt;
    });
    const config = timetableRecord?.metrics?.config || {};

    const workingDays = Array.isArray(config.workingDays) && config.workingDays.length > 0
      ? config.workingDays
      : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Group by configured days
    const grouped = {};
    for (const d of workingDays) {
      grouped[d] = [];
    }

    for (const slot of formattedSlots) {
      if (!grouped[slot.day]) grouped[slot.day] = [];
      grouped[slot.day].push(slot);
    }

    return res.status(200).json({
      success: true,
      timetable: grouped,
      slots: formattedSlots,
      config: {
        collegeTiming: config.collegeTiming || { startTime: '09:00 AM', endTime: '04:30 PM', isSaturdayWorking: true },
        workingDays,
        breaks: config.breaks || [{ id: 'b1', name: 'Lunch Break', startTime: '12:50 PM', endTime: '01:40 PM' }],
        periods: config.periods || []
      },
      metadata: {
        semester: parseInt(semester, 10),
        section,
        version: timetableRecord?.version || 1,
        status: timetableRecord?.status || 'ACTIVE',
        approvedBy: timetableRecord?.approvedBy || null
      }
    });
  } catch (error) {
    logger.error(`[Timetable Controller] Error fetching timetable: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get My Personalized Timetable (Student or Teacher)
exports.getMyTimetable = async (req, res) => {
  try {
    const userRole = (req.user?.role || '').toUpperCase();

    if (userRole === 'TEACHER' || userRole === 'TG' || req.user?.teacherId) {
      const teacherId = req.user.teacherId;
      if (!teacherId) {
        return res.status(200).json({ success: true, timetable: {}, slots: [] });
      }

      // Filter slots by ACTIVE timetable (LOGIC-03)
      const slots = await prisma.timetableSlot.findMany({
        where: {
          teacherId,
          timetable: { status: 'ACTIVE' }
        },
        include: {
          subject: true,
          classroom: true,
          section: true,
          timetable: true
        },
        orderBy: [{ periodNumber: 'asc' }]
      });

      // Overlay DailySubstitution for today or requested date (LOGIC-01)
      const queryDate = req.query.date ? new Date(req.query.date) : new Date();
      queryDate.setHours(0, 0, 0, 0);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayDayName = dayNames[queryDate.getDay()];

      // Get active substitutions where teacher is either original or substitute
      const dailySubs = await prisma.dailySubstitution.findMany({
        where: {
          date: queryDate,
          status: 'ACTIVE',
          OR: [
            { originalTeacherId: teacherId },
            { substituteTeacherId: teacherId }
          ]
        },
        include: {
          slot: {
            include: {
              subject: true,
              classroom: true,
              section: true,
              teacher: true,
              timetable: true
            }
          },
          originalTeacher: true,
          substituteTeacher: true
        }
      });

      const substitutedOutSlotIds = new Set(
        dailySubs.filter(s => s.originalTeacherId === teacherId).map(s => s.slotId)
      );

      // Slots teacher is scheduled to teach
      let formatted = slots.map(s => {
        const fmt = formatSlot(s);
        if (s.dayOfWeek === todayDayName && substitutedOutSlotIds.has(s.id)) {
          const sub = dailySubs.find(ds => ds.slotId === s.id);
          fmt.isSubstituted = true;
          fmt.substituteTeacherName = sub ? `${sub.substituteTeacher?.firstName} ${sub.substituteTeacher?.lastName || ''}`.trim() : 'Substitute';
          fmt.status = 'Substituted (On Leave)';
        }
        return fmt;
      });

      // Add slots where this teacher is the substitute for today
      const assignedAsSub = dailySubs.filter(s => s.substituteTeacherId === teacherId && s.slot);
      for (const asSub of assignedAsSub) {
        if (asSub.slot && asSub.slot.timetable?.status === 'ACTIVE') {
          const subFmt = formatSlot(asSub.slot);
          subFmt.isSubstituteCover = true;
          subFmt.originalTeacherName = `${asSub.originalTeacher?.firstName} ${asSub.originalTeacher?.lastName || ''}`.trim();
          subFmt.notes = asSub.notes;
          formatted.push(subFmt);
        }
      }

      const grouped = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [] };
      for (const s of formatted) {
        if (!grouped[s.day]) grouped[s.day] = [];
        grouped[s.day].push(s);
      }

      return res.status(200).json({ success: true, timetable: grouped, slots: formatted });
    }

    // Default to student's section
    const student = req.user?.studentProfile;
    const semester = student?.semester || 5;
    const sectionName = student?.section?.name || 'A';

    return exports.getTimetable({ query: { semester, section: sectionName } }, res);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get Timetable Conflicts (Constraint Validation)
exports.getConflicts = async (req, res) => {
  try {
    const { section, semester } = req.query;

    // Filter by ACTIVE timetable only to prevent false conflicts with archived versions (LOGIC-03)
    const allSlots = await prisma.timetableSlot.findMany({
      where: {
        timetable: { status: 'ACTIVE' }
      },
      include: {
        subject: true,
        teacher: true,
        classroom: true,
        section: true,
        timetable: true
      }
    });

    const conflicts = [];
    const teacherMap = new Map();
    const roomMap = new Map();
    const sectionMap = new Map();

    for (const slot of allSlots) {
      const day = slot.dayOfWeek;
      const period = slot.periodNumber;
      const timeStr = `${slot.startTime} - ${slot.endTime}`;
      const secName = slot.section?.name || slot.timetable?.sectionId || 'Unknown';
      const teacherName = slot.teacher ? `${slot.teacher.firstName} ${slot.teacher.lastName || ''}`.trim() : null;
      const roomNum = slot.classroom?.roomNumber;
      const subName = slot.subject?.name || 'Subject';

      // 1. Teacher conflict (assigned to 2 classes at same time)
      if (slot.teacherId && teacherName) {
        const tKey = `${day}_${period}_${slot.teacherId}`;
        if (teacherMap.has(tKey)) {
          const prev = teacherMap.get(tKey);
          conflicts.push({
            id: `tc-${slot.id}-${prev.id}`,
            conflictType: 'Teacher Conflict',
            faculty: teacherName,
            subject: `${subName} / ${prev.subName}`,
            day,
            time: timeStr,
            period,
            affectedSection: `Sections ${secName} & ${prev.secName}`,
            description: `${teacherName} is assigned to two different classes simultaneously in Period ${period} (${timeStr}).`
          });
        } else {
          teacherMap.set(tKey, { id: slot.id, secName, subName });
        }
      }

      // 2. Room conflict (assigned to 2 classes at same time)
      if (slot.classroomId && roomNum) {
        const rKey = `${day}_${period}_${slot.classroomId}`;
        if (roomMap.has(rKey)) {
          const prev = roomMap.get(rKey);
          conflicts.push({
            id: `rc-${slot.id}-${prev.id}`,
            conflictType: 'Room Conflict',
            room: roomNum,
            faculty: teacherName,
            subject: `${subName} / ${prev.subName}`,
            day,
            time: timeStr,
            period,
            affectedSection: `Sections ${secName} & ${prev.secName}`,
            description: `Room ${roomNum} is double-booked for ${subName} and ${prev.subName} in Period ${period}.`
          });
        } else {
          roomMap.set(rKey, { id: slot.id, secName, subName });
        }
      }

      // 3. Student Section conflict (section assigned 2 subjects in same period)
      if (slot.sectionId) {
        const sKey = `${day}_${period}_${slot.sectionId}`;
        if (sectionMap.has(sKey)) {
          const prev = sectionMap.get(sKey);
          conflicts.push({
            id: `sc-${slot.id}-${prev.id}`,
            conflictType: 'Student Section Conflict',
            faculty: teacherName,
            subject: `${subName} / ${prev.subName}`,
            day,
            time: timeStr,
            period,
            affectedSection: `Section ${secName}`,
            description: `Section ${secName} is assigned multiple subjects (${subName} & ${prev.subName}) in Period ${period}.`
          });
        } else {
          sectionMap.set(sKey, { id: slot.id, subName });
        }
      }
    }

    return res.status(200).json({
      success: true,
      totalConflicts: conflicts.length,
      conflicts,
      hasConflicts: conflicts.length > 0
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Time parsing and formatting helpers for custom period timing generation
const parseTimeMinutes = (timeStr) => {
  if (!timeStr) return 540; // 09:00 AM
  const cleaned = String(timeStr).trim();
  const match = cleaned.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return 540;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = (match[3] || '').toUpperCase();
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const formatTimeMinutes = (totalMinutes) => {
  let hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)} ${meridiem}`;
};

const generatePeriodsFromTiming = (startTimeStr, durationMinutes, count, breaksList = []) => {
  let currentMinutes = parseTimeMinutes(startTimeStr || '09:00 AM');
  const dur = parseInt(durationMinutes, 10) || 50;
  const parsedBreaks = (breaksList || []).map(b => ({
    ...b,
    startMins: parseTimeMinutes(b.startTime || b.start_time),
    endMins: parseTimeMinutes(b.endTime || b.end_time)
  })).sort((a, b) => a.startMins - b.startMins);

  const generated = [];
  for (let i = 1; i <= count; i++) {
    for (const brk of parsedBreaks) {
      if (currentMinutes >= brk.startMins && currentMinutes < brk.endMins) {
        currentMinutes = brk.endMins;
      }
    }
    const slotStart = currentMinutes;
    let slotEnd = slotStart + dur;

    for (const brk of parsedBreaks) {
      if (slotStart < brk.startMins && slotEnd > brk.startMins) {
        if (brk.startMins - slotStart >= 25) {
          slotEnd = brk.startMins;
        } else {
          currentMinutes = brk.endMins;
          slotEnd = currentMinutes + dur;
        }
      }
    }

    generated.push({
      periodNumber: i,
      period: i,
      name: `Period ${i}`,
      label: `Period ${i}`,
      startTime: formatTimeMinutes(slotStart),
      endTime: formatTimeMinutes(slotEnd),
      duration: dur
    });

    currentMinutes = slotEnd;
    for (const brk of parsedBreaks) {
      if (currentMinutes >= brk.startMins && currentMinutes < brk.endMins) {
        currentMinutes = brk.endMins;
      }
    }
  }
  return generated;
};

// 4. Smart AI Timetable Generation with Full Period, Break & Timing Constraints
exports.generateTimetable = async (req, res) => {
  try {
    const {
      department = 'CSE',
      semester = 5,
      section = 'A',
      academicYear = '2026-27',
      collegeTiming = {},
      workingDays: reqWorkingDays,
      breaks = [],
      periods: reqPeriods = [],
      period_timings = [],
      start_time,
      startTime: bodyStartTime,
      period_duration_minutes,
      periodDuration,
      periods_per_day,
      periodsPerDay,
      customSubjects = [],
      custom_subjects = []
    } = req.body;

    const subjectsInput = customSubjects.length > 0 ? customSubjects : custom_subjects;
    const reqStartTime = start_time || bodyStartTime || collegeTiming.startTime || '09:00 AM';
    const reqDuration = parseInt(period_duration_minutes || periodDuration || collegeTiming.periodDuration || 50, 10);
    const reqPeriodCount = parseInt(periods_per_day || periodsPerDay || (reqPeriods.length > 0 ? reqPeriods.length : 7), 10);

    const dept = await prisma.department.findFirst({ where: { code: department.toUpperCase() } });
    if (!dept) {
      return res.status(404).json({ success: false, message: `Department ${department} not found.` });
    }

    // 1. Fetch real curriculum, faculty, rooms, and sections from PostgreSQL
    const [dbSubjects, dbTeachers, dbRooms, sec, activeLeaves, otherSectionSlots] = await Promise.all([
      prisma.subject.findMany({ where: { departmentId: dept.id, semester: parseInt(semester, 10) } }),
      prisma.teacher.findMany({ where: { departmentId: dept.id, status: 'ACTIVE' } }),
      prisma.classroom.findMany({ where: { isActive: true } }),
      prisma.section.findFirst({ where: { departmentId: dept.id, name: section.toUpperCase() } }),
      prisma.leaveApplication.findMany({
        where: { applicantType: 'TEACHER', status: { in: ['APPROVED', 'PENDING'] } }
      }),
      prisma.timetableSlot.findMany({
        where: {
          timetable: {
            departmentId: dept.id,
            status: 'ACTIVE',
            OR: [
              { semester: { not: parseInt(semester, 10) } },
              { section: { name: { not: section.toUpperCase() } } }
            ]
          }
        },
        include: { teacher: true, classroom: true }
      })
    ]);

    if (dbSubjects.length === 0 || dbTeachers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient subjects or teachers in database. Please add subjects and teachers in Master Data first.'
      });
    }

    // 2. Resolve Working Days
    const isSaturdayWorking = collegeTiming.isSaturdayWorking !== undefined ? Boolean(collegeTiming.isSaturdayWorking) : true;
    let workingDays = Array.isArray(reqWorkingDays) && reqWorkingDays.length > 0
      ? reqWorkingDays
      : (Array.isArray(collegeTiming.workingDays) && collegeTiming.workingDays.length > 0
          ? collegeTiming.workingDays
          : (isSaturdayWorking
              ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
              : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']));

    // 3. Resolve Breaks
    let activeBreaks = Array.isArray(breaks) && breaks.length > 0
      ? breaks.map((b, idx) => ({
          id: b.id || `brk-${idx + 1}`,
          name: b.name || b.label || 'Break',
          startTime: b.startTime || b.start_time || '01:05 PM',
          endTime: b.endTime || b.end_time || '01:50 PM',
          isBreak: true
        }))
      : [
          { id: 'b1', name: 'Short Break', startTime: '11:10 AM', endTime: '11:25 AM', isBreak: true },
          { id: 'b2', name: 'Lunch Break', startTime: '01:05 PM', endTime: '01:50 PM', isBreak: true }
        ];

    // 4. Resolve Periods (Dynamic calculation or user customized)
    let rawPeriods = (Array.isArray(reqPeriods) && reqPeriods.length > 0)
      ? reqPeriods
      : (Array.isArray(period_timings) && period_timings.length > 0 ? period_timings : []);

    let activePeriods = [];
    if (rawPeriods.length > 0) {
      activePeriods = rawPeriods.map((p, idx) => {
        const pNum = parseInt(p.periodNumber || p.period || p.period_number || idx + 1, 10);
        return {
          ...p,
          periodNumber: pNum,
          period: pNum,
          name: p.name || p.label || `Period ${pNum}`,
          label: p.label || p.name || `Period ${pNum}`,
          startTime: p.startTime || p.start_time || p.start || '09:00 AM',
          endTime: p.endTime || p.end_time || p.end || '09:50 AM',
          duration: parseInt(p.duration || p.duration_minutes || reqDuration, 10)
        };
      });
    } else {
      activePeriods = generatePeriodsFromTiming(reqStartTime, reqDuration, reqPeriodCount, activeBreaks);
    }

    // 5. Build Busy Constraints from other sections
    const teacherBusyMap = new Set(); // `${day}_${period}_${teacherId}`
    const roomBusyMap = new Set(); // `${day}_${period}_${roomId}`

    for (const os of otherSectionSlots) {
      if (os.dayOfWeek && os.periodNumber) {
        if (os.teacherId) teacherBusyMap.add(`${os.dayOfWeek}_${os.periodNumber}_${os.teacherId}`);
        if (os.classroomId) roomBusyMap.add(`${os.dayOfWeek}_${os.periodNumber}_${os.classroomId}`);
      }
    }

    // 6. Theory & Lab Rooms pool
    const theoryRooms = dbRooms.filter(r => r.type !== 'LAB');
    const labRooms = dbRooms.filter(r => r.type === 'LAB');
    const defaultTheoryRoom = theoryRooms[0] || dbRooms[0] || null;
    const defaultLabRoom = labRooms[0] || dbRooms[0] || null;

    // 7. Build Sessions to Schedule
    const sessions = [];

    if (subjectsInput && subjectsInput.length > 0) {
      for (const cs of subjectsInput) {
        const subName = cs.name || cs.subject || 'Subject';
        const subCode = cs.code || 'CS';
        const isLab = Boolean(cs.isLab || cs.type === 'Practical' || cs.type === 'Lab' || subName.toLowerCase().includes('lab'));
        const weeklyPeriods = parseInt(cs.weeklyPeriods || cs.periods_per_week || (isLab ? 2 : 4), 10);
        const consecutive = parseInt(cs.consecutivePeriods || (isLab ? 2 : 1), 10);

        // Find teacher
        let teacher = dbTeachers.find(t => t.id === cs.teacherId || `${t.firstName} ${t.lastName || ''}`.trim().toLowerCase() === String(cs.teacherName || cs.faculty || '').toLowerCase());
        if (!teacher) teacher = dbTeachers[0];

        // Find room
        let room = dbRooms.find(r => r.id === cs.classroomId || r.roomNumber === cs.roomNumber);
        if (!room) room = isLab ? defaultLabRoom : defaultTheoryRoom;

        const matchedDbSub = dbSubjects.find(s => s.code === subCode) || dbSubjects[0];

        if (isLab) {
          const numBlocks = Math.max(1, Math.floor(weeklyPeriods / consecutive));
          for (let b = 0; b < numBlocks; b++) {
            sessions.push({
              subject: matchedDbSub,
              name: subName,
              code: subCode,
              teacher,
              room: defaultLabRoom || room,
              isLab: true,
              consecutivePeriods: consecutive,
              type: 'Practical'
            });
          }
        } else {
          for (let p = 0; p < weeklyPeriods; p++) {
            sessions.push({
              subject: matchedDbSub,
              name: subName,
              code: subCode,
              teacher,
              room: defaultTheoryRoom || room,
              isLab: false,
              consecutivePeriods: 1,
              type: 'Theory'
            });
          }
        }
      }
    } else {
      // Default from dbSubjects
      let tIdx = 0;
      for (const sub of dbSubjects) {
        const isLab = sub.name.toLowerCase().includes('lab');
        const teacher = dbTeachers[tIdx % dbTeachers.length];
        tIdx++;

        if (isLab) {
          sessions.push({
            subject: sub,
            name: sub.name,
            code: sub.code,
            teacher,
            room: defaultLabRoom,
            isLab: true,
            consecutivePeriods: 2,
            type: 'Practical'
          });
        } else {
          for (let p = 0; p < Math.min(sub.weeklyHours || 4, 4); p++) {
            sessions.push({
              subject: sub,
              name: sub.name,
              code: sub.code,
              teacher,
              room: defaultTheoryRoom,
              isLab: false,
              consecutivePeriods: 1,
              type: 'Theory'
            });
          }
        }
      }
    }

    // Sort: Practical / Lab sessions first (need consecutive blocks)
    sessions.sort((a, b) => (b.isLab ? 1 : 0) - (a.isLab ? 1 : 0));

    // 8. Execute Deterministic Constraint Allocation
    const allocatedSlots = [];
    const sectionBusy = new Set(); // `${day}_${period}`
    const dailyTeacherCount = new Map(); // `${day}_${teacherId}` -> count
    const dailySubjectPlaced = new Set(); // `${day}_${subCode}`

    const periodMap = new Map(activePeriods.map(p => [p.periodNumber, p]));

    for (const session of sessions) {
      let placed = false;
      const isLab = session.isLab;
      const consec = session.consecutivePeriods || 1;
      const teacher = session.teacher;
      const room = session.room;

      // Try least loaded days first to balance schedule across working days
      const daysByLoad = [...workingDays].sort((d1, d2) => {
        const c1 = [...sectionBusy].filter(k => k.startsWith(`${d1}_`)).length;
        const c2 = [...sectionBusy].filter(k => k.startsWith(`${d2}_`)).length;
        return c1 - c2;
      });

      for (const day of daysByLoad) {
        if (placed) break;

        // Spread theory subjects: avoid placing same subject twice on same day if possible
        if (!isLab && dailySubjectPlaced.has(`${day}_${session.code}`)) {
          const daysWithoutThisSub = workingDays.filter(d => !dailySubjectPlaced.has(`${d}_${session.code}`));
          if (daysWithoutThisSub.length > 0) continue;
        }

        if (isLab && consec === 2) {
          // Look for 2 consecutive free periods
          for (let pIdx = 0; pIdx < activePeriods.length - 1; pIdx++) {
            const p1 = activePeriods[pIdx].periodNumber;
            const p2 = activePeriods[pIdx + 1].periodNumber;

            const secFree = !sectionBusy.has(`${day}_${p1}`) && !sectionBusy.has(`${day}_${p2}`);
            const teacherFree = !teacherBusyMap.has(`${day}_${p1}_${teacher.id}`) && !teacherBusyMap.has(`${day}_${p2}_${teacher.id}`);
            const roomFree = !room || (!roomBusyMap.has(`${day}_${p1}_${room.id}`) && !roomBusyMap.has(`${day}_${p2}_${room.id}`));

            if (secFree && teacherFree && roomFree) {
              const p1Info = periodMap.get(p1);
              const p2Info = periodMap.get(p2);

              allocatedSlots.push({
                dayOfWeek: day,
                periodNumber: p1,
                startTime: p1Info.startTime,
                endTime: p1Info.endTime,
                subjectId: session.subject.id,
                teacherId: teacher.id,
                classroomId: room?.id || null,
                sectionId: sec?.id || null,
                isLab: true
              });

              allocatedSlots.push({
                dayOfWeek: day,
                periodNumber: p2,
                startTime: p2Info.startTime,
                endTime: p2Info.endTime,
                subjectId: session.subject.id,
                teacherId: teacher.id,
                classroomId: room?.id || null,
                sectionId: sec?.id || null,
                isLab: true
              });

              sectionBusy.add(`${day}_${p1}`);
              sectionBusy.add(`${day}_${p2}`);
              teacherBusyMap.add(`${day}_${p1}_${teacher.id}`);
              teacherBusyMap.add(`${day}_${p2}_${teacher.id}`);
              if (room) {
                roomBusyMap.add(`${day}_${p1}_${room.id}`);
                roomBusyMap.add(`${day}_${p2}_${room.id}`);
              }
              dailySubjectPlaced.add(`${day}_${session.code}`);
              placed = true;
              break;
            }
          }
        } else {
          // Single period slot
          for (const pInfo of activePeriods) {
            const p = pInfo.periodNumber;

            const secFree = !sectionBusy.has(`${day}_${p}`);
            const teacherFree = !teacherBusyMap.has(`${day}_${p}_${teacher.id}`);
            const teacherDailyCount = dailyTeacherCount.get(`${day}_${teacher.id}`) || 0;
            const workloadOk = teacherDailyCount < (teacher.maxPeriodsPerDay || 4);
            const roomFree = !room || !roomBusyMap.has(`${day}_${p}_${room.id}`);

            if (secFree && teacherFree && workloadOk && roomFree) {
              allocatedSlots.push({
                dayOfWeek: day,
                periodNumber: p,
                startTime: pInfo.startTime,
                endTime: pInfo.endTime,
                subjectId: session.subject.id,
                teacherId: teacher.id,
                classroomId: room?.id || null,
                sectionId: sec?.id || null,
                isLab: false
              });

              sectionBusy.add(`${day}_${p}`);
              teacherBusyMap.add(`${day}_${p}_${teacher.id}`);
              if (room) roomBusyMap.add(`${day}_${p}_${room.id}`);
              dailyTeacherCount.set(`${day}_${teacher.id}`, teacherDailyCount + 1);
              dailySubjectPlaced.add(`${day}_${session.code}`);
              placed = true;
              break;
            }
          }
        }
      }
    }

    // 9. Save generated timetable and persist configuration in PostgreSQL
    const existingVersion = await prisma.timetable.findFirst({
      where: { departmentId: dept.id, semester: parseInt(semester, 10), sectionId: sec?.id || undefined },
      orderBy: { version: 'desc' }
    });
    const newVersion = (existingVersion?.version || 0) + 1;

    const savedTimetable = await prisma.$transaction(async (tx) => {
      // Archive or deactivate previous version
      if (existingVersion) {
        await tx.timetable.update({
          where: { id: existingVersion.id },
          data: { status: 'ARCHIVED' }
        });
      }

      const tb = await tx.timetable.create({
        data: {
          departmentId: dept.id,
          semester: parseInt(semester, 10),
          sectionId: sec?.id || null,
          academicYear,
          version: newVersion,
          status: 'ACTIVE',
          approvedBy: req.user?.name || 'HOD / Smart AI Engine',
          approvedAt: new Date(),
          metrics: {
            slotsCount: allocatedSlots.length,
            engine: 'Smart-CSP-Engine',
            config: {
              collegeTiming: {
                startTime: collegeTiming.startTime || '09:00 AM',
                endTime: collegeTiming.endTime || '04:30 PM',
                isSaturdayWorking,
                workingDays
              },
              workingDays,
              breaks: activeBreaks,
              periods: activePeriods,
              customSubjects: subjectsInput
            }
          }
        }
      });

      const slotInserts = allocatedSlots.map(s => ({
        timetableId: tb.id,
        dayOfWeek: s.dayOfWeek,
        periodNumber: parseInt(s.periodNumber || s.period || s.period_number, 10) || 1,
        startTime: s.startTime,
        endTime: s.endTime,
        subjectId: s.subjectId,
        teacherId: s.teacherId,
        classroomId: s.classroomId,
        sectionId: sec?.id || null,
        isLab: Boolean(s.isLab)
      }));

      await tx.timetableSlot.createMany({ data: slotInserts });
      return tb;
    });

    // Record AI Generated ERP record
    await prisma.aIGeneratedRecord.create({
      data: {
        recordType: 'TIMETABLE_VERSION',
        referenceId: savedTimetable.id,
        generatedByAgent: 'TimetableAgent',
        inputParameters: { department, semester, section, academicYear, periodsCount: activePeriods.length, breaksCount: activeBreaks.length },
        structuredResult: { timetableId: savedTimetable.id, version: newVersion, slotsCount: allocatedSlots.length },
        status: 'COMMITTED',
        approvedByUserId: req.user?.id || null,
        approvedAt: new Date()
      }
    });

    return res.status(200).json({
      success: true,
      message: `Timetable version ${newVersion} generated and saved to PostgreSQL successfully.`,
      timetableId: savedTimetable.id,
      version: newVersion,
      slotsCount: allocatedSlots.length,
      slots: allocatedSlots,
      timetable: allocatedSlots,
      config: {
        workingDays,
        breaks: activeBreaks,
        periods: activePeriods,
        collegeTiming: {
          startTime: collegeTiming.startTime || '09:00 AM',
          endTime: collegeTiming.endTime || '04:30 PM',
          isSaturdayWorking
        }
      }
    });
  } catch (error) {
    logger.error(`[Timetable Controller] Generate error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Timetable Versions
exports.getTimetableVersions = async (req, res) => {
  try {
    const versions = await prisma.timetable.findMany({
      orderBy: { version: 'desc' },
      include: { section: true }
    });
    return res.status(200).json({ success: true, versions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Approve / Publish
exports.approveTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.timetable.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        approvedBy: req.user?.name || 'HOD',
        approvedAt: new Date()
      }
    });
    return res.status(200).json({ success: true, message: 'Timetable approved and active.', timetable: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.publishTimetable = exports.approveTimetable;
exports.regenerateTimetable = exports.generateTimetable;
exports.getTimetableById = exports.getTimetable;

// 7. CRUD on Slots
exports.createTimetableEntry = async (req, res) => {
  try {
    const { timetableId, dayOfWeek, periodNumber, startTime, endTime, subjectId, teacherId, classroomId, sectionId, isLab } = req.body;

    const slot = await prisma.timetableSlot.create({
      data: {
        timetableId,
        dayOfWeek,
        periodNumber: parseInt(periodNumber, 10),
        startTime,
        endTime,
        subjectId,
        teacherId,
        classroomId: classroomId || null,
        sectionId: sectionId || null,
        isLab: Boolean(isLab)
      },
      include: { subject: true, teacher: true, classroom: true, section: true }
    });

    return res.status(201).json({ success: true, slot: formatSlot(slot) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTimetableEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const slot = await prisma.timetableSlot.update({
      where: { id },
      data: req.body,
      include: { subject: true, teacher: true, classroom: true, section: true }
    });
    return res.status(200).json({ success: true, slot: formatSlot(slot) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteTimetableEntry = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.timetableSlot.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Slot deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Exports
exports.exportTimetablePDF = async (req, res) => {
  try {
    const { section = 'A', semester = 5, year = '3rd Year', slots, config } = { ...req.query, ...req.body };
    const pdfBuffer = await pdfService.exportTimetablePDF(section, semester, year, slots, config);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=timetable_${section}_sem${semester}.pdf`);
    return res.send(pdfBuffer);
  } catch (error) {
    logger.error(`[Timetable Controller] PDF export error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportTimetableExcel = async (req, res) => {
  try {
    const { section = 'A', semester = 5, academicYear = '2026-27', slots, config } = { ...req.query, ...req.body };
    const excelBuffer = await excelService.exportTimetableExcel(section, semester, academicYear, slots, config);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=timetable_${section}_sem${semester}.xlsx`);
    return res.send(excelBuffer);
  } catch (error) {
    logger.error(`[Timetable Controller] Excel export error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

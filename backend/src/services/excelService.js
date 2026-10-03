// ============================================================================
// Departmental ERP - Excel Export Service
// Renders the EXACT 2D visual timetable grid matching the UI
// ============================================================================

const xlsx = require('xlsx');
const { prisma } = require('../config/postgres');

const excelService = {
  // 1. Export section timetable in EXACT 2D Grid matching UI
  async exportTimetableExcel(section = 'A', semester = 5, academicYear = '2026-27', customSlots = null, customConfig = null) {
    const cleanSection = section.replace('CSE-', '').toUpperCase();
    const semNum = parseInt(semester, 10) || 5;

    let slots = [];
    let config = {};

    if (Array.isArray(customSlots) && customSlots.length > 0) {
      slots = customSlots;
      config = customConfig || {};
    } else {
      const timetableRecord = await prisma.timetable.findFirst({
        where: {
          semester: semNum,
          ...(cleanSection ? { section: { name: cleanSection } } : {})
        },
        orderBy: { version: 'desc' },
        include: {
          slots: {
            include: {
              subject: true,
              teacher: true,
              classroom: true,
              section: true
            }
          },
          section: true,
          department: true
        }
      });

      slots = timetableRecord?.slots || [];
      config = timetableRecord?.metrics?.config || {};
    }

    // Working days
    const workingDays = Array.isArray(config.workingDays) && config.workingDays.length > 0
      ? config.workingDays
      : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Breaks
    const breaks = Array.isArray(config.breaks) && config.breaks.length > 0
      ? config.breaks
      : [{ name: 'Lunch Break', startTime: '12:50 PM', endTime: '01:40 PM', isBreak: true }];

    // Periods
    let periods = Array.isArray(config.periods) && config.periods.length > 0 ? config.periods : [];
    if (periods.length === 0) {
      const periodMap = new Map();
      for (const s of slots) {
        if (!periodMap.has(s.periodNumber)) {
          periodMap.set(s.periodNumber, {
            periodNumber: s.periodNumber,
            name: `Period ${s.periodNumber}`,
            startTime: s.startTime || '09:30 AM',
            endTime: s.endTime || '10:20 AM'
          });
        }
      }
      if (periodMap.size > 0) {
        periods = Array.from(periodMap.values()).sort((a, b) => a.periodNumber - b.periodNumber);
      } else {
        periods = [
          { periodNumber: 1, name: 'Period 1', startTime: '09:00 AM', endTime: '09:50 AM' },
          { periodNumber: 2, name: 'Period 2', startTime: '09:50 AM', endTime: '10:40 AM' },
          { periodNumber: 3, name: 'Period 3', startTime: '10:40 AM', endTime: '11:30 AM' },
          { periodNumber: 4, name: 'Period 4', startTime: '11:45 AM', endTime: '12:35 PM' },
          { periodNumber: 5, name: 'Period 5', startTime: '01:30 PM', endTime: '02:20 PM' },
          { periodNumber: 6, name: 'Period 6', startTime: '02:20 PM', endTime: '03:10 PM' },
          { periodNumber: 7, name: 'Period 7', startTime: '03:10 PM', endTime: '04:00 PM' }
        ];
      }
    }

    const parseTimeMinutes = (tStr) => {
      if (!tStr) return 0;
      const match = tStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (!match) return 0;
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const mer = (match[3] || '').toUpperCase();
      if (mer === 'PM' && h < 12) h += 12;
      if (mer === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    };

    const allItems = [
      ...periods.map(p => ({ ...p, type: 'PERIOD', timeMinutes: parseTimeMinutes(p.startTime) })),
      ...breaks.map(b => ({ ...b, type: 'BREAK', timeMinutes: parseTimeMinutes(b.startTime) }))
    ];
    allItems.sort((a, b) => a.timeMinutes - b.timeMinutes);

    // Map slots by (day, periodNumber)
    const slotLookup = new Map();
    for (const s of slots) {
      const key = `${s.dayOfWeek}_${s.periodNumber}`;
      slotLookup.set(key, s);
    }

    // Build Worksheet Data array of arrays (AOA)
    const aoa = [
      ['CAMPUSFLOW — DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING'],
      [`OFFICIAL ACADEMIC TIMETABLE (Semester ${semNum} — Section ${cleanSection})`],
      [`Academic Year: ${academicYear} | Department: CSE | Status: ACTIVE & VERIFIED`],
      [] // Blank line
    ];

    // Header Row: Time/Period, Monday, Tuesday, ...
    const headerRow = ['Time / Period', ...workingDays];
    aoa.push(headerRow);

    // Data Rows
    for (const item of allItems) {
      if (item.type === 'BREAK') {
        const breakText = `[BREAK] ${item.name} (${item.startTime} - ${item.endTime})`;
        const row = [breakText];
        for (let i = 0; i < workingDays.length; i++) {
          row.push(`*** ${item.name.toUpperCase()} ***`);
        }
        aoa.push(row);
      } else {
        const timeHeader = `${item.name || 'Period ' + item.periodNumber}\n(${item.startTime} - ${item.endTime})`;
        const row = [timeHeader];

        for (const day of workingDays) {
          const slot = slotLookup.get(`${day}_${item.periodNumber}`);
          if (slot) {
            const sub = slot.subject?.name || 'Class';
            const code = slot.subject?.code ? ` (${slot.subject.code})` : '';
            const teacher = slot.teacher ? `\nFaculty: ${slot.teacher.firstName} ${slot.teacher.lastName || ''}`.trim() : '';
            const room = slot.classroom?.roomNumber ? `\nRoom: ${slot.classroom.roomNumber}` : '';
            const type = slot.isLab ? ' [LAB]' : '';
            row.push(`${sub}${code}${type}${teacher}${room}`);
          } else {
            row.push('—');
          }
        }
        aoa.push(row);
      }
    }

    // Create Worksheet
    const worksheet = xlsx.utils.aoa_to_sheet(aoa);

    // Set Column Widths for readability
    const colWidths = [{ wch: 22 }];
    for (let i = 0; i < workingDays.length; i++) {
      colWidths.push({ wch: 32 });
    }
    worksheet['!cols'] = colWidths;

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, `Timetable_Sec_${cleanSection}`);
    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  },

  // 2. Export students to Excel buffer
  async exportStudentsExcel(filter = {}) {
    const students = await prisma.student.findMany({
      where: filter,
      include: {
        department: true,
        section: true
      },
      orderBy: { enrollmentNo: 'asc' }
    });

    const data = students.map((s) => ({
      'Enrollment Number': s.enrollmentNo,
      'Full Name': `${s.firstName} ${s.lastName || ''}`.trim(),
      'Email': s.email,
      'Phone': s.phone || 'N/A',
      'Semester': s.semester,
      'Section': s.section?.name || 'A',
      'Department': s.department?.code || 'CSE',
      'Status': s.status
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'CSE_Students');
    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
};

module.exports = excelService;

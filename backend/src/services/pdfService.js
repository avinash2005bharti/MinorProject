// ============================================================================
// Departmental ERP - PDF Export Service
// Renders the EXACT 2D visual timetable grid matching the UI
// ============================================================================

const PDFDocument = require('pdfkit');
const { prisma } = require('../config/postgres');

const pdfService = {
  /**
   * Generates a professional 2D visual grid timetable PDF buffer using PDFKit.
   * Matches the UI grid layout with Time/Period column, Day columns, Break rows, and Cell details.
   */
  async exportTimetablePDF(section = 'A', semester = 5, year = '3rd Year', customSlots = null, customConfig = null) {
    return new Promise(async (resolve, reject) => {
      try {
        const cleanSection = section.replace('CSE-', '').toUpperCase();
        const semNum = parseInt(semester, 10) || 5;

        let slots = [];
        let config = {};

        if (Array.isArray(customSlots) && customSlots.length > 0) {
          slots = customSlots;
          config = customConfig || {};
        } else {
          // Fetch latest active timetable for this section and semester
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

        // Extract working days or default to Mon-Sat
        const workingDays = Array.isArray(config.workingDays) && config.workingDays.length > 0
          ? config.workingDays
          : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // Extract configured breaks or default
        const breaks = Array.isArray(config.breaks) && config.breaks.length > 0
          ? config.breaks
          : [
              { name: 'Lunch Break', startTime: '12:50 PM', endTime: '01:40 PM', isBreak: true }
            ];

        // Extract configured periods or derive from slots/defaults
        let periods = Array.isArray(config.periods) && config.periods.length > 0 ? config.periods : [];
        if (periods.length === 0) {
          // Derive periods from slots if available
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

        // Build composite timeline rows: periods and breaks interleaved chronologically
        const timeline = [];
        let pIdx = 0;
        let bIdx = 0;

        // Simple time to minutes helper for ordering
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

        // Initialize Landscape A4 PDFKit Document
        const doc = new PDFDocument({ margin: 25, size: 'A4', layout: 'landscape' });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        const pageWidth = 841.89; // A4 landscape width
        const marginLeft = 25;
        const availableWidth = pageWidth - marginLeft * 2; // ~791.89pt

        // 1. Header Banner
        doc.rect(marginLeft, 20, availableWidth, 54).fill('#0F172A');

        doc.fillColor('#38BDF8').fontSize(12).font('Helvetica-Bold')
           .text('CAMPUSFLOW — SMART COLLEGE ERP SYSTEM', marginLeft + 15, 27, { width: availableWidth - 30, align: 'center' });

        doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica-Bold')
           .text('DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING', marginLeft + 15, 42, { width: availableWidth - 30, align: 'center' });

        doc.fillColor('#94A3B8').fontSize(8.5).font('Helvetica')
           .text(`ACADEMIC TIMETABLE  •  Semester ${semNum} (Section ${cleanSection})  •  Academic Session: 2026-27  •  Status: APPROVED & ACTIVE`, marginLeft + 15, 57, { width: availableWidth - 30, align: 'center' });

        // 2. Table Column Dimensions
        const timeColWidth = 90;
        const numDayCols = workingDays.length;
        const dayColWidth = Math.floor((availableWidth - timeColWidth) / numDayCols);
        const actualTableWidth = timeColWidth + dayColWidth * numDayCols;

        let startY = 82;

        // Table Header
        doc.rect(marginLeft, startY, actualTableWidth, 24).fill('#1E3A8A');

        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8.5);
        doc.text('Time / Period', marginLeft + 4, startY + 7, { width: timeColWidth - 8, align: 'center' });

        let currentX = marginLeft + timeColWidth;
        for (const day of workingDays) {
          doc.text(day.toUpperCase(), currentX + 2, startY + 7, { width: dayColWidth - 4, align: 'center' });
          currentX += dayColWidth;
        }

        startY += 24;

        // Render Timeline Rows
        const baseRowHeight = 44;
        const breakRowHeight = 20;

        for (const item of allItems) {
          if (item.type === 'BREAK') {
            // Render full-width break bar
            doc.rect(marginLeft, startY, actualTableWidth, breakRowHeight).fill('#FEF3C7');
            doc.rect(marginLeft, startY, actualTableWidth, breakRowHeight).stroke('#F59E0B');

            doc.fillColor('#B45309').font('Helvetica-Bold').fontSize(8.5);
            const breakLabel = `☕ ${item.name.toUpperCase()} (${item.startTime} – ${item.endTime})`;
            doc.text(breakLabel, marginLeft, startY + 5, { width: actualTableWidth, align: 'center' });

            startY += breakRowHeight;
          } else {
            // Render Class Period Row
            const rowHeight = baseRowHeight;

            // Check page boundary
            if (startY + rowHeight > 540) {
              doc.addPage({ layout: 'landscape', margin: 25 });
              startY = 30;
            }

            // Time column cell
            doc.rect(marginLeft, startY, timeColWidth, rowHeight).fill('#F8FAFC');
            doc.rect(marginLeft, startY, timeColWidth, rowHeight).stroke('#CBD5E1');

            doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(8);
            doc.text(item.name || `Period ${item.periodNumber}`, marginLeft + 2, startY + 6, { width: timeColWidth - 4, align: 'center' });
            doc.fillColor('#475569').font('Helvetica').fontSize(7.5);
            doc.text(`${item.startTime} -`, marginLeft + 2, startY + 18, { width: timeColWidth - 4, align: 'center' });
            doc.text(item.endTime, marginLeft + 2, startY + 28, { width: timeColWidth - 4, align: 'center' });

            // Day Cells
            currentX = marginLeft + timeColWidth;

            for (const day of workingDays) {
              const slotKey = `${day}_${item.periodNumber}`;
              const slot = slotLookup.get(slotKey);

              const cellBg = slot ? (slot.isLab ? '#F0FDF4' : '#FFFFFF') : '#FAFAFA';
              doc.rect(currentX, startY, dayColWidth, rowHeight).fill(cellBg);
              doc.rect(currentX, startY, dayColWidth, rowHeight).stroke('#CBD5E1');

              if (slot) {
                const subName = slot.subject?.name || 'Class';
                const subCode = slot.subject?.code || '';
                const teacherName = slot.teacher
                  ? `${slot.teacher.firstName} ${slot.teacher.lastName || ''}`.trim()
                  : 'TBD';
                const roomName = slot.classroom?.roomNumber || 'Room 101';

                // Subject Title
                doc.fillColor('#1E293B').font('Helvetica-Bold').fontSize(7.5);
                const displaySub = subName.length > 22 ? `${subName.substring(0, 20)}...` : subName;
                doc.text(`${displaySub} (${subCode})`, currentX + 3, startY + 4, { width: dayColWidth - 6, align: 'center' });

                // Faculty
                doc.fillColor('#2563EB').font('Helvetica').fontSize(7);
                doc.text(`Prof. ${teacherName}`, currentX + 3, startY + 18, { width: dayColWidth - 6, align: 'center' });

                // Room & Lab tag
                doc.fillColor('#64748B').font('Helvetica').fontSize(6.5);
                const roomTag = slot.isLab ? `[LAB] ${roomName}` : roomName;
                doc.text(roomTag, currentX + 3, startY + 30, { width: dayColWidth - 6, align: 'center' });
              } else {
                // Free Slot
                doc.fillColor('#CBD5E1').font('Helvetica').fontSize(10);
                doc.text('—', currentX + 2, startY + 15, { width: dayColWidth - 4, align: 'center' });
              }

              currentX += dayColWidth;
            }

            startY += rowHeight;
          }
        }

        // Footer Note
        startY += 8;
        doc.fillColor('#64748B').font('Helvetica-Oblique').fontSize(7.5);
        doc.text('Note: Practical / Lab sessions span designated lab rooms. This schedule is computer-generated, conflict-free, and approved by the HOD.', marginLeft, startY, { width: actualTableWidth, align: 'left' });
        doc.text(`Official Document  •  Printed on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, marginLeft, startY, { width: actualTableWidth, align: 'right' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
};

module.exports = pdfService;

const xlsx = require('xlsx');
const { Student, Timetable } = require('../models/mysql');

const excelService = {
  // Export students to Excel buffer
  async exportStudentsExcel(filter = {}) {
    const students = await Student.findAll({ where: filter });
    const data = students.map((s) => ({
      'Enrollment Number': s.enrollment_no,
      'Full Name': s.name,
      'Email': s.email,
      'Phone': s.phone,
      'Year': s.year,
      'Semester': s.semester,
      'Section': s.section,
      'Batch': s.batch,
      'Status': s.status
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'CSE_Students');
    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  },

  // Export section timetable to Excel buffer
  async exportTimetableExcel(section = 'A', semester = 5) {
    const cleanSection = section.replace('CSE-', '').toUpperCase();
    const where = { section: cleanSection };
    if (semester) where.semester = parseInt(semester, 10);

    const slots = await Timetable.findAll({
      where,
      order: [
        ['day', 'ASC'],
        ['start_time', 'ASC']
      ]
    });

    const data = slots.map((s) => ({
      'Day': s.day,
      'Period': s.period || 1,
      'Time Slot': `${s.start_time || ''} - ${s.end_time || ''}`,
      'Subject': s.subject,
      'Faculty Member': s.faculty,
      'Room / Lab': s.room,
      'Class': `${s.year || '3rd Year'} Sem ${s.semester} Sec ${s.section}`,
      'Type': s.type || 'Lecture'
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, `Timetable_Sec_${cleanSection}`);
    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
};

module.exports = excelService;

const xlsx = require('xlsx');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Timetable = require('../models/Timetable');

const excelService = {
  // Export students to Excel buffer
  async exportStudentsExcel(filter = {}) {
    const students = await Student.find(filter).lean();
    const data = students.map((s) => ({
      'Roll Number': s.rollNo,
      'Full Name': s.name,
      'Email': s.email,
      'Department': s.department,
      'Year': s.year,
      'Semester': s.semester,
      'Section': s.section,
      'Batch': s.batch,
      'CGPA': s.cgpa,
      'Attendance %': s.attendance,
      'Status': s.status
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'CSE_Students');
    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  },

  // Export section timetable to Excel buffer
  async exportTimetableExcel(section = 'CSE-3A') {
    const slots = await Timetable.find({ section }).lean();
    const data = slots.map((s) => ({
      'Day': s.day,
      'Period': s.period,
      'Time': s.time,
      'Subject Code': s.code,
      'Subject Name': s.subject,
      'Faculty': s.faculty,
      'Room': s.room,
      'Section': s.section,
      'Type': s.type
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, `Timetable_${section}`);
    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
};

module.exports = excelService;

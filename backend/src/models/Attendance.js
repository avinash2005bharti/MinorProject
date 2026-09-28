const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    rollNo: {
      type: String,
      required: true
    },
    studentName: {
      type: String,
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    subjectCode: {
      type: String,
      required: true
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher'
    },
    facultyName: {
      type: String,
      required: true
    },
    date: {
      type: String,
      required: true // Format: YYYY-MM-DD
    },
    period: {
      type: String,
      default: 'Period 1'
    },
    section: {
      type: String,
      required: true
    },
    semester: {
      type: Number,
      default: 6
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'duty_leave'],
      default: 'present'
    },
    remarks: {
      type: String,
      default: ''
    },
    isAutoUpdated: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Compound index for fast queries & prevent duplicates per period per day
attendanceSchema.index({ student: 1, date: 1, subjectCode: 1, period: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);

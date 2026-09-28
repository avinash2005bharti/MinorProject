const mongoose = require('mongoose');

const attendanceQuerySchema = new mongoose.Schema(
  {
    queryId: {
      type: String,
      unique: true,
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    studentName: {
      type: String,
      required: true
    },
    rollNo: {
      type: String,
      required: true
    },
    section: {
      type: String,
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    faculty: {
      type: String,
      required: true
    },
    date: {
      type: String,
      required: true
    },
    period: {
      type: String,
      default: 'Period 1'
    },
    currentStatus: {
      type: String,
      default: 'Absent'
    },
    expectedStatus: {
      type: String,
      default: 'Present'
    },
    reason: {
      type: String,
      required: true
    },
    supportingDoc: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['pending_tg', 'pending_hod', 'completed', 'rejected'],
      default: 'pending_tg'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AttendanceQuery', attendanceQuerySchema);

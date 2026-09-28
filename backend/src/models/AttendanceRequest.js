const mongoose = require('mongoose');

const attendanceRequestSchema = new mongoose.Schema(
  {
    requestId: {
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
    department: {
      type: String,
      default: 'Computer Science & Engineering'
    },
    semester: {
      type: String,
      default: '6th'
    },
    section: {
      type: String,
      required: true
    },
    title: {
      type: String,
      default: 'Attendance Consideration Request'
    },
    startDate: {
      type: String,
      required: true
    },
    endDate: {
      type: String,
      required: true
    },
    dateRangeLabel: {
      type: String
    },
    reason: {
      type: String,
      required: true
    },
    supportingDoc: {
      type: String,
      default: null
    },
    currentAttendance: {
      type: Number,
      required: true
    },
    expectedAttendance: {
      type: Number,
      default: 84
    },
    status: {
      type: String,
      enum: ['pending_tg', 'pending_hod', 'processing_agent', 'completed', 'rejected'],
      default: 'pending_tg'
    },
    tgRecommendation: {
      type: String,
      default: ''
    },
    affectedClasses: [
      {
        subject: String,
        code: String,
        date: String,
        period: String
      }
    ],
    timeline: [
      {
        step: String,
        actor: String,
        time: String,
        completed: Boolean,
        active: Boolean
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('AttendanceRequest', attendanceRequestSchema);

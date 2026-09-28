const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema(
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
    section: {
      type: String,
      required: true
    },
    leaveType: {
      type: String,
      enum: ['Medical', 'Personal', 'Duty', 'On-Duty', 'Event duty', 'General'],
      default: 'Medical'
    },
    title: {
      type: String,
      default: 'Leave Application'
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
    status: {
      type: String,
      enum: ['pending_tg', 'pending_hod', 'pending_hod_direct', 'completed', 'rejected'],
      default: 'pending_tg'
    },
    tgUnavailable: {
      type: Boolean,
      default: false
    },
    tgRecommendation: {
      type: String,
      default: ''
    },
    hodRemarks: {
      type: String,
      default: ''
    },
    timeline: [
      {
        step: String,
        actor: String,
        time: String,
        completed: Boolean,
        active: Boolean,
        warning: Boolean
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);

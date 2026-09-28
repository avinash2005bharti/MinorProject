const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    subject: {
      type: String,
      required: true
    },
    subjectCode: {
      type: String,
      required: true
    },
    faculty: {
      type: String,
      required: true
    },
    section: {
      type: String,
      required: true
    },
    className: {
      type: String,
      default: 'CSE 3rd Year'
    },
    dueDate: {
      type: String,
      required: true
    },
    totalMarks: {
      type: Number,
      default: 20
    },
    description: {
      type: String,
      default: ''
    },
    attachmentName: {
      type: String,
      default: null
    },
    attachmentUrl: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['active', 'closed', 'draft'],
      default: 'active'
    },
    submissionsCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assignment', assignmentSchema);

const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true
    },
    assignmentTitle: {
      type: String,
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
    submittedAt: {
      type: String,
      default: () => new Date().toISOString()
    },
    fileName: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      default: ''
    },
    fileSize: {
      type: String,
      default: '1.5 MB'
    },
    status: {
      type: String,
      enum: ['submitted', 'graded', 'late'],
      default: 'submitted'
    },
    marks: {
      type: Number,
      default: null
    },
    totalMarks: {
      type: Number,
      default: 20
    },
    feedback: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Submission', submissionSchema);

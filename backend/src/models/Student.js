const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rollNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    department: {
      type: String,
      default: 'Computer Science & Engineering'
    },
    year: {
      type: Number,
      required: true,
      min: 1,
      max: 4
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8
    },
    semesterLabel: {
      type: String,
      default: '6th'
    },
    section: {
      type: String,
      required: true,
      trim: true,
      default: 'CSE-3A'
    },
    batch: {
      type: String,
      default: '2021-2025'
    },
    cgpa: {
      type: Number,
      default: 8.0
    },
    attendance: {
      type: Number,
      default: 75,
      min: 0,
      max: 100
    },
    requiredThreshold: {
      type: Number,
      default: 75
    },
    tgName: {
      type: String,
      default: 'Prof. K. Sen'
    },
    tgEmail: {
      type: String,
      default: 'k.sen@oist.ac.in'
    },
    hodName: {
      type: String,
      default: 'Dr. S. Roy'
    },
    status: {
      type: String,
      enum: ['present', 'absent'],
      default: 'present'
    },
    autoUpdated: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', studentSchema);

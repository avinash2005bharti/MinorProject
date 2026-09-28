const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    facultyId: {
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
    designation: {
      type: String,
      default: 'Assistant Professor'
    },
    department: {
      type: String,
      default: 'Computer Science & Engineering'
    },
    specialization: {
      type: String,
      default: 'Computer Science'
    },
    assignedSections: [
      {
        type: String,
        trim: true
      }
    ],
    assignedSubjects: [
      {
        code: String,
        name: String,
        sections: [String],
        hoursPerWeek: Number
      }
    ],
    weeklyHours: {
      type: Number,
      default: 14
    },
    status: {
      type: String,
      enum: ['Active', 'On Leave', 'Inactive'],
      default: 'Active'
    },
    isTG: {
      type: Boolean,
      default: false
    },
    tgAssignedSection: {
      type: String,
      default: null
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    currentRoom: {
      type: String,
      default: 'Room 204'
    },
    attendanceResponsibility: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Teacher', teacherSchema);

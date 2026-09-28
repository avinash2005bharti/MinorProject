const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    department: {
      type: String,
      default: 'Computer Science & Engineering'
    },
    year: {
      type: Number,
      required: true
    },
    semester: {
      type: Number,
      required: true
    },
    sections: [
      {
        type: String,
        trim: true
      }
    ],
    credits: {
      type: Number,
      default: 4
    },
    hours: {
      type: Number,
      default: 4
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher'
    },
    facultyName: {
      type: String,
      required: true
    },
    room: {
      type: String,
      default: 'Room 204'
    },
    type: {
      type: String,
      enum: ['Lecture', 'Lab', 'Seminar', 'Elective'],
      default: 'Lecture'
    },
    totalHeld: {
      type: Number,
      default: 25
    },
    attended: {
      type: Number,
      default: 18
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subject', subjectSchema);

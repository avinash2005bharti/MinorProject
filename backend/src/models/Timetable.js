const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: true,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    period: {
      type: Number,
      required: true
    },
    time: {
      type: String,
      required: true
    },
    code: {
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
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher'
    },
    room: {
      type: String,
      required: true
    },
    section: {
      type: String,
      required: true
    },
    semester: {
      type: Number,
      required: true
    },
    year: {
      type: Number,
      default: 3
    },
    type: {
      type: String,
      enum: ['Lecture', 'Lab', 'Seminar'],
      default: 'Lecture'
    },
    isLive: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Timetable', timetableSchema);

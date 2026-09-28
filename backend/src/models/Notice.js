const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true
    },
    authorRole: {
      type: String,
      default: 'Faculty'
    },
    authorName: {
      type: String,
      required: true
    },
    targetType: {
      type: String,
      enum: ['Section', 'Year', 'Department', 'All'],
      default: 'Section'
    },
    targetValue: {
      type: String,
      default: 'CSE-3A'
    },
    priority: {
      type: String,
      enum: ['normal', 'urgent', 'important'],
      default: 'normal'
    },
    pinned: {
      type: Boolean,
      default: false
    },
    date: {
      type: String,
      default: () => new Date().toLocaleDateString()
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notice', noticeSchema);

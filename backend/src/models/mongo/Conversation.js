// ============================================================================
// MongoDB Conversation Model (AI Application Data Only)
// ============================================================================

const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // References PostgreSQL User UUID
      required: true,
      index: true
    },
    title: {
      type: String,
      default: 'New Conversation'
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    collection: 'conversations'
  }
);

conversationSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);

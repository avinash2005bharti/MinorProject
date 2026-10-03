// ============================================================================
// MongoDB ShortTermMemory Model (Fast LLM Working Memory & TTL Context Only)
// ============================================================================

const mongoose = require('mongoose');

const shortTermMemorySchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: String, // References PostgreSQL User UUID
      index: true
    },
    contextWindow: [
      {
        role: String,
        text: String,
        timestamp: { type: Date, default: Date.now }
      }
    ],
    state: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    expireAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24-hour TTL
      index: { expires: 0 }
    }
  },
  {
    timestamps: true,
    collection: 'short_term_memory'
  }
);

module.exports = mongoose.model('ShortTermMemory', shortTermMemorySchema);

// ============================================================================
// MongoDB Message Model (AI Chat Turn History Only)
// ============================================================================

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    userId: {
      type: String, // References PostgreSQL User UUID
      required: true,
      index: true
    },
    role: {
      type: String, // 'user' | 'assistant' | 'system'
      required: true
    },
    content: {
      type: String,
      required: true
    },
    agent: {
      type: String, // e.g. 'central_orchestrator', 'timetable_agent', 'rag_agent'
      default: 'assistant'
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    collection: 'messages'
  }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);

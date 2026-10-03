// ============================================================================
// MongoDB AgentRun Model (AI Multi-Agent Execution Traces Only)
// ============================================================================

const mongoose = require('mongoose');

const agentRunSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.Mixed, // Can be ObjectId or String identifier
      index: true
    },
    userId: {
      type: String, // References PostgreSQL User UUID
      required: true,
      index: true
    },
    agentName: {
      type: String,
      required: true
    },
    status: {
      type: String, // 'STARTED' | 'RUNNING' | 'COMPLETED' | 'FAILED'
      default: 'STARTED'
    },
    input: {
      type: mongoose.Schema.Types.Mixed
    },
    output: {
      type: mongoose.Schema.Types.Mixed
    },
    toolCalls: [
      {
        toolName: String,
        parameters: mongoose.Schema.Types.Mixed,
        result: mongoose.Schema.Types.Mixed,
        timestamp: { type: Date, default: Date.now }
      }
    ],
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    collection: 'agent_runs'
  }
);

agentRunSchema.index({ userId: 1, startedAt: -1 });

module.exports = mongoose.model('AgentRun', agentRunSchema);

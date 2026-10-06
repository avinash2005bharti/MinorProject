// ============================================================================
// MongoDB AI Memory & Execution Trace Models
// STRICT RULE: AI Application and Conversation Memory ONLY. No ERP entities.
// ============================================================================

const mongoose = require('mongoose');

// 1. Conversation
const conversationSchema = new mongoose.Schema(
  {
    conversationId: { type: String, index: true },
    userId: { type: String, required: true, index: true }, // References PostgreSQL User UUID
    title: { type: String, default: 'New Conversation' },
    role: { type: String, default: 'student' },
    messageCount: { type: Number, default: 0 },
    messages: [
      {
        sender: String,
        content: String,
        citations: Array,
        toolCalls: Array,
        tokens: Object,
        attachments: [
          {
            fileId: String,
            filename: String,
            fileType: String,
            storageUrl: String,
            source: { type: String, enum: ['user_upload', 'agent_generated'], default: 'user_upload' }
          }
        ],
        timestamp: { type: Date, default: Date.now }
      }
    ],
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true, collection: 'conversations' }
);
const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

// 2. Message
const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    role: { type: String, required: true },
    content: { type: String, required: true },
    agent: { type: String, default: 'assistant' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true, collection: 'messages' }
);
const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

// 3. Short Term Memory (STM)
const shortTermMemorySchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, index: true },
    contextWindow: [
      {
        role: String,
        text: String,
        timestamp: { type: Date, default: Date.now }
      }
    ],
    state: { type: mongoose.Schema.Types.Mixed, default: {} },
    expireAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      index: { expires: 0 }
    }
  },
  { timestamps: true, collection: 'short_term_memory' }
);
const ShortTermMemory = mongoose.models.ShortTermMemory || mongoose.model('ShortTermMemory', shortTermMemorySchema);

// 4. Agent Run / Agent Log
const agentRunSchema = new mongoose.Schema(
  {
    conversationId: { type: String, index: true },
    userId: { type: String, required: true, index: true },
    agentName: { type: String, required: true },
    status: { type: String, default: 'COMPLETED' },
    input: { type: mongoose.Schema.Types.Mixed },
    output: { type: mongoose.Schema.Types.Mixed },
    toolCalls: Array,
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: Date.now }
  },
  { timestamps: true, collection: 'agent_runs' }
);
const AgentRun = mongoose.models.AgentRun || mongoose.model('AgentRun', agentRunSchema);
const AgentLog = AgentRun;

// 5. User Conversation Memory & Preferences
const userMemorySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    preferences: { type: mongoose.Schema.Types.Mixed, default: {} },
    interactionCount: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: Date.now }
  },
  { timestamps: true, collection: 'users_memory' }
);
const UserMemory = mongoose.models.UserMemory || mongoose.model('UserMemory', userMemorySchema);

// 6. Tool Execution Logs
const toolExecutionLogSchema = new mongoose.Schema(
  {
    userId: { type: String, index: true },
    role: String,
    agentId: String,
    conversationId: { type: String, index: true },
    agentName: String,
    toolName: String,
    parameters: mongoose.Schema.Types.Mixed,
    result: mongoose.Schema.Types.Mixed,
    resourceId: String,
    success: Boolean,
    executionTimeMs: Number,
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true, collection: 'tool_execution_logs' }
);
const ToolExecutionLog = mongoose.models.ToolExecutionLog || mongoose.model('ToolExecutionLog', toolExecutionLogSchema);

// 7. AI Preferences
const aiPreferenceSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    theme: { type: String, default: 'dark' },
    notificationsEnabled: { type: Boolean, default: true },
    aiSuggestionsEnabled: { type: Boolean, default: true }
  },
  { timestamps: true, collection: 'ai_preferences' }
);
const AiPreference = mongoose.models.AiPreference || mongoose.model('AiPreference', aiPreferenceSchema);

module.exports = {
  Conversation,
  Message,
  ShortTermMemory,
  AgentRun,
  AgentLog,
  UserMemory,
  ToolExecutionLog,
  AiPreference
};

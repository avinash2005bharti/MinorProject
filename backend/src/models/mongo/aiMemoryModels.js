const mongoose = require('mongoose');

// 1. Users Memory (Long-term memory per student/faculty/admin)
const UserMemorySchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  role: { type: String, enum: ['student', 'faculty', 'admin'], required: true },
  longTermFacts: [{
    fact: { type: String, required: true },
    category: { type: String, default: 'academic' },
    createdAt: { type: Date, default: Date.now }
  }],
  academicInterests: [{ type: String }],
  learningStrengths: [{ type: String }],
  areasToImprove: [{ type: String }],
  summaryProfile: { type: String, default: '' },
  lastInteraction: { type: Date, default: Date.now }
}, {
  collection: 'users_memory',
  timestamps: true
});

// 2. Conversations (Full multi-turn history with citations & summaries)
const MessageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  citations: [{
    collectionName: String,
    title: String,
    snippet: String,
    score: Number
  }],
  toolCalls: [{
    tool: String,
    args: mongoose.Schema.Types.Mixed,
    output: mongoose.Schema.Types.Mixed
  }],
  tokens: {
    prompt: Number,
    completion: Number,
    total: Number
  },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const ConversationSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  role: { type: String, required: true },
  title: { type: String, default: 'New Academic Query' },
  messages: [MessageSchema],
  sessionSummary: { type: String, default: '' },
  messageCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, {
  collection: 'conversations',
  timestamps: true
});

// 3. Short Term Memory (Fast working memory & active session context with auto-expiry)
const ShortTermMemorySchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  activeSubject: { type: String },
  activeAssignment: { type: String },
  pendingIntent: { type: String },
  contextWindow: [{
    role: String,
    text: String,
    timestamp: { type: Date, default: Date.now }
  }],
  expireAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // Expires in 24 hours
  }
}, {
  collection: 'short_term_memory',
  timestamps: true
});

ShortTermMemorySchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

// 4. AI Preferences
const AiPreferenceSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  temperature: { type: Number, default: 0.3, min: 0, max: 1 },
  model: { type: String, default: 'llama-3.3-70b-versatile' },
  tone: { type: String, enum: ['Academic', 'Direct', 'Detailed', 'Concise'], default: 'Academic' },
  enableProactiveReminders: { type: Boolean, default: true },
  autoSummarizeThreshold: { type: Number, default: 6 } // Summarize every 6 messages
}, {
  collection: 'ai_preferences',
  timestamps: true
});

// 5. Agent Logs
const AgentLogSchema = new mongoose.Schema({
  agentName: {
    type: String,
    enum: ['StudentAssistant', 'FacultyAssistant', 'AdminAssistant', 'RAGAgent', 'MemoryAgent', 'EmailAgent', 'Orchestrator'],
    required: true,
    index: true
  },
  userId: { type: String, index: true },
  action: { type: String, required: true },
  input: { type: mongoose.Schema.Types.Mixed },
  output: { type: mongoose.Schema.Types.Mixed },
  tokensUsed: { type: Number, default: 0 },
  executionTimeMs: { type: Number, default: 0 },
  status: { type: String, enum: ['SUCCESS', 'ERROR'], default: 'SUCCESS' },
  errorMessage: { type: String },
  timestamp: { type: Date, default: Date.now, index: true }
}, {
  collection: 'agent_logs'
});

// 6. Tool Execution Logs
const ToolExecutionLogSchema = new mongoose.Schema({
  toolName: { type: String, required: true, index: true },
  agentName: { type: String },
  userId: { type: String },
  parameters: { type: mongoose.Schema.Types.Mixed },
  result: { type: mongoose.Schema.Types.Mixed },
  durationMs: { type: Number },
  status: { type: String, enum: ['SUCCESS', 'FAILED'], default: 'SUCCESS' },
  error: { type: String },
  timestamp: { type: Date, default: Date.now }
}, {
  collection: 'tool_execution_logs'
});

const UserMemory = mongoose.model('UserMemory', UserMemorySchema);
const Conversation = mongoose.model('Conversation', ConversationSchema);
const ShortTermMemory = mongoose.model('ShortTermMemory', ShortTermMemorySchema);
const AiPreference = mongoose.model('AiPreference', AiPreferenceSchema);
const AgentLog = mongoose.model('AgentLog', AgentLogSchema);
const ToolExecutionLog = mongoose.model('ToolExecutionLog', ToolExecutionLogSchema);

module.exports = {
  UserMemory,
  Conversation,
  ShortTermMemory,
  AiPreference,
  AgentLog,
  ToolExecutionLog
};

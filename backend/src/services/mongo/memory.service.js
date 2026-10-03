// ============================================================================
// MongoDB LLM Short-Term Memory (STM) & Conversation Service
// Manages fast working memory, active session context, auto-expiry, and chat history
// ============================================================================

const Conversation = require('../../models/mongo/Conversation');
const ShortTermMemory = require('../../models/mongo/ShortTermMemory');

class MongoMemoryService {
  // --- LLM Short-Term Memory (STM) ---
  async getShortTermMemory(sessionId) {
    if (!sessionId) return null;
    return ShortTermMemory.findOne({ sessionId });
  }

  async updateShortTermMemory(sessionId, data) {
    if (!sessionId) return null;
    return ShortTermMemory.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          ...data,
          updatedAt: new Date(),
          expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Extend TTL by 24h
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  async pushContextWindow(sessionId, role, text) {
    return ShortTermMemory.findOneAndUpdate(
      { sessionId },
      {
        $push: {
          contextWindow: {
            $each: [{ role, text, timestamp: new Date() }],
            $slice: -10 // Keep last 10 interactions in fast working memory
          }
        },
        $set: { expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }
      },
      { upsert: true, new: true }
    );
  }

  async clearShortTermMemory(sessionId) {
    return ShortTermMemory.deleteOne({ sessionId });
  }

  // --- Conversations & Multi-turn History ---
  async getConversation(conversationId) {
    if (!conversationId) return null;
    return Conversation.findOne({ conversationId });
  }

  async appendMessage(conversationId, { sender, content, citations = [], toolCalls = [], tokens = {}, role = 'student', userId = 'guest' }) {
    return Conversation.findOneAndUpdate(
      { conversationId },
      {
        $setOnInsert: {
          conversationId,
          userId,
          role,
          title: content.slice(0, 45) + (content.length > 45 ? '...' : ''),
          createdAt: new Date()
        },
        $push: {
          messages: {
            sender,
            content,
            citations,
            toolCalls,
            tokens,
            timestamp: new Date()
          }
        },
        $inc: { messageCount: 1 }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  async getRecentMessages(conversationId, limit = 6) {
    const conv = await this.getConversation(conversationId);
    if (!conv || !conv.messages) return [];
    return conv.messages.slice(-limit).map(m => ({
      role: m.sender,
      content: m.content
    }));
  }

  async listUserConversations(userId, limit = 20) {
    return Conversation.find({ userId })
      .select('conversationId title messageCount updatedAt createdAt')
      .sort({ updatedAt: -1 })
      .limit(limit);
  }

  async deleteConversation(conversationId) {
    return Conversation.deleteOne({ conversationId });
  }
}

module.exports = new MongoMemoryService();

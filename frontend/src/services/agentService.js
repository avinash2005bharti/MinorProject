// ==========================================================================
// CSE Department ERP – Multi-Agent AI Service
// Connects UI to Node.js & Python FastAPI Multi-Agent Orchestrator
// ==========================================================================

import { aiApi } from '../api/aiApi';

export const agentService = {
  // 1. Primary AI Chat Orchestrator (Student, Faculty, Admin)
  async chatWithAgent({ prompt, conversation_id, role, user_id }) {
    return aiApi.chat({ prompt, conversation_id, role, user_id });
  },

  // 2. Contextual Prompt Suggestions
  async getSuggestions(role = 'student') {
    const res = await aiApi.getSuggestions(role);
    return res.suggestions || [];
  },

  // 3. User Long-Term Memory Profile
  async getUserMemory(userId) {
    const res = await aiApi.getUserMemory(userId);
    return res.memory || null;
  },

  // 4. RAG Document Vector Search
  async searchRAG(query, category = 'Notes') {
    const res = await aiApi.searchRag(query, category);
    return res.results || [];
  }
};

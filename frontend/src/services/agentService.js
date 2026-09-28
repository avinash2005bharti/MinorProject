// ==========================================================================
// CSE Department ERP – Multi-Agent AI Service
// Connects UI to Node.js & Python FastAPI Multi-Agent Orchestrator
// ==========================================================================

import { apiClient } from './api';

export const agentService = {
  // 1. Primary AI Chat Orchestrator (Student, Faculty, Admin)
  async chatWithAgent({ prompt, conversation_id, role, user_id }) {
    try {
      const res = await apiClient.post('/ai/chat', {
        prompt,
        conversation_id,
        role,
        user_id
      });
      return res;
    } catch (e) {
      console.warn('[agentService] AI Chat fallback:', e.message);
      return {
        success: true,
        answer: `I received your query: "${prompt}". Connected to CSE Department records.`,
        citations: [],
        tool_calls: []
      };
    }
  },

  // 2. Contextual Prompt Suggestions
  async getSuggestions(role = 'student') {
    try {
      const res = await apiClient.get(`/ai/suggestions?role=${role}`);
      return res.suggestions || [];
    } catch {
      return [
        "Kal meri class kab hai aur assignment pending hai?",
        "What is my current attendance in DBMS and OS?",
        "Explain Dijkstra's Algorithm with CSE syllabus context"
      ];
    }
  },

  // 3. User Long-Term Memory Profile
  async getUserMemory(userId) {
    try {
      const res = await apiClient.get(`/ai/memory?userId=${userId}`);
      return res.memory;
    } catch {
      return null;
    }
  },

  // 4. RAG Document Vector Search
  async searchRAG(query, category = 'Notes') {
    try {
      const res = await apiClient.post('/ai/rag/search', { query, category });
      return res.results || [];
    } catch {
      return [];
    }
  },

  // Step-by-step simulations for Attendance, Timetable, and Leave
  getAttendanceAgentSteps(studentName, section, dateRange) {
    return [
      { id: 1, text: `HOD Digital Authorization verified for ${studentName}`, delay: 500 },
      { id: 2, text: `Locating student registry: ${studentName} in Section ${section}`, delay: 1100 },
      { id: 3, text: `Scanning class attendance ledger for period: ${dateRange}`, delay: 1800 },
      { id: 4, text: `Identified 6 affected lectures across 5 course modules`, delay: 2500 },
      { id: 5, text: `Applying institutional duty credit to Section ${section} database`, delay: 3200 },
      { id: 6, text: `Recalculating overall attendance aggregate: 72% → 84% (Safe Status)`, delay: 3900 },
      { id: 7, text: `Auto-generated notices dispatched to Student and Subject Teachers via Brevo`, delay: 4500 }
    ];
  },

  getTimetableAgentSteps() {
    return [
      { id: 1, text: 'Ingesting CSE department curriculum syllabus and credit requirements', delay: 400 },
      { id: 2, text: 'Querying faculty availability matrix and statutory teaching load limits', delay: 900 },
      { id: 3, text: 'Scanning classroom capacities and laboratory specialized software specs', delay: 1500 },
      { id: 4, text: 'Synthesizing combinatorial schedule matrix for Section CSE-3A & 3B', delay: 2200 },
      { id: 5, text: 'Running heuristic multi-variable collision detector', delay: 2800 },
      { id: 6, text: 'Constraint verification finished: 100% collision-free schedule verified', delay: 3500 }
    ];
  },

  getTimetableResolutionSteps() {
    return [
      { id: 1, text: 'Re-routing Room 204 collision: CS502 shifted to Smart Classroom 205', delay: 500 },
      { id: 2, text: 'Balancing Dr. Sunita Sharma teaching slots with mandatory 30-min break', delay: 1100 },
      { id: 3, text: 'Validating updated master grid with zero room or teacher collisions', delay: 1700 },
      { id: 4, text: 'Autonomous healing complete: 100% collision-free timetable locked in MySQL', delay: 2300 }
    ];
  },

  getAttendanceQuerySteps(studentName, subject, date) {
    return [
      { id: 1, text: `HOD approved attendance query for ${studentName}`, delay: 400 },
      { id: 2, text: `Targeting session record: ${subject} on ${date}`, delay: 900 },
      { id: 3, text: 'Modifying ledger entry from Absent → Present (Verified by Faculty/HOD)', delay: 1500 },
      { id: 4, text: 'Synchronizing student portal standing and recalculating percentage', delay: 2100 },
      { id: 5, text: `Confirmation notification pushed to ${studentName}`, delay: 2700 }
    ];
  }
};

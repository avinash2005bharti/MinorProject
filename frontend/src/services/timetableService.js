// ==========================================================================
// CampusFlow – Timetable Service
// AI Timetable Generation, constraint analysis, collision checks & autonomous healing
// ==========================================================================

import { apiClient } from './api';

export const timetableService = {
  // Simulates AI constraint evaluation and conflict discovery
  analyzeConstraints(params) {
    return {
      totalSlots: 25,
      facultyAssigned: 8,
      roomsAllocated: 5,
      conflicts: [
        {
          id: 'conf-1',
          type: 'Room Double-Booking',
          description: 'Room 204 is simultaneously requested by CS301 (Dr. Rajesh Verma) and CS402 (Prof. Raman) on Wednesday Period 3.',
          suggestedFix: 'Reallocate CS402 to smart classroom Room 205 (Capacity 60, equipped with projector).'
        },
        {
          id: 'conf-2',
          type: 'Faculty Workload Overlap',
          description: 'Dr. Meenakshi S. assigned consecutive 4-hour block on Tuesday without statutory break interval.',
          suggestedFix: 'Shift Operating Systems Period 4 to Thursday Period 2; insert 30-min departmental break.'
        }
      ]
    };
  },

  // Generates resolved clean timetable
  getResolvedTimetable() {
    return {
      conflictsResolvedCount: 2,
      conflictFree: true,
      optimizationScore: '98.4%',
      generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  },

  // Real Backend API Integrations
  async getTimetableApi(year = '3rd Year', semester = 5, section = 'A') {
    try {
      const res = await apiClient.get(`/timetable?year=${encodeURIComponent(year)}&semester=${semester}&section=${section}`);
      const slots = res?.timetable || (Array.isArray(res) ? res : []);
      const grid = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [] };
      slots.forEach((s) => {
        if (grid[s.day]) {
          grid[s.day].push({
            id: s.id,
            period: s.period,
            time: `${s.start_time} - ${s.end_time}`,
            code: s.subject ? s.subject.split(' ').map(w => w[0]).join('').slice(0, 5).toUpperCase() : 'CS',
            subject: s.subject,
            faculty: s.faculty,
            room: s.room,
            type: s.type
          });
        }
      });
      return grid;
    } catch (e) {
      console.warn('[timetableService] Fetching timetable notice:', e.message);
      return { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [] };
    }
  },

  async fetchTimetableApi(params = {}) {
    const query = new URLSearchParams(params).toString();
    try {
      const res = await apiClient.get(`/timetable?${query}`);
      return res.data;
    } catch (e) {
      console.warn('[timetableService] Falling back to local timetable:', e.message);
      return null;
    }
  },

  async analyzeConstraintsApi(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await apiClient.get(`/timetable/analyze?${query}`);
      return res.data;
    } catch (e) {
      console.warn('[timetableService] Fallback constraint analysis:', e.message);
      return this.analyzeConstraints(params);
    }
  },

  async resolveTimetableApi(section = 'CSE-3A') {
    try {
      const res = await apiClient.post('/timetable/resolve', { section });
      return res.data;
    } catch (e) {
      console.warn('[timetableService] Fallback resolve:', e.message);
      return this.getResolvedTimetable();
    }
  }
};

// ==========================================================================
// CampusFlow – Timetable Service
// Directly connected to real backend timetable APIs (No mock data fallback)
// ==========================================================================

import { timetableApi } from '../api/timetableApi';

export const timetableService = {
  // Fetch real timetable grid for a section
  async getTimetableApi(year = '3rd Year', semester = 5, section = 'A') {
    const res = await timetableApi.getTimetable({ year, semester, section });
    const slots = res?.timetable || [];
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
  },

  async fetchTimetableApi(params = {}) {
    return timetableApi.getTimetable(params);
  },

  async analyzeConstraintsApi(params = {}) {
    return timetableApi.getConflicts(params);
  },

  async generateTimetableApi(data) {
    return timetableApi.generateTimetable(data);
  },

  async downloadPdf(params) {
    return timetableApi.downloadPdf(params);
  },

  async downloadExcel(params) {
    return timetableApi.downloadExcel(params);
  }
};

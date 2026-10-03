// ==========================================================================
// Timetable API Module
// Real endpoints for Timetable Slots, AI Generation, Versions, Approval & PDF/Excel Export
// ==========================================================================

import { apiClient, API_BASE_URL } from './client';

export const timetableApi = {
  // Query slots (year, semester, section, day)
  getTimetable(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const qs = query.toString();
    return apiClient.get(`/timetable${qs ? `?${qs}` : ''}`);
  },

  // Get current logged-in student's timetable
  getMyTimetable(day) {
    return apiClient.get(`/timetable/my${day ? `?day=${day}` : ''}`);
  },

  // Conflict inspection
  getConflicts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/timetable/conflicts${query ? `?${query}` : ''}`);
  },

  // AI Autonomous Timetable Generation
  generateTimetable(data) {
    return apiClient.post('/timetable/generate', data);
  },

  // Get version history
  getVersions(id = 1, params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/timetable/${id}/versions${query ? `?${query}` : ''}`);
  },

  // Regenerate new version
  regenerateTimetable(id, data = {}) {
    return apiClient.post(`/timetable/${id}/regenerate`, data);
  },

  // Approve timetable version
  approveTimetable(id) {
    return apiClient.post(`/timetable/${id}/approve`, {});
  },

  // Publish timetable version
  publishTimetable(id) {
    return apiClient.post(`/timetable/${id}/publish`, {});
  },

  // Real PDF Export Download
  async downloadPdf(params = {}) {
    const { slots, config, ...rest } = params;
    const query = new URLSearchParams(rest).toString();
    const endpoint = `/timetable/export/pdf${query ? `?${query}` : ''}`;
    let blob;
    if (slots && Array.isArray(slots)) {
      blob = await apiClient.post(endpoint, { slots, config, ...rest }, { responseType: 'blob' });
    } else {
      blob = await apiClient.get(endpoint, { responseType: 'blob' });
    }
    const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Timetable_Sec_${params.section || 'A'}_Sem${params.semester || 5}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Real Excel Export Download
  async downloadExcel(params = {}) {
    const { slots, config, ...rest } = params;
    const query = new URLSearchParams(rest).toString();
    const endpoint = `/timetable/export/excel${query ? `?${query}` : ''}`;
    let blob;
    if (slots && Array.isArray(slots)) {
      blob = await apiClient.post(endpoint, { slots, config, ...rest }, { responseType: 'blob' });
    } else {
      blob = await apiClient.get(endpoint, { responseType: 'blob' });
    }
    const url = window.URL.createObjectURL(
      new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    );
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Timetable_Sec_${params.section || 'A'}_Sem${params.semester || 5}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Direct CRUD
  createSlot(data) {
    return apiClient.post('/timetable', data);
  },

  updateSlot(id, data) {
    return apiClient.put(`/timetable/${id}`, data);
  },

  deleteSlot(id) {
    return apiClient.delete(`/timetable/${id}`);
  }
};

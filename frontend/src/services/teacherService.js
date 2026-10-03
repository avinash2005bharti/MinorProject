// ==========================================================================
// CampusFlow – Teacher Management Service
// Directly connected to real backend faculty APIs (No mock data fallback)
// ==========================================================================

import { teacherApi } from '../api/teacherApi';

export const teacherService = {
  // Fetch real faculty from backend API
  async fetchDepartmentFacultyApi(params = {}) {
    const res = await teacherApi.getFaculty(params);
    return res.faculty || [];
  },

  async fetchTeacherProfileApi(id) {
    const res = await teacherApi.getFacultyById(id);
    return res.faculty || null;
  },

  async appointTeacherAsTgApi(id, data = {}) {
    return teacherApi.appointTg(id, data);
  },

  async revokeTeacherTgApi(id) {
    return teacherApi.revokeTg(id);
  }
};

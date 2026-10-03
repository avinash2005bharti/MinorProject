// ==========================================================================
// Notification API Module
// Real endpoints for Department System Alerts & User Notifications
// ==========================================================================

import { apiClient } from './client';

export const notificationApi = {
  getNotifications(role = 'student') {
    return apiClient.get(`/notifications?role=${role}`);
  },

  createNotification(data) {
    return apiClient.post('/notifications', data);
  },

  markRead(id) {
    return apiClient.put(`/notifications/${id}/read`, {});
  },

  clearAll(role = 'student') {
    return apiClient.put(`/notifications/clear/all?role=${role}`, {});
  }
};

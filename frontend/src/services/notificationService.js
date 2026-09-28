// ==========================================================================
// CampusFlow – Notification Service
// Dispatch notifications and floating toast alerts across the ERP
// ==========================================================================

import { apiClient } from './api';

export const notificationService = {
  createNotification(title, message, recipient = 'student', type = 'info') {
    return {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      recipient,
      type,
      time: 'Just now',
      read: false
    };
  },

  // Backend API calls
  async fetchNotificationsApi(role = 'student') {
    try {
      const res = await apiClient.get(`/notifications?role=${role}`);
      return res.data;
    } catch (e) {
      console.warn('[notificationService] Notification fetch fallback:', e.message);
      return [];
    }
  },

  async markReadApi(id) {
    return apiClient.put(`/notifications/${id}/read`, {});
  },

  async clearAllApi(role = 'student') {
    return apiClient.put(`/notifications/clear/all?role=${role}`, {});
  }
};

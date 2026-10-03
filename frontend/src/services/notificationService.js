// ==========================================================================
// CampusFlow – Notification Service
// Dispatch notifications across the ERP via real backend API
// ==========================================================================

import { notificationApi } from '../api/notificationApi';

export const notificationService = {
  createNotification(title, message, recipient = 'student', type = 'info') {
    return notificationApi.createNotification({ title, message, recipient, type });
  },

  async fetchNotificationsApi(role = 'student') {
    const res = await notificationApi.getNotifications(role);
    return res.notifications || [];
  },

  async markReadApi(id) {
    return notificationApi.markRead(id);
  },

  async clearAllApi(role = 'student') {
    return notificationApi.clearAll(role);
  }
};

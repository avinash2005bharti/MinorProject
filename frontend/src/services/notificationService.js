// ==========================================================================
// CampusFlow – Notification Service
// Dispatch notifications and floating toast alerts across the ERP
// ==========================================================================

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
  }
};

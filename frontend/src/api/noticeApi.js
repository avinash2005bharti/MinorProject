// ==========================================================================
// Notice Board API Module
// Real endpoints for Department Circulars and Notice Broadcasts
// ==========================================================================

import { apiClient } from './client';

export const noticeApi = {
  getNotices() {
    return apiClient.get('/notices');
  },

  createNotice(data) {
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      return apiClient.post('/notices', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return apiClient.post('/notices', data);
  },

  markRead(id) {
    return apiClient.put(`/notices/${id}/read`, {});
  },

  markUnread(id) {
    return apiClient.put(`/notices/${id}/unread`, {});
  },

  deleteNotice(id) {
    return apiClient.delete(`/notices/${id}`);
  }
};

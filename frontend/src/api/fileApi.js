// ==========================================================================
// File Intelligence API Module
// Upload, history, status, delete, and file management endpoints
// ==========================================================================

import { apiClient } from './client';

export const fileApi = {
  /**
   * Upload a file with optional conversation association
   */
  upload(file, conversationId = null, onProgress = null) {
    const formData = new FormData();
    formData.append('file', file);
    if (conversationId) {
      formData.append('conversationId', conversationId);
    }

    return apiClient.request('/files/upload', {
      method: 'POST',
      body: formData,
      timeout: 120000 // 2 min for large files
    });
  },

  /**
   * Get file processing status
   */
  getFileStatus(fileId) {
    return apiClient.get(`/files/${fileId}/status`);
  },

  /**
   * Get file metadata
   */
  getFile(fileId) {
    return apiClient.get(`/files/${fileId}`);
  },

  /**
   * Get user's file history
   */
  getFiles({ page = 1, limit = 20, source, conversationId } = {}) {
    const params = new URLSearchParams({ page, limit });
    if (source) params.append('source', source);
    if (conversationId) params.append('conversationId', conversationId);
    return apiClient.get(`/files?${params.toString()}`);
  },

  /**
   * Delete a file
   */
  deleteFile(fileId) {
    return apiClient.delete(`/files/${fileId}`);
  }
};

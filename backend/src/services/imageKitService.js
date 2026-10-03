const fs = require('fs');
const path = require('path');
const ImageKit = require('imagekit');
const { logger } = require('./loggerService');

class ImageKitService {
  constructor() {
    this.publicKey = process.env.IMAGEKIT_PUBLIC_KEY || '';
    this.privateKey = process.env.IMAGEKIT_PRIVATE_KEY || '';
    this.urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || '';

    if (this.isConfigured()) {
      try {
        this.client = new ImageKit({
          publicKey: this.publicKey,
          privateKey: this.privateKey,
          urlEndpoint: this.urlEndpoint
        });
        logger.info('[ImageKit] Storage service initialized successfully with CDN endpoint: ' + this.urlEndpoint);
      } catch (err) {
        logger.warn('[ImageKit] Initialization error: ' + err.message);
        this.client = null;
      }
    } else {
      this.client = null;
      logger.info('[ImageKit] Credentials not configured. Storage falling back to local filesystem (/uploads).');
    }
  }

  /**
   * Check if ImageKit has credentials configured in environment
   */
  isConfigured() {
    return Boolean(this.publicKey && this.privateKey && this.urlEndpoint);
  }

  /**
   * Upload buffer, base64 string, or remote URL directly to ImageKit
   * @param {Object} options
   * @param {Buffer|string} options.file - Buffer or base64 or URL
   * @param {string} options.fileName - Destination filename
   * @param {string} [options.folder] - Folder path in ImageKit media library
   * @param {Array<string>} [options.tags] - Search tags
   * @returns {Promise<Object|null>} ImageKit response or null if unconfigured
   */
  async uploadFile({ file, fileName, folder = '/campusflow-erp', tags = [] }) {
    if (!this.isConfigured() || !this.client) {
      return null;
    }

    try {
      const result = await this.client.upload({
        file,
        fileName,
        folder,
        tags: Array.isArray(tags) ? tags : [tags]
      });

      logger.info(`[ImageKit] File uploaded successfully: ${result.name} (${result.url})`);
      return {
        url: result.url,
        fileId: result.fileId,
        name: result.name,
        thumbnailUrl: result.thumbnailUrl,
        size: result.size,
        fileType: result.fileType
      };
    } catch (error) {
      logger.error(`[ImageKit] Upload error: ${error.message}`);
      return null;
    }
  }

  /**
   * Upload a file from a local file path to ImageKit
   * @param {string} filePath - Absolute path to local file
   * @param {string} [originalName] - Original filename
   * @param {string} [folder] - Target ImageKit folder
   * @param {Array<string>} [tags] - Metadata tags
   * @returns {Promise<Object|null>}
   */
  async uploadFromPath(filePath, originalName, folder = '/campusflow-erp', tags = []) {
    if (!this.isConfigured() || !this.client) {
      return null;
    }

    try {
      if (!fs.existsSync(filePath)) {
        logger.warn(`[ImageKit] Local file path not found: ${filePath}`);
        return null;
      }

      const fileBuffer = fs.readFileSync(filePath);
      const fileName = originalName || path.basename(filePath);

      return await this.uploadFile({
        file: fileBuffer,
        fileName,
        folder,
        tags
      });
    } catch (error) {
      logger.error(`[ImageKit] uploadFromPath error: ${error.message}`);
      return null;
    }
  }

  /**
   * Delete a file from ImageKit by fileId
   * @param {string} fileId
   * @returns {Promise<boolean>}
   */
  async deleteFile(fileId) {
    if (!this.isConfigured() || !this.client || !fileId) {
      return false;
    }

    try {
      await this.client.deleteFile(fileId);
      logger.info(`[ImageKit] Deleted file: ${fileId}`);
      return true;
    } catch (error) {
      logger.warn(`[ImageKit] Delete error for file ${fileId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate client-side authentication parameters for frontend direct uploads
   */
  getAuthenticationParameters() {
    if (!this.isConfigured() || !this.client) {
      return {
        configured: false,
        message: 'ImageKit credentials not configured in backend environment.'
      };
    }

    try {
      const authParams = this.client.getAuthenticationParameters();
      return {
        configured: true,
        token: authParams.token,
        expire: authParams.expire,
        signature: authParams.signature,
        publicKey: this.publicKey,
        urlEndpoint: this.urlEndpoint
      };
    } catch (error) {
      logger.error(`[ImageKit] Auth params generation error: ${error.message}`);
      return {
        configured: false,
        error: error.message
      };
    }
  }
}

module.exports = new ImageKitService();

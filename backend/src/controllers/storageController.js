const imageKitService = require('../services/imageKitService');
const { logger } = require('../services/loggerService');

/**
 * Get client-side ImageKit authentication parameters (signature, token, expire)
 */
exports.getImageKitAuth = async (req, res) => {
  try {
    const authParams = imageKitService.getAuthenticationParameters();
    return res.status(200).json({
      success: true,
      ...authParams
    });
  } catch (error) {
    logger.error(`[Storage Controller] Auth error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate storage upload authentication parameters.',
      error: error.message
    });
  }
};

/**
 * Get storage configuration status (ImageKit Cloud vs Local Disk Fallback)
 */
exports.getStorageStatus = async (req, res) => {
  try {
    const isImageKit = imageKitService.isConfigured();
    return res.status(200).json({
      success: true,
      provider: isImageKit ? 'imagekit' : 'local',
      endpoint: isImageKit ? imageKitService.urlEndpoint : '/uploads',
      isCloud: isImageKit,
      message: isImageKit
        ? 'ImageKit cloud CDN storage is active and configured.'
        : 'Running on local disk storage fallback (/uploads). Configure IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT to enable ImageKit.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Direct file upload endpoint (supports ImageKit with automatic local fallback)
 */
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided for upload.' });
    }

    const { folder, tags } = req.body;
    let fileUrl = `/uploads/${req.file.filename}`;
    let fileId = null;
    let provider = 'local';

    if (imageKitService.isConfigured()) {
      const parsedTags = tags ? (Array.isArray(tags) ? tags : tags.split(',')) : ['general'];
      const ikResult = await imageKitService.uploadFromPath(
        req.file.path,
        req.file.originalname,
        folder || '/campusflow-erp',
        parsedTags
      );

      if (ikResult && ikResult.url) {
        fileUrl = ikResult.url;
        fileId = ikResult.fileId;
        provider = 'imagekit';
      }
    }

    return res.status(201).json({
      success: true,
      message: `File uploaded successfully via ${provider}.`,
      file: {
        url: fileUrl,
        fileId,
        filename: req.file.originalname,
        provider,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    logger.error(`[Storage Controller] Upload error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

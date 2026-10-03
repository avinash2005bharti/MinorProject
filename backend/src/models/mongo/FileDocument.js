// ============================================================================
// FileDocument — MongoDB File Metadata Model
// Tracks uploaded & AI-generated files with ImageKit references, processing
// status, and conversation/user associations.
// STRICT RULE: Store metadata only. Actual files live in ImageKit Cloud.
// ============================================================================

const mongoose = require('mongoose');

const fileDocumentSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    conversationId: { type: String, index: true },
    filename: { type: String, required: true },
    originalName: { type: String },
    mimeType: { type: String, required: true },
    fileType: {
      type: String,
      enum: ['png', 'jpg', 'jpeg', 'webp', 'pdf', 'xlsx', 'xls', 'csv', 'pptx', 'ppt', 'docx', 'doc', 'txt', 'other'],
      required: true
    },
    fileSize: { type: Number, default: 0 },
    source: {
      type: String,
      enum: ['user_upload', 'agent_generated'],
      default: 'user_upload'
    },

    // ImageKit Cloud Storage
    storageProvider: { type: String, default: 'imagekit' },
    storageUrl: { type: String },
    imagekitFileId: { type: String, index: true },

    // Processing Pipeline
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true
    },
    processingError: { type: String, default: null },
    processingStage: { type: String, default: null },

    // Extracted / Normalized Content Reference
    extractedContent: {
      summary: { type: String },
      textPreview: { type: String },
      fullText: { type: String },
      tables: { type: mongoose.Schema.Types.Mixed },
      structuredData: { type: mongoose.Schema.Types.Mixed },
      pageCount: { type: Number },
      sheetCount: { type: Number },
      slideCount: { type: Number },
      tableCount: { type: Number },
      chunksIndexed: { type: Number, default: 0 },
      hasVisualContent: { type: Boolean, default: false }
    },

    // Agent-generated file metadata
    generatedByAgent: { type: String, default: null },
    generatedContext: { type: mongoose.Schema.Types.Mixed, default: null },

    // Access control
    departmentId: { type: String, default: null },
    visibility: {
      type: String,
      enum: ['private', 'department', 'public'],
      default: 'private'
    },

    // Soft delete
    isDeleted: { type: Boolean, default: false }
  },
  {
    timestamps: true,
    collection: 'file_documents'
  }
);

// Compound indexes for common queries
fileDocumentSchema.index({ userId: 1, createdAt: -1 });
fileDocumentSchema.index({ conversationId: 1, createdAt: -1 });
fileDocumentSchema.index({ userId: 1, isDeleted: 1, createdAt: -1 });

const FileDocument = mongoose.models.FileDocument || mongoose.model('FileDocument', fileDocumentSchema);

module.exports = FileDocument;

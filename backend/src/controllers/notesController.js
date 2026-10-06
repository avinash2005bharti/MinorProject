// ============================================================================
// Departmental ERP - Notes & Document Metadata Controller
// Canonical Document Records: PostgreSQL (DocumentMetadata)
// Vector Embeddings & Semantic Search: Qdrant (erp_documents)
// ============================================================================

const path = require('path');
const axios = require('axios');
const { prisma } = require('../config/postgres');
const { logger } = require('../services/loggerService');

const PYTHON_AI_SERVICE_URL = process.env.AI_SERVICE_URL || process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8000';

// 1. Upload Document & Ingest to Qdrant RAG Pipeline
exports.uploadNote = async (req, res) => {
  try {
    const { title, category = 'Notes', subjectId, subject_id } = req.body;
    const finalSubjectId = subjectId || subject_id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file.' });
    }

    if (!title) {
      return res.status(400).json({ success: false, message: 'Document title is required.' });
    }

    const fileExt = path.extname(req.file.originalname).replace('.', '').toLowerCase();
    let fileUrl = `/uploads/${req.file.filename}`;
    const absolutePath = req.file.path;

    const defaultDept = await prisma.department.findFirst();

    // 1. Save canonical metadata in PostgreSQL
    const doc = await prisma.documentMetadata.create({
      data: {
        title: title.trim(),
        fileName: req.file.originalname,
        fileUrl,
        fileType: fileExt,
        fileSize: req.file.size,
        category,
        subjectId: finalSubjectId || null,
        departmentId: defaultDept.id,
        uploadedByUserId: req.user?.id || null,
        qdrantIndexed: false,
        qdrantCollection: 'erp_documents'
      }
    });

    // 2. Trigger Qdrant RAG Ingestion asynchronously via FastAPI AI Service
    setImmediate(async () => {
      try {
        const ingestRes = await axios.post(`${PYTHON_AI_SERVICE_URL}/ai/rag/index`, {
          noteId: doc.id,
          filePath: absolutePath,
          fileName: req.file.originalname,
          title: doc.title,
          category: doc.category,
          subjectId: doc.subjectId,
          user_id: String(req.user.id),
          role: req.user.role,
          user: req.user
        }, {
          timeout: 10000,
          headers: { 'x-internal-secret': process.env.INTERNAL_API_SECRET || '' }
        });

        if (ingestRes.data?.success) {
          await prisma.documentMetadata.update({
            where: { id: doc.id },
            data: {
              qdrantIndexed: true,
              chunksCount: ingestRes.data.chunksIndexed || 0
            }
          });
          logger.info(`[Notes] Document ${doc.id} successfully indexed into Qdrant.`);
        }
      } catch (ragErr) {
        logger.warn(`[Notes] Qdrant ingestion deferred: ${ragErr.message}`);
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Document uploaded and registered in PostgreSQL.',
      note: doc,
      document: doc
    });
  } catch (error) {
    logger.error(`[Notes Controller] Upload error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get All Documents / Notes
exports.getNotes = async (req, res) => {
  try {
    const { category, subjectId } = req.query;
    const where = {};
    if (category) where.category = category;
    if (subjectId) where.subjectId = subjectId;

    const docs = await prisma.documentMetadata.findMany({
      where,
      include: { subject: true, uploadedByUser: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      count: docs.length,
      notes: docs,
      data: docs
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Delete Document
exports.deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.documentMetadata.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Document deleted from PostgreSQL.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Download Document
exports.downloadNote = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await prisma.documentMetadata.findUnique({ where: { id } });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });
    return res.status(200).json({ success: true, document: doc, downloadUrl: doc.fileUrl });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Get Note Status
exports.getNoteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await prisma.documentMetadata.findUnique({ where: { id } });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });
    return res.status(200).json({ success: true, qdrantIndexed: doc.qdrantIndexed, chunksCount: doc.chunksCount });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

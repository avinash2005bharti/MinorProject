const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { Note, Subject, Faculty } = require('../models/mysql');
const { aiLogger, logger } = require('../services/loggerService');

const PYTHON_AI_SERVICE_URL = process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8000';

// 1. Upload Document & Ingest to RAG Vector Pipeline
exports.uploadNote = async (req, res) => {
  try {
    const { title, description, category, subject_id, year, semester } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file (PDF, DOCX, PPT, PPTX, TXT, or Image).'
      });
    }

    if (!title) {
      return res.status(400).json({ success: false, message: 'Document title is required.' });
    }

    const file_ext = path.extname(req.file.originalname).replace('.', '').toLowerCase();
    const file_url = `/uploads/${req.file.filename}`;
    const absolutePath = req.file.path;

    const faculty_id = req.user && req.user.facultyProfile ? req.user.facultyProfile.id : null;

    // 1. Save metadata in MySQL
    const note = await Note.create({
      title,
      description: description || '',
      file_url,
      file_type: file_ext,
      category: category || 'Notes',
      subject_id: subject_id ? parseInt(subject_id, 10) : null,
      faculty_id,
      year: year || null,
      semester: semester ? parseInt(semester, 10) : null,
      rag_indexed: false
    });

    // 2. Trigger asynchronous indexing pipeline in Python FastAPI AI Microservice
    // Pipeline: Extract Text -> Chunking -> Embedding -> Qdrant Collection
    indexDocumentWithAI({
      noteId: note.id,
      filePath: absolutePath,
      fileName: req.file.originalname,
      title,
      category: note.category,
      subjectId: note.subject_id,
      year: note.year,
      semester: note.semester
    }).catch(err => {
      aiLogger.warn(`[RAG Pipeline] Async indexing error for Note #${note.id}: ${err.message}`);
    });

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully and queued for AI Vector Embedding in Qdrant.',
      note
    });
  } catch (error) {
    logger.error(`[Notes Controller] Upload error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get All Notes / Documents
exports.getNotes = async (req, res) => {
  try {
    const { category, subject_id, year, semester } = req.query;
    const where = {};

    if (category) where.category = category;
    if (subject_id) where.subject_id = parseInt(subject_id, 10);
    if (year) where.year = year;
    if (semester) where.semester = parseInt(semester, 10);

    const notes = await Note.findAll({
      where,
      include: [
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] },
        { model: Faculty, as: 'faculty', attributes: ['id', 'name', 'designation'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      count: notes.length,
      notes
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Download / Stream Document
exports.downloadNote = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Note.findByPk(id);

    if (!note) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const filename = path.basename(note.file_url);
    const uploadDir = process.env.UPLOAD_PATH || path.join(__dirname, '../../uploads');
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Physical file missing from storage.' });
    }

    return res.download(filePath, `${note.title}.${note.file_type}`);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Delete Note
exports.deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Note.findByPk(id);

    if (!note) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const filename = path.basename(note.file_url);
    const uploadDir = process.env.UPLOAD_PATH || path.join(__dirname, '../../uploads');
    const filePath = path.join(uploadDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await note.destroy();

    return res.status(200).json({
      success: true,
      message: 'Document deleted from database and file storage.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: Call Python FastAPI AI Service to ingest file into Qdrant vector database
async function indexDocumentWithAI(docData) {
  try {
    aiLogger.info(`[RAG Ingest] Calling Python AI Service to index document #${docData.noteId}: "${docData.title}"`);
    const response = await axios.post(`${PYTHON_AI_SERVICE_URL}/ai/rag/index`, docData, {
      timeout: 30000
    });

    if (response.data && response.data.success) {
      aiLogger.info(`[RAG Ingest] Successfully indexed note #${docData.noteId} into Qdrant collection: "${docData.category}"`);
      await Note.update({ rag_indexed: true }, { where: { id: docData.noteId } });
    }
  } catch (err) {
    aiLogger.warn(`[RAG Ingest] AI Service indexing skipped or unavailable (${err.message}). Document saved in MySQL.`);
  }
}

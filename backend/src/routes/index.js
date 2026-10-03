const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const axios = require('axios');
const { prisma } = require('../config/postgres');

const authRoutes = require('./authRoutes');
const studentRoutes = require('./studentRoutes');
const facultyRoutes = require('./facultyRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const assignmentRoutes = require('./assignmentRoutes');
const timetableRoutes = require('./timetableRoutes');
const teacherSchedulerRoutes = require('./teacherSchedulerRoutes');
const notesRoutes = require('./notesRoutes');
const aiRoutes = require('./aiRoutes');
const academicRoutes = require('./academicRoutes');
const adminRoutes = require('./adminRoutes');
const requestRoutes = require('./requestRoutes');
const noticeRoutes = require('./noticeRoutes');
const notificationRoutes = require('./notificationRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const agentRoutes = require('./agentRoutes');
const storageRoutes = require('./storageRoutes');
const fileRoutes = require('./fileRoutes');
const classroomRoutes = require('./classroomRoutes');
const masterDataRoutes = require('./masterDataRoutes');
const leaveRoutes = require('./leaveRoutes');

const teacherSchedulerController = require('../controllers/teacherSchedulerController');
const leaveController = require('../controllers/leaveController');
const masterDataController = require('../controllers/masterDataController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const PYTHON_AI_SERVICE_URL = process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8000';

// Mount Core Application Routes
router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/faculty', facultyRoutes);
router.use('/teachers', facultyRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/timetable', timetableRoutes);
router.use('/teacher-scheduler', teacherSchedulerRoutes);
router.use('/substitutions', teacherSchedulerRoutes);
router.use('/notes', notesRoutes);
router.use('/materials', notesRoutes);
router.use('/ai', aiRoutes);
router.use('/academic', academicRoutes);
router.use('/departments', academicRoutes);
router.use('/admin', adminRoutes);
router.use('/requests', requestRoutes);
router.use('/notices', noticeRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/agents', agentRoutes);
router.use('/chat', aiRoutes);
router.use('/chats', aiRoutes);
router.use('/storage', storageRoutes);
router.use('/files', fileRoutes);
router.use('/documents', fileRoutes);
router.use('/classrooms', classroomRoutes);
router.use('/master-data', masterDataRoutes);
router.use('/leaves', leaveRoutes);

// Direct REST routes & Aliases for Teachers, Leave, and Master Data Import
router.get('/teachers/availability', leaveController.getFacultyAvailability);
router.post('/teachers/:id/leave-toggle', leaveController.toggleTeacherLeave);
router.get('/teachers/:id/affected-classes', leaveController.getAffectedClasses);
router.post('/teachers/:id/propose-substitutes', leaveController.proposeSubstitutes);
router.post('/teachers/import', upload.single('file'), masterDataController.importTeachers);
router.get('/teachers/export', masterDataController.exportTeachers);
router.post('/students/import', upload.single('file'), masterDataController.importStudents);
router.get('/students/export', masterDataController.exportStudents);
router.post('/subjects/import', upload.single('file'), masterDataController.importSubjects);
router.get('/subjects/export', masterDataController.exportSubjects);
router.post('/classrooms/import', upload.single('file'), masterDataController.importClassrooms);
router.get('/classrooms/export', masterDataController.exportClassrooms);
router.post('/timetable/import', upload.single('file'), masterDataController.importTimetable);

// Direct REST routes for teacher absence & substitutions (Section 23)
router.post('/teachers/:id/absence', teacherSchedulerController.reportAbsence);
router.get('/teachers/:id/substitutions', teacherSchedulerController.getTeacherSubstitutions);

router.get('/health/db', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const mongoState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    return res.status(200).json({
      success: true,
      status: 'ok',
      relationalDatabase: 'UP (PostgreSQL Prisma)',
      mongoDatabase: mongoState,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(503).json({ success: false, status: 'error', error: err.message });
  }
});

router.get('/health/qdrant', async (req, res) => {
  try {
    const aiHealth = await axios.get(`${PYTHON_AI_SERVICE_URL}/health/qdrant`, { timeout: 2000 });
    return res.status(200).json({ success: true, ...aiHealth.data });
  } catch (err) {
    return res.status(200).json({ success: true, status: 'STANDALONE', engine: 'Qdrant Cloud / Local', note: 'AI microservice offline' });
  }
});

router.get('/health/ai', async (req, res) => {
  try {
    const aiHealth = await axios.get(`${PYTHON_AI_SERVICE_URL}/health/ai`, { timeout: 2000 });
    return res.status(200).json({ success: true, ...aiHealth.data });
  } catch (err) {
    return res.status(200).json({
      success: true,
      status: 'STANDALONE_FALLBACK',
      service: 'Node.js Local Deterministic Agent Orchestrator',
      fastApiUrl: PYTHON_AI_SERVICE_URL
    });
  }
});

// Comprehensive Cloud Health Check Endpoint (Section 35 & Render Postgres)
router.get('/health', async (req, res) => {
  const startTime = Date.now();
  const checks = {
    apiGateway: 'UP',
    postgresql: 'DOWN',
    mongodb: 'DOWN',
    fastApiAI: 'DOWN',
    qdrant: 'CHECKING'
  };

  // 1. PostgreSQL Health Check
  let postgresHealthy = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.postgresql = 'UP (PostgreSQL Prisma)';
    postgresHealthy = true;
  } catch (err) {
    checks.postgresql = `ERROR (${err.message})`;
  }

  // 2. MongoDB Health Check
  try {
    const state = mongoose.connection.readyState;
    if (state === 1) {
      checks.mongodb = 'UP (Connected)';
    } else if (state === 2) {
      checks.mongodb = 'CONNECTING';
    } else {
      checks.mongodb = 'DISCONNECTED';
    }
  } catch (err) {
    checks.mongodb = `ERROR (${err.message})`;
  }

  // 3. FastAPI & Qdrant Health Check
  try {
    const aiHealth = await axios.get(`${PYTHON_AI_SERVICE_URL}/health`, { timeout: 2000 });
    checks.fastApiAI = aiHealth.data.status || 'UP';
    checks.qdrant = aiHealth.data.qdrant_status || 'UP';
  } catch (err) {
    checks.fastApiAI = `OFFLINE (${err.message})`;
    checks.qdrant = 'UNKNOWN (AI microservice offline)';
  }

  const allHealthy = postgresHealthy && checks.mongodb.startsWith('UP');

  return res.status(allHealthy ? 200 : (postgresHealthy ? 200 : 503)).json({
    status: allHealthy ? 'ok' : (postgresHealthy ? 'degraded' : 'error'),
    database: 'postgresql',
    databaseStatus: postgresHealthy ? 'connected' : 'disconnected',
    department: 'Computer Science & Engineering',
    service: 'CSE Agentic Departmental ERP Backend',
    version: '2.0.0',
    checks,
    latencyMs: Date.now() - startTime,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;


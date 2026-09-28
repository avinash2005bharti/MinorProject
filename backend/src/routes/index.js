const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const axios = require('axios');
const { sequelize } = require('../config/mysql');

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

const teacherSchedulerController = require('../controllers/teacherSchedulerController');

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

// Direct REST routes for teacher absence & substitutions (Section 23)
router.post('/teachers/:id/absence', teacherSchedulerController.reportAbsence);
router.get('/teachers/:id/substitutions', teacherSchedulerController.getTeacherSubstitutions);

// Comprehensive Cloud Health Check Endpoint (Section 35)
router.get('/health', async (req, res) => {
  const startTime = Date.now();
  const checks = {
    apiGateway: 'UP',
    mysql: 'DOWN',
    mongodb: 'DOWN',
    fastApiAI: 'DOWN',
    qdrant: 'CHECKING'
  };

  // 1. MySQL Health Check
  try {
    await sequelize.authenticate();
    checks.mysql = `UP (${sequelize.getDialect()})`;
  } catch (err) {
    checks.mysql = `ERROR (${err.message})`;
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

  const allHealthy = checks.mysql.startsWith('UP') && checks.mongodb.startsWith('UP');

  return res.status(allHealthy ? 200 : 200).json({
    status: allHealthy ? 'HEALTHY' : 'DEGRADED',
    department: 'Computer Science & Engineering',
    service: 'CSE Agentic Departmental ERP Backend',
    version: '2.0.0',
    checks,
    latencyMs: Date.now() - startTime,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

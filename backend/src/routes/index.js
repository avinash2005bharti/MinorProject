const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const studentRoutes = require('./studentRoutes');
const facultyRoutes = require('./facultyRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const assignmentRoutes = require('./assignmentRoutes');
const timetableRoutes = require('./timetableRoutes');
const notesRoutes = require('./notesRoutes');
const aiRoutes = require('./aiRoutes');
const academicRoutes = require('./academicRoutes');
const adminRoutes = require('./adminRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/faculty', facultyRoutes);
router.use('/teachers', facultyRoutes); // Alias for frontend compatibility
router.use('/attendance', attendanceRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/timetable', timetableRoutes);
router.use('/notes', notesRoutes);
router.use('/materials', notesRoutes); // Alias for frontend compatibility
router.use('/ai', aiRoutes);
router.use('/academic', academicRoutes);
router.use('/departments', academicRoutes); // Replaced with CSE hierarchy
router.use('/admin', adminRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    department: 'Computer Science & Engineering',
    service: 'CSE Agentic ERP API Gateway',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

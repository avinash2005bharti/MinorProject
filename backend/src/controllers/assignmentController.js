const { Assignment, AssignmentSubmission, Subject, Student, Faculty } = require('../models/postgres');
const emailService = require('../services/emailService');
const { logger } = require('../services/loggerService');

// 1. Get All Assignments (With filter for year/semester/subject)
exports.getAssignments = async (req, res) => {
  try {
    const { subject_id, semester } = req.query;
    const where = {};
    if (subject_id) where.subject_id = subject_id;

    const includeSubject = {
      model: Subject,
      as: 'subject',
      attributes: ['id', 'name', 'code', 'semester']
    };

    if (semester) {
      includeSubject.where = { semester: parseInt(semester, 10) };
    }

    const assignments = await Assignment.findAll({
      where,
      include: [
        includeSubject,
        {
          model: AssignmentSubmission,
          as: 'submissions',
          attributes: ['id', 'student_id', 'marks', 'status', 'createdAt']
        }
      ],
      order: [['deadline', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      count: assignments.length,
      assignments
    });
  } catch (error) {
    logger.error(`[Assignment Controller] Error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Create Assignment (Faculty / Admin)
exports.createAssignment = async (req, res) => {
  try {
    const { title, description, deadline, subject_id, max_marks } = req.body;

    if (!title || !deadline || !subject_id) {
      return res.status(400).json({
        success: false,
        message: 'title, deadline, and subject_id are required.'
      });
    }

    let file_url = null;
    if (req.file) {
      file_url = `/uploads/${req.file.filename}`;
      const imageKitService = require('../services/imageKitService');
      if (imageKitService.isConfigured()) {
        const ikUpload = await imageKitService.uploadFromPath(
          req.file.path,
          req.file.originalname,
          '/erp-assignments',
          ['assignment', `subject-${subject_id}`]
        );
        if (ikUpload && ikUpload.url) {
          file_url = ikUpload.url;
        }
      }
    }

    const assignment = await Assignment.create({
      title,
      description,
      deadline: new Date(deadline),
      subject_id,
      max_marks: max_marks ? parseInt(max_marks, 10) : 100,
      file_url
    });

    // Notify students enrolled in this subject's semester asynchronously
    const subject = await Subject.findByPk(subject_id);
    if (subject) {
      Student.findAll({ where: { semester: subject.semester, status: 'Active' } })
        .then(students => {
          for (const s of students.slice(0, 50)) { // broadcast to semester batch
            emailService.sendAssignmentReminder(s.email, s.name, title, deadline).catch(() => {});
          }
        })
        .catch(() => {});
    }

    return res.status(201).json({
      success: true,
      message: 'Assignment published successfully.',
      assignment
    });
  } catch (error) {
    logger.error(`[Assignment Create] Error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Submit Assignment (Student)
exports.submitAssignment = async (req, res) => {
  try {
    const { assignment_id, student_id } = req.body;
    const finalStudentId = student_id || (req.user && req.user.studentProfile ? req.user.studentProfile.id : null);

    if (!assignment_id || !finalStudentId) {
      return res.status(400).json({
        success: false,
        message: 'assignment_id and student identification are required.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a submission document (PDF, DOCX, etc.).'
      });
    }

    const assignment = await Assignment.findByPk(assignment_id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    let file_path = `/uploads/${req.file.filename}`;
    const imageKitService = require('../services/imageKitService');
    if (imageKitService.isConfigured()) {
      const ikUpload = await imageKitService.uploadFromPath(
        req.file.path,
        req.file.originalname,
        '/erp-submissions',
        ['submission', `assignment-${assignment_id}`, `student-${finalStudentId}`]
      );
      if (ikUpload && ikUpload.url) {
        file_path = ikUpload.url;
      }
    }
    const isLate = new Date() > new Date(assignment.deadline);

    // Check if previous submission exists
    let submission = await AssignmentSubmission.findOne({
      where: { assignment_id, student_id: finalStudentId }
    });

    if (submission) {
      submission.file = file_path;
      submission.status = isLate ? 'Late' : 'Submitted';
      submission.submitted_at = new Date();
      await submission.save();
    } else {
      submission = await AssignmentSubmission.create({
        assignment_id,
        student_id: finalStudentId,
        file: file_path,
        status: isLate ? 'Late' : 'Submitted'
      });
    }

    return res.status(200).json({
      success: true,
      message: isLate ? 'Assignment submitted (Marked Late).' : 'Assignment submitted successfully!',
      submission
    });
  } catch (error) {
    logger.error(`[Assignment Submit] Error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Evaluate Submission (Faculty / Admin)
exports.evaluateSubmission = async (req, res) => {
  try {
    const { submission_id } = req.params;
    const { marks, feedback } = req.body;

    if (marks === undefined) {
      return res.status(400).json({ success: false, message: 'Marks are required for evaluation.' });
    }

    const submission = await AssignmentSubmission.findByPk(submission_id, {
      include: [
        { model: Assignment, as: 'assignment' },
        { model: Student, as: 'student' }
      ]
    });

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    submission.marks = parseFloat(marks);
    submission.feedback = feedback || '';
    submission.status = 'Graded';
    await submission.save();

    return res.status(200).json({
      success: true,
      message: 'Submission graded successfully.',
      submission
    });
  } catch (error) {
    logger.error(`[Assignment Evaluate] Error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};


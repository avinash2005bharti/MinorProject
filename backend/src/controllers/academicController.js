const { Subject, Section, Faculty, Student } = require('../models/mysql');
const { logger } = require('../services/loggerService');

// 1. Get CSE Department Academic Hierarchy
// Department: CSE -> 1st Year, 2nd Year, 3rd Year, 4th Year -> Semesters 1 to 8 -> Sections
exports.getCseHierarchy = async (req, res) => {
  try {
    const sections = await Section.findAll({ order: [['semester', 'ASC'], ['section_name', 'ASC']] });
    const subjects = await Subject.findAll({ order: [['semester', 'ASC'], ['code', 'ASC']] });

    const years = [
      {
        year: '1st Year',
        semesters: [
          {
            semester: 1,
            sections: sections.filter(s => s.semester === 1).map(s => s.section_name),
            subjects: subjects.filter(s => s.semester === 1)
          },
          {
            semester: 2,
            sections: sections.filter(s => s.semester === 2).map(s => s.section_name),
            subjects: subjects.filter(s => s.semester === 2)
          }
        ]
      },
      {
        year: '2nd Year',
        semesters: [
          {
            semester: 3,
            sections: sections.filter(s => s.semester === 3).map(s => s.section_name),
            subjects: subjects.filter(s => s.semester === 3)
          },
          {
            semester: 4,
            sections: sections.filter(s => s.semester === 4).map(s => s.section_name),
            subjects: subjects.filter(s => s.semester === 4)
          }
        ]
      },
      {
        year: '3rd Year',
        semesters: [
          {
            semester: 5,
            sections: sections.filter(s => s.semester === 5).map(s => s.section_name),
            subjects: subjects.filter(s => s.semester === 5)
          },
          {
            semester: 6,
            sections: sections.filter(s => s.semester === 6).map(s => s.section_name),
            subjects: subjects.filter(s => s.semester === 6)
          }
        ]
      },
      {
        year: '4th Year',
        semesters: [
          {
            semester: 7,
            sections: sections.filter(s => s.semester === 7).map(s => s.section_name),
            subjects: subjects.filter(s => s.semester === 7)
          },
          {
            semester: 8,
            sections: sections.filter(s => s.semester === 8).map(s => s.section_name),
            subjects: subjects.filter(s => s.semester === 8)
          }
        ]
      }
    ];

    return res.status(200).json({
      success: true,
      department: 'Computer Science & Engineering (CSE)',
      totalYears: 4,
      years
    });
  } catch (error) {
    logger.error(`[Academic Controller] Hierarchy error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get All Subjects
exports.getSubjects = async (req, res) => {
  try {
    const { semester } = req.query;
    const where = {};
    if (semester) where.semester = parseInt(semester, 10);

    const subjects = await Subject.findAll({ where, order: [['semester', 'ASC'], ['code', 'ASC']] });
    return res.status(200).json({ success: true, count: subjects.length, subjects });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Create Subject
exports.createSubject = async (req, res) => {
  try {
    const { code, name, semester, credits } = req.body;
    if (!code || !name || !semester) {
      return res.status(400).json({ success: false, message: 'code, name, and semester are required.' });
    }

    const existing = await Subject.findOne({ where: { code } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Subject with this code already exists.' });
    }

    const subject = await Subject.create({
      code: code.toUpperCase(),
      name,
      semester: parseInt(semester, 10),
      credits: credits ? parseInt(credits, 10) : 4
    });

    return res.status(201).json({ success: true, message: 'Subject added successfully.', subject });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Update Subject
exports.updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findByPk(id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found.' });

    await subject.update(req.body);
    return res.status(200).json({ success: true, message: 'Subject updated successfully.', subject });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Delete Subject
exports.deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findByPk(id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found.' });

    await subject.destroy();
    return res.status(200).json({ success: true, message: 'Subject deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Get All Sections
exports.getSections = async (req, res) => {
  try {
    const { year, semester } = req.query;
    const where = {};
    if (year) where.year = year;
    if (semester) where.semester = parseInt(semester, 10);

    const sections = await Section.findAll({ where, order: [['semester', 'ASC'], ['section_name', 'ASC']] });
    return res.status(200).json({ success: true, count: sections.length, sections });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Create Section
exports.createSection = async (req, res) => {
  try {
    const { year, semester, section_name } = req.body;
    if (!year || !semester || !section_name) {
      return res.status(400).json({ success: false, message: 'year, semester, and section_name are required.' });
    }

    const section = await Section.create({
      year,
      semester: parseInt(semester, 10),
      section_name: section_name.toUpperCase()
    });

    return res.status(201).json({ success: true, message: 'Class section created successfully.', section });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Delete Section
exports.deleteSection = async (req, res) => {
  try {
    const { id } = req.params;
    const section = await Section.findByPk(id);
    if (!section) return res.status(404).json({ success: false, message: 'Section not found.' });

    await section.destroy();
    return res.status(200).json({ success: true, message: 'Section removed successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

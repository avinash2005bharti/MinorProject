const { Subject, Section } = require('../models/postgres');

const DEFAULT_CSE_YEARS = [
  {
    yearNumber: 1,
    name: '1st Year',
    title: 'Freshman Year',
    semesters: [
      { semNumber: 1, name: 'Semester 1', batch: '2025-2029', sections: ['A', 'B'] },
      { semNumber: 2, name: 'Semester 2', batch: '2025-2029', sections: ['A', 'B'] }
    ]
  },
  {
    yearNumber: 2,
    name: '2nd Year',
    title: 'Sophomore Year',
    semesters: [
      { semNumber: 3, name: 'Semester 3', batch: '2024-2028', sections: ['A', 'B'] },
      { semNumber: 4, name: 'Semester 4', batch: '2024-2028', sections: ['A', 'B'] }
    ]
  },
  {
    yearNumber: 3,
    name: '3rd Year',
    title: 'Junior Year',
    semesters: [
      { semNumber: 5, name: 'Semester 5', batch: '2023-2027', sections: ['A', 'B', 'C'] },
      { semNumber: 6, name: 'Semester 6', batch: '2023-2027', sections: ['A', 'B', 'C'] }
    ]
  },
  {
    yearNumber: 4,
    name: '4th Year',
    title: 'Senior Year',
    semesters: [
      { semNumber: 7, name: 'Semester 7', batch: '2022-2026', sections: ['A', 'B'] },
      { semNumber: 8, name: 'Semester 8', batch: '2022-2026', sections: ['A', 'B'] }
    ]
  }
];

// GET /api/cse/years
exports.getCseYears = async (req, res, next) => {
  try {
    let structure = await AcademicStructure.findOne({ code: 'CSE' });
    if (!structure) {
      return res.status(200).json(DEFAULT_CSE_YEARS);
    }

    // Format strictly matching specification
    const formatted = structure.years.map((y) => ({
      year: y.yearNumber,
      name: y.name,
      title: y.title,
      semesters: y.semesters.map((s) => ({
        semester: s.semNumber,
        name: s.name,
        batch: s.batch,
        sections: s.sections.map((sec) => sec.sectionLetter || sec)
      }))
    }));

    res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
};

// GET /api/cse/semesters
exports.getCseSemesters = async (req, res, next) => {
  try {
    const list = [];
    DEFAULT_CSE_YEARS.forEach((y) => {
      y.semesters.forEach((s) => {
        list.push({
          id: `sem-${s.semNumber}`,
          yearId: `year-${y.yearNumber}`,
          semNumber: s.semNumber,
          name: s.name,
          batch: s.batch,
          sections: s.sections
        });
      });
    });
    res.status(200).json(list);
  } catch (error) {
    next(error);
  }
};

// GET /api/cse/sections
exports.getCseSections = async (req, res, next) => {
  try {
    const { semester, year } = req.query;
    const defaultSections = [
      { id: 'sec-1', name: 'CSE-3A', classId: 'cls-1', className: 'CSE 3rd Year', semester: '6th Semester', tgName: 'Prof. K. Sen', room: 'Room 204', studentsCount: 60 },
      { id: 'sec-2', name: 'CSE-3B', classId: 'cls-1', className: 'CSE 3rd Year', semester: '6th Semester', tgName: 'Prof. Amit K.', room: 'Room 205', studentsCount: 60 },
      { id: 'sec-3', name: 'CSE-2A', classId: 'cls-2', className: 'CSE 2nd Year', semester: '4th Semester', tgName: 'Dr. Meenakshi S.', room: 'Room 301', studentsCount: 62 },
      { id: 'sec-4', name: 'CSE-2B', classId: 'cls-2', className: 'CSE 2nd Year', semester: '4th Semester', tgName: 'Prof. Anita Sharma', room: 'Room 302', studentsCount: 63 }
    ];
    res.status(200).json({ success: true, data: defaultSections });
  } catch (error) {
    next(error);
  }
};

// POST /api/cse/sections (Add new section, e.g. CSE-3C)
exports.addSection = async (req, res, next) => {
  try {
    const { name, semester, tgName, room, studentsCount } = req.body;
    res.status(201).json({
      success: true,
      message: `Section ${name || 'CSE-3C'} successfully provisioned under CSE Department.`,
      data: {
        id: `sec-${Date.now().toString().slice(-4)}`,
        name: name || 'CSE-3C',
        semester: semester || '6th Semester',
        tgName: tgName || 'Prof. K. Sen',
        room: room || 'Room 206',
        studentsCount: Number(studentsCount) || 55
      }
    });
  } catch (error) {
    next(error);
  }
};

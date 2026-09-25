// ==========================================================================
// CSE Academic Structure Data & Persistence Engine
// Exclusively for Computer Science Engineering (CSE) Department
// Structure: CSE -> 4 Years -> 8 Semesters -> Sections (A, B, + dynamic)
// ==========================================================================

export const CSE_YEARS = [
  { id: 'year-1', yearNumber: 1, name: '1st Year', title: 'Freshman Year', semesters: ['sem-1', 'sem-2'] },
  { id: 'year-2', yearNumber: 2, name: '2nd Year', title: 'Sophomore Year', semesters: ['sem-3', 'sem-4'] },
  { id: 'year-3', yearNumber: 3, name: '3rd Year', title: 'Junior Year', semesters: ['sem-5', 'sem-6'] },
  { id: 'year-4', yearNumber: 4, name: '4th Year', title: 'Senior Year', semesters: ['sem-7', 'sem-8'] }
];

export const CSE_SEMESTERS = [
  { id: 'sem-1', yearId: 'year-1', semNumber: 1, name: 'Semester 1', batch: '2025-2029', activeTerm: 'Odd Term 2025' },
  { id: 'sem-2', yearId: 'year-1', semNumber: 2, name: 'Semester 2', batch: '2025-2029', activeTerm: 'Even Term 2026' },
  { id: 'sem-3', yearId: 'year-2', semNumber: 3, name: 'Semester 3', batch: '2024-2028', activeTerm: 'Odd Term 2025' },
  { id: 'sem-4', yearId: 'year-2', semNumber: 4, name: 'Semester 4', batch: '2024-2028', activeTerm: 'Even Term 2026' },
  { id: 'sem-5', yearId: 'year-3', semNumber: 5, name: 'Semester 5', batch: '2023-2027', activeTerm: 'Odd Term 2025' },
  { id: 'sem-6', yearId: 'year-3', semNumber: 6, name: 'Semester 6', batch: '2023-2027', activeTerm: 'Even Term 2026' },
  { id: 'sem-7', yearId: 'year-4', semNumber: 7, name: 'Semester 7', batch: '2022-2026', activeTerm: 'Odd Term 2025' },
  { id: 'sem-8', yearId: 'year-4', semNumber: 8, name: 'Semester 8', batch: '2022-2026', activeTerm: 'Even Term 2026' }
];

export const RESOURCE_CATEGORIES = [
  { id: 'subjects', name: 'Subjects', icon: 'BookOpen', description: 'Curriculum courses & faculty assignments' },
  { id: 'notes', name: 'Notes', icon: 'FileText', description: 'Lecture slides, notes & topic guides' },
  { id: 'pyqs', name: 'PYQs', icon: 'HelpCircle', description: 'Previous year question papers & solutions' },
  { id: 'assignments', name: 'Assignments', icon: 'CheckSquare', description: 'Coursework tasks, rubrics & deadlines' },
  { id: 'labManuals', name: 'Lab Manuals', icon: 'FlaskConical', description: 'Hands-on practical guides & experiments' },
  { id: 'practicalFiles', name: 'Practical Files', icon: 'FileCheck', description: 'Submission formats, index & viva questions' },
  { id: 'syllabus', name: 'Syllabus', icon: 'Bookmark', description: 'University scheme & topic breakdowns' },
  { id: 'timetable', name: 'Timetable', icon: 'Calendar', description: 'Section weekly lecture & lab slots' },
  { id: 'announcements', name: 'Announcements', icon: 'Bell', description: 'Section-exclusive circulars & alerts' },
  { id: 'resources', name: 'Other Resources', icon: 'Globe', description: 'Video links, repos, cheat sheets & drives' }
];

// Helper to generate distinct initial section data
const createInitialSectionData = (yearNum, semNum, sectionLetter) => {
  const isA = sectionLetter === 'A';
  const room = isA ? `Room ${200 + semNum * 2}` : `Room ${201 + semNum * 2}`;
  const mentor = isA ? 'Prof. K. Sen' : 'Dr. Anita Sharma';
  const studentsCount = isA ? 42 : 40;

  // Subjects based on Semester
  let subjects = [];
  if (semNum === 1 || semNum === 2) {
    subjects = [
      { id: 'sub-1', code: `CS${semNum}01`, name: 'Engineering Mathematics', faculty: 'Dr. V. Dubey', credits: 4, hours: 4, room },
      { id: 'sub-2', code: `CS${semNum}02`, name: 'Basic Computer Engineering', faculty: isA ? 'Prof. R. Saxena' : 'Prof. M. Gupta', credits: 4, hours: 4, room },
      { id: 'sub-3', code: `CS${semNum}03`, name: 'Physics for Engineers', faculty: 'Dr. H. Pathak', credits: 3, hours: 3, room },
      { id: 'sub-4', code: `CS${semNum}04`, name: 'Programming Fundamentals in C', faculty: isA ? 'Prof. K. Sen' : 'Dr. R. Verma', credits: 4, hours: 5, room }
    ];
  } else if (semNum === 3 || semNum === 4) {
    subjects = [
      { id: 'sub-1', code: `CS${semNum}01`, name: 'Discrete Mathematics', faculty: 'Dr. V. Dubey', credits: 4, hours: 4, room },
      { id: 'sub-2', code: `CS${semNum}02`, name: 'Digital Logic & Circuit Design', faculty: 'Prof. S. Das', credits: 3, hours: 4, room },
      { id: 'sub-3', code: `CS${semNum}03`, name: 'Object Oriented Programming in Java', faculty: isA ? 'Dr. Rajesh Verma' : 'Prof. K. Sen', credits: 4, hours: 4, room },
      { id: 'sub-4', code: `CS${semNum}04`, name: 'Data Structures Foundations', faculty: isA ? 'Dr. Meenakshi S.' : 'Prof. A. Kumar', credits: 4, hours: 5, room }
    ];
  } else if (semNum === 5 || semNum === 6) {
    subjects = [
      { id: 'sub-1', code: `CS${semNum}01`, name: 'Data Structures & Algorithms', faculty: isA ? 'Dr. Rajesh Verma' : 'Prof. Anita Sharma', credits: 4, hours: 4, room },
      { id: 'sub-2', code: `CS${semNum}02`, name: 'Database Management Systems', faculty: isA ? 'Prof. Anita Sharma' : 'Dr. Meenakshi S.', credits: 4, hours: 4, room },
      { id: 'sub-3', code: `CS${semNum}03`, name: 'Operating Systems Architecture', faculty: isA ? 'Dr. Meenakshi S.' : 'Prof. Amit K.', credits: 4, hours: 4, room },
      { id: 'sub-4', code: `CS${semNum}04`, name: 'Computer Networks & Protocols', faculty: isA ? 'Prof. Amit K.' : 'Dr. Rajesh Verma', credits: 4, hours: 4, room },
      { id: 'sub-5', code: `CS${semNum}05`, name: 'Software Engineering Principles', faculty: 'Prof. K. Sen', credits: 3, hours: 3, room }
    ];
  } else {
    subjects = [
      { id: 'sub-1', code: `CS${semNum}01`, name: 'Distributed Systems & Cloud', faculty: 'Dr. S. Roy', credits: 4, hours: 4, room },
      { id: 'sub-2', code: `CS${semNum}02`, name: 'Artificial Intelligence & Deep Learning', faculty: isA ? 'Dr. Rajesh Verma' : 'Prof. K. Sen', credits: 4, hours: 4, room },
      { id: 'sub-3', code: `CS${semNum}03`, name: 'Cyber Security & Cryptography', faculty: 'Prof. Anita Sharma', credits: 3, hours: 3, room },
      { id: 'sub-4', code: `CS${semNum}04`, name: 'Major Capstone Project', faculty: 'All CSE Guides', credits: 6, hours: 8, room: 'Lab 4 & 5' }
    ];
  }

  // Notes
  const notes = [
    {
      id: `note-${semNum}-${sectionLetter}-1`,
      title: `${subjects[0]?.name} - Unit 1 & 2 Lecture Notes`,
      subject: subjects[0]?.name,
      subjectCode: subjects[0]?.code,
      uploadedAt: '18 Sept 2025',
      author: subjects[0]?.faculty,
      fileSize: isA ? '4.2 MB' : '3.8 MB',
      fileType: 'PDF',
      url: '#'
    },
    {
      id: `note-${semNum}-${sectionLetter}-2`,
      title: `${subjects[1]?.name} - Relational Architecture Slides`,
      subject: subjects[1]?.name,
      subjectCode: subjects[1]?.code,
      uploadedAt: '20 Sept 2025',
      author: subjects[1]?.faculty,
      fileSize: '6.1 MB',
      fileType: 'PDF',
      url: '#'
    }
  ];

  // PYQs
  const pyqs = [
    {
      id: `pyq-${semNum}-${sectionLetter}-1`,
      title: `End-Semester Examination Question Paper 2024 (${sectionLetter})`,
      subject: subjects[0]?.name,
      subjectCode: subjects[0]?.code,
      year: '2024',
      examType: 'End-Semester',
      uploadedAt: '12 Aug 2025',
      fileSize: '1.4 MB',
      hasSolution: true
    },
    {
      id: `pyq-${semNum}-${sectionLetter}-2`,
      title: `Mid-Term Examination 2023 Solved Paper`,
      subject: subjects[1]?.name,
      subjectCode: subjects[1]?.code,
      year: '2023',
      examType: 'Mid-Term',
      uploadedAt: '05 Aug 2025',
      fileSize: '2.1 MB',
      hasSolution: true
    }
  ];

  // Assignments
  const assignments = [
    {
      id: `asg-${semNum}-${sectionLetter}-1`,
      title: `Assignment 1: ${subjects[0]?.name} Implementation`,
      subject: subjects[0]?.name,
      subjectCode: subjects[0]?.code,
      dueDate: '30 Sept 2025',
      totalMarks: 25,
      submissionsCount: isA ? 38 : 34,
      totalStudents: studentsCount,
      status: 'Active'
    },
    {
      id: `asg-${semNum}-${sectionLetter}-2`,
      title: `Assignment 2: Schema Design & Case Study`,
      subject: subjects[1]?.name,
      subjectCode: subjects[1]?.code,
      dueDate: '08 Oct 2025',
      totalMarks: 20,
      submissionsCount: isA ? 12 : 9,
      totalStudents: studentsCount,
      status: 'Active'
    }
  ];

  // Lab Manuals
  const labManuals = [
    {
      id: `lm-${semNum}-${sectionLetter}-1`,
      title: `${subjects[0]?.name} Hands-on Lab Manual (2025 Scheme)`,
      subject: subjects[0]?.name,
      experimentsCount: 12,
      labRoom: isA ? 'CSE Lab 204' : 'CSE Lab 206',
      fileSize: '5.4 MB',
      uploadedAt: '01 Sept 2025'
    }
  ];

  // Practical Files
  const practicalFiles = [
    {
      id: `pf-${semNum}-${sectionLetter}-1`,
      title: `Section ${sectionLetter} Certified Practical File Index & Viva Sheet`,
      subject: subjects[0]?.name,
      format: 'Word & PDF',
      uploadedAt: '04 Sept 2025',
      fileSize: '950 KB'
    }
  ];

  // Syllabus
  const syllabus = [
    {
      id: `syl-${semNum}-${sectionLetter}-1`,
      title: `B.Tech CSE Semester ${semNum} Complete Curriculum Scheme`,
      accreditation: 'Autonomous OIST Curriculum',
      revisionYear: '2024-2025',
      uploadedAt: '10 Aug 2025',
      fileSize: '3.1 MB'
    }
  ];

  // Timetable Schedule
  const timetable = [
    { day: 'Monday', time: '09:00 - 10:00 AM', subject: subjects[0]?.name, code: subjects[0]?.code, faculty: subjects[0]?.faculty, room },
    { day: 'Monday', time: '10:15 - 11:15 AM', subject: subjects[1]?.name, code: subjects[1]?.code, faculty: subjects[1]?.faculty, room },
    { day: 'Tuesday', time: '11:30 - 01:30 PM', subject: `${subjects[0]?.name} Practical Lab`, code: `${subjects[0]?.code}-L`, faculty: subjects[0]?.faculty, room: 'Lab 2' },
    { day: 'Wednesday', time: '10:30 - 11:30 AM', subject: subjects[0]?.name, code: subjects[0]?.code, faculty: subjects[0]?.faculty, room },
    { day: 'Thursday', time: '02:00 - 03:00 PM', subject: subjects[2]?.name || 'Operating Systems', code: subjects[2]?.code || 'CS303', faculty: subjects[2]?.faculty || 'Dr. Meenakshi', room },
    { day: 'Friday', time: '03:15 - 04:15 PM', subject: subjects[3]?.name || 'Computer Networks', code: subjects[3]?.code || 'CS304', faculty: subjects[3]?.faculty || 'Prof. Amit', room }
  ];

  // Announcements
  const announcements = [
    {
      id: `ann-${semNum}-${sectionLetter}-1`,
      title: `Section ${sectionLetter}: Lab Session Relocated to ${room}`,
      content: `Notice for Section ${sectionLetter} students: Tomorrow's practical batch will assemble in ${room} at 10:00 AM sharp with printed lab records.`,
      date: '22 Sept 2025',
      priority: 'Important',
      author: mentor
    },
    {
      id: `ann-${semNum}-${sectionLetter}-2`,
      title: `Submission Deadline Extended for Assignment 1`,
      content: `Students of Section ${sectionLetter} may submit their Assignment 1 coding notebook till 30 Sept without late penalty.`,
      date: '20 Sept 2025',
      priority: 'Standard',
      author: subjects[0]?.faculty
    }
  ];

  // Other Resources
  const resources = [
    {
      id: `res-${semNum}-${sectionLetter}-1`,
      title: `Section ${sectionLetter} Official GitHub Assignment Repository`,
      type: 'GitHub Repo',
      url: 'https://github.com/oist-cse/academic-coursework',
      addedBy: mentor,
      date: '15 Sept 2025'
    },
    {
      id: `res-${semNum}-${sectionLetter}-2`,
      title: `NPTEL & MIT OpenCourseWare Video Playlist`,
      type: 'Video Lecture Series',
      url: 'https://nptel.ac.in/courses/106106',
      addedBy: subjects[0]?.faculty,
      date: '12 Sept 2025'
    }
  ];

  return {
    sectionId: `sec-${sectionLetter.toLowerCase()}`,
    sectionName: `Section ${sectionLetter}`,
    sectionLetter,
    studentsCount,
    room,
    mentor,
    subjects,
    notes,
    pyqs,
    assignments,
    labManuals,
    practicalFiles,
    syllabus,
    timetable,
    announcements,
    resources
  };
};

// Generates the comprehensive initial academic structure
export const generateDefaultAcademicStructure = () => {
  const structure = {};

  CSE_YEARS.forEach((yr) => {
    yr.semesters.forEach((semId) => {
      const sem = CSE_SEMESTERS.find((s) => s.id === semId);
      const semNum = sem.semNumber;
      
      // Default: Section A and Section B
      const keyA = `${yr.id}_${semId}_sec-a`;
      const keyB = `${yr.id}_${semId}_sec-b`;

      structure[keyA] = createInitialSectionData(yr.yearNumber, semNum, 'A');
      structure[keyB] = createInitialSectionData(yr.yearNumber, semNum, 'B');
    });
  });

  return structure;
};

// Load from LocalStorage or generate default
const STORAGE_KEY = 'oist_cse_academic_structure_v2';
const SECTIONS_LIST_KEY = 'oist_cse_semester_sections_v2';

export const loadAcademicStructure = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load academic structure from localStorage:', e);
  }
  const defaultData = generateDefaultAcademicStructure();
  saveAcademicStructure(defaultData);
  return defaultData;
};

export const saveAcademicStructure = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save academic structure to localStorage:', e);
  }
};

// Load list of sections per semester (allows adding Section C, D, etc.)
export const loadSemesterSectionsList = () => {
  try {
    const raw = localStorage.getItem(SECTIONS_LIST_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load semester sections list:', e);
  }
  // Default: every semester has Section A and Section B
  const defaultList = {};
  CSE_SEMESTERS.forEach((s) => {
    defaultList[s.id] = ['A', 'B'];
  });
  saveSemesterSectionsList(defaultList);
  return defaultList;
};

export const saveSemesterSectionsList = (list) => {
  try {
    localStorage.setItem(SECTIONS_LIST_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save semester sections list to localStorage:', e);
  }
};

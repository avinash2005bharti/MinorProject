const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/mysql');

// 0. Department Model
const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    defaultValue: 'CSE'
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
    defaultValue: 'Computer Science & Engineering'
  },
  hod_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  hod_name: {
    type: DataTypes.STRING(150),
    allowNull: true,
    defaultValue: 'Dr. Alok Verma'
  }
}, {
  tableName: 'departments',
  timestamps: true
});

// 1. User Model (Central Authentication & RBAC)
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'faculty', 'student', 'hod'),
    allowNull: false,
    defaultValue: 'student'
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  otpCode: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  otpExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'pending'),
    defaultValue: 'active'
  }
}, {
  tableName: 'users',
  timestamps: true
});

// 2. Student Model
const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  enrollment_no: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  year: {
    type: DataTypes.STRING(50),
    allowNull: false // '1st Year', '2nd Year', '3rd Year', '4th Year'
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: false // 1 through 8
  },
  section: {
    type: DataTypes.STRING(10),
    allowNull: false // 'A', 'B', 'C'
  },
  batch: {
    type: DataTypes.STRING(20),
    allowNull: false // e.g. '2022-2026'
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'Active'
  }
}, {
  tableName: 'students',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// 3. Faculty Model (with academic and scheduling workload limits)
const Faculty = sequelize.define('Faculty', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  department_code: {
    type: DataTypes.STRING(50),
    defaultValue: 'CSE'
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  designation: {
    type: DataTypes.STRING(100),
    allowNull: false // 'Professor & Head', 'Associate Professor', 'Assistant Professor'
  },
  specialization: {
    type: DataTypes.STRING(200),
    allowNull: false // e.g. 'AI & Machine Learning', 'Database Systems & Big Data'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  max_periods_per_day: {
    type: DataTypes.INTEGER,
    defaultValue: 4
  },
  max_periods_per_week: {
    type: DataTypes.INTEGER,
    defaultValue: 18
  },
  preferred_slots: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '[]' // JSON array string
  },
  availability_status: {
    type: DataTypes.ENUM('Available', 'On Leave', 'Busy'),
    defaultValue: 'Available'
  }
}, {
  tableName: 'faculty',
  timestamps: true
});

// 4. Subjects Model (with lab and weekly periods requirements)
const Subject = sequelize.define('Subject', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  department_code: {
    type: DataTypes.STRING(50),
    defaultValue: 'CSE'
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  credits: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 4
  },
  hours_per_week: {
    type: DataTypes.INTEGER,
    defaultValue: 4
  },
  is_lab: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  required_room_type: {
    type: DataTypes.ENUM('Classroom', 'Lab', 'Seminar'),
    defaultValue: 'Classroom'
  }
}, {
  tableName: 'subjects',
  timestamps: true
});

// 5. Classrooms & Labs Model
const Classroom = sequelize.define('Classroom', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  department_code: {
    type: DataTypes.STRING(50),
    defaultValue: 'CSE'
  },
  room_number: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false // e.g. 'CSE Room 204', 'CSE Software Lab 2'
  },
  room_type: {
    type: DataTypes.ENUM('Classroom', 'Lab', 'Seminar'),
    defaultValue: 'Classroom'
  },
  capacity: {
    type: DataTypes.INTEGER,
    defaultValue: 60
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'classrooms',
  timestamps: true
});

// 6. Sections Model
const Section = sequelize.define('Section', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  department_code: {
    type: DataTypes.STRING(50),
    defaultValue: 'CSE'
  },
  year: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  section_name: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  student_count: {
    type: DataTypes.INTEGER,
    defaultValue: 60
  }
}, {
  tableName: 'sections',
  timestamps: true
});

// 7. Attendance Model
const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  subject_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  faculty_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Present', 'Absent', 'Late', 'Excused'),
    allowNull: false,
    defaultValue: 'Present'
  }
}, {
  tableName: 'attendance',
  timestamps: true
});

// 8. Assignments Model
const Assignment = sequelize.define('Assignment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: false
  },
  subject_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  max_marks: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  file_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  tableName: 'assignments',
  timestamps: true
});

// 9. Assignment Submissions Model
const AssignmentSubmission = sequelize.define('AssignmentSubmission', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  assignment_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  file: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  marks: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Submitted', 'Graded', 'Late'),
    defaultValue: 'Submitted'
  }
}, {
  tableName: 'assignment_submissions',
  timestamps: true
});

// 10. Timetable Master / Versioning Model
const TimetableMaster = sequelize.define('TimetableMaster', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  department_code: {
    type: DataTypes.STRING(50),
    defaultValue: 'CSE'
  },
  year: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  section: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  academic_year: {
    type: DataTypes.STRING(20),
    defaultValue: '2026-27'
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  status: {
    type: DataTypes.ENUM('Draft', 'Generated', 'Pending Approval', 'Approved', 'Published', 'Archived'),
    defaultValue: 'Draft'
  },
  stats: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '{}' // JSON string with soft_constraints_score, workload_balance, etc.
  },
  created_by: {
    type: DataTypes.STRING(150),
    defaultValue: 'AI Agent'
  },
  approved_by: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  published_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'timetable_masters',
  timestamps: true
});

// 11. Timetable Slot Entry Model (Relational Source of Truth)
const Timetable = sequelize.define('Timetable', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  timetable_master_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  year: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  section: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  day: {
    type: DataTypes.STRING(20),
    allowNull: false // 'Monday', 'Tuesday', etc.
  },
  period: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  start_time: {
    type: DataTypes.STRING(20),
    allowNull: false // e.g. '09:30 AM'
  },
  end_time: {
    type: DataTypes.STRING(20),
    allowNull: false // e.g. '10:30 AM'
  },
  subject: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  faculty: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  room: {
    type: DataTypes.STRING(50),
    defaultValue: 'CSE Room 204'
  },
  type: {
    type: DataTypes.ENUM('Lecture', 'Lab', 'Seminar'),
    defaultValue: 'Lecture'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  substitution_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'timetable',
  timestamps: true
});

// 12. Teacher Absence Record Model
const TeacherAbsence = sequelize.define('TeacherAbsence', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  faculty_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  faculty_name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  reason: {
    type: DataTypes.STRING(255),
    defaultValue: 'Personal / Medical Leave'
  },
  status: {
    type: DataTypes.ENUM('Reported', 'Pending Adjustment', 'Adjusted', 'Cancelled'),
    defaultValue: 'Reported'
  },
  reported_by: {
    type: DataTypes.STRING(150),
    defaultValue: 'HOD'
  }
}, {
  tableName: 'teacher_absences',
  timestamps: true
});

// 13. Teacher Substitution Record Model
const TeacherSubstitution = sequelize.define('TeacherSubstitution', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  absence_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  timetable_entry_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  original_faculty_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  original_faculty_name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  substitute_faculty_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  substitute_faculty_name: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  day: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  start_time: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  end_time: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  room: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Proposed', 'Approved', 'Rejected'),
    defaultValue: 'Proposed'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  approved_by: {
    type: DataTypes.STRING(150),
    allowNull: true
  }
}, {
  tableName: 'teacher_substitutions',
  timestamps: true
});

// 14. Scheduling Constraints Model
const SchedulingConstraint = sequelize.define('SchedulingConstraint', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  department_code: {
    type: DataTypes.STRING(50),
    defaultValue: 'CSE'
  },
  constraint_type: {
    type: DataTypes.STRING(100),
    allowNull: false // 'NO_EARLY_CLASS', 'LIGHT_DAY', 'MAX_CONSECUTIVE_HOURS', 'PREFER_MORNING_LABS'
  },
  rule_data: {
    type: DataTypes.TEXT,
    defaultValue: '{}' // JSON formatted configuration
  },
  is_hard: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'scheduling_constraints',
  timestamps: true
});

// 15. Audit Log Model (Relational Audit Trail)
const AuditRecord = sequelize.define('AuditRecord', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  actor_id: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  actor_name: {
    type: DataTypes.STRING(150),
    allowNull: false,
    defaultValue: 'System'
  },
  role: {
    type: DataTypes.STRING(50),
    defaultValue: 'HOD'
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  entity: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  entity_id: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  previous_state: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  new_state: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_ai_generated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  approved: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'audit_records',
  timestamps: true
});

// 16. Notes / Documents Model
const Note = sequelize.define('Note', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  file_url: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  file_type: {
    type: DataTypes.STRING(50),
    allowNull: false // 'pdf', 'docx', 'pptx', etc.
  },
  category: {
    type: DataTypes.ENUM(
      'Notes',
      'Assignments',
      'Circulars',
      'Syllabus',
      'Lab Manuals',
      'Previous Papers',
      'Faculty Documents'
    ),
    defaultValue: 'Notes'
  },
  subject_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  faculty_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  year: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  rag_indexed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'notes',
  timestamps: true
});

// 17. Notice Model (Relational Department Notice Board)
const Notice = sequelize.define('Notice', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  authorRole: {
    type: DataTypes.STRING(50),
    defaultValue: 'HOD Office'
  },
  authorName: {
    type: DataTypes.STRING(150),
    defaultValue: 'Dr. Alok Verma'
  },
  targetType: {
    type: DataTypes.ENUM('Section', 'Year', 'Department', 'All'),
    defaultValue: 'Department'
  },
  targetValue: {
    type: DataTypes.STRING(50),
    defaultValue: 'CSE-3A'
  },
  priority: {
    type: DataTypes.ENUM('normal', 'urgent', 'important'),
    defaultValue: 'normal'
  },
  pinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'notices',
  timestamps: true
});

// 18. Notification Model (Relational System Alerts & Notifications)
const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  recipient: {
    type: DataTypes.STRING(50),
    defaultValue: 'student'
  },
  role: {
    type: DataTypes.STRING(50),
    defaultValue: 'student'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING(50),
    defaultValue: 'info'
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'notifications',
  timestamps: true
});

// 19. StudentRequest Model (Relational Attendance Considerations, Leaves, and Queries)
const StudentRequest = sequelize.define('StudentRequest', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  requestId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  requestType: {
    type: DataTypes.ENUM('attendance_consideration', 'leave_request', 'attendance_query'),
    defaultValue: 'attendance_consideration'
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  studentName: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  rollNo: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  department: {
    type: DataTypes.STRING(50),
    defaultValue: 'CSE'
  },
  semester: {
    type: DataTypes.STRING(20),
    defaultValue: '5th'
  },
  section: {
    type: DataTypes.STRING(10),
    defaultValue: 'A'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  dateRangeLabel: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  supportingDoc: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  currentAttendance: {
    type: DataTypes.INTEGER,
    defaultValue: 75
  },
  expectedAttendance: {
    type: DataTypes.INTEGER,
    defaultValue: 85
  },
  leaveType: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  subjectName: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  queryDate: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  period: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending_tg'
  },
  tgRecommendation: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tgBypassed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  timeline: {
    type: DataTypes.TEXT,
    defaultValue: '[]'
  },
  affectedClasses: {
    type: DataTypes.TEXT,
    defaultValue: '[]'
  }
}, {
  tableName: 'student_requests',
  timestamps: true
});

// Associations
User.hasOne(Student, { foreignKey: 'userId', as: 'studentProfile' });
Student.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(Faculty, { foreignKey: 'userId', as: 'facultyProfile' });
Faculty.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Student.hasMany(Attendance, { foreignKey: 'student_id', as: 'attendanceRecords' });
Attendance.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

Subject.hasMany(Attendance, { foreignKey: 'subject_id', as: 'attendanceRecords' });
Attendance.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });

Faculty.hasMany(Attendance, { foreignKey: 'faculty_id', as: 'attendanceMarked' });
Attendance.belongsTo(Faculty, { foreignKey: 'faculty_id', as: 'faculty' });

Subject.hasMany(Assignment, { foreignKey: 'subject_id', as: 'assignments' });
Assignment.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });

Assignment.hasMany(AssignmentSubmission, { foreignKey: 'assignment_id', as: 'submissions' });
AssignmentSubmission.belongsTo(Assignment, { foreignKey: 'assignment_id', as: 'assignment' });

Student.hasMany(AssignmentSubmission, { foreignKey: 'student_id', as: 'submissions' });
AssignmentSubmission.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

Subject.hasMany(Note, { foreignKey: 'subject_id', as: 'notes' });
Note.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });

Faculty.hasMany(Note, { foreignKey: 'faculty_id', as: 'uploadedNotes' });
Note.belongsTo(Faculty, { foreignKey: 'faculty_id', as: 'faculty' });

TimetableMaster.hasMany(Timetable, { foreignKey: 'timetable_master_id', as: 'entries' });
Timetable.belongsTo(TimetableMaster, { foreignKey: 'timetable_master_id', as: 'master' });

Faculty.hasMany(TeacherAbsence, { foreignKey: 'faculty_id', as: 'absences' });
TeacherAbsence.belongsTo(Faculty, { foreignKey: 'faculty_id', as: 'faculty' });

TeacherAbsence.hasMany(TeacherSubstitution, { foreignKey: 'absence_id', as: 'substitutions' });
TeacherSubstitution.belongsTo(TeacherAbsence, { foreignKey: 'absence_id', as: 'absence' });

module.exports = {
  sequelize,
  Department,
  User,
  Student,
  Faculty,
  Subject,
  Classroom,
  Section,
  Attendance,
  Assignment,
  AssignmentSubmission,
  TimetableMaster,
  Timetable,
  TeacherAbsence,
  TeacherSubstitution,
  SchedulingConstraint,
  AuditRecord,
  Note,
  Notice,
  Notification,
  StudentRequest
};

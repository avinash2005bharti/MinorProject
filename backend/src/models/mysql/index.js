const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/mysql');

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
    type: DataTypes.ENUM('admin', 'faculty', 'student'),
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

// 3. Faculty Model
const Faculty = sequelize.define('Faculty', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
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
    allowNull: false // e.g. 'AI & Machine Learning', 'Cloud Computing'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  }
}, {
  tableName: 'faculty',
  timestamps: true
});

// 4. Subjects Model
const Subject = sequelize.define('Subject', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
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
  }
}, {
  tableName: 'subjects',
  timestamps: true
});

// 5. Sections Model
const Section = sequelize.define('Section', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
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
  }
}, {
  tableName: 'sections',
  timestamps: true
});

// 6. Attendance Model
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

// 7. Assignments Model
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

// 8. Assignment Submissions Model
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

// 9. Timetable Model
const Timetable = sequelize.define('Timetable', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
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
    defaultValue: 'Lab-1 / CSE Block'
  }
}, {
  tableName: 'timetable',
  timestamps: true
});

// 10. Notes / Documents Model
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

module.exports = {
  sequelize,
  User,
  Student,
  Faculty,
  Subject,
  Section,
  Attendance,
  Assignment,
  AssignmentSubmission,
  Timetable,
  Note
};

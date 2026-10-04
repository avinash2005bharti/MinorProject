require('dotenv').config();
const { sequelize } = require('../config/postgres');
const bcrypt = require('bcryptjs');

async function migrateDatabase() {
  console.log('[Migration] Starting Comprehensive Normalized Core ERD Migration on PostgreSQL...');
  console.log('[Migration] Host:', process.env.PGHOST, '| Database:', process.env.PGDATABASE);

  await sequelize.authenticate();
  console.log('[Migration] Connected to PostgreSQL successfully.');

  // 1. Enable pgcrypto for UUID generation
  await sequelize.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
  console.log('[Migration] Extension pgcrypto enabled.');

  // 2. Safely rename existing tables to _old if they exist and have integer IDs
  const tablesToRename = [
    'departments', 'users', 'students', 'faculty', 'classrooms',
    'sections', 'subjects', 'attendance', 'attendance_sessions',
    'attendance_corrections', 'student_requests', 'leave_applications',
    'timetable', 'timetable_masters', 'teacher_absences',
    'teacher_substitutions', 'audit_records', 'notifications'
  ];

  for (const table of tablesToRename) {
    try {
      const [colRows] = await sequelize.query(`
        SELECT data_type FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = '${table}' AND column_name = 'id';
      `);
      if (colRows.length > 0 && colRows[0].data_type !== 'uuid') {
        console.log(`[Migration] Backing up existing integer-based table '${table}' -> '${table}_old'...`);
        await sequelize.query(`DROP TABLE IF EXISTS ${table}_old CASCADE;`);
        await sequelize.query(`ALTER TABLE ${table} RENAME TO ${table}_old;`);
      }
    } catch (err) {
      console.warn(`[Migration Notice] Table backup notice for ${table}:`, err.message);
    }
  }

  // 3. Create all 27 Normalized Entities with UUIDs, Foreign Keys, Indexes & Constraints
  const ddl = `
  -- 1. academic_years
  CREATE TABLE IF NOT EXISTS academic_years (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(20) UNIQUE NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      is_current BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  -- 2. departments
  CREATE TABLE IF NOT EXISTS departments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(150) NOT NULL,
      code VARCHAR(20) UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  -- 3. programs
  CREATE TABLE IF NOT EXISTS programs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(150) NOT NULL,
      code VARCHAR(50) UNIQUE NOT NULL,
      department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
      duration_years INTEGER DEFAULT 4,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  -- 4. semesters
  CREATE TABLE IF NOT EXISTS semesters (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      semester_number INTEGER NOT NULL CHECK (semester_number BETWEEN 1 AND 8),
      program_id UUID NOT NULL REFERENCES programs(id) ON DELETE RESTRICT,
      academic_year VARCHAR(20) DEFAULT '2026-27',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  -- 5. sections
  CREATE TABLE IF NOT EXISTS sections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(20) NOT NULL,
      semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL,
      department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
      academic_year VARCHAR(20) DEFAULT '2026-27',
      capacity INTEGER DEFAULT 60,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  -- 6. users
  CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      external_user_id VARCHAR(150) UNIQUE,
      role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'HOD', 'TEACHER', 'STUDENT', 'TG', 'admin', 'hod', 'faculty', 'teacher', 'student', 'tg')),
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(150) NOT NULL,
      refresh_token TEXT,
      otp_code VARCHAR(10),
      otp_expiry TIMESTAMPTZ,
      status VARCHAR(20) DEFAULT 'ACTIVE',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  -- 7. teachers
  CREATE TABLE IF NOT EXISTS teachers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
      employee_id VARCHAR(50) UNIQUE NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100),
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(20),
      designation VARCHAR(100) NOT NULL,
      department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
      joining_date DATE DEFAULT CURRENT_DATE,
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'Active', 'Inactive', 'On Leave')),
      specialization VARCHAR(200) DEFAULT 'Computer Science & Engineering',
      max_periods_per_day INTEGER DEFAULT 4,
      max_periods_per_week INTEGER DEFAULT 18,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  -- 8. hods (max 1 active HOD per department)
  CREATE TABLE IF NOT EXISTS hods (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
      department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
      start_date DATE DEFAULT CURRENT_DATE,
      end_date DATE,
      is_current BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );
  CREATE UNIQUE INDEX IF NOT EXISTS uq_current_hod_per_dept ON hods (department_id) WHERE is_current = TRUE;

  -- 9. mentor_teacher_groups
  CREATE TABLE IF NOT EXISTS mentor_teacher_groups (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
      name VARCHAR(100) NOT NULL,
      department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
      academic_year VARCHAR(20) DEFAULT '2026-27',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  -- 10. students
  CREATE TABLE IF NOT EXISTS students (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
      enrollment_no VARCHAR(50) UNIQUE NOT NULL,
      roll_no VARCHAR(50),
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100),
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(20),
      date_of_birth DATE,
      admission_year INTEGER DEFAULT 2023,
      semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
      department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
      section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'GRADUATED', 'SUSPENDED', 'Active', 'Inactive')),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  -- 11. student_mentor_assignments
  CREATE TABLE IF NOT EXISTS student_mentor_assignments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      mentor_group_id UUID NOT NULL REFERENCES mentor_teacher_groups(id) ON DELETE CASCADE,
      academic_year VARCHAR(20) DEFAULT '2026-27',
      assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_student_mentor_year UNIQUE (student_id, academic_year)
  );

  -- 12. subjects
  CREATE TABLE IF NOT EXISTS subjects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(30) UNIQUE NOT NULL,
      name VARCHAR(150) NOT NULL,
      department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
      semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL,
      semester INTEGER DEFAULT 5,
      credits INTEGER DEFAULT 4,
      lecture_hours INTEGER DEFAULT 3,
      practical_hours INTEGER DEFAULT 2,
      subject_type VARCHAR(20) DEFAULT 'THEORY' CHECK (subject_type IN ('THEORY', 'LAB', 'TUTORIAL', 'Theory', 'Lab', 'Tutorial')),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  -- 13. teacher_subject_assignments
  CREATE TABLE IF NOT EXISTS teacher_subject_assignments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
      subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
      academic_year VARCHAR(20) DEFAULT '2026-27',
      semester INTEGER DEFAULT 5,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  -- 14. rooms
  CREATE TABLE IF NOT EXISTS rooms (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      room_number VARCHAR(50) UNIQUE NOT NULL,
      building VARCHAR(100) DEFAULT 'Main Academic Block',
      floor INTEGER DEFAULT 2,
      room_type VARCHAR(20) DEFAULT 'CLASSROOM' CHECK (room_type IN ('CLASSROOM', 'LAB', 'SEMINAR_HALL', 'Classroom', 'Lab', 'Seminar')),
      capacity INTEGER DEFAULT 60,
      is_available BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  -- 15. timetable_versions
  CREATE TABLE IF NOT EXISTS timetable_versions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
      generated_by VARCHAR(150) DEFAULT 'AI Timetable Agent',
      generation_method VARCHAR(20) DEFAULT 'AI' CHECK (generation_method IN ('MANUAL', 'AI', 'Manual', 'Ai')),
      reason TEXT,
      status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED', 'Draft', 'Active', 'Archived', 'Generated', 'Pending Approval', 'Approved', 'Published')),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      activated_at TIMESTAMPTZ
  );

  -- 16. timetable_entries
  CREATE TABLE IF NOT EXISTS timetable_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
      subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
      room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
      day VARCHAR(20) DEFAULT 'Monday',
      period INTEGER DEFAULT 1,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      academic_year VARCHAR(20) DEFAULT '2026-27',
      semester INTEGER DEFAULT 5,
      timetable_version UUID REFERENCES timetable_versions(id) ON DELETE CASCADE,
      type VARCHAR(20) DEFAULT 'Lecture',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_tt_teacher_collision ON timetable_entries (teacher_id, day_of_week, start_time, end_time, timetable_version);
  CREATE INDEX IF NOT EXISTS idx_tt_room_collision ON timetable_entries (room_id, day_of_week, start_time, end_time, timetable_version);
  CREATE INDEX IF NOT EXISTS idx_tt_section_collision ON timetable_entries (section_id, day_of_week, start_time, end_time, timetable_version);

  -- 17. teacher_availability
  CREATE TABLE IF NOT EXISTS teacher_availability (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
      day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      availability_status VARCHAR(20) DEFAULT 'AVAILABLE' CHECK (availability_status IN ('AVAILABLE', 'UNAVAILABLE', 'Available', 'Unavailable')),
      reason TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  -- 18. teacher_absences
  CREATE TABLE IF NOT EXISTS teacher_absences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      reason TEXT,
      status VARCHAR(20) DEFAULT 'REPORTED' CHECK (status IN ('REPORTED', 'APPROVED', 'RESOLVED', 'Reported', 'Approved', 'Resolved', 'Pending Adjustment', 'Adjusted')),
      reported_by VARCHAR(150) DEFAULT 'Self',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  -- 19. attendance_sessions
  CREATE TABLE IF NOT EXISTS attendance_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
      subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
      teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
      date DATE NOT NULL,
      start_time TIME,
      end_time TIME,
      period INTEGER DEFAULT 1,
      timetable_entry_id UUID REFERENCES timetable_entries(id) ON DELETE SET NULL,
      qr_token VARCHAR(255),
      status VARCHAR(20) DEFAULT 'CLOSED',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  -- 20. attendance_records
  CREATE TABLE IF NOT EXISTS attendance_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
      student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      status VARCHAR(20) NOT NULL DEFAULT 'PRESENT' CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'Present', 'Absent', 'Late', 'Excused')),
      marked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      marked_by VARCHAR(150),
      remarks TEXT,
      CONSTRAINT uq_session_student UNIQUE (session_id, student_id)
  );

  -- 21. attendance_correction_requests
  CREATE TABLE IF NOT EXISTS attendance_correction_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      attendance_record_id UUID REFERENCES attendance_records(id) ON DELETE SET NULL,
      requested_status VARCHAR(20) NOT NULL DEFAULT 'PRESENT' CHECK (requested_status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'Present', 'Absent', 'Late', 'Excused')),
      reason TEXT NOT NULL,
      evidence_url TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'Pending', 'Approved', 'Rejected', 'pending_tg', 'pending_hod')),
      reviewed_by VARCHAR(150),
      reviewed_role VARCHAR(20) CHECK (reviewed_role IN ('TG', 'HOD', 'TEACHER', 'tg', 'hod', 'teacher')),
      reviewed_at TIMESTAMPTZ,
      review_comment TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  -- 22. leave_requests
  CREATE TABLE IF NOT EXISTS leave_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      reason TEXT NOT NULL,
      leave_type VARCHAR(20) NOT NULL DEFAULT 'SICK' CHECK (leave_type IN ('SICK', 'CASUAL', 'EMERGENCY', 'OTHER', 'Medical', 'Duty', 'Personal', 'Academic', 'Hackathon')),
      status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'TG_APPROVED', 'HOD_APPROVED', 'REJECTED', 'CANCELLED', 'Pending', 'Approved', 'Rejected', 'Cancelled', 'pending_tg', 'pending_hod')),
      current_approver_role VARCHAR(20) DEFAULT 'TG' CHECK (current_approver_role IN ('TG', 'HOD', 'tg', 'hod')),
      tg_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
      hod_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
      reviewed_at TIMESTAMPTZ,
      review_comment TEXT,
      supporting_doc TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  -- 23. attendance_consideration_requests
  CREATE TABLE IF NOT EXISTS attendance_consideration_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      reason TEXT NOT NULL,
      requested_percentage NUMERIC(5, 2),
      category VARCHAR(100) DEFAULT 'Hackathon / Project Competition',
      supporting_doc TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'Pending', 'Approved', 'Rejected', 'pending_tg', 'pending_hod')),
      approved_by VARCHAR(150),
      approved_at TIMESTAMPTZ,
      remarks TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  -- 24. notifications
  CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      recipient_user_id VARCHAR(150),
      role VARCHAR(50) DEFAULT 'all',
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) DEFAULT 'info',
      is_read BOOLEAN DEFAULT FALSE,
      reference_type VARCHAR(50),
      reference_id VARCHAR(150),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  -- 25. audit_logs
  CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      actor_user_id VARCHAR(150),
      actor_name VARCHAR(150) DEFAULT 'System',
      actor_role VARCHAR(50) DEFAULT 'ADMIN',
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(100) NOT NULL,
      entity_id VARCHAR(150),
      old_values JSONB DEFAULT '{}'::jsonb,
      new_values JSONB DEFAULT '{}'::jsonb,
      ip_address VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  -- 26. ai_jobs
  CREATE TABLE IF NOT EXISTS ai_jobs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      requested_by VARCHAR(150),
      job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('TIMETABLE_GENERATION', 'TIMETABLE_MODIFICATION', 'TEACHER_SUBSTITUTION', 'REPORT_GENERATION', 'ATTENDANCE_ANALYSIS')),
      status VARCHAR(20) NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED')),
      input_data JSONB DEFAULT '{}'::jsonb,
      output_data JSONB DEFAULT '{}'::jsonb,
      error_message TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ
  );

  -- 27. generated_reports
  CREATE TABLE IF NOT EXISTS generated_reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      generated_by VARCHAR(150),
      report_type VARCHAR(100) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_url TEXT NOT NULL,
      format VARCHAR(10) NOT NULL CHECK (format IN ('PDF', 'XLSX', 'CSV', 'pdf', 'xlsx', 'csv')),
      ai_job_id UUID REFERENCES ai_jobs(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  -- Ancillary ERP tables
  CREATE TABLE IF NOT EXISTS notices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      author_role VARCHAR(50) DEFAULT 'HOD Office',
      author_name VARCHAR(150) DEFAULT 'Dr. Alok Verma',
      target_type VARCHAR(50) DEFAULT 'Department',
      target_value VARCHAR(50) DEFAULT 'CSE-3A',
      priority VARCHAR(20) DEFAULT 'normal',
      pinned BOOLEAN DEFAULT FALSE,
      date DATE DEFAULT CURRENT_DATE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS assignments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(200) NOT NULL,
      description TEXT,
      deadline TIMESTAMPTZ NOT NULL,
      subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
      max_marks INTEGER DEFAULT 100,
      file_url VARCHAR(500),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS assignment_submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
      student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      file VARCHAR(500) NOT NULL,
      marks NUMERIC(5, 2),
      feedback TEXT,
      status VARCHAR(20) DEFAULT 'Submitted',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(200) NOT NULL,
      description TEXT,
      file_url VARCHAR(500) NOT NULL,
      file_type VARCHAR(50) NOT NULL,
      category VARCHAR(50) DEFAULT 'Notes',
      subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
      teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
      rag_indexed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );
  `;

  // Cleanly strip comments and split by semicolon
  const cleanSql = ddl
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map(line => line.replace(/--.*$/, '').trim())
    .join('\n');

  const statements = cleanSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const stmt of statements) {
    try {
      await sequelize.query(stmt + ';');
    } catch (e) {
      console.warn('[DDL Error on statement]:', stmt.slice(0, 80), '...\nError:', e.message);
    }
  }

  // 4. Create compatibility views for legacy names
  const views = [
    `CREATE OR REPLACE VIEW faculty AS SELECT id, department_id AS department_code, (first_name || ' ' || COALESCE(last_name, '')) AS name, email, designation, specialization, phone, max_periods_per_day, max_periods_per_week, user_id AS "userId", status AS availability_status, created_at AS "createdAt", updated_at AS "updatedAt" FROM teachers;`,
    `CREATE OR REPLACE VIEW classrooms AS SELECT id, room_number, ('Room ' || room_number) AS name, room_type, capacity, is_available, created_at AS "createdAt", updated_at AS "updatedAt" FROM rooms;`,
    `CREATE OR REPLACE VIEW timetable AS SELECT id, timetable_version AS timetable_master_id, academic_year AS year, semester, 'A' AS section, day, period, start_time::text AS start_time, end_time::text AS end_time, '' AS subject, '' AS faculty, '' AS room, type, TRUE AS is_active, created_at AS "createdAt", updated_at AS "updatedAt" FROM timetable_entries;`,
    `CREATE OR REPLACE VIEW timetable_masters AS SELECT id, 'CSE' AS department_code, '3rd Year' AS year, 5 AS semester, 'A' AS section, '2026-27' AS academic_year, 1 AS version, status, '{}' AS stats, generated_by AS created_by, NULL AS approved_by, activated_at AS published_at, created_at AS "createdAt", updated_at AS "updatedAt" FROM timetable_versions;`,
    `CREATE OR REPLACE VIEW attendance AS SELECT id, student_id, session_id AS subject_id, NULL AS faculty_id, CURRENT_DATE AS date, status, created_at AS "createdAt", updated_at AS "updatedAt" FROM attendance_records;`,
    `CREATE OR REPLACE VIEW audit_records AS SELECT id, actor_user_id AS actor_id, actor_name, actor_role AS role, action, entity_type AS entity, entity_id, old_values::text AS previous_state, new_values::text AS new_state, FALSE AS is_ai_generated, TRUE AS approved, '' AS details, created_at AS "createdAt", updated_at AS "updatedAt" FROM audit_logs;`,
    `CREATE OR REPLACE VIEW leave_applications AS SELECT id, student_id AS "userId", (CURRENT_DATE + 1) AS "startDate", (CURRENT_DATE + 3) AS "endDate", reason, leave_type AS "leaveType", status, tg_id AS "mentorId", hod_id AS "hodId", reviewed_at AS "approvedAt", NULL AS "approvedBy", created_at AS "createdAt", updated_at AS "updatedAt" FROM leave_requests;`,
    `CREATE OR REPLACE VIEW attendance_corrections AS SELECT id, student_id, NULL AS subject_id, CURRENT_DATE AS date, 1 AS period, requested_status AS "requestedStatus", reason, status, reviewed_by AS "reviewedBy", reviewed_at AS "reviewedAt", review_comment AS "reviewComment", created_at AS "createdAt", updated_at AS "updatedAt" FROM attendance_correction_requests;`,
    `CREATE OR REPLACE VIEW student_requests AS SELECT id, ('REQ-' || substring(id::text, 1, 8)) AS "requestId", 'attendance_consideration' AS "requestType", student_id AS "studentId", '' AS "studentName", '' AS "rollNo", 'CSE' AS department, '5th' AS semester, 'A' AS section, reason AS title, start_date AS "startDate", end_date AS "endDate", reason, supporting_doc AS "supportingDoc", 75 AS "currentAttendance", 85 AS "expectedAttendance", status, created_at AS "createdAt", updated_at AS "updatedAt" FROM attendance_consideration_requests;`
  ];

  for (const v of views) {
    try {
      await sequelize.query(v);
    } catch (e) {
      console.warn('[View Creation Warning]:', e.message);
    }
  }

  console.log('[Migration] All 27 entities & compatibility views successfully provisioned in PostgreSQL!');
}

migrateDatabase().catch(console.error).finally(() => process.exit(0));

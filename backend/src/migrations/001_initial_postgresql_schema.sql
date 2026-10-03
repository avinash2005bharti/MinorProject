-- PostgreSQL Schema Migration: 001_initial_postgresql_schema.sql
-- ERP Relational Data Source of Truth for Computer Science & Engineering Department

-- 1. Departments
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE DEFAULT 'CSE',
    name VARCHAR(150) NOT NULL DEFAULT 'Computer Science & Engineering',
    hod_id INTEGER,
    hod_name VARCHAR(150) DEFAULT 'Dr. Alok Verma',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users (Authentication & RBAC)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'faculty', 'student', 'hod')),
    name VARCHAR(150) NOT NULL,
    "refreshToken" TEXT,
    "otpCode" VARCHAR(10),
    "otpExpiry" TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Students
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    enrollment_no VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20),
    year VARCHAR(50) NOT NULL,
    semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
    section VARCHAR(10) NOT NULL,
    batch VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'Active',
    "userId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Faculty
CREATE TABLE IF NOT EXISTS faculty (
    id SERIAL PRIMARY KEY,
    department_code VARCHAR(50) DEFAULT 'CSE',
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    designation VARCHAR(100) NOT NULL,
    specialization VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    max_periods_per_day INTEGER DEFAULT 4,
    max_periods_per_week INTEGER DEFAULT 18,
    preferred_slots TEXT DEFAULT '[]',
    availability_status VARCHAR(20) DEFAULT 'Available' CHECK (availability_status IN ('Available', 'On Leave', 'Busy')),
    "userId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Subjects
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    department_code VARCHAR(50) DEFAULT 'CSE',
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
    credits INTEGER DEFAULT 4,
    hours_per_week INTEGER DEFAULT 4,
    is_lab BOOLEAN DEFAULT false,
    required_room_type VARCHAR(20) DEFAULT 'Classroom' CHECK (required_room_type IN ('Classroom', 'Lab', 'Seminar')),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Classrooms & Labs
CREATE TABLE IF NOT EXISTS classrooms (
    id SERIAL PRIMARY KEY,
    department_code VARCHAR(50) DEFAULT 'CSE',
    room_number VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    room_type VARCHAR(50) DEFAULT 'Classroom',
    capacity INTEGER DEFAULT 60,
    is_available BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Sections
CREATE TABLE IF NOT EXISTS sections (
    id SERIAL PRIMARY KEY,
    department_code VARCHAR(50) DEFAULT 'CSE',
    year VARCHAR(50) NOT NULL,
    semester INTEGER NOT NULL,
    section_name VARCHAR(10) NOT NULL,
    batch VARCHAR(20),
    student_count INTEGER DEFAULT 60,
    tg_id INTEGER REFERENCES faculty(id) ON DELETE SET NULL,
    tg_name VARCHAR(150),
    default_room_id INTEGER REFERENCES classrooms(id) ON DELETE SET NULL,
    default_room_number VARCHAR(50),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Timetable Masters (Versioned Head)
CREATE TABLE IF NOT EXISTS timetable_masters (
    id SERIAL PRIMARY KEY,
    department_code VARCHAR(50) DEFAULT 'CSE',
    year VARCHAR(50) NOT NULL,
    semester INTEGER NOT NULL,
    section VARCHAR(10) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    version INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Generated', 'Published', 'Archived')),
    stats TEXT DEFAULT '{}',
    created_by VARCHAR(150),
    approved_by VARCHAR(150),
    published_at TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Timetable Slots
CREATE TABLE IF NOT EXISTS timetable (
    id SERIAL PRIMARY KEY,
    timetable_master_id INTEGER REFERENCES timetable_masters(id) ON DELETE CASCADE,
    year VARCHAR(50) NOT NULL,
    semester INTEGER NOT NULL,
    section VARCHAR(10) NOT NULL,
    day VARCHAR(20) NOT NULL,
    period INTEGER NOT NULL,
    start_time VARCHAR(20) NOT NULL,
    end_time VARCHAR(20) NOT NULL,
    subject VARCHAR(150) NOT NULL,
    faculty VARCHAR(150) NOT NULL,
    room VARCHAR(50) NOT NULL,
    type VARCHAR(50) DEFAULT 'Lecture',
    is_active BOOLEAN DEFAULT true,
    substitution_id INTEGER,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Teacher Absences
CREATE TABLE IF NOT EXISTS teacher_absences (
    id SERIAL PRIMARY KEY,
    faculty_id INTEGER REFERENCES faculty(id) ON DELETE CASCADE,
    faculty_name VARCHAR(150) NOT NULL,
    date VARCHAR(20) NOT NULL,
    reason VARCHAR(255) DEFAULT 'Leave',
    status VARCHAR(50) DEFAULT 'Reported',
    reported_by VARCHAR(150) DEFAULT 'HOD',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Teacher Substitutions
CREATE TABLE IF NOT EXISTS teacher_substitutions (
    id SERIAL PRIMARY KEY,
    absence_id INTEGER REFERENCES teacher_absences(id) ON DELETE CASCADE,
    timetable_entry_id INTEGER,
    original_faculty_id INTEGER REFERENCES faculty(id) ON DELETE SET NULL,
    original_faculty_name VARCHAR(150) NOT NULL,
    substitute_faculty_id INTEGER REFERENCES faculty(id) ON DELETE SET NULL,
    substitute_faculty_name VARCHAR(150) NOT NULL,
    date VARCHAR(20) NOT NULL,
    day VARCHAR(20) NOT NULL,
    start_time VARCHAR(20) NOT NULL,
    end_time VARCHAR(20) NOT NULL,
    subject VARCHAR(150) NOT NULL,
    room VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'Proposed' CHECK (status IN ('Proposed', 'Approved', 'Rejected', 'Cancelled')),
    reason VARCHAR(255) DEFAULT 'AI Teacher Scheduler Allocation',
    approved_by VARCHAR(150),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Scheduling Constraints
CREATE TABLE IF NOT EXISTS scheduling_constraints (
    id SERIAL PRIMARY KEY,
    department_code VARCHAR(50) DEFAULT 'CSE',
    academic_year VARCHAR(20) NOT NULL,
    semester INTEGER,
    section VARCHAR(10),
    constraint_type VARCHAR(20) NOT NULL CHECK (constraint_type IN ('HARD', 'SOFT')),
    rule_key VARCHAR(100) NOT NULL,
    rule_value TEXT NOT NULL,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Audit Records
CREATE TABLE IF NOT EXISTS audit_records (
    id SERIAL PRIMARY KEY,
    actor_id VARCHAR(100) NOT NULL,
    actor_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    previous_state TEXT,
    new_state TEXT,
    is_ai_generated BOOLEAN DEFAULT false,
    approved BOOLEAN DEFAULT true,
    details TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Attendance Records
CREATE TABLE IF NOT EXISTS attendances (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    faculty_id INTEGER REFERENCES faculty(id) ON DELETE SET NULL,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    date VARCHAR(20) NOT NULL,
    period INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Present', 'Absent', 'Excused', 'Late')),
    verified_by_tg BOOLEAN DEFAULT false,
    approved_by_hod BOOLEAN DEFAULT false,
    reason TEXT,
    proof_url TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Assignments
CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    faculty_id INTEGER REFERENCES faculty(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    max_marks INTEGER DEFAULT 100,
    file_url TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. Assignment Submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    marks_obtained INTEGER,
    feedback TEXT,
    status VARCHAR(20) DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Graded', 'Late', 'Resubmitted')),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. Notes & Study Materials
CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    faculty_id INTEGER REFERENCES faculty(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    file_type VARCHAR(50),
    vector_indexed BOOLEAN DEFAULT false,
    qdrant_point_id VARCHAR(100),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 18. Department Notices
CREATE TABLE IF NOT EXISTS notices (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(100) DEFAULT 'CSE Office',
    "targetRole" VARCHAR(20) DEFAULT 'all' CHECK ("targetRole" IN ('all', 'student', 'faculty', 'hod')),
    priority VARCHAR(20) DEFAULT 'Normal' CHECK (priority IN ('Normal', 'Important', 'Urgent')),
    "expiresAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 19. User Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    "isRead" BOOLEAN DEFAULT false,
    "actionUrl" VARCHAR(255),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 20. Student Requests (Leaves, Queries, Considerations)
CREATE TABLE IF NOT EXISTS student_requests (
    id SERIAL PRIMARY KEY,
    "studentId" INTEGER REFERENCES students(id) ON DELETE CASCADE,
    "studentName" VARCHAR(150) NOT NULL,
    "enrollmentNo" VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    subject VARCHAR(150),
    dates TEXT DEFAULT '[]',
    reason TEXT NOT NULL,
    "supportingDocument" TEXT,
    status VARCHAR(50) DEFAULT 'Submitted',
    "tgStatus" VARCHAR(50) DEFAULT 'Pending TG Review',
    "tgRemarks" TEXT,
    "hodStatus" VARCHAR(50) DEFAULT 'Pending HOD Approval',
    "hodRemarks" TEXT,
    "tgBypassed" BOOLEAN DEFAULT false,
    "rejectionReason" TEXT,
    timeline TEXT DEFAULT '[]',
    "affectedClasses" TEXT DEFAULT '[]',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 21. Time Slots / Periods
CREATE TABLE IF NOT EXISTS time_slots (
    id SERIAL PRIMARY KEY,
    period_number INTEGER NOT NULL,
    start_time VARCHAR(20) NOT NULL,
    end_time VARCHAR(20) NOT NULL,
    label VARCHAR(50),
    is_break BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 22. Attendance Sessions
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL UNIQUE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    faculty_id INTEGER NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    section VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    period INTEGER DEFAULT 1,
    qr_token VARCHAR(255),
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Closed', 'Cancelled')),
    expires_at TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 23. Attendance Corrections
CREATE TABLE IF NOT EXISTS attendance_corrections (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    period INTEGER,
    original_status VARCHAR(20) DEFAULT 'Absent',
    requested_status VARCHAR(20) DEFAULT 'Present',
    reason TEXT,
    supporting_doc VARCHAR(500),
    status VARCHAR(30) DEFAULT 'pending_tg' CHECK (status IN ('pending_tg', 'pending_hod', 'approved', 'rejected')),
    tg_id INTEGER,
    tg_recommendation TEXT,
    hod_id INTEGER,
    hod_comments TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 24. Leave Applications
CREATE TABLE IF NOT EXISTS leave_applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    user_role VARCHAR(20) DEFAULT 'student' CHECK (user_role IN ('student', 'faculty', 'tg', 'hod')),
    leave_type VARCHAR(30) DEFAULT 'Personal' CHECK (leave_type IN ('Medical', 'Personal', 'On-Duty', 'Academic')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    supporting_doc VARCHAR(500),
    status VARCHAR(30) DEFAULT 'pending_tg' CHECK (status IN ('pending_tg', 'pending_hod', 'pending_hod_direct', 'approved', 'rejected')),
    tg_bypassed BOOLEAN DEFAULT false,
    tg_id INTEGER,
    tg_recommendation TEXT,
    hod_id INTEGER,
    hod_comments TEXT,
    timeline TEXT DEFAULT '[]',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance & Query Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_students_enrollment ON students(enrollment_no);
CREATE INDEX IF NOT EXISTS idx_students_sem_sec ON students(semester, section);
CREATE INDEX IF NOT EXISTS idx_faculty_email ON faculty(email);
CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);
CREATE INDEX IF NOT EXISTS idx_timetable_sem_sec ON timetable(semester, section, day);
CREATE INDEX IF NOT EXISTS idx_timetable_faculty ON timetable(faculty);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_subject ON attendance(subject_id, date);
CREATE INDEX IF NOT EXISTS idx_substitutions_date ON teacher_substitutions(date);
CREATE INDEX IF NOT EXISTS idx_requests_student ON student_requests("studentId");
CREATE INDEX IF NOT EXISTS idx_att_sess_sub_sec ON attendance_sessions(subject_id, section, date);
CREATE INDEX IF NOT EXISTS idx_att_corr_stud ON attendance_corrections(student_id, status);
CREATE INDEX IF NOT EXISTS idx_leave_app_user ON leave_applications(user_id, status);


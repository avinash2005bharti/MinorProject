import os
import json
import time
import sqlite3
from urllib.parse import urlparse
from typing import Dict, Any, List, Optional
from loguru import logger
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

class PostgresTools:
    """
    Authoritative Relational Database Tools for CSE Department AI Agents.
    Executes queries and transactional updates against PostgreSQL.
    PostgreSQL is the strict source of truth for all academic, faculty, classroom,
    timetable, and absence records.
    """
    def __init__(self):
        raw_url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL") or ""
        self.db_url = raw_url.replace("postgres://", "postgresql://") if raw_url else ""
        if self.db_url and "sslmode=" not in self.db_url and ("render.com" in self.db_url or os.getenv("DB_SSL") == "true"):
            sep = "&" if "?" in self.db_url else "?"
            self.db_url += f"{sep}sslmode=require"

        self.host = os.getenv("PGHOST") or os.getenv("DB_HOST", "127.0.0.1")
        self.port = int(os.getenv("PGPORT") or os.getenv("DB_PORT", 5432))
        self.database = os.getenv("PGDATABASE") or os.getenv("DB_NAME", "departmental_erp_db")
        self.user = os.getenv("PGUSER") or os.getenv("DB_USER", "erp_admin")
        self.password = os.getenv("PGPASSWORD") or os.getenv("DB_PASSWORD", "")
        self._parse_db_url()

    def _parse_db_url(self):
        if self.db_url:
            try:
                parsed = urlparse(self.db_url)
                self.host = parsed.hostname or self.host
                self.port = parsed.port or self.port
                self.user = parsed.username or self.user
                self.password = parsed.password or self.password
                self.database = parsed.path.lstrip('/') or self.database
            except Exception as e:
                logger.warning(f"[PostgresTools] Error parsing DATABASE_URL: {e}")

    def _get_connection(self):
        try:
            sslmode = "require" if ("render.com" in (self.host or "") or os.getenv("DB_SSL") == "true") else "prefer"
            if self.db_url:
                conn = psycopg2.connect(self.db_url, connect_timeout=5)
            else:
                conn = psycopg2.connect(
                    host=self.host,
                    port=self.port,
                    user=self.user,
                    password=self.password,
                    dbname=self.database,
                    sslmode=sslmode,
                    connect_timeout=5
                )
            conn.autocommit = False
            return "postgres", conn
        except Exception as e:
            logger.warning(f"[PostgresTools] PostgreSQL connection to {self.host}:{self.port} failed ({e}).")
            return None, None

    def _execute_query(self, query: str, params: tuple = ()) -> List[Dict[str, Any]]:
        db_type, conn = self._get_connection()
        if not conn:
            return []

        try:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                cursor.execute(query, params)
                res = cursor.fetchall()
                res = [dict(r) for r in res]
            conn.close()
            return res
        except Exception as e:
            logger.error(f"[PostgresTools] Query error: {e} | Query: {query}")
            try:
                conn.close()
            except Exception:
                pass
            return []

    def _execute_update(self, query: str, params: tuple = ()) -> Optional[str]:
        db_type, conn = self._get_connection()
        if not conn:
            return None

        try:
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                last_id = None
                if query.strip().upper().startswith("INSERT INTO") and "RETURNING" in query.upper():
                    row = cursor.fetchone()
                    if row:
                        last_id = str(row[0])
            conn.commit()
            conn.close()
            return last_id
        except Exception as e:
            logger.error(f"[PostgresTools] Update error: {e} | Query: {query}")
            try:
                conn.rollback()
                conn.close()
            except Exception:
                pass
            return None

    # ----------------- Academic Source of Truth Tools -----------------
    def get_all_faculty(self, department: str) -> List[Dict[str, Any]]:
        query = """
            SELECT t.id,
                   TRIM(CONCAT(t.first_name, ' ', COALESCE(t.last_name, ''))) as name,
                   t.email, t.designation, t.phone, t.is_tg,
                   t.max_periods_per_day, t.max_periods_per_week
            FROM teachers t
            JOIN departments d ON t.department_id = d.id
            WHERE t.status = 'ACTIVE' AND d.code = %s
            ORDER BY t.first_name ASC;
        """
        return self._execute_query(query, (department,))

    def get_faculty_by_name(self, name_query: str, department: str) -> List[Dict[str, Any]]:
        clean_name = name_query.strip().lower().replace("dr.", "").replace("prof.", "").replace("dr", "").replace("prof", "").strip()
        query = """
            SELECT t.id,
                   TRIM(CONCAT(t.first_name, ' ', COALESCE(t.last_name, ''))) as name,
                   t.email, t.designation, t.phone, t.is_tg
            FROM teachers t
            JOIN departments d ON t.department_id = d.id
            WHERE (LOWER(t.first_name) LIKE %s OR LOWER(COALESCE(t.last_name, '')) LIKE %s)
              AND d.code = %s;
        """
        return self._execute_query(query, (f"%{clean_name}%", f"%{clean_name}%", department))

    def get_all_subjects(self, semester: Optional[int] = None, department: str = "") -> List[Dict[str, Any]]:
        if not department:
            return []
        if semester:
            query = """
                SELECT s.id, s.code, s.name, s.semester, s.credits, s.weekly_hours as hours_per_week,
                       s.is_elective as is_lab,
                       CASE WHEN s.is_elective OR LOWER(s.name) LIKE '%%lab%%' THEN 'Lab' ELSE 'Classroom' END as required_room_type
                FROM subjects s
                JOIN departments d ON s.department_id = d.id
                WHERE s.semester = %s AND d.code = %s
                ORDER BY s.code ASC;
            """
            return self._execute_query(query, (semester, department))
        query = """
            SELECT s.id, s.code, s.name, s.semester, s.credits, s.weekly_hours as hours_per_week,
                   s.is_elective as is_lab,
                   CASE WHEN s.is_elective OR LOWER(s.name) LIKE '%%lab%%' THEN 'Lab' ELSE 'Classroom' END as required_room_type
            FROM subjects s
            JOIN departments d ON s.department_id = d.id
            WHERE d.code = %s
            ORDER BY s.semester ASC, s.code ASC;
        """
        return self._execute_query(query, (department,))

    def upsert_subject(
        self,
        code: str,
        name: str,
        semester: int,
        credits: int = 4,
        weekly_hours: int = 4,
        is_elective: bool = False,
        department: str = ""
    ) -> Dict[str, Any]:
        if not department:
            return {"success": False, "error": "Department scope is required"}
        dept_res = self._execute_query("SELECT id FROM departments WHERE code = %s LIMIT 1;", (department,))
        dept_id = dept_res[0]["id"] if dept_res else None
        if not dept_id:
            return {"success": False, "error": "Department not found"}

        query = """
            INSERT INTO subjects (id, code, name, department_id, semester, credits, weekly_hours, is_elective, created_at, updated_at)
            VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            ON CONFLICT (code) DO UPDATE
            SET name = EXCLUDED.name,
                semester = EXCLUDED.semester,
                credits = EXCLUDED.credits,
                weekly_hours = EXCLUDED.weekly_hours,
                is_elective = EXCLUDED.is_elective,
                updated_at = NOW()
            WHERE subjects.department_id = EXCLUDED.department_id
            RETURNING id;
        """
        sub_id = self._execute_update(query, (code.strip().upper(), name.strip(), dept_id, int(semester), int(credits), int(weekly_hours), bool(is_elective)))
        if not sub_id:
            return {"success": False, "error": "Subject creation failed or the existing subject belongs to another department"}
        return {"success": True, "id": sub_id, "code": code.strip().upper(), "name": name.strip()}

    def get_all_rooms(self, room_type: Optional[str] = None, department: str = "") -> List[Dict[str, Any]]:
        if not department:
            return []
        query = """
            SELECT c.id, c.room_number, c.building as name, c.type as room_type, c.capacity, c.is_active
            FROM classrooms c
            LEFT JOIN departments d ON c.department_id = d.id
            WHERE is_active = true AND (c.department_id IS NULL OR d.code = %s)
            ORDER BY room_number ASC;
        """
        return self._execute_query(query, (department,))

    def get_sections(self, semester: Optional[int] = None) -> List[Dict[str, Any]]:
        query = "SELECT id, name as section_name, capacity, academic_year FROM sections ORDER BY name ASC;"
        return self._execute_query(query)

    # ----------------- Timetable & Versioning Tools -----------------
    def get_timetable(
        self,
        year: str = "3rd Year",
        semester: int = 5,
        section: str = "A",
        day: Optional[str] = None,
        department: Optional[str] = None,
        academic_year: Optional[str] = None,
        version: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        query = """
            SELECT ts.id, ts.day_of_week as day, ts.period_number as period,
                   ts.start_time, ts.end_time, s.name as subject, s.code as subject_code,
                   TRIM(CONCAT(t.first_name, ' ', COALESCE(t.last_name, ''))) as faculty,
                   c.room_number as room, sec.name as section, ts.is_lab
            FROM timetable_slots ts
            JOIN subjects s ON ts.subject_id = s.id
            JOIN teachers t ON ts.teacher_id = t.id
            LEFT JOIN classrooms c ON ts.classroom_id = c.id
            JOIN timetable tt ON ts.timetable_id = tt.id
            JOIN sections sec ON ts.section_id = sec.id
            JOIN departments d ON tt.department_id = d.id
            WHERE s.semester = %s AND tt.semester = %s AND sec.name = %s
        """
        params = [semester, semester, section]
        if department:
            query += " AND d.code = %s"
            params.append(department)
        if academic_year:
            query += " AND tt.academic_year = %s"
            params.append(academic_year)
        if version is not None:
            query += " AND tt.version = %s"
            params.append(version)
        if day:
            query += " AND ts.day_of_week = %s"
            params.append(day)
        query += " ORDER BY ts.day_of_week ASC, ts.period_number ASC;"

        return self._execute_query(query, tuple(params))

    def substitution_is_in_department(
        self,
        timetable_slot_id: str,
        original_teacher_id: str,
        original_teacher_name: str,
        substitute_teacher_id: str,
        substitute_teacher_name: str,
        department: str
    ) -> bool:
        query = """
            SELECT 1
            FROM timetable_slots ts
            JOIN timetable tt ON ts.timetable_id = tt.id
            JOIN departments d ON tt.department_id = d.id
            JOIN teachers original_teacher ON ts.teacher_id = original_teacher.id
            JOIN teachers substitute_teacher ON substitute_teacher.id = %s
            WHERE ts.id = %s
              AND ts.teacher_id = %s
              AND d.code = %s
              AND original_teacher.department_id = d.id
              AND substitute_teacher.department_id = d.id
              AND LOWER(TRIM(CONCAT(original_teacher.first_name, ' ', COALESCE(original_teacher.last_name, '')))) = LOWER(%s)
              AND LOWER(TRIM(CONCAT(substitute_teacher.first_name, ' ', COALESCE(substitute_teacher.last_name, '')))) = LOWER(%s)
            LIMIT 1
        """
        return bool(self._execute_query(
            query,
            (
                substitute_teacher_id,
                timetable_slot_id,
                original_teacher_id,
                department,
                original_teacher_name.strip(),
                substitute_teacher_name.strip()
            )
        ))

    def get_timetable_master(
        self,
        semester: int,
        section: str,
        department: str,
        academic_year: str
    ) -> Optional[Dict[str, Any]]:
        query = """
            SELECT t.id, t.semester, sec.name as section, t.academic_year, t.version, t.status, t.approved_by, t.approved_at
            FROM timetable t
            JOIN sections sec ON t.section_id = sec.id
            JOIN departments d ON t.department_id = d.id
            WHERE t.semester = %s AND sec.name = %s AND d.code = %s AND t.academic_year = %s
            ORDER BY t.version DESC LIMIT 1;
        """
        rows = self._execute_query(query, (semester, section, department, academic_year))
        return rows[0] if rows else None

    def timetable_version_matches(self, timetable_id: str, expected_slots: List[Dict[str, Any]]) -> bool:
        rows = self._execute_query(
            """
                SELECT day_of_week, period_number, start_time, end_time,
                       subject_id, teacher_id, classroom_id, is_lab
                FROM timetable_slots
                WHERE timetable_id = %s;
            """,
            (timetable_id,)
        )

        def signature(slot: Dict[str, Any]) -> tuple:
            return (
                str(slot.get("day") or slot.get("dayOfWeek") or ""),
                int(slot.get("period") or slot.get("periodNumber") or 0),
                str(slot.get("startTime") or slot.get("start_time") or ""),
                str(slot.get("endTime") or slot.get("end_time") or ""),
                str(slot.get("subjectId") or slot.get("subject_id") or ""),
                str(slot.get("teacherId") or slot.get("teacher_id") or ""),
                str(slot.get("classroomId") or slot.get("classroom_id") or ""),
                bool(slot.get("isLab") or slot.get("is_lab"))
            )

        expected = sorted(signature(slot) for slot in expected_slots)
        actual = sorted(
            (
                str(row.get("day_of_week") or ""),
                int(row.get("period_number") or 0),
                str(row.get("start_time") or ""),
                str(row.get("end_time") or ""),
                str(row.get("subject_id") or ""),
                str(row.get("teacher_id") or ""),
                str(row.get("classroom_id") or ""),
                bool(row.get("is_lab"))
            )
            for row in rows
        )
        return bool(expected) and actual == expected

    def save_new_timetable_version(
        self,
        department: str,
        year: str,
        semester: int,
        section: str,
        academic_year: str,
        slots: List[Dict[str, Any]],
        stats: Dict[str, Any],
        created_by: str = "AI Timetable Engine"
    ) -> Optional[str]:
        if not slots:
            return None
        # 1. Lookup department
        dept_rows = self._execute_query("SELECT id FROM departments WHERE code = %s LIMIT 1;", (department,))
        dept_id = dept_rows[0]["id"] if dept_rows else None
        if not dept_id:
            return None

        # 2. Resolve the section only within the authenticated department/semester/year.
        sec_rows = self._execute_query(
            """
                SELECT sec.id
                FROM sections sec
                JOIN semesters sem ON sec.semester_id = sem.id
                WHERE sec.name = %s AND sec.department_id = %s
                  AND sec.academic_year = %s AND sem.semester_number = %s
                  AND sem.academic_year = %s AND sem.department_id = %s
                LIMIT 1;
            """,
            (section.upper(), dept_id, academic_year, semester, academic_year, dept_id)
        )
        sec_id = sec_rows[0]["id"] if sec_rows else None
        if not sec_id:
            return None

        # 3. Determine the next version for this exact timetable scope.
        ver_rows = self._execute_query(
            """
                SELECT version FROM timetable
                WHERE department_id = %s AND section_id = %s
                  AND semester = %s AND academic_year = %s
                ORDER BY version DESC LIMIT 1;
            """,
            (dept_id, sec_id, semester, academic_year)
        )
        next_ver = (ver_rows[0]["version"] + 1) if ver_rows else 1

        db_type, conn = self._get_connection()
        if not conn:
            return None
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                        INSERT INTO timetable (id, department_id, section_id, semester, academic_year, version, status, approved_by, approved_at, metrics, created_at, updated_at)
                        VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, 'ACTIVE', %s, NOW(), %s, NOW(), NOW())
                        RETURNING id;
                    """,
                    (dept_id, sec_id, semester, academic_year, next_ver, created_by, json.dumps(stats))
                )
                row = cursor.fetchone()
                if not row:
                    conn.rollback()
                    return None
                master_id = str(row[0])
                for slot in slots:
                    subject_id = slot.get("subjectId") or slot.get("subject_id")
                    teacher_id = slot.get("teacherId") or slot.get("teacher_id")
                    period = slot.get("period") or slot.get("periodNumber")
                    start_time = slot.get("startTime") or slot.get("start_time")
                    end_time = slot.get("endTime") or slot.get("end_time")
                    day = slot.get("day") or slot.get("dayOfWeek")
                    if not all((subject_id, teacher_id, period, start_time, end_time, day)):
                        raise ValueError("A generated timetable slot is missing a required database field.")
                    insert_slot = """
                        INSERT INTO timetable_slots (id, timetable_id, day_of_week, period_number, start_time, end_time, subject_id, teacher_id, classroom_id, section_id, is_lab, created_at, updated_at)
                        VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW());
                    """
                    cursor.execute(insert_slot, (
                        master_id,
                        day,
                        int(period),
                        start_time,
                        end_time,
                        subject_id,
                        teacher_id,
                        slot.get("classroomId") or slot.get("classroom_id"),
                        sec_id,
                        bool(slot.get("isLab") or slot.get("is_lab"))
                    ))
            conn.commit()
            return master_id
        except Exception as error:
            conn.rollback()
            logger.error(f"[PostgresTools] Timetable transaction failed: {error}")
            return None
        finally:
            conn.close()

    def get_teacher_schedule(
        self,
        faculty_name: str,
        day: Optional[str] = None,
        department: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        clean_name = faculty_name.strip().lower().replace("dr.", "").replace("prof.", "").strip()
        query = """
            SELECT ts.id, ts.day_of_week as day, ts.period_number as period,
                   ts.start_time, ts.end_time, s.name as subject, s.code as subject_code,
                   TRIM(CONCAT(t.first_name, ' ', COALESCE(t.last_name, ''))) as faculty,
                   c.room_number as room, sec.name as section, ts.is_lab
            FROM timetable_slots ts
            JOIN subjects s ON ts.subject_id = s.id
            JOIN teachers t ON ts.teacher_id = t.id
            LEFT JOIN classrooms c ON ts.classroom_id = c.id
            LEFT JOIN sections sec ON ts.section_id = sec.id
            JOIN timetable tt ON ts.timetable_id = tt.id
            JOIN departments d ON tt.department_id = d.id
            WHERE (LOWER(t.first_name) LIKE %s OR LOWER(COALESCE(t.last_name, '')) LIKE %s)
        """
        params = [f"%{clean_name}%", f"%{clean_name}%"]
        if department:
            query += " AND d.code = %s"
            params.append(department)
        if day:
            query += " AND ts.day_of_week = %s"
            params.append(day)
        query += " ORDER BY ts.day_of_week ASC, ts.period_number ASC;"
        return self._execute_query(query, tuple(params))

    # ----------------- Absence & Substitution Tools -----------------
    def get_affected_classes_for_absence(
        self,
        faculty_name: str,
        day_name: str,
        department: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        return self.get_teacher_schedule(faculty_name, day=day_name, department=department)

postgres_tools = PostgresTools()

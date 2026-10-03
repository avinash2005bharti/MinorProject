import os
import json
import time
import sqlite3
from urllib.parse import urlparse
from typing import Dict, Any, List, Optional
from loguru import logger
import psycopg2
import psycopg2.extras

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
    def get_all_faculty(self, department: str = "CSE") -> List[Dict[str, Any]]:
        query = """
            SELECT id, 
                   TRIM(CONCAT(first_name, ' ', COALESCE(last_name, ''))) as name,
                   email, designation, phone, is_tg,
                   max_periods_per_day, max_periods_per_week
            FROM teachers
            WHERE status = 'ACTIVE'
            ORDER BY first_name ASC;
        """
        return self._execute_query(query)

    def get_faculty_by_name(self, name_query: str, department: str = "CSE") -> List[Dict[str, Any]]:
        clean_name = name_query.strip().lower().replace("dr.", "").replace("prof.", "").replace("dr", "").replace("prof", "").strip()
        query = """
            SELECT id, 
                   TRIM(CONCAT(first_name, ' ', COALESCE(last_name, ''))) as name,
                   email, designation, phone, is_tg
            FROM teachers 
            WHERE LOWER(first_name) LIKE %s OR LOWER(COALESCE(last_name, '')) LIKE %s;
        """
        return self._execute_query(query, (f"%{clean_name}%", f"%{clean_name}%"))

    def get_all_subjects(self, semester: Optional[int] = None, department: str = "CSE") -> List[Dict[str, Any]]:
        if semester:
            query = """
                SELECT id, code, name, semester, credits, weekly_hours as hours_per_week,
                       is_elective as is_lab,
                       CASE WHEN is_elective OR LOWER(name) LIKE '%%lab%%' THEN 'Lab' ELSE 'Classroom' END as required_room_type
                FROM subjects
                WHERE semester = %s
                ORDER BY code ASC;
            """
            return self._execute_query(query, (semester,))
        query = """
            SELECT id, code, name, semester, credits, weekly_hours as hours_per_week,
                   is_elective as is_lab,
                   CASE WHEN is_elective OR LOWER(name) LIKE '%%lab%%' THEN 'Lab' ELSE 'Classroom' END as required_room_type
            FROM subjects
            ORDER BY semester ASC, code ASC;
        """
        return self._execute_query(query)

    def upsert_subject(
        self,
        code: str,
        name: str,
        semester: int,
        credits: int = 4,
        weekly_hours: int = 4,
        is_elective: bool = False,
        department: str = "CSE"
    ) -> Dict[str, Any]:
        dept_res = self._execute_query("SELECT id FROM departments WHERE code = %s LIMIT 1;", (department,))
        if not dept_res:
            dept_res = self._execute_query("SELECT id FROM departments LIMIT 1;")
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
            RETURNING id;
        """
        sub_id = self._execute_update(query, (code.strip().upper(), name.strip(), dept_id, int(semester), int(credits), int(weekly_hours), bool(is_elective)))
        return {"success": True, "id": sub_id, "code": code.strip().upper(), "name": name.strip()}

    def get_all_rooms(self, room_type: Optional[str] = None, department: str = "CSE") -> List[Dict[str, Any]]:
        query = """
            SELECT id, room_number, building as name, type as room_type, capacity, is_active
            FROM classrooms
            WHERE is_active = true
            ORDER BY room_number ASC;
        """
        return self._execute_query(query)

    def get_sections(self, semester: Optional[int] = None) -> List[Dict[str, Any]]:
        query = "SELECT id, name as section_name, capacity, academic_year FROM sections ORDER BY name ASC;"
        return self._execute_query(query)

    # ----------------- Timetable & Versioning Tools -----------------
    def get_timetable(
        self,
        year: str = "3rd Year",
        semester: int = 5,
        section: str = "A",
        day: Optional[str] = None
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
            LEFT JOIN sections sec ON ts.section_id = sec.id
            WHERE s.semester = %s
        """
        params = [semester]
        if day:
            query += " AND ts.day_of_week = %s"
            params.append(day)
        query += " ORDER BY ts.day_of_week ASC, ts.period_number ASC;"

        return self._execute_query(query, tuple(params))

    def get_timetable_master(self, semester: int, section: str, academic_year: str = "2026-27") -> Optional[Dict[str, Any]]:
        query = """
            SELECT t.id, t.semester, sec.name as section, t.academic_year, t.version, t.status, t.approved_by, t.approved_at
            FROM timetable t
            LEFT JOIN sections sec ON t.section_id = sec.id
            WHERE t.semester = %s AND t.academic_year = %s
            ORDER BY t.version DESC LIMIT 1;
        """
        rows = self._execute_query(query, (semester, academic_year))
        return rows[0] if rows else None

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
    ) -> str:
        # 1. Lookup department
        dept_rows = self._execute_query("SELECT id FROM departments WHERE code = %s LIMIT 1;", (department,))
        dept_id = dept_rows[0]["id"] if dept_rows else None

        # 2. Lookup section
        sec_rows = self._execute_query("SELECT id FROM sections WHERE name = %s LIMIT 1;", (section.upper(),))
        sec_id = sec_rows[0]["id"] if sec_rows else None

        # 3. Determine next version
        ver_rows = self._execute_query("SELECT version FROM timetable WHERE semester = %s ORDER BY version DESC LIMIT 1;", (semester,))
        next_ver = (ver_rows[0]["version"] + 1) if ver_rows else 1

        # 4. Insert Timetable Master
        insert_master_query = """
            INSERT INTO timetable (id, department_id, section_id, semester, academic_year, version, status, approved_by, approved_at, metrics, created_at, updated_at)
            VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, 'ACTIVE', %s, NOW(), %s, NOW(), NOW())
            RETURNING id;
        """
        master_id = self._execute_update(insert_master_query, (
            dept_id, sec_id, semester, academic_year, next_ver, created_by, json.dumps(stats)
        ))

        # 5. Insert slots
        if master_id and slots:
            for s in slots:
                insert_slot = """
                    INSERT INTO timetable_slots (id, timetable_id, day_of_week, period_number, start_time, end_time, subject_id, teacher_id, classroom_id, section_id, is_lab, created_at, updated_at)
                    VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW());
                """
                self._execute_update(insert_slot, (
                    master_id,
                    s.get("day") or s.get("dayOfWeek") or "Monday",
                    int(s.get("period") or s.get("periodNumber") or 1),
                    s.get("startTime") or s.get("start_time") or "09:30 AM",
                    s.get("endTime") or s.get("end_time") or "10:20 AM",
                    s.get("subjectId") or s.get("subject_id"),
                    s.get("teacherId") or s.get("teacher_id"),
                    s.get("classroomId") or s.get("classroom_id"),
                    sec_id,
                    bool(s.get("isLab") or s.get("is_lab"))
                ))

        return master_id or "new_version"

    def get_teacher_schedule(self, faculty_name: str, day: Optional[str] = None) -> List[Dict[str, Any]]:
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
            WHERE LOWER(t.first_name) LIKE %s OR LOWER(COALESCE(t.last_name, '')) LIKE %s
        """
        params = [f"%{clean_name}%", f"%{clean_name}%"]
        if day:
            query += " AND ts.day_of_week = %s"
            params.append(day)
        query += " ORDER BY ts.day_of_week ASC, ts.period_number ASC;"
        return self._execute_query(query, tuple(params))

    # ----------------- Absence & Substitution Tools -----------------
    def get_affected_classes_for_absence(self, faculty_name: str, day_name: str) -> List[Dict[str, Any]]:
        return self.get_teacher_schedule(faculty_name, day=day_name)

postgres_tools = PostgresTools()

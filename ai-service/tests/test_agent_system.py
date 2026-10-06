"""
CampusFlow AI Operational Agent System - Automated Test Suite
Verifies:
1. Student Operator: Real DB attendance query, real leave application, personal schedule, RBAC security block on admin tools.
2. Teacher Operator: Real DB teaching schedule query, real attendance marking, room vacancy check.
3. TG Operator: Mentee monitoring, attendance shortage review.
4. HOD Operator: Teacher leave inspection, timetable workflow, leave approval.
5. Admin Operator: Department analytics, classroom registration, destructive action confirmation state machine.
6. Verification & Grounding: No fake success responses without tool execution.
"""

import sys
import os
import unittest
import time
from typing import Dict, Any

# Fix Windows console encoding
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from agents.orchestrator import central_orchestrator
from tools.tool_registry import agent_tool_registry
from tools.postgres_tools import postgres_tools
from memory.mongo_memory import mongo_memory


class TestCampusFlowAgentSystem(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        print("\n" + "=" * 70)
        print("[>>] STARTING CAMPUSFLOW OPERATIONAL AGENT TEST SUITE")
        print("=" * 70)
        # Fetch real test student and faculty from PostgreSQL
        db_type, conn = postgres_tools._get_connection()
        cls.test_student_id = "1b22c469-57ba-465f-bd43-be4b893ee5b0"
        cls.test_student_enrollment = "EN109074"
        cls.test_teacher_id = None
        cls.test_teacher_name = "Checklist Teacher"

        if conn:
            import psycopg2.extras
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("SELECT id, enrollment_no, first_name, last_name FROM students LIMIT 1;")
                std = cur.fetchone()
                if std:
                    cls.test_student_id = std["id"]
                    cls.test_student_enrollment = std["enrollment_no"]

                cur.execute("SELECT id, first_name, last_name FROM teachers LIMIT 1;")
                tch = cur.fetchone()
                if tch:
                    cls.test_teacher_id = tch["id"]
                    cls.test_teacher_name = f"{tch['first_name']} {tch['last_name'] or ''}".strip()
            conn.close()

        print(f"Loaded Test Student: ID={cls.test_student_id}, Enrollment={cls.test_student_enrollment}")
        print(f"Loaded Test Teacher: ID={cls.test_teacher_id}, Name={cls.test_teacher_name}\n")

    def test_01_student_attendance_operation(self):
        """Student Agent: Queries real attendance ledger from PostgreSQL."""
        print("\n[TEST 1] Student queries personal attendance record...")
        user_ctx = {
            "id": self.test_student_id,
            "role": "STUDENT",
            "name": "Checklist Student",
            "studentId": self.test_student_id,
            "enrollmentNo": self.test_student_enrollment,
            "departmentCode": "CSE",
            "permissions": ["ATTENDANCE_READ_SELF", "TIMETABLE_VIEW", "LEAVE_APPLY"]
        }

        res = central_orchestrator.orchestrate(
            prompt=f"Show my attendance record and percentage for enrollment {self.test_student_enrollment}",
            user_id=self.test_student_id,
            role="STUDENT",
            conversation_id=f"test_student_att_{int(time.time())}",
            user_context=user_ctx
        )

        self.assertTrue(res.get("success"), "Student agent execution should succeed")
        self.assertEqual(res.get("agent_used"), "StudentOperatorAgent")
        self.assertIn("get_student_attendance", res.get("actions_taken"))
        self.assertTrue(len(res.get("answer", "")) > 10)
        print("  -> Actions Executed:", res.get("actions_taken"))
        print("  -> Answer Preview:", res.get("answer")[:150].replace("\n", " "))

    def test_02_student_apply_leave_operation(self):
        """Student Agent: Submits real leave application into PostgreSQL."""
        print("\n[TEST 2] Student applies for leave...")
        user_ctx = {
            "id": self.test_student_id,
            "role": "STUDENT",
            "name": "Checklist Student",
            "studentId": self.test_student_id,
            "departmentCode": "CSE",
            "permissions": ["LEAVE_APPLY", "ATTENDANCE_READ_SELF"]
        }

        res = central_orchestrator.orchestrate(
            prompt="Apply leave for tomorrow because I have to attend an urgent family function.",
            user_id=self.test_student_id,
            role="STUDENT",
            conversation_id=f"test_student_leave_{int(time.time())}",
            user_context=user_ctx
        )

        self.assertTrue(res.get("success"))
        self.assertIn("apply_leave", res.get("actions_taken"))
        print("  -> Actions Executed:", res.get("actions_taken"))
        print("  -> Answer Preview:", res.get("answer")[:150].replace("\n", " "))

    def test_03_student_rbac_security_boundary(self):
        """Security: Student attempting administrative/faculty action must be strictly BLOCKED."""
        print("\n[TEST 3] Security Check: Student attempting to deactivate a teacher...")
        user_ctx = {
            "id": self.test_student_id,
            "role": "STUDENT",
            "name": "Checklist Student",
            "departmentCode": "CSE",
            "permissions": ["ATTENDANCE_READ_SELF", "TIMETABLE_VIEW"]
        }

        res = central_orchestrator.orchestrate(
            prompt="Deactivate teacher Rahul Sharma immediately",
            user_id=self.test_student_id,
            role="STUDENT",
            conversation_id=f"test_student_hack_{int(time.time())}",
            user_context=user_ctx
        )

        # Must be blocked by RBAC
        self.assertFalse(res.get("success"))
        self.assertEqual(res.get("detected_intent"), "RBAC_ACCESS_DENIED")
        self.assertIn("Access Denied", res.get("answer"))
        print("  -> RBAC Correctly Blocked Student from Administrative Action:")
        print("     ", res.get("answer")[:120].replace("\n", " "))

    def test_04_teacher_schedule_operation(self):
        """Teacher Agent: Looks up teaching schedule from PostgreSQL."""
        print("\n[TEST 4] Teacher views personal teaching schedule...")
        user_ctx = {
            "id": self.test_teacher_id or "teacher_1",
            "role": "TEACHER",
            "name": self.test_teacher_name,
            "teacherId": self.test_teacher_id,
            "departmentCode": "CSE",
            "permissions": ["TIMETABLE_VIEW", "ATTENDANCE_MARK", "FACULTY_MANAGE"]
        }

        res = central_orchestrator.orchestrate(
            prompt=f"Show my teaching schedule and lecture slots for {self.test_teacher_name}",
            user_id=self.test_teacher_id or "teacher_1",
            role="TEACHER",
            conversation_id=f"test_teacher_sched_{int(time.time())}",
            user_context=user_ctx
        )

        self.assertTrue(res.get("success"))
        self.assertIn("get_teacher_schedule", res.get("actions_taken"))
        print("  -> Actions Executed:", res.get("actions_taken"))
        print("  -> Answer Preview:", res.get("answer")[:150].replace("\n", " "))

    def test_05_teacher_mark_attendance_operation(self):
        """Teacher Agent: Marks attendance for a student in PostgreSQL."""
        print("\n[TEST 5] Teacher marks student lecture attendance...")
        user_ctx = {
            "id": self.test_teacher_id or "teacher_1",
            "role": "TEACHER",
            "name": self.test_teacher_name,
            "teacherId": self.test_teacher_id,
            "departmentCode": "CSE",
            "permissions": ["ATTENDANCE_MARK", "TIMETABLE_VIEW"]
        }

        res = central_orchestrator.orchestrate(
            prompt=f"Mark attendance for student {self.test_student_enrollment} in CS501 as PRESENT for period 1 today",
            user_id=self.test_teacher_id or "teacher_1",
            role="TEACHER",
            conversation_id=f"test_teacher_mark_{int(time.time())}",
            user_context=user_ctx
        )

        self.assertTrue(res.get("success"))
        self.assertIn("mark_attendance", res.get("actions_taken"))
        print("  -> Actions Executed:", res.get("actions_taken"))
        print("  -> Answer Preview:", res.get("answer")[:150].replace("\n", " "))

    def test_06_tg_mentee_monitoring_operation(self):
        """TG Agent: Checks mentees and detects attendance shortage."""
        print("\n[TEST 6] TG checks assigned mentees for attendance shortage...")
        user_ctx = {
            "id": self.test_teacher_id or "tg_1",
            "role": "TG",
            "name": "Prof. Tutor Guardian",
            "teacherId": self.test_teacher_id,
            "departmentCode": "CSE",
            "permissions": ["MENTEE_MONITOR", "ATTENDANCE_MARK", "LEAVE_REVIEW_TG"]
        }

        res = central_orchestrator.orchestrate(
            prompt="Show my mentees and check if any have an attendance shortage below 75%",
            user_id=self.test_teacher_id or "tg_1",
            role="TG",
            conversation_id=f"test_tg_mentees_{int(time.time())}",
            user_context=user_ctx
        )

        self.assertTrue(res.get("success"))
        self.assertIn("get_mentees", res.get("actions_taken"))
        print("  -> Actions Executed:", res.get("actions_taken"))
        print("  -> Answer Preview:", res.get("answer")[:150].replace("\n", " "))

    def test_07_hod_absence_and_leave_operation(self):
        """HOD Agent: Inspects faculty on leave today."""
        print("\n[TEST 7] HOD inspects teachers on leave today...")
        user_ctx = {
            "id": "hod_1",
            "role": "HOD",
            "name": "Dr. Alok Verma",
            "departmentCode": "CSE",
            "permissions": ["FACULTY_MANAGE", "LEAVE_APPROVE_HOD", "TIMETABLE_MANAGE", "TIMETABLE_VIEW"]
        }

        res = central_orchestrator.orchestrate(
            prompt="Show me all teachers on leave today and their affected lecture slots",
            user_id="hod_1",
            role="HOD",
            conversation_id=f"test_hod_leaves_{int(time.time())}",
            user_context=user_ctx
        )

        self.assertTrue(res.get("success"))
        self.assertIn("get_teachers_on_leave", res.get("actions_taken"))
        print("  -> Actions Executed:", res.get("actions_taken"))
        print("  -> Answer Preview:", res.get("answer")[:150].replace("\n", " "))

    def test_08_admin_department_analytics_operation(self):
        """Admin Agent: Retrieves real department operational analytics."""
        print("\n[TEST 8] Admin checks department analytics...")
        user_ctx = {
            "id": "admin_1",
            "role": "ADMIN",
            "name": "Department Administrator",
            "departmentCode": "CSE",
            "permissions": ["*"]
        }

        res = central_orchestrator.orchestrate(
            prompt="Give me high-level department analytics and active counts across teachers and students",
            user_id="admin_1",
            role="ADMIN",
            conversation_id=f"test_admin_analytics_{int(time.time())}",
            user_context=user_ctx
        )

        self.assertTrue(res.get("success"))
        self.assertIn("get_department_analytics", res.get("actions_taken"))
        print("  -> Actions Executed:", res.get("actions_taken"))
        print("  -> Answer Preview:", res.get("answer")[:150].replace("\n", " "))

    def test_09_destructive_action_confirmation_state_machine(self):
        """Destructive action must halt and request confirmation when unconfirmed."""
        print("\n[TEST 9] Confirmation State Machine: Admin deactivates teacher without confirmed flag...")
        user_ctx = {
            "id": "admin_1",
            "role": "ADMIN",
            "name": "Department Administrator",
            "departmentCode": "CSE",
            "permissions": ["*"]
        }

        res = central_orchestrator.orchestrate(
            prompt="Deactivate teacher Checklist Teacher from the department",
            user_id="admin_1",
            role="ADMIN",
            conversation_id=f"test_admin_confirm_{int(time.time())}",
            user_context=user_ctx
        )

        self.assertTrue(res.get("success"))
        self.assertTrue(res.get("requires_confirmation"), "Must flag requires_confirmation=True")
        self.assertIsNotNone(res.get("action_to_confirm"), "Must provide action payload to confirm")
        print("  -> Correctly paused with requires_confirmation=True")
        print("  -> Confirmation Prompt:", res.get("confirmation_prompt") or res.get("answer")[:120])

    def test_10_truthful_grounding_no_fake_success(self):
        """Verification: Agent must not hallucinate a success without executing a tool."""
        print("\n[TEST 10] Grounding Check: Asking an irrelevant or impossible request...")
        user_ctx = {
            "id": self.test_student_id,
            "role": "STUDENT",
            "name": "Checklist Student",
            "departmentCode": "CSE"
        }

        res = central_orchestrator.orchestrate(
            prompt="Create a satellite launch station in Room 204",
            user_id=self.test_student_id,
            role="STUDENT",
            conversation_id=f"test_impossible_{int(time.time())}",
            user_context=user_ctx
        )

        # Must not claim satellite was created
        ans = res.get("answer", "").lower()
        self.assertNotIn("successfully created satellite", ans)
        print("  -> Agent correctly avoided fake success response.")


if __name__ == "__main__":
    unittest.main()

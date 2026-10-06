import os
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from tools.postgres_tools import PostgresTools


class FakeCursor:
    def __init__(self):
        self.executed = []

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def execute(self, query, params):
        self.executed.append((query, params))

    @staticmethod
    def fetchone():
        return ("timetable-1",)


class FakeConnection:
    def __init__(self):
        self.cursor_instance = FakeCursor()
        self.committed = False
        self.rolled_back = False
        self.closed = False

    def cursor(self):
        return self.cursor_instance

    def commit(self):
        self.committed = True

    def rollback(self):
        self.rolled_back = True

    def close(self):
        self.closed = True


class PostgresToolScopeTests(unittest.TestCase):
    def setUp(self):
        self.db = object.__new__(PostgresTools)

    def test_timetable_query_filters_department_section_and_version(self):
        with patch.object(self.db, "_execute_query", return_value=[]) as execute:
            self.db.get_timetable(
                semester=5,
                section="B",
                department="EE",
                academic_year="2026-27",
                version=3,
            )

        query, params = execute.call_args.args
        self.assertIn("tt.semester = %s AND sec.name = %s", query)
        self.assertIn("d.code = %s", query)
        self.assertIn("tt.academic_year = %s", query)
        self.assertIn("tt.version = %s", query)
        self.assertEqual(params, (5, 5, "B", "EE", "2026-27", 3))

    def test_substitution_check_binds_slot_teachers_names_and_department(self):
        with patch.object(self.db, "_execute_query", return_value=[]) as execute:
            result = self.db.substitution_is_in_department(
                "slot-1",
                "teacher-1",
                "Original Teacher",
                "teacher-2",
                "Substitute Teacher",
                "EE",
            )

        self.assertFalse(result)
        query, params = execute.call_args.args
        self.assertIn("d.code = %s", query)
        self.assertIn("original_teacher.department_id = d.id", query)
        self.assertIn("substitute_teacher.department_id = d.id", query)
        self.assertEqual(
            params,
            ("teacher-2", "slot-1", "teacher-1", "EE", "Original Teacher", "Substitute Teacher"),
        )

    def test_timetable_verifier_requires_exact_saved_slot_match(self):
        expected = [{
            "day": "Monday",
            "period": 1,
            "startTime": "09:00 AM",
            "endTime": "09:50 AM",
            "subjectId": "subject-1",
            "teacherId": "teacher-1",
            "classroomId": "room-1",
            "isLab": False,
        }]
        rows = [{
            "day_of_week": "Monday",
            "period_number": 1,
            "start_time": "09:00 AM",
            "end_time": "09:50 AM",
            "subject_id": "subject-1",
            "teacher_id": "teacher-1",
            "classroom_id": "room-1",
            "is_lab": False,
        }]
        with patch.object(self.db, "_execute_query", return_value=rows):
            self.assertTrue(self.db.timetable_version_matches("timetable-1", expected))
        rows[0]["teacher_id"] = "different-teacher"
        with patch.object(self.db, "_execute_query", return_value=rows):
            self.assertFalse(self.db.timetable_version_matches("timetable-1", expected))

    def test_timetable_write_is_atomic_and_does_not_fake_missing_scope(self):
        with patch.object(self.db, "_execute_query", return_value=[]), patch.object(self.db, "_get_connection") as connect:
            self.assertIsNone(self.db.save_new_timetable_version(
                department="EE",
                year="3rd Year",
                semester=5,
                section="A",
                academic_year="2026-27",
                slots=[{"day": "Monday"}],
                stats={},
            ))
        connect.assert_not_called()

        reads = [
            [{"id": "department-1"}],
            [{"id": "section-1"}],
            [{"version": 2}],
        ]
        connection = FakeConnection()
        with patch.object(self.db, "_execute_query", side_effect=reads), patch.object(
            self.db, "_get_connection", return_value=("postgres", connection)
        ):
            result = self.db.save_new_timetable_version(
                department="EE",
                year="3rd Year",
                semester=5,
                section="A",
                academic_year="2026-27",
                slots=[{
                    "day": "Monday",
                    "period": 1,
                    "startTime": "09:00 AM",
                    "endTime": "09:50 AM",
                    "subjectId": "subject-1",
                    "teacherId": "teacher-1",
                    "classroomId": "room-1",
                    "isLab": False,
                }],
                stats={},
            )

        self.assertEqual(result, "timetable-1")
        self.assertTrue(connection.committed)
        self.assertFalse(connection.rolled_back)
        self.assertTrue(connection.closed)
        self.assertEqual(len(connection.cursor_instance.executed), 2)


if __name__ == "__main__":
    unittest.main()

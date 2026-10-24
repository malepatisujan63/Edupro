# -*- coding: utf-8 -*-
"""
Unit test suite for CBT High-Stakes Examination Security & Integrity Engine.
"""

import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import unittest
import time
import sqlite3
from cbt_engine import (
    CBTExamSessionManager,
    CBTAnswerScrubber,
    CBTMarkingEvaluator,
    CBTAuditLogger
)


class TestCBTEngine(unittest.TestCase):

    def setUp(self):
        self.raw_quiz = {
            "id": "quiz_jee_physics_01",
            "title": "JEE Main Physics Electromagnetism",
            "duration_minutes": 60,
            "questions": [
                {
                    "id": "q1",
                    "section": "Physics",
                    "question": "What is the magnetic flux through a closed surface?",
                    "options": ["Zero", "Infinite", "4π", "μ₀/4π"],
                    "correct_index": 0,
                    "correct_answer": "Zero",
                    "explanation": "Gauss's law for magnetism states that magnetic monopoles do not exist, so net flux is zero."
                },
                {
                    "id": "q2",
                    "section": "Physics",
                    "question": "Unit of magnetic permeability is:",
                    "options": ["H/m", "T/m", "Wb/m", "N/A"],
                    "correct_index": 0,
                    "correct_answer": "H/m",
                    "explanation": "Henry per meter (H/m) is the SI unit of permeability."
                }
            ]
        }

    def test_zero_leakage_answer_scrubbing(self):
        scrubbed = CBTAnswerScrubber.scrub_quiz_for_candidate(self.raw_quiz)
        for q in scrubbed["questions"]:
            self.assertNotIn("correct_index", q)
            self.assertNotIn("correct_answer", q)
            self.assertNotIn("explanation", q)
            self.assertIn("options", q)
            self.assertIn("question", q)

        # Classroom quiz scrubbing test
        scrubbed_student = CBTAnswerScrubber.scrub_classroom_quiz(self.raw_quiz, is_faculty=False, has_completed=False)
        self.assertNotIn("correct_index", scrubbed_student["questions"][0])

        scrubbed_faculty = CBTAnswerScrubber.scrub_classroom_quiz(self.raw_quiz, is_faculty=True, has_completed=False)
        self.assertIn("correct_index", scrubbed_faculty["questions"][0])

        scrubbed_done = CBTAnswerScrubber.scrub_classroom_quiz(self.raw_quiz, is_faculty=False, has_completed=True)
        self.assertIn("correct_index", scrubbed_done["questions"][0])

    def test_authoritative_session_timing_and_bot_detection(self):
        manager = CBTExamSessionManager(grace_period_seconds=10.0)
        session_info = manager.start_candidate_session("quiz_test", "user_123", duration_minutes=30)
        self.assertIn("session_token", session_info)
        self.assertEqual(session_info["remaining_seconds"], 1800)

        # 1. Suspicious bot speed test (answering 10 questions in 3 seconds = 0.3s/question)
        audit = manager.validate_and_finalize_session(
            quiz_id="quiz_test",
            user_id="user_123",
            reported_time_seconds=3,
            answered_count=10
        )
        self.assertTrue(audit["is_suspicious_speed"])
        self.assertEqual(audit["integrity_status"], "FLAGGED_SPEED")

        # 2. Legitimate human attempt (15 minutes elapsed)
        t0 = time.time()
        manager.start_candidate_session("quiz_test_2", "user_456", duration_minutes=60)
        audit_human = manager.validate_and_finalize_session(
            quiz_id="quiz_test_2",
            user_id="user_456",
            reported_time_seconds=900,
            answered_count=10,
            current_time=t0 + 900.0
        )
        self.assertFalse(audit_human["is_suspicious_speed"])
        self.assertEqual(audit_human["integrity_status"], "VERIFIED")

    def test_strict_marking_and_sectional_breakdown(self):
        questions = self.raw_quiz["questions"]
        # q1: correct (0), q2: incorrect (1)
        answers = {"q1": 0, "q2": 1}
        result = CBTMarkingEvaluator.evaluate(questions, answers, positive_marks=4.0, negative_marks=1.0)

        self.assertEqual(result["correct_count"], 1)
        self.assertEqual(result["incorrect_count"], 1)
        self.assertEqual(result["unattempted_count"], 0)
        # 1 correct (+4) and 1 incorrect (-1) = 3.0
        self.assertEqual(result["score"], 3.0)
        self.assertEqual(result["max_marks"], 8.0)
        self.assertEqual(result["accuracy"], 50.0)
        self.assertEqual(result["negative_marks_lost"], 1.0)
        self.assertIn("Physics", result["subject_breakdown"])
        self.assertEqual(result["subject_breakdown"]["Physics"]["score"], 3.0)

    def test_audit_logger_sqlite(self):
        conn = sqlite3.connect(":memory:")
        CBTAuditLogger.record_attempt(
            conn,
            attempt_id="att_1",
            quiz_id="quiz_1",
            user_id="u_1",
            client_ip="127.0.0.1",
            reported_time=120,
            authoritative_time=120,
            speed_per_q=12.0,
            is_suspicious_speed=False,
            is_timed_out=False,
            integrity_status="VERIFIED",
            audit_flags=[]
        )
        row = conn.execute("SELECT * FROM cbt_integrity_logs WHERE attempt_id = 'att_1'").fetchone()
        self.assertIsNotNone(row)
        conn.close()

    def test_proctor_notepad_and_command_violation(self):
        conn = sqlite3.connect(":memory:")
        notepad_entries = [
            "[14:30:01] Key: 'a' | Code: KeyA | Modifiers:",
            "[14:30:05] Key: 'c' | Code: KeyC | Modifiers: Ctrl",
            "[14:30:05] 🚨 VIOLATION: Command Violation [Ctrl+c]: Keyboard commands prohibited in CBT exam. - Auto-submitting exam."
        ]
        proctor_notepad = "\n".join(notepad_entries)
        violation_reason = "Command Violation [Ctrl+c]: Keyboard commands prohibited in CBT exam."

        CBTAuditLogger.record_attempt(
            conn,
            attempt_id="att_viol_1",
            quiz_id="quiz_jee_physics_01",
            user_id="violator_user_1",
            client_ip="192.168.1.100",
            reported_time=15,
            authoritative_time=15,
            speed_per_q=7.5,
            is_suspicious_speed=False,
            is_timed_out=False,
            integrity_status="DISQUALIFIED_COMMAND_VIOLATION",
            audit_flags=[f"COMMAND_VIOLATION: {violation_reason}"],
            proctor_notepad=proctor_notepad
        )

        row = conn.execute("SELECT * FROM cbt_integrity_logs WHERE attempt_id = 'att_viol_1'").fetchone()
        self.assertIsNotNone(row)
        col_names = [d[0] for d in conn.execute("SELECT * FROM cbt_integrity_logs LIMIT 1").description]
        notepad_idx = col_names.index("proctor_notepad")
        status_idx = col_names.index("integrity_status")
        self.assertEqual(row[status_idx], "DISQUALIFIED_COMMAND_VIOLATION")
        self.assertIn("🚨 VIOLATION", row[notepad_idx])
        self.assertIn("Key: 'c' | Code: KeyC | Modifiers: Ctrl", row[notepad_idx])
        conn.close()

    def test_escape_key_violation_audit(self):
        conn = sqlite3.connect(":memory:")
        notepad_entries = [
            "[15:20:00] CBT Exam session initialized. Mouse-only navigation strictly enforced.",
            "[15:20:10] Blocked Key: 'Escape' | Code: Escape | Modifiers:",
            "[15:20:10] 🚨 VIOLATION: Escape Key Violation: Candidate pressed Escape during fullscreen exam. Exam auto-submitted."
        ]
        proctor_notepad = "\n".join(notepad_entries)
        violation_reason = "Escape Key Violation: Candidate pressed Escape during fullscreen exam. Exam auto-submitted."

        CBTAuditLogger.record_attempt(
            conn,
            attempt_id="att_esc_viol_1",
            quiz_id="quiz_jee_physics_01",
            user_id="user_esc_1",
            client_ip="10.0.0.5",
            reported_time=10,
            authoritative_time=10,
            speed_per_q=5.0,
            is_suspicious_speed=False,
            is_timed_out=False,
            integrity_status="DISQUALIFIED_ESCAPE_VIOLATION",
            audit_flags=[f"ESCAPE_VIOLATION: {violation_reason}"],
            proctor_notepad=proctor_notepad
        )

        row = conn.execute("SELECT * FROM cbt_integrity_logs WHERE attempt_id = 'att_esc_viol_1'").fetchone()
        self.assertIsNotNone(row)
        col_names = [d[0] for d in conn.execute("SELECT * FROM cbt_integrity_logs LIMIT 1").description]
        notepad_idx = col_names.index("proctor_notepad")
        status_idx = col_names.index("integrity_status")
        self.assertEqual(row[status_idx], "DISQUALIFIED_ESCAPE_VIOLATION")
        self.assertIn("Escape Key Violation", row[notepad_idx])
        conn.close()


if __name__ == "__main__":
    unittest.main()

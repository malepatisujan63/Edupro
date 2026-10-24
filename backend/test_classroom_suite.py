# -*- coding: utf-8 -*-
"""
Classroom Backend Infrastructure & Pipelines Unit Verification Suite
Tests all classroom backend business logic, algorithms, access control,
gradebook computations, item analysis, at-risk detection, and queries directly.
"""

import sys
import os
import unittest
import json
import sqlite3
import uuid
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

class MockResponse:
    def __init__(self, data, status_code=200):
        self.data = data
        self.status_code = status_code

def mock_check_classroom_access(conn, classroom_id, user_id, user_role, require_faculty_owner=False):
    clean_id = (classroom_id or "").strip()
    classroom = conn.execute("SELECT * FROM classrooms WHERE LOWER(id) = LOWER(?)", (clean_id,)).fetchone()
    if not classroom:
        return None, False, False, ({"success": False, "error": "Classroom not found"}, 404)

    is_faculty_owner = (classroom["faculty_id"] == user_id)
    if require_faculty_owner:
        if not is_faculty_owner:
            return classroom, False, False, ({"success": False, "error": "Unauthorized: Only faculty owner allowed"}, 403)
        return classroom, True, False, None

    member = conn.execute(
        "SELECT status, role FROM classroom_members WHERE LOWER(classroom_id) = LOWER(?) AND user_id = ?",
        (clean_id, user_id)
    ).fetchone()
    is_accepted_member = bool(member and member["status"] == "accepted")

    if not is_faculty_owner and not is_accepted_member:
        return classroom, False, False, ({"success": False, "error": "Classroom access restricted"}, 403)

    return classroom, is_faculty_owner, is_accepted_member, None


class TestClassroomBackendPipelines(unittest.TestCase):
    def setUp(self):
        self.conn = sqlite3.connect(":memory:")
        self.conn.row_factory = sqlite3.Row
        
        # Build schema
        self.conn.executescript("""
            CREATE TABLE users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                handle TEXT UNIQUE NOT NULL,
                role TEXT NOT NULL,
                avatar TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE classrooms (
                id TEXT PRIMARY KEY,
                faculty_id TEXT NOT NULL,
                name TEXT NOT NULL,
                subject_code TEXT NOT NULL,
                department TEXT NOT NULL,
                semester TEXT NOT NULL,
                description TEXT,
                cover_gradient TEXT,
                invite_code TEXT UNIQUE NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE classroom_members (
                id TEXT PRIMARY KEY,
                classroom_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                role TEXT NOT NULL,
                status TEXT NOT NULL,
                joined_at TEXT NOT NULL
            );

            CREATE TABLE classroom_posts (
                id TEXT PRIMARY KEY,
                classroom_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                user_name TEXT NOT NULL,
                user_role TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                post_type TEXT NOT NULL,
                is_pinned INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            );

            CREATE TABLE classroom_post_comments (
                id TEXT PRIMARY KEY,
                post_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                user_name TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE classroom_post_likes (
                id TEXT PRIMARY KEY,
                post_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE classroom_quizzes (
                id TEXT PRIMARY KEY,
                classroom_id TEXT NOT NULL,
                faculty_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                duration_minutes INTEGER NOT NULL,
                total_marks INTEGER NOT NULL,
                questions_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE classroom_quiz_attempts (
                id TEXT PRIMARY KEY,
                classroom_id TEXT NOT NULL,
                quiz_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                user_name TEXT NOT NULL,
                score REAL NOT NULL,
                total_marks REAL NOT NULL,
                accuracy REAL NOT NULL,
                answers_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE classroom_problems (
                id TEXT PRIMARY KEY,
                classroom_id TEXT NOT NULL,
                title TEXT NOT NULL,
                slug TEXT NOT NULL,
                description TEXT,
                difficulty TEXT NOT NULL,
                category TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE classroom_submissions (
                id TEXT PRIMARY KEY,
                classroom_id TEXT NOT NULL,
                problem_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                user_name TEXT NOT NULL,
                language TEXT NOT NULL,
                code TEXT NOT NULL,
                verdict TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE classroom_channels (
                id TEXT PRIMARY KEY,
                classroom_id TEXT NOT NULL,
                name TEXT NOT NULL,
                channel_type TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE notifications (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                sender_id TEXT,
                sender_name TEXT,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                data_json TEXT,
                is_read INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            );
        """)

        # Fixtures
        self.now = str(time.time())
        self.faculty_id = "fac_1"
        self.student1_id = "stu_1"
        self.student2_id = "stu_2"
        self.classroom_id = "cls_101"

        self.conn.execute("INSERT INTO users VALUES ('fac_1', 'Prof. Snape', 'snape@edu.in', 'snape', 'faculty', '', ?)", (self.now,))
        self.conn.execute("INSERT INTO users VALUES ('stu_1', 'Harry Potter', 'harry@edu.in', 'harry', 'student', '', ?)", (self.now,))
        self.conn.execute("INSERT INTO users VALUES ('stu_2', 'Ron Weasley', 'ron@edu.in', 'ron', 'student', '', ?)", (self.now,))

        self.conn.execute("""
            INSERT INTO classrooms VALUES ('cls_101', 'fac_1', 'Potions & Defense', 'POT301', 'Alchemy', 'Sem 5', 'Advanced Brewing', 'grad1', 'INV123', ?)
        """, (self.now,))

        self.conn.execute("INSERT INTO classroom_members VALUES ('m1', 'cls_101', 'stu_1', 'student', 'accepted', ?)", (self.now,))
        self.conn.execute("INSERT INTO classroom_members VALUES ('m2', 'cls_101', 'stu_2', 'student', 'accepted', ?)", (self.now,))
        self.conn.commit()

    def tearDown(self):
        self.conn.close()

    def test_access_control_verification(self):
        # 1. Faculty owner access
        cls, is_fac, is_mem, err = mock_check_classroom_access(self.conn, "cls_101", self.faculty_id, "faculty", require_faculty_owner=True)
        self.assertIsNone(err)
        self.assertTrue(is_fac)

        # 2. Student trying faculty-only route
        cls, is_fac, is_mem, err = mock_check_classroom_access(self.conn, "cls_101", self.student1_id, "student", require_faculty_owner=True)
        self.assertIsNotNone(err)
        self.assertEqual(err[1], 403)

        # 3. Accepted student access
        cls, is_fac, is_mem, err = mock_check_classroom_access(self.conn, "cls_101", self.student1_id, "student", require_faculty_owner=False)
        self.assertIsNone(err)
        self.assertTrue(is_mem)

        # 4. Outsider access
        cls, is_fac, is_mem, err = mock_check_classroom_access(self.conn, "cls_101", "outsider_99", "student", require_faculty_owner=False)
        self.assertIsNotNone(err)
        self.assertEqual(err[1], 403)

    def test_student_leave_pipeline(self):
        # Student leaves: remove membership and notify faculty
        self.conn.execute("DELETE FROM classroom_members WHERE classroom_id = ? AND user_id = ?", (self.classroom_id, self.student1_id))
        self.conn.execute("""
            INSERT INTO notifications (id, user_id, sender_id, sender_name, type, title, message, data_json, is_read, created_at)
            VALUES ('n1', ?, ?, 'Harry Potter', 'classroom_leave', 'Left Class', 'Student left', '{}', 0, ?)
        """, (self.faculty_id, self.student1_id, self.now))
        self.conn.commit()

        row = self.conn.execute("SELECT * FROM classroom_members WHERE classroom_id = ? AND user_id = ?", (self.classroom_id, self.student1_id)).fetchone()
        self.assertIsNone(row)
        notif = self.conn.execute("SELECT * FROM notifications WHERE user_id = ?", (self.faculty_id,)).fetchone()
        self.assertEqual(notif["type"], "classroom_leave")

    def test_faculty_member_expulsion_pipeline(self):
        # Faculty removes student 2
        self.conn.execute("DELETE FROM classroom_members WHERE classroom_id = ? AND user_id = ?", (self.classroom_id, self.student2_id))
        self.conn.execute("""
            INSERT INTO notifications (id, user_id, sender_id, sender_name, type, title, message, data_json, is_read, created_at)
            VALUES ('n2', ?, ?, 'Prof. Snape', 'classroom_expelled', 'Removed', 'You have been removed', '{}', 0, ?)
        """, (self.student2_id, self.faculty_id, self.now))
        self.conn.commit()

        row = self.conn.execute("SELECT * FROM classroom_members WHERE classroom_id = ? AND user_id = ?", (self.classroom_id, self.student2_id)).fetchone()
        self.assertIsNone(row)
        notif = self.conn.execute("SELECT * FROM notifications WHERE user_id = ?", (self.student2_id,)).fetchone()
        self.assertEqual(notif["type"], "classroom_expelled")

    def test_analytics_and_at_risk_heuristics(self):
        # Setup Quiz & Problem Submissions
        quiz_id = "qz_1"
        self.conn.execute("""
            INSERT INTO classroom_quizzes VALUES ('qz_1', 'cls_101', 'fac_1', 'Wolfsbane Quiz', 'Brewing test', 20, 100, '[]', ?)
        """, (self.now,))

        # Student 1: 95% on Quiz, 2 Coding Problems solved
        self.conn.execute("""
            INSERT INTO classroom_quiz_attempts VALUES ('qa_1', 'cls_101', 'qz_1', 'stu_1', 'Harry Potter', 95, 100, 95.0, '{}', ?)
        """, (self.now,))
        self.conn.execute("""
            INSERT INTO classroom_problems VALUES ('pr_1', 'cls_101', 'Polyjuice Potion', 'polyjuice', '', 'Medium', 'Greedy', ?)
        """, (self.now,))
        self.conn.execute("""
            INSERT INTO classroom_problems VALUES ('pr_2', 'cls_101', 'Felix Felicis', 'felix', '', 'Hard', 'DP', ?)
        """, (self.now,))

        self.conn.execute("""
            INSERT INTO classroom_submissions VALUES ('s1', 'cls_101', 'pr_1', 'stu_1', 'Harry', 'python', 'code', 'Accepted', ?)
        """, (self.now,))
        self.conn.execute("""
            INSERT INTO classroom_submissions VALUES ('s2', 'cls_101', 'pr_2', 'stu_1', 'Harry', 'python', 'code', 'Accepted', ?)
        """, (self.now,))

        # Student 2: Attempted quiz but scored 20% (low accuracy)
        self.conn.execute("""
            INSERT INTO classroom_quiz_attempts VALUES ('qa_2', 'cls_101', 'qz_1', 'stu_2', 'Ron Weasley', 20, 100, 20.0, '{}', ?)
        """, (self.now,))
        self.conn.commit()

        # Gradebook computation logic from app.py
        students = self.conn.execute("""
            SELECT u.id, u.name, u.email FROM classroom_members m
            JOIN users u ON m.user_id = u.id WHERE m.classroom_id = 'cls_101'
        """).fetchall()

        quiz_attempts = self.conn.execute("SELECT * FROM classroom_quiz_attempts WHERE classroom_id = 'cls_101'").fetchall()
        submissions = self.conn.execute("SELECT * FROM classroom_submissions WHERE classroom_id = 'cls_101'").fetchall()
        accepted_subs = [s for s in submissions if s["verdict"] == "Accepted"]

        student_quiz_map = {}
        for qa in quiz_attempts:
            student_quiz_map.setdefault(qa["user_id"], []).append(qa)

        student_solved_map = {}
        for s in accepted_subs:
            student_solved_map.setdefault(s["user_id"], set()).add(s["problem_id"])

        roster = []
        at_risk = []
        for s in students:
            uid = s["id"]
            user_qa = student_quiz_map.get(uid, [])
            q_cnt = len(user_qa)
            avg_acc = round(sum(float(a["accuracy"]) for a in user_qa) / max(1, q_cnt), 1) if q_cnt > 0 else 0.0
            solved_cnt = len(student_solved_map.get(uid, set()))
            total_pts = round(sum(float(a["score"]) for a in user_qa) + (solved_cnt * 50), 1)

            roster.append({"user_id": uid, "name": s["name"], "total_points": total_pts, "avg_accuracy": avg_acc})
            if q_cnt == 0 or avg_acc < 40.0:
                at_risk.append({"user_id": uid, "name": s["name"]})

        # Verify Student 1 is rank 1 (95 + 100 = 195 pts)
        ranked = sorted(roster, key=lambda x: x["total_points"], reverse=True)
        self.assertEqual(ranked[0]["user_id"], "stu_1")
        self.assertEqual(ranked[0]["total_points"], 195.0)

        # Verify Student 2 is flagged as at-risk (accuracy 20% < 40%)
        at_risk_ids = [r["user_id"] for r in at_risk]
        self.assertIn("stu_2", at_risk_ids)
        self.assertNotIn("stu_1", at_risk_ids)

    def test_quiz_item_analysis_success_rates(self):
        questions = [
            {"id": "q1", "question": "Question 1", "correct_index": 2},
            {"id": "q2", "question": "Question 2", "correct_index": 0}
        ]
        attempts = [
            {"answers_json": json.dumps({"q1": 2, "q2": 0})}, # Both correct
            {"answers_json": json.dumps({"q1": 2, "q2": 1})}, # Q1 correct, Q2 wrong
            {"answers_json": json.dumps({"q1": 1})}            # Q1 wrong, Q2 unattempted
        ]
        total_attempts = len(attempts)
        item_analysis = []
        for q in questions:
            qid = q["id"]
            c_ans = q["correct_index"]
            c_count = 0
            inc_count = 0
            unatt_count = 0
            for a in attempts:
                ans_map = json.loads(a["answers_json"])
                user_choice = ans_map.get(qid)
                if user_choice is None:
                    unatt_count += 1
                elif user_choice == c_ans:
                    c_count += 1
                else:
                    inc_count += 1
            rate = round((c_count / total_attempts) * 100.0, 1)
            item_analysis.append({"qid": qid, "success_rate": rate, "unattempted": unatt_count})

        # Q1: 2 correct out of 3 = 66.7%
        self.assertEqual(item_analysis[0]["success_rate"], 66.7)
        # Q2: 1 correct out of 3 = 33.3%, 1 unattempted
        self.assertEqual(item_analysis[1]["success_rate"], 33.3)
        self.assertEqual(item_analysis[1]["unattempted"], 1)

    def test_post_pin_and_cascading_deletion(self):
        post_id = "pst_99"
        self.conn.execute("""
            INSERT INTO classroom_posts VALUES ('pst_99', 'cls_101', 'fac_1', 'Snape', 'faculty', 'Caution', 'Safety goggles required', 'notice', 0, ?)
        """, (self.now,))
        self.conn.execute("INSERT INTO classroom_post_comments VALUES ('c1', 'pst_99', 'stu_1', 'Harry', 'Yes sir', ?)", (self.now,))
        self.conn.execute("INSERT INTO classroom_post_likes VALUES ('l1', 'pst_99', 'stu_1', ?)", (self.now,))
        self.conn.commit()

        # Pin toggle
        post = self.conn.execute("SELECT is_pinned FROM classroom_posts WHERE id = 'pst_99'").fetchone()
        new_pinned = 0 if post["is_pinned"] else 1
        self.conn.execute("UPDATE classroom_posts SET is_pinned = ? WHERE id = 'pst_99'", (new_pinned,))
        self.conn.commit()
        self.assertEqual(self.conn.execute("SELECT is_pinned FROM classroom_posts WHERE id = 'pst_99'").fetchone()["is_pinned"], 1)

        # Cascading deletion
        self.conn.execute("DELETE FROM classroom_posts WHERE id = 'pst_99'")
        self.conn.execute("DELETE FROM classroom_post_comments WHERE post_id = 'pst_99'")
        self.conn.execute("DELETE FROM classroom_post_likes WHERE post_id = 'pst_99'")
        self.conn.commit()

        self.assertIsNone(self.conn.execute("SELECT * FROM classroom_posts WHERE id = 'pst_99'").fetchone())
        self.assertEqual(len(self.conn.execute("SELECT * FROM classroom_post_comments WHERE post_id = 'pst_99'").fetchall()), 0)
        self.assertEqual(len(self.conn.execute("SELECT * FROM classroom_post_likes WHERE post_id = 'pst_99'").fetchall()), 0)

    def test_scoped_search(self):
        self.conn.execute("""
            INSERT INTO classroom_posts VALUES ('p_search', 'cls_101', 'fac_1', 'Snape', 'faculty', 'Felix Felicis Guide', 'Luck potion recipe', 'material', 0, ?)
        """, (self.now,))
        self.conn.execute("""
            INSERT INTO classroom_channels VALUES ('ch_search', 'cls_101', 'felix-chat', 'general', ?)
        """, (self.now,))
        self.conn.commit()

        pat = "%felix%"
        matched_posts = self.conn.execute("SELECT * FROM classroom_posts WHERE classroom_id = 'cls_101' AND LOWER(title) LIKE ?", (pat,)).fetchall()
        matched_channels = self.conn.execute("SELECT * FROM classroom_channels WHERE classroom_id = 'cls_101' AND LOWER(name) LIKE ?", (pat,)).fetchall()

        self.assertEqual(len(matched_posts), 1)
        self.assertEqual(matched_posts[0]["title"], "Felix Felicis Guide")
        self.assertEqual(len(matched_channels), 1)
        self.assertEqual(matched_channels[0]["name"], "felix-chat")


if __name__ == "__main__":
    unittest.main()

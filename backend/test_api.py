# -*- coding: utf-8 -*-
"""
Koinexa API Automated Test Suite
Verifies all core endpoints and business logic:
1. Health and database connectivity
2. Posts creation (YouTube course, tweet, hackathon) & Studymate toggling
3. JEE Main CBT submission, auto-evaluation (+4, -1 rules), and 1-5 star ratings
4. LeetCode Code Lab runner & 20+ test cases evaluation
5. WhatsApp communities and live messaging
6. Global multi-domain search
"""

import json
import unittest
import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app import app
from backend.database import get_db_connection

class TestKoinexaPlatform(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_01_health_check(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "ok")

    def test_02_posts_and_studymate(self):
        # 1. Fetch feed
        res = self.client.get("/api/posts")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertGreaterEqual(len(data["posts"]), 1)

        # 2. Publish new YouTube course post
        new_post = {
            "post_type": "youtube_course",
            "title": "Striver A2Z DSA Sheet",
            "content": "A comprehensive 450 question roadmap covering everything from basic recursion to segment trees.",
            "why_recommend": "Clear step-by-step intuition videos with code solutions in Java and C++.",
            "youtube_url": "https://www.youtube.com/watch?v=EAR7De6G3mM",
            "course_url": "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2",
            "tags": "DSA,Striver,SDE,Placements"
        }
        create_res = self.client.post("/api/posts", json=new_post)
        self.assertEqual(create_res.status_code, 200)
        self.assertTrue(create_res.get_json()["success"])

        # 3. Toggle Studymate
        toggle_res = self.client.post("/api/studymates/toggle", json={"target_user_id": "u_rohit"})
        self.assertEqual(toggle_res.status_code, 200)
        self.assertTrue(toggle_res.get_json()["success"])

    def test_03_jee_main_cbt_and_rating(self):
        # 1. Get quizzes
        res = self.client.get("/api/quizzes")
        self.assertEqual(res.status_code, 200)
        quizzes = res.get_json()["quizzes"]
        self.assertGreaterEqual(len(quizzes), 1)

        quiz_id = quizzes[0]["id"]

        # 2. Get quiz details
        detail_res = self.client.get(f"/api/quizzes/{quiz_id}")
        self.assertEqual(detail_res.status_code, 200)
        quiz_data = detail_res.get_json()["quiz"]
        self.assertIn("sections", quiz_data)
        self.assertIn("questions", quiz_data)

        # 3. Submit exam with answers (Q1: correct, Q2: wrong, Q3-Q10: unattempted)
        submit_payload = {
            "answers": {"q1": 0, "q2": 1},
            "time_taken_seconds": 1800
        }
        submit_res = self.client.post(f"/api/quizzes/{quiz_id}/submit", json=submit_payload)
        self.assertEqual(submit_res.status_code, 200)
        eval_data = submit_res.get_json()
        self.assertTrue(eval_data["success"])
        # Score should be 4 (for q1) - 1 (for q2) = 3
        self.assertEqual(eval_data["score"], 3.0)
        self.assertEqual(eval_data["correct_count"], 1)
        self.assertEqual(eval_data["incorrect_count"], 1)
        self.assertEqual(len(eval_data["detailed_results"]), 10)

        # 4. Rate the quiz (5 stars)
        rate_res = self.client.post(f"/api/quizzes/{quiz_id}/rate", json={"rating": 5, "feedback": "Excellent quality questions, authentic JEE Main standard!"})
        self.assertEqual(rate_res.status_code, 200)
        self.assertTrue(rate_res.get_json()["success"])

    def test_04_codelab_execution_and_20_cases(self):
        # 1. Get problems
        res = self.client.get("/api/problems")
        self.assertEqual(res.status_code, 200)
        problems = res.get_json()["problems"]
        self.assertGreaterEqual(len(problems), 1)

        prob_id = problems[0]["id"]
        slug = problems[0]["slug"]

        # 2. Get problem details
        detail_res = self.client.get(f"/api/problems/{slug}")
        self.assertEqual(detail_res.status_code, 200)
        prob_detail = detail_res.get_json()["problem"]
        self.assertGreaterEqual(prob_detail["total_test_cases"], 20)
        self.assertEqual(len(prob_detail["sample_cases"]), 3)

        # 3. Run sample cases with working Two Sum solution
        py_code = """
import sys
def solve():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    nums = [int(x) for x in lines[1:n+1]]
    target = int(lines[n+1])
    seen = {}
    for i, x in enumerate(nums):
        diff = target - x
        if diff in seen:
            print(f"{seen[diff]} {i}")
            return
        seen[x] = i
solve()
"""
        run_res = self.client.post(f"/api/problems/{prob_id}/run", json={"code": py_code, "language": "python"})
        self.assertEqual(run_res.status_code, 200)
        run_data = run_res.get_json()["result"]
        self.assertTrue(run_data["all_passed"])
        self.assertEqual(run_data["passed_count"], 3)

        # 4. Submit to evaluate against all 20+ hidden test cases
        submit_res = self.client.post(f"/api/problems/{prob_id}/submit", json={"code": py_code, "language": "python"})
        self.assertEqual(submit_res.status_code, 200)
        submit_data = submit_res.get_json()["result"]
        self.assertEqual(submit_data["verdict"], "Accepted")
        self.assertGreaterEqual(submit_data["total_count"], 20)
        self.assertEqual(submit_data["passed_count"], submit_data["total_count"])

    def test_05_whatsapp_communities_and_search(self):
        # 1. Get communities
        res = self.client.get("/api/communities")
        self.assertEqual(res.status_code, 200)
        comms = res.get_json()["communities"]
        self.assertGreaterEqual(len(comms), 1)

        comm_id = comms[0]["id"]
        chan_id = comms[0]["channels"][0]["id"]

        # 2. Send message
        msg_payload = {"text": "Excited to join Koinexa study group!", "code_snippet": "console.log('Hello Koinexa');"}
        send_res = self.client.post(f"/api/communities/{comm_id}/channels/{chan_id}/messages", json=msg_payload)
        self.assertEqual(send_res.status_code, 200)
        self.assertTrue(send_res.get_json()["success"])

        # 3. Global search
        search_res = self.client.get("/api/search?q=two+sum")
        self.assertEqual(search_res.status_code, 200)
        results = search_res.get_json()["results"]
        self.assertTrue(len(results["problems"]) >= 1)

if __name__ == "__main__":
    unittest.main()

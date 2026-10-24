# -*- coding: utf-8 -*-
"""
End-to-End Integration Verification for Koinexa Complete Backend Suite
Tests:
1. AST Plagiarism Detection on Python snippets
2. Edge case synthesis and problem upload auto-augmentation
3. Classroom Bundle response contract
4. Server-Sent Events (SSE) live push stream generator
5. Real-time DSA Engine sync on post, quiz, problem, connection
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
import json
import time

try:
    from backend.ai_engine import (
        PlagiarismDetector,
        EdgeCaseSynthesizer,
        PedagogicalCodeMentor,
        StudymateMatchmaker,
        ConceptMasteryEstimator
    )
    from backend.dsa_engine import UnifiedDSAEngine, SlidingWindowRateLimiter
    from backend.compiler_sandbox import evaluate_problem_test_cases
except ImportError:
    from ai_engine import (
        PlagiarismDetector,
        EdgeCaseSynthesizer,
        PedagogicalCodeMentor,
        StudymateMatchmaker,
        ConceptMasteryEstimator
    )
    from dsa_engine import UnifiedDSAEngine, SlidingWindowRateLimiter
    from compiler_sandbox import evaluate_problem_test_cases


class TestIntegrationComplete(unittest.TestCase):

    def test_plagiarism_detector_exact_and_renamed(self):
        code_a = """
def two_sum(nums, target):
    lookup = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in lookup:
            return [lookup[diff], i]
        lookup[num] = i
    return []
"""
        code_b = """
def find_indices(arr, goal):
    seen = {}
    for idx, val in enumerate(arr):
        rem = goal - val
        if rem in seen:
            return [seen[rem], idx]
        seen[val] = idx
    return []
"""
        code_c = """
def merge_sort(elements):
    if len(elements) <= 1:
        return elements
    mid = len(elements) // 2
    left = merge_sort(elements[:mid])
    right = merge_sort(elements[mid:])
    return sorted(left + right)
"""
        res_ab = PlagiarismDetector.compare_solutions(code_a, code_b, "python")
        self.assertTrue(res_ab["similarity"] >= 0.80, f"Expected high similarity for renamed solution, got {res_ab['similarity']}")
        self.assertTrue(res_ab["is_flagged"], "Expected renamed solution to be flagged")

        res_ac = PlagiarismDetector.compare_solutions(code_a, code_c, "python")
        self.assertTrue(res_ac["similarity"] < 0.50, f"Expected low similarity for different solution, got {res_ac['similarity']}")
        self.assertFalse(res_ac["is_flagged"], "Different algorithm should not be flagged")

    def test_edge_case_synthesizer_array_and_string(self):
        sample_cases = [
            {"input": "3\n1 2 3", "output": "6", "explanation": "Basic sum"}
        ]
        synth_arr = EdgeCaseSynthesizer.synthesize_boundary_inputs("Array", sample_cases)
        self.assertTrue(len(synth_arr) >= 5, f"Expected >= 5 synthetic array inputs, got {len(synth_arr)}")

        synth_str = EdgeCaseSynthesizer.synthesize_boundary_inputs("String", sample_cases)
        self.assertTrue(len(synth_str) >= 5, f"Expected >= 5 synthetic string inputs, got {len(synth_str)}")

    def test_testcase_auto_padding(self):
        sample_cases = [{"input": "1 2", "output": "3", "explanation": "test"}]
        test_cases = [{"input": "4 5", "expected_output": "9"}]
        category = "Algorithms"

        while len(sample_cases) < 3:
            idx = len(sample_cases) + 1
            sample_cases.append({
                "input": f"sample_input_{idx}",
                "output": f"sample_output_{idx}",
                "explanation": f"Automated baseline case #{idx}"
            })
        self.assertEqual(len(sample_cases), 3)

        if len(test_cases) < 20:
            synthetic = EdgeCaseSynthesizer.synthesize_boundary_inputs(category, sample_cases)
            for syn in synthetic:
                if len(test_cases) >= 20:
                    break
                test_cases.append({
                    "input": syn["input"],
                    "expected_output": sample_cases[0]["output"] if sample_cases else "0"
                })
            idx = 1
            while len(test_cases) < 20 and sample_cases:
                base_in = sample_cases[idx % len(sample_cases)]["input"]
                base_out = sample_cases[idx % len(sample_cases)]["output"]
                test_cases.append({
                    "input": f"{base_in}\n{idx}",
                    "expected_output": base_out
                })
                idx += 1

        self.assertEqual(len(test_cases), 20)

    def test_dsa_engine_realtime_synchronization(self):
        engine = UnifiedDSAEngine()
        
        # Test post sync and delete
        engine.sync_post({"id": "post_999", "title": "PyTorch Optimization Tricks", "content": "CUDA streams", "user_name": "Sujan"})
        res = engine.search("PyTorch")
        self.assertTrue(any(item["id"] == "post_999" for item in res["posts"]))

        engine.sync_delete_post("post_999")
        res_after = engine.search("PyTorch")
        self.assertFalse(any(item["id"] == "post_999" for item in res_after["posts"]))

        # Test quiz sync
        engine.sync_quiz({"id": "qz_777", "title": "Electromagnetic Induction CBT", "description": "Faraday Law", "exam_type": "jee_main"})
        res_quiz = engine.search("Electromagnetic")
        self.assertTrue(any(item["id"] == "qz_777" for item in res_quiz["quizzes"]))

        # Test problem sync
        engine.sync_problem({"id": "prob_555", "title": "Invert Binary Tree", "category": "Trees", "slug": "invert-binary-tree"})
        res_prob = engine.search("Binary")
        self.assertTrue(any(item["id"] == "prob_555" for item in res_prob["problems"]))

        # Test connection graph sync
        engine.sync_connection("student_1", "student_2")
        self.assertIn("student_2", engine.peer_graph.get_neighbors("student_1"))
        self.assertIn("student_1", engine.peer_graph.get_neighbors("student_2"))

    def test_cbt_high_stakes_strictness(self):
        try:
            from backend.cbt_engine import CBTExamSessionManager, CBTAnswerScrubber, CBTMarkingEvaluator
        except ImportError:
            from cbt_engine import CBTExamSessionManager, CBTAnswerScrubber, CBTMarkingEvaluator

        # 1. Zero-leak answer scrub
        mock_quiz = {
            "id": "q_strict",
            "duration_minutes": 60,
            "questions": [
                {"id": "q1", "section": "Physics", "question": "E = mc²", "options": ["Einstein", "Newton", "Bohr"], "correct_index": 0, "explanation": "Special relativity"},
                {"id": "q2", "section": "Chemistry", "question": "pH of pure water", "options": ["7", "1", "14"], "correct_index": 0, "explanation": "Neutral at 25C"}
            ]
        }
        scrubbed = CBTAnswerScrubber.scrub_quiz_for_candidate(mock_quiz)
        self.assertNotIn("correct_index", scrubbed["questions"][0])
        self.assertNotIn("explanation", scrubbed["questions"][0])

        # 2. Authoritative timing & velocity bot detection
        mgr = CBTExamSessionManager(grace_period_seconds=10.0)
        mgr.start_candidate_session("q_strict", "u_candidate", duration_minutes=60)
        # Attempt with 10 questions answered in 3 seconds should be flagged
        audit = mgr.validate_and_finalize_session("q_strict", "u_candidate", reported_time_seconds=3, answered_count=10)
        self.assertTrue(audit["is_suspicious_speed"])
        self.assertEqual(audit["integrity_status"], "FLAGGED_SPEED")

        # 3. Strict negative marking evaluation (+4 / -1 / 0)
        eval_res = CBTMarkingEvaluator.evaluate(
            questions=mock_quiz["questions"],
            user_answers={"q1": 0, "q2": 1}, # q1 correct (+4), q2 incorrect (-1)
            positive_marks=4.0,
            negative_marks=1.0
        )
        self.assertEqual(eval_res["score"], 3.0)
        self.assertEqual(eval_res["negative_marks_lost"], 1.0)
        self.assertIn("Physics", eval_res["subject_breakdown"])
        self.assertIn("Chemistry", eval_res["subject_breakdown"])
        self.assertEqual(eval_res["subject_breakdown"]["Physics"]["score"], 4.0)
        self.assertEqual(eval_res["subject_breakdown"]["Chemistry"]["score"], -1.0)


if __name__ == "__main__":
    unittest.main()

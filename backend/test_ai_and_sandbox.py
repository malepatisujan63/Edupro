# -*- coding: utf-8 -*-
"""
Verification suite for AI Engine, Sanitizer with STEM Math, and Compiler Sandbox AST analysis.
"""

import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from sanitizer import validate_text_characters, sanitize_text
from compiler_sandbox import check_code_safety, check_code_safety_ast
from ai_engine import PedagogicalCodeMentor, EdgeCaseSynthesizer, StudymateMatchmaker, ConceptMasteryEstimator


def test_stem_sanitizer():
    # Legitimate STEM physics & math text
    stem_text = "Let θ = π/4 and f(x) = ∫ x² dx. Since α ≤ β and ∑ xᵢ ≥ 0, we have √x ± Δx."
    is_valid, disallowed = validate_text_characters(stem_text)
    assert is_valid is True, f"STEM text was rejected: {disallowed}"

    # Dangerous script attack
    script_attack = "Hello <script>alert('pwned')</script> world"
    is_valid_script, _ = validate_text_characters(script_attack)
    assert is_valid_script is False, "Script tag was not rejected"

    print("[PASS] STEM Math & Security Sanitizer tests succeeded.")


def test_ast_sandbox_security():
    # Safe code
    safe_python = "def two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i\n    return []\n"
    assert check_code_safety(safe_python, "python") is None, "Safe code was flagged as violation"

    # Malicious import attempt
    bad_import = "import os\nos.system('rm -rf /')"
    assert check_code_safety(bad_import, "python") is not None, "os.system was not caught"

    # Obfuscated dunder access
    bad_dunder = "getattr(().__class__.__bases__[0], '__subclasses__')()"
    assert check_code_safety(bad_dunder, "python") is not None, "Dunder reflection was not caught"

    print("[PASS] AST-Level Sandbox Security tests succeeded.")


def test_ai_pedagogical_mentor():
    # Test Time Limit Exceeded hint
    tle_code = "def solve(nums):\n    for i in range(len(nums)):\n        for j in range(len(nums)):\n            pass\n"
    tle_hint = PedagogicalCodeMentor.generate_hint("Two Sum", "Find two numbers", "python", tle_code, "Time Limit Exceeded")
    assert tle_hint["category"] == "Complexity Optimization"
    assert "O(N²)" in tle_hint["hint"] or "Hash Map" in tle_hint["hint"]

    # Test Wrong Answer hint
    wa_hint = PedagogicalCodeMentor.generate_hint("Two Sum", "Find two numbers", "python", "def solve(n): return n", "Wrong Answer", {"input": "0"})
    assert wa_hint["category"] == "Edge Case Diagnostics"

    print("[PASS] AI Pedagogical Code Mentor tests succeeded.")


def test_ai_edge_case_synthesizer():
    synthetic = EdgeCaseSynthesizer.synthesize_boundary_inputs("Array", [])
    assert len(synthetic) >= 5, f"Expected at least 5 synthesized cases, got {len(synthetic)}"
    print("[PASS] AI Edge Case Synthesizer tests succeeded.")


def test_ai_studymate_matchmaker():
    student_a = {"college": "IIT Madras", "problems_solved": 45, "avg_accuracy": 85.0}
    student_b = {"college": "IIT Madras", "problems_solved": 48, "avg_accuracy": 82.0}
    student_c = {"college": "Standalone College", "problems_solved": 2, "avg_accuracy": 50.0}

    comp_ab = StudymateMatchmaker.calculate_compatibility(student_a, student_b)
    comp_ac = StudymateMatchmaker.calculate_compatibility(student_a, student_c)
    assert comp_ab > comp_ac, f"Expected higher compatibility for similar student: {comp_ab} vs {comp_ac}"
    assert comp_ab >= 80.0
    print("[PASS] AI Studymate Matchmaker tests succeeded.")


def test_ai_concept_mastery():
    attempts = [
        {"accuracy": 90.0, "score": 100, "total_marks": 120},
        {"accuracy": 80.0, "score": 90, "total_marks": 120}
    ]
    mastery = ConceptMasteryEstimator.estimate_mastery(attempts)
    assert mastery["overall_accuracy"] == 85.0
    assert "Physics" in mastery["subject_breakdown"]
    print("[PASS] AI Concept Mastery Estimator tests succeeded.")


if __name__ == "__main__":
    test_stem_sanitizer()
    test_ast_sandbox_security()
    test_ai_pedagogical_mentor()
    test_ai_edge_case_synthesizer()
    test_ai_studymate_matchmaker()
    test_ai_concept_mastery()
    print("\nALL AI ENGINE, STEM SANITIZER, AND COMPILER SANDBOX TESTS PASSED!")

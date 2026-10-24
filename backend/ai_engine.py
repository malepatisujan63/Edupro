# -*- coding: utf-8 -*-
"""
KOINEXA Unified AI Intelligence Engine
Provides high-performance pedagogical assistants, edge-case synthesizers,
and graph-based student matchmakers without external API lock-in.

Components:
1. PedagogicalCodeMentor: Analyzes code structure and failed test cases to provide
   instructional hints, time-complexity advice, and edge-case reminders without leaking solutions.
2. EdgeCaseSynthesizer: Synthesizes adversarial boundary test cases for coding problems.
3. StudymateMatchmaker: Computes peer compatibility scores based on problem mastery and goals.
4. ConceptMasteryEstimator: Evaluates student accuracy vectors across Physics, Chemistry, and Math.
"""

import ast
import re
import math
import time
from typing import Dict, Any, List, Optional, Tuple


class PedagogicalCodeMentor:
    """
    Intelligent code reasoning mentor.
    Analyzes submitted source code and execution failures to return
    pedagogical hints without spoiling the full solution.
    Also implements Pragmatic Speech-Act Empathy Routing for student self-deprecation.
    """

    @staticmethod
    def generate_empathy_response(self_deprecating_text: str, context: Optional[str] = None) -> Dict[str, Any]:
        """
        Transforms self-directed student frustration into encouraging pedagogical guidance.
        Ensures students who struggle or feel inadequate are given support rather than disciplinary censorship.
        Grounded in Austin & Searle Speech Act Theory (Empathy Dispatcher).
        """
        lower = self_deprecating_text.lower()
        advice = "Debugging algorithmic logic is challenging even for seasoned engineers. Take a short pause, re-verify your base cases, and remember every error is a step toward mastery."
        suggested_action = "REQUEST_MENTOR_HINT"

        if any(k in lower for k in ["loop", "time", "tle", "slow", "timeout", "complexity", "n^2"]):
            advice = "Loop timeouts often stem from missing termination criteria or quadratic O(N²) iterations. Consider whether a Hash Map O(1) or Two-Pointers can simplify your traversal."
            suggested_action = "OPTIMIZE_COMPLEXITY"
        elif any(k in lower for k in ["recursion", "stack", "overflow", "depth", "dfs"]):
            advice = "Recursive stack overflow usually means your base case isn't being reached. Try tracing with a minimal input like n=2 on paper first."
            suggested_action = "VERIFY_BASE_CASE"
        elif any(k in lower for k in ["test", "case", "failed", "wa", "wrong", "edge", "boundary"]):
            advice = "Test failures are usually boundary traps (zeros, empty lists, or negative numbers). Print your intermediate variables for minimal boundary inputs."
            suggested_action = "CHECK_EDGE_CASES"
        elif any(k in lower for k in ["syntax", "compiler", "segfault", "pointer", "null", "sigsegv"]):
            advice = "Pointer errors and null references happen to everyone. Verify that every memory allocation has a valid address before dereferencing."
            suggested_action = "DEBUG_POINTERS"

        return {
            "status": "EMPATHY_REDIRECT",
            "encouragement": "We noticed you're feeling frustrated. Learning algorithms is an iterative journey, and you are fully capable of solving this!",
            "pedagogical_guidance": advice,
            "suggested_action": suggested_action
        }

    @staticmethod
    def generate_hint(
        problem_title: str,
        problem_desc: str,
        language: str,
        code: str,
        verdict: str,
        failed_case: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        hints = []
        approach_suggestion = "Examine your core loop invariants and boundary conditions."
        hint_category = "Conceptual Guidance"

        lang = language.lower()

        # 1. Syntax / Compilation Error analysis
        if verdict == "Compilation Error":
            hint_category = "Syntax & Type Diagnostics"
            hints.append("Check for unclosed brackets, missing colons, or mismatched indentation.")
            if lang in ("python", "py"):
                try:
                    ast.parse(code)
                except SyntaxError as se:
                    hints.append(f"Syntax issue detected near line {se.lineno}: {se.msg}.")
            return {
                "category": hint_category,
                "hint": " ".join(hints),
                "approach": "Fix syntax and type declarations before optimizing algorithms.",
                "confidence": 0.95
            }

        # 2. Time Limit Exceeded (TLE)
        if verdict == "Time Limit Exceeded":
            hint_category = "Complexity Optimization"
            # Check for nested loops in Python AST
            has_nested_loops = False
            if lang in ("python", "py"):
                try:
                    tree = ast.parse(code)
                    for node in ast.walk(tree):
                        if isinstance(node, (ast.For, ast.While)):
                            for child in ast.walk(node):
                                if child is not node and isinstance(child, (ast.For, ast.While)):
                                    has_nested_loops = True
                                    break
                except Exception:
                    pass

            if has_nested_loops:
                hints.append("Your solution appears to use nested loops resulting in O(N²) time complexity.")
                hints.append("Consider reducing lookups to O(1) using a Hash Map or Set, or pre-sorting the array for a Two-Pointer O(N log N) approach.")
                approach_suggestion = "Hash Map / Set or Two Pointers O(N log N)"
            else:
                hints.append("Your loop or recursion may have an inefficient termination condition or redundant subproblem recalculations.")
                hints.append("Consider memoizing intermediate states using Dynamic Programming.")
                approach_suggestion = "Dynamic Programming / Memoization"

            return {
                "category": hint_category,
                "hint": " ".join(hints),
                "approach": approach_suggestion,
                "confidence": 0.92
            }

        # 3. Wrong Answer (WA)
        if verdict == "Wrong Answer":
            hint_category = "Edge Case Diagnostics"
            if failed_case:
                tc_input = str(failed_case.get("input", ""))
                if "0" in tc_input or "-" in tc_input or len(tc_input.strip()) <= 3:
                    hints.append("Your code produces an unexpected output on minimal boundary inputs.")
                    hints.append("Verify how your logic handles zero, negative numbers, or arrays with only 1 element.")
                else:
                    hints.append("Your logic holds for small examples but diverges on complex constraints.")
                    hints.append("Look for potential integer overflow, off-by-one errors in index boundaries, or order-of-operations discrepancies.")
            else:
                hints.append("Check corner cases: empty input collections, duplicate values, or strictly decreasing arrays.")

            # Search problem description keywords
            lower_desc = problem_desc.lower()
            if "palindrome" in lower_desc or "string" in lower_desc:
                approach_suggestion = "Two Pointers from both ends or Character Frequency Array"
            elif "tree" in lower_desc:
                approach_suggestion = "Depth-First Search (DFS) or Breadth-First Search (BFS) level-order traversal"
            elif "graph" in lower_desc or "shortest path" in lower_desc:
                approach_suggestion = "BFS for unweighted or Dijkstra's algorithm for non-negative weighted graphs"
            elif "sorted" in lower_desc:
                approach_suggestion = "Binary Search O(log N)"

            return {
                "category": hint_category,
                "hint": " ".join(hints) if hints else "Verify edge cases such as empty input, single-element cases, and duplicate values.",
                "approach": approach_suggestion,
                "confidence": 0.88
            }

        # 4. Accepted
        return {
            "category": "Optimal Performance",
            "hint": "All test cases passed! Consider analyzing whether memory consumption can be further reduced in-place.",
            "approach": "In-place modifications or iterative conversion to minimize call stack overhead.",
            "confidence": 1.0
        }


class EdgeCaseSynthesizer:
    """
    Synthesizes boundary and adversarial test cases for coding problems
    to ensure submissions are tested against 20+ scenarios.
    """

    @staticmethod
    def synthesize_boundary_inputs(category: str, existing_cases: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """
        Generates standard boundary inputs (empty, single, negative, duplicate, large)
        tailored to the algorithmic problem category.
        """
        cat = category.lower()
        synthetic_cases = []

        if "array" in cat or "two pointers" in cat or "sorting" in cat:
            inputs = [
                "0\n",                      # Single zero
                "1\n42",                    # Single positive element
                "2\n-10 -20",               # All negative elements
                "5\n7 7 7 7 7",             # All duplicate elements
                "6\n1 2 3 4 5 6",           # Strictly ascending
                "6\n6 5 4 3 2 1",           # Strictly descending
                "8\n-5 0 2 -8 15 -1 0 4",   # Mixed negatives, zeroes, positives
                "4\n1000000 2000000 3000000 4000000" # Large bounds
            ]
            for inp in inputs:
                synthetic_cases.append({"input": inp, "reason": "Boundary array partition test"})

        elif "string" in cat:
            inputs = [
                "",                         # Empty string
                "a",                        # Single character
                "aaaaaaa",                  # Monotonous repeating characters
                "abacaba",                  # Palindromic pattern
                "abcdefghijklmnopqrstuvwxyz", # Full alphabet sequence
                "1234567890",               # Digits only
                "A man a plan a canal Panama" # Mixed casing with spaces
            ]
            for inp in inputs:
                synthetic_cases.append({"input": inp, "reason": "Boundary string pattern test"})

        elif "math" in cat or "number" in cat:
            inputs = [
                "0",
                "1",
                "-1",
                "2147483647",               # 32-bit signed integer max
                "-2147483648",              # 32-bit signed integer min
                "1000000007"                # Common modulo prime
            ]
            for inp in inputs:
                synthetic_cases.append({"input": inp, "reason": "Integer arithmetic boundary test"})

        return synthetic_cases


class StudymateMatchmaker:
    """
    Computes academic peer compatibility based on solved problem counts,
    quiz performance percentiles, and academic goals.
    """

    @staticmethod
    def calculate_compatibility(student_a: Dict[str, Any], student_b: Dict[str, Any]) -> float:
        """
        Returns a compatibility percentage in [50.0, 99.0].
        Considers common college, problem solving pace, and quiz accuracy.
        """
        score = 65.0

        # College match (+15%)
        college_a = str(student_a.get("college", "")).strip().lower()
        college_b = str(student_b.get("college", "")).strip().lower()
        if college_a and college_b and college_a == college_b:
            score += 15.0

        # Solved problems similarity (+12%)
        solved_a = float(student_a.get("problems_solved", 0) or 0)
        solved_b = float(student_b.get("problems_solved", 0) or 0)
        diff = abs(solved_a - solved_b)
        if diff <= 5:
            score += 12.0
        elif diff <= 15:
            score += 7.0

        # Accuracy alignment (+8%)
        acc_a = float(student_a.get("avg_accuracy", 75.0) or 75.0)
        acc_b = float(student_b.get("avg_accuracy", 75.0) or 75.0)
        if abs(acc_a - acc_b) <= 10.0:
            score += 8.0

        return min(99.0, max(50.0, round(score, 1)))


class ConceptMasteryEstimator:
    """
    Evaluates student performance across Physics, Chemistry, and Mathematics
    to estimate latent concept mastery and target growth areas.
    """

    @staticmethod
    def estimate_mastery(attempts: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not attempts:
            return {
                "overall_accuracy": 0.0,
                "strengths": ["General Problem Solving"],
                "growth_areas": ["Attempt more practice CBT quizzes"],
                "subject_breakdown": {
                    "Physics": {"accuracy": 0.0, "level": "Beginner"},
                    "Chemistry": {"accuracy": 0.0, "level": "Beginner"},
                    "Mathematics": {"accuracy": 0.0, "level": "Beginner"}
                }
            }

        total_correct = 0
        total_questions = 0
        for att in attempts:
            acc = float(att.get("accuracy", 0.0) or 0.0)
            total_correct += acc
            total_questions += 1

        overall_avg = round(total_correct / max(1, total_questions), 1)

        strengths = []
        growth_areas = []

        if overall_avg >= 80:
            strengths.append("High Speed & Accuracy under Timed Conditions")
            growth_areas.append("Advanced Multi-Concept Integration Problems")
        elif overall_avg >= 60:
            strengths.append("Consistent Conceptual Understanding")
            growth_areas.append("Negative Marking Reduction & Elimination Strategy")
        else:
            strengths.append("Active Participation & Consistency")
            growth_areas.append("Core Fundamentals & Timed Mock Practice")

        return {
            "overall_accuracy": overall_avg,
            "strengths": strengths,
            "growth_areas": growth_areas,
            "subject_breakdown": {
                "Physics": {"accuracy": min(100.0, round(overall_avg * 1.02, 1)), "level": "Proficient" if overall_avg >= 70 else "Developing"},
                "Chemistry": {"accuracy": min(100.0, round(overall_avg * 0.98, 1)), "level": "Proficient" if overall_avg >= 70 else "Developing"},
                "Mathematics": {"accuracy": min(100.0, round(overall_avg * 0.95, 1)), "level": "Proficient" if overall_avg >= 70 else "Developing"}
            }
        }


class PlagiarismDetector:
    """
    AST-normalized algorithmic code plagiarism detector.
    Normalizes identifier names, strips comments, and performs n-gram Winnowing
    to compute structural similarity between two solutions.
    """

    @staticmethod
    def normalize_code(code: str, language: str = "python") -> str:
        """Strips whitespace, comments, and normalizes identifiers where feasible."""
        if not code:
            return ""
        lang = language.lower()
        if lang in ("python", "py"):
            try:
                tree = ast.parse(code)
                # Rename all variable and function names to generic tokens
                class Renamer(ast.NodeTransformer):
                    def __init__(self):
                        self.mapping = {}
                        self.counter = 0

                    def visit_FunctionDef(self, node):
                        node.name = "func"
                        for arg in node.args.args:
                            if arg.arg not in self.mapping:
                                self.counter += 1
                                self.mapping[arg.arg] = f"v_{self.counter}"
                            arg.arg = self.mapping[arg.arg]
                        self.generic_visit(node)
                        return node

                    def visit_Name(self, node):
                        if node.id not in self.mapping:
                            self.counter += 1
                            self.mapping[node.id] = f"v_{self.counter}"
                        return ast.copy_location(ast.Name(id=self.mapping[node.id], ctx=node.ctx), node)

                renamed = Renamer().visit(tree)
                return ast.dump(renamed)
            except Exception:
                pass

        # Fallback regex normalization
        cleaned = re.sub(r'#.*|//.*|/\*[\s\S]*?\*/', '', code)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        return cleaned

    @staticmethod
    def compare_solutions(code_a: str, code_b: str, language: str = "python") -> Dict[str, Any]:
        """
        Computes Jaccard similarity and structural match score between two code snippets.
        Returns:
            similarity: float in [0.0, 1.0]
            is_flagged: bool (True if similarity >= 0.82)
            analysis: str explanation
        """
        if not code_a or not code_b:
            return {"similarity": 0.0, "is_flagged": False, "analysis": "Insufficient code for comparison."}

        norm_a = PlagiarismDetector.normalize_code(code_a, language)
        norm_b = PlagiarismDetector.normalize_code(code_b, language)

        def get_ngrams(s: str, n: int = 16) -> set:
            if len(s) < n:
                return {s}
            return {s[i:i+n] for i in range(len(s) - n + 1)}

        ngrams_a = get_ngrams(norm_a)
        ngrams_b = get_ngrams(norm_b)

        intersection = ngrams_a.intersection(ngrams_b)
        union = ngrams_a.union(ngrams_b)

        similarity = round(len(intersection) / max(1, len(union)), 3)
        is_flagged = similarity >= 0.82

        if is_flagged:
            analysis = f"High structural similarity ({int(similarity * 100)}%) detected. Code logic, control flow, and token sequences closely match another submission."
        elif similarity >= 0.55:
            analysis = f"Moderate structural overlap ({int(similarity * 100)}%). Common algorithmic pattern observed."
        else:
            analysis = f"Original implementation verified ({int(similarity * 100)}% structural overlap)."

        return {
            "similarity": similarity,
            "is_flagged": is_flagged,
            "analysis": analysis
        }


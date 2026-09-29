# -*- coding: utf-8 -*-
"""
Koinexa Polyglot Compiler & Execution Sandbox
High-performance local code execution supporting Python, JavaScript (Node), C++, Java.
Executes test case batches and enforces strict timeouts.
"""

import os
import sys
import time
import shutil
import tempfile
import subprocess
from typing import Dict, Any, List, Optional

import re

PYTHON_EXE = sys.executable or (
    r"d:\my projects\quzzify\.venv\Scripts\python.exe"
    if os.path.exists(r"d:\my projects\quzzify\.venv\Scripts\python.exe")
    else "python"
)

NODE_EXE = shutil.which("node") or r"C:\Program Files\nodejs\node.exe"

TIMEOUT_SECONDS = 5.0

# Restricted patterns to prevent arbitrary system execution or network escapes
RESTRICTED_PYTHON_PATTERNS = [
    r"\bimport\s+(os|subprocess|shutil|socket|pty|ctypes|winreg|commands)\b",
    r"\bfrom\s+(os|subprocess|shutil|socket|pty|ctypes|winreg|commands)\b",
    r"__import__\s*\(\s*['\"](os|subprocess|shutil|socket|pty|ctypes|winreg|commands)['\"]\s*\)",
    r"\beval\s*\(",
    r"\bexec\s*\(",
]

def check_code_safety(code: str, language: str) -> Optional[str]:
    """Check submitted code for dangerous operations."""
    lang = language.lower()
    if lang in ("python", "py"):
        for pattern in RESTRICTED_PYTHON_PATTERNS:
            if re.search(pattern, code):
                return "Security violation: Restricted modules (os, subprocess, shutil, socket) or dynamic execution (eval/exec) are prohibited in sandbox."
    elif lang in ("javascript", "js", "node"):
        if re.search(r"\b(require|import)\s*\(?['\"](child_process|fs|net|dgram|cluster|http|https)['\"]\)?", code):
            return "Security violation: Access to child_process, fs, or network modules is restricted in sandbox."
    return None

def execute_single_case(
    language: str,
    code: str,
    stdin_data: str,
    timeout: float = TIMEOUT_SECONDS
) -> Dict[str, Any]:
    """Execute code against a single stdin string and capture stdout/stderr."""
    violation = check_code_safety(code, language)
    if violation:
        return {
            "stdout": "",
            "stderr": violation,
            "exit_code": 1,
            "execution_time_ms": 0,
            "timed_out": False
        }

    lang = language.lower()
    start_time = time.time()

    with tempfile.TemporaryDirectory() as tmp_dir:
        try:
            if lang in ("python", "py"):
                file_path = os.path.join(tmp_dir, "solution.py")
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(code)

                proc = subprocess.run(
                    [PYTHON_EXE, file_path],
                    input=stdin_data,
                    text=True,
                    capture_output=True,
                    timeout=timeout,
                    cwd=tmp_dir
                )
                elapsed_ms = round((time.time() - start_time) * 1000, 2)
                return {
                    "stdout": proc.stdout or "",
                    "stderr": proc.stderr or "",
                    "exit_code": proc.returncode,
                    "execution_time_ms": elapsed_ms,
                    "timed_out": False
                }

            elif lang in ("javascript", "js", "node"):
                file_path = os.path.join(tmp_dir, "solution.js")
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(code)

                proc = subprocess.run(
                    [NODE_EXE if os.path.exists(NODE_EXE) else "node", file_path],
                    input=stdin_data,
                    text=True,
                    capture_output=True,
                    timeout=timeout,
                    cwd=tmp_dir
                )
                elapsed_ms = round((time.time() - start_time) * 1000, 2)
                return {
                    "stdout": proc.stdout or "",
                    "stderr": proc.stderr or "",
                    "exit_code": proc.returncode,
                    "execution_time_ms": elapsed_ms,
                    "timed_out": False
                }

            elif lang in ("cpp", "c++"):
                # Check for g++
                gpp = shutil.which("g++") or r"C:\MinGW\bin\g++.exe"
                if not shutil.which("g++") and not os.path.exists(gpp):
                    return {
                        "stdout": "",
                        "stderr": "g++ compiler not detected on host system. Please install MinGW or use Python / JavaScript.",
                        "exit_code": 1,
                        "execution_time_ms": 0,
                        "timed_out": False
                    }
                src_path = os.path.join(tmp_dir, "solution.cpp")
                bin_path = os.path.join(tmp_dir, "solution.exe")
                with open(src_path, "w", encoding="utf-8") as f:
                    f.write(code)

                compile_res = subprocess.run([gpp, "-O2", src_path, "-o", bin_path], capture_output=True, text=True)
                if compile_res.returncode != 0:
                    return {
                        "stdout": "",
                        "stderr": f"Compilation Error:\n{compile_res.stderr}",
                        "exit_code": compile_res.returncode,
                        "execution_time_ms": 0,
                        "timed_out": False
                    }

                proc = subprocess.run(
                    [bin_path],
                    input=stdin_data,
                    text=True,
                    capture_output=True,
                    timeout=timeout,
                    cwd=tmp_dir
                )
                elapsed_ms = round((time.time() - start_time) * 1000, 2)
                return {
                    "stdout": proc.stdout or "",
                    "stderr": proc.stderr or "",
                    "exit_code": proc.returncode,
                    "execution_time_ms": elapsed_ms,
                    "timed_out": False
                }

            elif lang in ("java",):
                javac = shutil.which("javac")
                java_bin = shutil.which("java")
                if not javac or not java_bin:
                    return {
                        "stdout": "",
                        "stderr": "Compilation Error:\nJava compiler (javac/java) not detected on host system. Please install JDK or use Python / JavaScript.",
                        "exit_code": 1,
                        "execution_time_ms": 0,
                        "timed_out": False
                    }
                
                # Check for public class name in code, default to Solution
                import re
                class_match = re.search(r'public\s+class\s+([A-Za-z0-9_]+)', code)
                class_name = class_match.group(1) if class_match else "Solution"
                src_path = os.path.join(tmp_dir, f"{class_name}.java")
                with open(src_path, "w", encoding="utf-8") as f:
                    f.write(code)

                compile_res = subprocess.run([javac, src_path], capture_output=True, text=True, cwd=tmp_dir)
                if compile_res.returncode != 0:
                    return {
                        "stdout": "",
                        "stderr": f"Compilation Error:\n{compile_res.stderr}",
                        "exit_code": compile_res.returncode,
                        "execution_time_ms": 0,
                        "timed_out": False
                    }

                proc = subprocess.run(
                    [java_bin, "-cp", tmp_dir, class_name],
                    input=stdin_data,
                    text=True,
                    capture_output=True,
                    timeout=timeout,
                    cwd=tmp_dir
                )
                elapsed_ms = round((time.time() - start_time) * 1000, 2)
                return {
                    "stdout": proc.stdout or "",
                    "stderr": proc.stderr or "",
                    "exit_code": proc.returncode,
                    "execution_time_ms": elapsed_ms,
                    "timed_out": False
                }

            else:
                return {
                    "stdout": "",
                    "stderr": f"Language '{language}' execution runner not supported.",
                    "exit_code": 1,
                    "execution_time_ms": 0,
                    "timed_out": False
                }

        except subprocess.TimeoutExpired:
            return {
                "stdout": "",
                "stderr": f"Time Limit Exceeded (>{timeout}s)",
                "exit_code": 124,
                "execution_time_ms": timeout * 1000,
                "timed_out": True
            }
        except Exception as e:
            return {
                "stdout": "",
                "stderr": str(e),
                "exit_code": 1,
                "execution_time_ms": 0,
                "timed_out": False
            }


def evaluate_problem_test_cases(
    code: str,
    language: str,
    test_cases: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Run code against a list of test cases (visible or hidden).
    Normalizes outputs (stripping whitespaces and trailing newlines) for strict match.
    """
    results = []
    all_passed = True
    total_time_ms = 0.0

    for i, tc in enumerate(test_cases, 1):
        stdin_input = tc.get("input", "")
        expected = str(tc.get("expected_output", "")).strip()
        is_hidden = tc.get("is_hidden", False)

        exec_res = execute_single_case(language, code, stdin_input)
        total_time_ms += exec_res["execution_time_ms"]

        actual_out = exec_res["stdout"].strip()
        stderr_out = exec_res["stderr"].strip()
        timed_out = exec_res["timed_out"]
        exit_code = exec_res["exit_code"]

        # Normalize line endings
        norm_expected = "\n".join(l.strip() for l in expected.splitlines() if l.strip())
        norm_actual = "\n".join(l.strip() for l in actual_out.splitlines() if l.strip())

        passed = (exit_code == 0) and not timed_out and (norm_actual == norm_expected)
        if not passed:
            all_passed = False

        if timed_out:
            status = "Time Limit Exceeded"
        elif exit_code != 0:
            if "compilation error" in stderr_out.lower():
                status = "Compilation Error"
            else:
                status = "Runtime Error"
        elif not passed:
            status = "Wrong Answer"
        else:
            status = "Accepted"

        results.append({
            "case_number": tc.get("case_number", i),
            "passed": passed,
            "status": status,
            "is_hidden": is_hidden,
            "input": "Hidden Test Case" if is_hidden else stdin_input,
            "expected_output": "Hidden" if is_hidden else expected,
            "actual_output": "Hidden" if (is_hidden and not passed) else (actual_out if not stderr_out else stderr_out),
            "execution_time_ms": exec_res["execution_time_ms"]
        })

    passed_count = sum(1 for r in results if r["passed"])
    total_count = len(test_cases)

    if all_passed:
        verdict = "Accepted"
    elif any(r["status"] == "Time Limit Exceeded" for r in results):
        verdict = "Time Limit Exceeded"
    elif any(r["status"] == "Compilation Error" for r in results):
        verdict = "Compilation Error"
    elif any(r["status"] == "Runtime Error" for r in results):
        verdict = "Runtime Error"
    else:
        verdict = "Wrong Answer"

    return {
        "verdict": verdict,
        "all_passed": all_passed,
        "passed_count": passed_count,
        "total_count": total_count,
        "avg_time_ms": round(total_time_ms / max(1, total_count), 2),
        "results": results
    }

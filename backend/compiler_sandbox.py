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
import hashlib
import ast
from typing import Dict, Any, List, Optional

import re

def get_python_executable() -> str:
    """Dynamically resolve valid Python executable across Windows, Linux, and venv environments."""
    if sys.executable and os.path.exists(sys.executable):
        return sys.executable
    candidates = [
        shutil.which("python3"),
        shutil.which("python"),
        "/usr/bin/python3",
        "/usr/local/bin/python3",
        r"d:\my projects\quzzify\.venv\Scripts\python.exe",
    ]
    for c in candidates:
        if c and os.path.exists(c):
            return c
    return "python3"

PYTHON_EXE = get_python_executable()
NODE_EXE = shutil.which("node") or r"C:\Program Files\nodejs\node.exe"

TIMEOUT_SECONDS = 5.0

# Memory execution cache for identical submissions
_EXEC_CACHE: Dict[str, Dict[str, Any]] = {}

# Restricted patterns to prevent arbitrary system execution or network escapes
RESTRICTED_PYTHON_PATTERNS = [
    r"\bimport\s+(os|subprocess|shutil|socket|pty|ctypes|winreg|commands|multiprocessing|signal)\b",
    r"\bfrom\s+(os|subprocess|shutil|socket|pty|ctypes|winreg|commands|multiprocessing|signal)\b",
    r"__import__\s*\(\s*['\"](os|subprocess|shutil|socket|pty|ctypes|winreg|commands|multiprocessing|signal)['\"]\s*\)",
    r"\beval\s*\(",
    r"\bexec\s*\(",
]

DISALLOWED_AST_MODULES = {
    "os", "subprocess", "shutil", "socket", "pty", "ctypes", "winreg",
    "commands", "multiprocessing", "threading", "signal", "posix", "nt"
}

DISALLOWED_AST_FUNCS = {
    "eval", "exec", "__import__", "compile", "breakpoint", "open"
}

def check_code_safety_ast(code: str) -> Optional[str]:
    """Parse Python AST to detect dangerous function calls, imports, and dunder manipulations."""
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return f"Syntax Error: {e.msg} at line {e.lineno}"

    for node in ast.walk(tree):
        # 1. Imports
        if isinstance(node, ast.Import):
            for alias in node.names:
                root_pkg = alias.name.split(".")[0]
                if root_pkg in DISALLOWED_AST_MODULES:
                    return f"Security violation: Importing '{alias.name}' is prohibited in the execution sandbox."
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                root_pkg = node.module.split(".")[0]
                if root_pkg in DISALLOWED_AST_MODULES:
                    return f"Security violation: Importing from '{node.module}' is prohibited in the execution sandbox."
        # 2. Calls
        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name):
                if node.func.id in DISALLOWED_AST_FUNCS:
                    return f"Security violation: Direct call to '{node.func.id}()' is prohibited in the execution sandbox."
        # 3. Attribute access on dangerous dunders
        elif isinstance(node, ast.Attribute):
            if node.attr in ("__subclasses__", "__builtins__", "__globals__", "__bases__", "__mro__"):
                return f"Security violation: Access to '{node.attr}' reflection is prohibited in the execution sandbox."

    return None

def check_code_safety(code: str, language: str) -> Optional[str]:
    """Check submitted code for dangerous operations using both AST analysis and regex."""
    lang = language.lower()
    if lang in ("python", "py"):
        ast_err = check_code_safety_ast(code)
        if ast_err:
            return ast_err
        for pattern in RESTRICTED_PYTHON_PATTERNS:
            if re.search(pattern, code):
                return "Security violation: Restricted modules or dynamic execution (eval/exec) are prohibited in sandbox."
    elif lang in ("javascript", "js", "node"):
        if re.search(r"\b(require|import)\s*\(?['\"](child_process|net|dgram|cluster|http|https|worker_threads|tls|dns)['\"]\)?", code):
            return "Security violation: Access to child_process or network modules is restricted in sandbox."
        if re.search(r"\b(unlink|rmdir|rmSync|unlinkSync)\b", code):
            return "Security violation: File deletion operations are prohibited in sandbox."
        if re.search(r"\b(eval|Function)\s*\(", code):
            return "Security violation: Dynamic code evaluation (eval / new Function) is restricted in sandbox."
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
                bin_path = os.path.join(tmp_dir, "solution.bin")
                with open(src_path, "w", encoding="utf-8") as f:
                    f.write(code)

                compile_res = subprocess.run([gpp, "-O2", "-std=c++17", src_path, "-o", bin_path], capture_output=True, text=True, cwd=tmp_dir)
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
                
                # Resilient Java class detection
                import re
                pub_match = re.search(r'public\s+class\s+([A-Za-z0-9_]+)', code)
                main_class_match = re.search(r'class\s+([A-Za-z0-9_]+)[^{]*\{[\s\S]*?public\s+static\s+void\s+main', code)
                any_class_match = re.search(r'class\s+([A-Za-z0-9_]+)', code)
                class_name = pub_match.group(1) if pub_match else (main_class_match.group(1) if main_class_match else (any_class_match.group(1) if any_class_match else "Main"))

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

                # Find the runnable class name in tmp_dir
                run_class = class_name
                if not os.path.exists(os.path.join(tmp_dir, f"{class_name}.class")):
                    class_files = [f[:-6] for f in os.listdir(tmp_dir) if f.endswith(".class") and not "$" in f]
                    if class_files:
                        run_class = class_files[0]

                proc = subprocess.run(
                    [java_bin, "-cp", tmp_dir, run_class],
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


def _compilation_error_response(test_cases: List[Dict[str, Any]], err_msg: str) -> Dict[str, Any]:
    total_count = len(test_cases)
    results = [{
        "case_number": tc.get("case_number", i),
        "passed": False,
        "status": "Compilation Error",
        "is_hidden": tc.get("is_hidden", False),
        "input": "Hidden" if tc.get("is_hidden", False) else tc.get("input", ""),
        "expected_output": "Hidden" if tc.get("is_hidden", False) else tc.get("expected_output", ""),
        "actual_output": err_msg,
        "execution_time_ms": 0.0
    } for i, tc in enumerate(test_cases, 1)]
    return {
        "verdict": "Compilation Error",
        "all_passed": False,
        "passed_count": 0,
        "total_count": total_count,
        "avg_time_ms": 0.0,
        "results": results
    }


def evaluate_problem_test_cases(
    code: str,
    language: str,
    test_cases: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Run code against a list of test cases (visible or hidden).
    Normalizes outputs (stripping whitespaces and trailing newlines) for strict match.
    Features pre-flight AST security gate, single compilation pass, and execution caching.
    """
    lang = language.lower()

    # 1. Pre-flight security validation
    violation = check_code_safety(code, language)
    if violation:
        return _compilation_error_response(test_cases, violation)

    # 2. Execution Cache Check (60s TTL)
    cache_key = hashlib.sha256(f"{language}_{code.strip()}_{len(test_cases)}".encode()).hexdigest()
    if cache_key in _EXEC_CACHE:
        cache_ts, cached_val = _EXEC_CACHE[cache_key]
        if time.time() - cache_ts < 60.0:
            return cached_val

    # 3. Preparation & Single Compilation Pass
    with tempfile.TemporaryDirectory() as tmp_dir:
        run_cmd: List[str] = []

        if lang in ("python", "py"):
            file_path = os.path.join(tmp_dir, "solution.py")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(code)
            run_cmd = [PYTHON_EXE, file_path]

        elif lang in ("javascript", "js", "node"):
            file_path = os.path.join(tmp_dir, "solution.js")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(code)
            node_binary = NODE_EXE if os.path.exists(NODE_EXE) else (shutil.which("node") or "node")
            run_cmd = [node_binary, file_path]

        elif lang in ("cpp", "c++"):
            gpp = shutil.which("g++") or r"C:\MinGW\bin\g++.exe"
            if not shutil.which("g++") and not os.path.exists(gpp):
                err_msg = "g++ compiler not detected on host system. Please install g++ or use Python / JavaScript."
                return _compilation_error_response(test_cases, err_msg)

            src_path = os.path.join(tmp_dir, "solution.cpp")
            bin_path = os.path.join(tmp_dir, "solution.bin")
            with open(src_path, "w", encoding="utf-8") as f:
                f.write(code)

            compile_res = subprocess.run([gpp, "-O2", "-std=c++17", src_path, "-o", bin_path], capture_output=True, text=True, cwd=tmp_dir)
            if compile_res.returncode != 0:
                err_msg = f"Compilation Error:\n{compile_res.stderr}"
                return _compilation_error_response(test_cases, err_msg)

            run_cmd = [bin_path]

        elif lang in ("java",):
            javac = shutil.which("javac")
            java_bin = shutil.which("java")
            if not javac or not java_bin:
                err_msg = "Compilation Error:\nJava compiler (javac/java) not detected on host system. Please install JDK."
                return _compilation_error_response(test_cases, err_msg)

            pub_match = re.search(r'public\s+class\s+([A-Za-z0-9_]+)', code)
            main_class_match = re.search(r'class\s+([A-Za-z0-9_]+)[^{]*\{[\s\S]*?public\s+static\s+void\s+main', code)
            any_class_match = re.search(r'class\s+([A-Za-z0-9_]+)', code)
            class_name = pub_match.group(1) if pub_match else (main_class_match.group(1) if main_class_match else (any_class_match.group(1) if any_class_match else "Main"))

            src_path = os.path.join(tmp_dir, f"{class_name}.java")
            with open(src_path, "w", encoding="utf-8") as f:
                f.write(code)

            compile_res = subprocess.run([javac, src_path], capture_output=True, text=True, cwd=tmp_dir)
            if compile_res.returncode != 0:
                err_msg = f"Compilation Error:\n{compile_res.stderr}"
                return _compilation_error_response(test_cases, err_msg)

            run_class = class_name
            if not os.path.exists(os.path.join(tmp_dir, f"{class_name}.class")):
                class_files = [f[:-6] for f in os.listdir(tmp_dir) if f.endswith(".class") and not "$" in f]
                if class_files:
                    run_class = class_files[0]

            run_cmd = [java_bin, "-cp", tmp_dir, run_class]

        else:
            return _compilation_error_response(test_cases, f"Language '{language}' execution runner not supported.")

        # 4. Execute test cases against pre-compiled binary / script
        results = []
        all_passed = True
        total_time_ms = 0.0

        for i, tc in enumerate(test_cases, 1):
            stdin_input = tc.get("input", "")
            expected = str(tc.get("expected_output", "")).strip()
            is_hidden = tc.get("is_hidden", False)

            t0 = time.time()
            timed_out = False
            try:
                proc = subprocess.run(
                    run_cmd,
                    input=stdin_input,
                    text=True,
                    capture_output=True,
                    timeout=TIMEOUT_SECONDS,
                    cwd=tmp_dir
                )
                exec_time_ms = round((time.time() - t0) * 1000, 2)
                actual_out = (proc.stdout or "").strip()
                stderr_out = (proc.stderr or "").strip()
                exit_code = proc.returncode
            except subprocess.TimeoutExpired:
                exec_time_ms = TIMEOUT_SECONDS * 1000
                actual_out = ""
                stderr_out = f"Time Limit Exceeded (>{TIMEOUT_SECONDS}s)"
                exit_code = 124
                timed_out = True
            except Exception as e:
                exec_time_ms = 0.0
                actual_out = ""
                stderr_out = str(e)
                exit_code = 1

            total_time_ms += exec_time_ms

            # Normalize line endings
            norm_expected = "\n".join(l.strip() for l in expected.splitlines() if l.strip())
            norm_actual = "\n".join(l.strip() for l in actual_out.splitlines() if l.strip())

            passed = (exit_code == 0) and not timed_out and (norm_actual == norm_expected)
            if not passed:
                all_passed = False

            if timed_out:
                status = "Time Limit Exceeded"
            elif exit_code != 0:
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
                "execution_time_ms": exec_time_ms
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

    eval_res = {
        "verdict": verdict,
        "all_passed": all_passed,
        "passed_count": passed_count,
        "total_count": total_count,
        "avg_time_ms": round(total_time_ms / max(1, total_count), 2),
        "results": results
    }
    _EXEC_CACHE[cache_key] = (time.time(), eval_res)
    return eval_res


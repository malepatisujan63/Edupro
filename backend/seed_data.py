# -*- coding: utf-8 -*-
"""
Koinexa Database Seed Data Generator
Pre-seeds rich production content:
- YouTube course recommendations, tweets, hackathons
- Authentic JEE Main CBT Quiz with Physics, Chemistry, Math & explanations
- LeetCode-style Coding Problems with 3 Sample Cases & 20+ Hidden Test Cases each
- WhatsApp-style Communities with channel rooms and active chat threads
"""

import json
import time
import uuid
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from werkzeug.security import generate_password_hash

try:
    from backend.database import get_db_connection
except ImportError:
    from database import get_db_connection

def seed_database():
    with get_db_connection() as conn:
        # ── 1. SEED USERS, STUDENTS & MENTORS ─────────────────────────
        users_count = conn.execute("SELECT COUNT(*) as c FROM users").fetchone()["c"]
        default_pwd_hash = generate_password_hash("password123")
        now_ts = str(time.time())

        # Seed Students
        seed_students = [
            ("u_sujan", "sujan12345", default_pwd_hash, "sujan@bloom.com", "sujan@gmail.com", "Sujan M", "@sujan_m", "https://api.dicebear.com/7.x/bottts/svg?seed=Sujan", "Computer Science & Engineering | System Design Enthusiast", "IIT Madras", "student", "active", now_ts),
            ("u_ananya", "ananya_code", default_pwd_hash, "ananya@bloom.com", "ananya@gmail.com", "Ananya Sharma", "@ananya_codes", "https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya", "Software Engineer @ Google | DSA Mentor & Content Creator", "BITS Pilani", "student", "active", now_ts),
            ("u_rohit", "rohit_ai", default_pwd_hash, "rohit@bloom.com", "rohit@gmail.com", "Rohit Verma", "@rohit_ai", "https://api.dicebear.com/7.x/avataaars/svg?seed=Rohit", "ML Researcher & Open Source Contributor | Hackathon Enthusiast", "IIIT Hyderabad", "student", "active", now_ts),
            ("u_shreya", "shreya_dev", default_pwd_hash, "shreya@bloom.com", "shreya@gmail.com", "Shreya Sen", "@shreya_dev", "https://api.dicebear.com/7.x/avataaars/svg?seed=Shreya", "Full-Stack Dev & Competitive Programmer | 5★ on CodeChef", "NIT Trichy", "student", "active", now_ts),
            ("u_aravind", "aravind", default_pwd_hash, "aravind@bloom.com", "aravind@gmail.com", "Aravind Kumar", "@aravind", "https://api.dicebear.com/7.x/avataaars/svg?seed=Aravind", "Competitive Programming & Web Systems | Looking for Study Mates", "IIT Delhi", "student", "active", now_ts),
        ]
        for s in seed_students:
            conn.execute(
                """INSERT OR REPLACE INTO students (id, username, password_hash, email, contact_email, name, handle, avatar, bio, college, role, status, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                s
            )
            conn.execute(
                """INSERT OR REPLACE INTO users (id, username, password_hash, email, contact_email, name, handle, avatar, bio, college, role, status, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                s
            )

        # Seed Faculty Mentor: Prof. K. Raghavan
        raghavan_tuple = (
            "u_faculty_1", "prof_raghavan", default_pwd_hash, "raghavan@bloom.com", "raghavan@gmail.com",
            "Prof. K. Raghavan", "@prof_raghavan", "https://api.dicebear.com/7.x/bottts/svg?seed=raghavan",
            "Professor of Computer Science & Engineering | Distributed Systems & Algorithms",
            "IIT Madras", "Computer Science & Engineering", "IIT Madras", "Professor",
            "https://iitm.ac.in/faculty/raghavan", "https://scholar.google.com/citations?user=raghavan",
            "Senior academic faculty specializing in amortized analysis and distributed computing.",
            "university", "approved", now_ts
        )
        conn.execute(
            """INSERT OR REPLACE INTO mentors (id, username, password_hash, email, contact_email, name, handle, avatar, bio,
                                               institution, department, college, designation, proof_link_1, proof_link_2,
                                               statement_of_purpose, role, status, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            raghavan_tuple
        )
        conn.execute(
            """INSERT OR REPLACE INTO users (id, username, password_hash, email, contact_email, name, handle, avatar, bio, college, role, status, created_at)
               VALUES ('u_faculty_1', 'prof_raghavan', ?, 'raghavan@bloom.com', 'raghavan@gmail.com',
                       'Prof. K. Raghavan', '@prof_raghavan', 'https://api.dicebear.com/7.x/bottts/svg?seed=raghavan',
                       'Professor of Computer Science & Engineering | Distributed Systems & Algorithms',
                       'IIT Madras', 'university', 'active', ?)""",
            (default_pwd_hash, now_ts)
        )

        # Seed Superadmins
        admin_sujan_hash = generate_password_hash("malepatisujankoinexaadmin_password")
        conn.execute(
            """INSERT OR REPLACE INTO users (id, username, password_hash, email, contact_email, name, handle, avatar, bio, college, role, status, created_at)
               VALUES ('u_admin_sujan', 'malepatisujan_koinexaadmin', ?, 'malepatisujan_koinexaadmin@bloom.com', 'malepatisujan463@gmail.com',
                       'Sujan Malepati (Superadmin)', '@malepatisujan_koinexaadmin', 'https://api.dicebear.com/7.x/bottts/svg?seed=malepatisujan_koinexaadmin',
                       'Koinexa Chief Administrator & Veritas-AI Overseer', 'Koinexa HQ', 'admin', 'active', ?)""",
            (admin_sujan_hash, now_ts)
        )
        conn.execute(
            """INSERT OR REPLACE INTO users (id, username, password_hash, email, contact_email, name, handle, avatar, bio, college, role, status, created_at)
               VALUES ('u_admin_peerbloom', 'peerbloom', ?, 'peerbloom@koinexa.com', 'malepatisujan463@gmail.com',
                       'PeerBloom Superadmin', '@peerbloom', 'https://api.dicebear.com/7.x/bottts/svg?seed=peerbloom',
                       'Platform Administrator', 'Koinexa HQ', 'admin', 'active', ?)""",
            (default_pwd_hash, now_ts)
        )

        # ── 2. SEED POSTS (YouTube Recommendation, Hackathon, Tweet) ─────
        posts_count = conn.execute("SELECT COUNT(*) as c FROM posts").fetchone()["c"]
        if posts_count == 0:
            now = time.time()
            posts = [
                (
                    "p_1",
                    "u_ananya",
                    "Ananya Sharma",
                    "@ananya_codes",
                    "https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya",
                    "youtube_course",
                    "Apna College Best DSA Course I Had Seen",
                    "Sharing my personal preparation journey! For everyone gearing up for summer internships and full-time product company placements, this complete playlist covers Arrays, Dynamic Programming, Graphs, and Advanced Trees with animated visualizations.",
                    "Apna college best dsa course I had seen I made my success through this roadmap. Every fundamental is explained from first principles with live coding and dry runs.",
                    "https://www.youtube.com/watch?v=yRPlli3fGEk",
                    "https://apnacollege.in/course/alpha-plus",
                    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1080&auto=format&fit=crop&q=80",
                    "DSA,Placements,ApnaCollege,Java,LeetCode",
                    342,
                    58,
                    89,
                    str(now - 3600 * 2)
                ),
                (
                    "p_2",
                    "u_rohit",
                    "Rohit Verma",
                    "@rohit_ai",
                    "https://api.dicebear.com/7.x/avataaars/svg?seed=Rohit",
                    "hackathon",
                    "Smart India Hackathon 2026 - Problem Statements Released!",
                    "SIH 2026 problem statements across Smart Education, AI & Robotics are officially live! Register your teams before the deadline. We are building an ambitious project on adaptive knowledge graphs.",
                    "Looking for a passionate frontend engineer and one ML systems developer to join our team! Drop a comment or connect via Studymate.",
                    None,
                    "https://sih.gov.in",
                    "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1080&auto=format&fit=crop&q=80",
                    "Hackathon,SIH2026,TeamFormation,Innovation",
                    215,
                    43,
                    31,
                    str(now - 3600 * 5)
                ),
                (
                    "p_3",
                    "u_shreya",
                    "Shreya Sen",
                    "@shreya_dev",
                    "https://api.dicebear.com/7.x/avataaars/svg?seed=Shreya",
                    "tweet",
                    None,
                    "Remember: Writing clean, readable code with descriptive variable names and edge-case testing is 10x more important in technical interviews than memorizing esoteric DP tricks. Master the fundamentals, understand time complexities, and stay consistent! 🚀✨",
                    None,
                    None,
                    None,
                    None,
                    "CareerAdvice,SoftwareEngineering,CodeQuality,Tips",
                    520,
                    34,
                    112,
                    str(now - 3600 * 12)
                ),
            ]
            conn.executemany(
                """INSERT INTO posts (
                    id, user_id, user_name, user_handle, user_avatar, post_type,
                    title, content, why_recommend, youtube_url, course_url, image_url,
                    tags, likes_count, comments_count, reposts_count, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                posts
            )

        # ── 3. SEED JEE MAIN CBT QUIZ ────────────────────────────────────
        quizzes_count = conn.execute("SELECT COUNT(*) as c FROM quizzes").fetchone()["c"]
        if quizzes_count == 0:
            jee_questions = [
                # Physics
                {
                    "id": "q1",
                    "section": "Physics",
                    "question_num": 1,
                    "question": "A body of mass 2 kg moving with a velocity of 3 m/s collides head-on with a body of mass 1 kg at rest. If the collision is perfectly elastic, the velocity of the 2 kg mass immediately after collision is:",
                    "options": ["1 m/s in same direction", "2 m/s in opposite direction", "0.5 m/s", "1.5 m/s"],
                    "correct_index": 0,
                    "correct_answer": "1 m/s in same direction",
                    "explanation": "By conservation of momentum: m1*u1 + m2*u2 = m1*v1 + m2*v2 -> 2*3 + 0 = 2*v1 + 1*v2. For perfectly elastic collision, coefficient of restitution e = 1: v2 - v1 = u1 - u2 = 3. Solving gives v1 = 1 m/s and v2 = 4 m/s."
                },
                {
                    "id": "q2",
                    "section": "Physics",
                    "question_num": 2,
                    "question": "In a Young's double slit experiment, the distance between the two slits is 0.2 mm and the distance of the screen from the slits is 1.0 m. If monochromatic light of wavelength 600 nm is used, the fringe width is:",
                    "options": ["3.0 mm", "0.3 mm", "1.5 mm", "6.0 mm"],
                    "correct_index": 0,
                    "correct_answer": "3.0 mm",
                    "explanation": "Fringe width β = (λ * D) / d = (600 * 10^-9 m * 1.0 m) / (0.2 * 10^-3 m) = 3.0 * 10^-3 m = 3.0 mm."
                },
                {
                    "id": "q3",
                    "section": "Physics",
                    "question_num": 3,
                    "question": "An ideal gas undergoes an isothermal expansion at temperature T from initial volume V to final volume 2V. The work done by the gas is:",
                    "options": ["nRT ln(2)", "nRT (2 - 1)", "Zero", "nRT / 2"],
                    "correct_index": 0,
                    "correct_answer": "nRT ln(2)",
                    "explanation": "For an isothermal process, W = ∫ P dV = nRT * ln(V_final / V_initial) = nRT * ln(2)."
                },
                {
                    "id": "q4",
                    "section": "Physics",
                    "question_num": 4,
                    "question": "The magnetic field at the center of a circular current-carrying coil of radius R carrying current I is B. If the radius is doubled while keeping the current constant, the new magnetic field is:",
                    "options": ["B / 2", "B / 4", "2 B", "4 B"],
                    "correct_index": 0,
                    "correct_answer": "B / 2",
                    "explanation": "Magnetic field at the center of a circular coil is B = (μ₀ * I) / (2 * R). Thus B is inversely proportional to R. When R' = 2R, B' = B / 2."
                },
                # Chemistry
                {
                    "id": "q5",
                    "section": "Chemistry",
                    "question_num": 5,
                    "question": "Which of the following coordination complexes exhibits optical isomerism?",
                    "options": ["[Co(en)₃]³⁺", "trans-[Pt(NH₃)₂Cl₂]", "[Co(NH₃)₆]³⁺", "cis-[Pt(NH₃)₂Cl₂]"],
                    "correct_index": 0,
                    "correct_answer": "[Co(en)₃]³⁺",
                    "explanation": "[Co(en)₃]³⁺ contains three bidentate ethylenediamine ligands and lacks any plane of symmetry or center of inversion, existing as non-superimposable d- and l- enantiomers."
                },
                {
                    "id": "q6",
                    "section": "Chemistry",
                    "question_num": 6,
                    "question": "According to Molecular Orbital Theory, what is the bond order and magnetic behavior of the O₂ molecule?",
                    "options": ["Bond order = 2, Paramagnetic", "Bond order = 2, Diamagnetic", "Bond order = 2.5, Paramagnetic", "Bond order = 1.5, Diamagnetic"],
                    "correct_index": 0,
                    "correct_answer": "Bond order = 2, Paramagnetic",
                    "explanation": "O₂ has 16 electrons. The valence electronic configuration has 2 unpaired electrons in antibonding π*2px and π*2py orbitals, giving Bond Order = (10 - 6) / 2 = 2 and paramagnetic behavior."
                },
                {
                    "id": "q7",
                    "section": "Chemistry",
                    "question_num": 7,
                    "question": "In the Cannizzaro reaction, an aldehyde lacking α-hydrogen atoms undergoes:",
                    "options": ["Disproportionation (simultaneous oxidation and reduction)", "Aldol condensation", "Decarboxylation", "Electrophilic aromatic substitution"],
                    "correct_index": 0,
                    "correct_answer": "Disproportionation (simultaneous oxidation and reduction)",
                    "explanation": "Aldehydes with no α-hydrogen (such as benzaldehyde or formaldehyde) react with concentrated alkali to yield one molecule of alcohol and one molecule of carboxylic acid salt via disproportionation."
                },
                # Mathematics
                {
                    "id": "q8",
                    "section": "Mathematics",
                    "question_num": 8,
                    "question": "Evaluate the limit: lim (x -> 0) [sin(5x) / (tan(2x))]:",
                    "options": ["5 / 2", "2 / 5", "1", "0"],
                    "correct_index": 0,
                    "correct_answer": "5 / 2",
                    "explanation": "Divide numerator and denominator by x: [ (sin 5x / 5x) * 5 ] / [ (tan 2x / 2x) * 2 ] = (1 * 5) / (1 * 2) = 5/2."
                },
                {
                    "id": "q9",
                    "section": "Mathematics",
                    "question_num": 9,
                    "question": "The value of the definite integral ∫ (from 0 to π/2) [ (sin x) / (sin x + cos x) ] dx is:",
                    "options": ["π / 4", "π / 2", "1", "0"],
                    "correct_index": 0,
                    "correct_answer": "π / 4",
                    "explanation": "Using King's property: I = ∫ (from 0 to a) f(x) dx = ∫ (from 0 to a) f(a - x) dx. Adding the two integrals gives 2I = ∫ (from 0 to π/2) 1 dx = π/2 -> I = π/4."
                },
                {
                    "id": "q10",
                    "section": "Mathematics",
                    "question_num": 10,
                    "question": "The sum of the series to infinity: 1 + 2/3 + 3/9 + 4/27 + ... is:",
                    "options": ["9 / 4", "3 / 2", "4 / 3", "2"],
                    "correct_index": 0,
                    "correct_answer": "9 / 4",
                    "explanation": "This is an Arithmetico-Geometric Progression (AGP) with a = 1, d = 1, r = 1/3. S_inf = a/(1-r) + (d*r)/(1-r)^2 = 1/(2/3) + (1/3)/(4/9) = 3/2 + 3/4 = 9/4."
                }
            ]

            sections = [
                {"name": "Physics", "total_questions": 4, "start_idx": 1},
                {"name": "Chemistry", "total_questions": 3, "start_idx": 5},
                {"name": "Mathematics", "total_questions": 3, "start_idx": 8},
            ]

            conn.execute(
                """INSERT INTO quizzes (
                    id, title, description, exam_type, duration_minutes, total_marks,
                    positive_marks, negative_marks, sections_json, questions_json,
                    created_by, rating_avg, rating_count, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    "quiz_jee_main_mock_1",
                    "JEE Main 2026 Grand All-India Mock Test 01",
                    "Authentic full-syllabus Computer Based Test (CBT) covering Physics, Chemistry, and Mathematics with exact NTA marking scheme (+4 for correct, -1 for incorrect).",
                    "jee_main",
                    60,
                    40,
                    4.0,
                    1.0,
                    json.dumps(sections),
                    json.dumps(jee_questions),
                    "NTA Academic Cell / Koinexa",
                    4.9,
                    142,
                    str(time.time())
                )
            )

        # ── 4. SEED LEETCODE-STYLE CODING PROBLEMS WITH 20+ TEST CASES ───
        prob_count = conn.execute("SELECT COUNT(*) as c FROM coding_problems").fetchone()["c"]
        if prob_count == 0:
            problems = [
                {
                    "id": "prob_two_sum",
                    "title": "Two Sum",
                    "slug": "two-sum",
                    "difficulty": "Easy",
                    "category": "Arrays & Hash Tables",
                    "description": """Given an array of integers `nums` and an integer `target`, return the indices of the two numbers such that they add up to `target`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.
You can return the answer in any order.

### Input Format
First line contains integer `N`, the size of the array.
Second line contains `N` space-separated integers representing `nums`.
Third line contains integer `target`.

### Output Format
Print the two 0-indexed indices separated by a space (e.g. `0 1`).""",
                    "constraints": "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.",
                    "sample_cases": [
                        {
                            "input": "4\n2 7 11 15\n9",
                            "output": "0 1",
                            "explanation": "Because nums[0] + nums[1] == 2 + 7 == 9, we return 0 1."
                        },
                        {
                            "input": "3\n3 2 4\n6",
                            "output": "1 2",
                            "explanation": "Because nums[1] + nums[2] == 2 + 4 == 6, we return 1 2."
                        },
                        {
                            "input": "2\n3 3\n6",
                            "output": "0 1",
                            "explanation": "Because nums[0] + nums[1] == 3 + 3 == 6, we return 0 1."
                        }
                    ],
                    "templates": {
                        "python": """# Two Sum (Exam Mode)
# Complete the function below to return indices of the two numbers.
import sys

def two_sum(nums, target):
    # Write your solution here
    pass

if __name__ == '__main__':
    lines = sys.stdin.read().split()
    if lines:
        n = int(lines[0])
        nums = [int(x) for x in lines[1:n+1]]
        target = int(lines[n+1])
        ans = two_sum(nums, target)
        if ans:
            print(f"{ans[0]} {ans[1]}")
""",
                        "javascript": """// Two Sum (Exam Mode)
// Complete the function below to return indices of the two numbers.
const fs = require('fs');

function twoSum(nums, target) {
    // Write your solution here
}

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!input || input.length < 3) return;
    const n = parseInt(input[0]);
    const nums = [];
    for (let i = 1; i <= n; i++) nums.push(parseInt(input[i]));
    const target = parseInt(input[n + 1]);
    const ans = twoSum(nums, target);
    if (ans) console.log(`${ans[0]} ${ans[1]}`);
}

solve();
""",
                        "cpp": """#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 0;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    int target;
    cin >> target;

    unordered_map<int, int> seen;
    for (int i = 0; i < n; i++) {
        int comp = target - nums[i];
        if (seen.count(comp)) {
            cout << seen[comp] << " " << i << endl;
            return 0;
        }
        seen[nums[i]] = i;
    }
    return 0;
}
""",
                        "java": """// Two Sum (Exam Mode)
// Return the indices of the two numbers such that they add up to target.
import java.io.*;
import java.util.*;

public class Main {
    public static int[] twoSum(int[] nums, int target) {
        // Write your solution here
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int comp = target - nums[i];
            if (seen.containsKey(comp)) {
                return new int[]{seen.get(comp), i};
            }
            seen.put(nums[i], i);
        }
        return new int[0];
    }

    public static void main(String[] args) throws Exception {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextInt()) return;
        int n = scanner.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) {
            nums[i] = scanner.nextInt();
        }
        int target = scanner.nextInt();
        int[] ans = twoSum(nums, target);
        if (ans != null && ans.length >= 2) {
            System.out.println(ans[0] + " " + ans[1]);
        }
    }
}
"""
                    },
                    # 20 robust test cases with exactly one valid pair
                    "test_cases": [
                        ("4\n2 7 11 15\n9", "0 1", 0),
                        ("3\n3 2 4\n6", "1 2", 0),
                        ("2\n3 3\n6", "0 1", 0),
                        ("5\n1 5 4 7 9\n12", "1 3", 1),
                        ("5\n10 20 8 40 60\n70", "0 4", 1),
                        ("4\n-1 -2 -3 -4\n-7", "2 3", 1),
                        ("4\n-10 7 15 3\n-7", "0 3", 1),
                        ("6\n0 4 3 0 1 2\n0", "0 3", 1),
                        ("5\n100 200 500 400 300\n600", "0 2", 1),
                        ("6\n1 2 8 4 5 6\n11", "4 5", 1),
                        ("5\n-5 1 9 3 8\n3", "0 4", 1),
                        ("4\n25 30 40 55\n80", "0 3", 1),
                        ("5\n9 4 1 8 5\n10", "0 2", 1),
                        ("5\n10 15 3 7 20\n22", "1 3", 1),
                        ("4\n-100 0 100 50\n0", "0 2", 1),
                        ("5\n2 4 6 8 10\n18", "3 4", 1),
                        ("4\n12 15 20 30\n42", "0 3", 1),
                        ("5\n7 10 14 17 23\n30", "0 4", 1),
                        ("4\n500 700 1200 2000\n2500", "0 3", 1),
                        ("6\n1 3 5 7 9 11\n14", "2 4", 1),
                        ("5\n8 2 15 6 3\n5", "1 4", 1)
                    ]
                },
                {
                    "id": "prob_valid_parentheses",
                    "title": "Valid Parentheses",
                    "slug": "valid-parentheses",
                    "difficulty": "Easy",
                    "category": "Stack & Strings",
                    "description": """Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

### Input Format
A single line containing the bracket string `s`.

### Output Format
Print `true` if valid, otherwise `false`.""",
                    "constraints": "1 <= s.length <= 10^4\ns consists of parentheses only '()[]{}'.",
                    "sample_cases": [
                        {"input": "()", "output": "true", "explanation": "Matching single pair of parentheses."},
                        {"input": "()[]{}", "output": "true", "explanation": "All bracket pairs are correctly nested and closed."},
                        {"input": "(]", "output": "false", "explanation": "Opening round bracket is improperly closed with square bracket."}
                    ],
                    "templates": {
                        "python": """# Valid Parentheses (Exam Mode)
# Complete the function below to determine if the string is valid.
import sys

def is_valid(s: str) -> bool:
    # Write your solution here
    pass

if __name__ == '__main__':
    s = sys.stdin.read().strip()
    print(str(is_valid(s)).lower())
""",
                        "javascript": """// Valid Parentheses (Exam Mode)
// Complete the function below to determine if the string is valid.
const fs = require('fs');

function isValid(s) {
    // Write your solution here
}

const s = fs.readFileSync(0, 'utf-8').trim();
console.log(isValid(s) ? 'true' : 'false');
""",
                        "cpp": """// Valid Parentheses (Exam Mode)
// Complete the function below to determine if the string is valid.
#include <iostream>
#include <string>
#include <stack>
#include <unordered_map>

using namespace std;

bool isValid(const string& s) {
    // Write your solution here
    stack<char> st;
    unordered_map<char, char> mapping = {{')', '('}, {'}', '{'}, {']', '['}};
    for (char c : s) {
        if (mapping.count(c)) {
            if (st.empty() || st.top() != mapping[c]) return false;
            st.pop();
        } else {
            st.push(c);
        }
    }
    return st.empty();
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    string s;
    if (cin >> s) {
        cout << (isValid(s) ? "true" : "false") << "\\n";
    }
    return 0;
}
""",
                        "java": """// Valid Parentheses (Exam Mode)
// Complete the function below to determine if the string is valid.
import java.io.*;
import java.util.*;

public class Main {
    public static boolean isValid(String s) {
        // Write your solution here
        Deque<Character> stack = new ArrayDeque<>();
        Map<Character, Character> map = new HashMap<>();
        map.put(')', '(');
        map.put('}', '{');
        map.put(']', '[');

        for (char c : s.toCharArray()) {
            if (map.containsKey(c)) {
                if (stack.isEmpty() || stack.pop() != map.get(c)) return false;
            } else {
                stack.push(c);
            }
        }
        return stack.isEmpty();
    }

    public static void main(String[] args) throws Exception {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String s = reader.readLine();
        if (s != null) {
            System.out.println(isValid(s.trim()) ? "true" : "false");
        }
    }
}
"""
                    },
                    "test_cases": [
                        ("()", "true", 0),
                        ("()[]{}", "true", 0),
                        ("(]", "false", 0),
                        ("([)]", "false", 1),
                        ("{[]}", "true", 1),
                        ("(", "false", 1),
                        ("]", "false", 1),
                        ("((()))", "true", 1),
                        ("((())", "false", 1),
                        ("{[()]}", "true", 1),
                        ("((({[]})))", "true", 1),
                        ("((({[}])))", "false", 1),
                        ("()()()()", "true", 1),
                        ("[][][][][]", "true", 1),
                        ("{}{}{}", "true", 1),
                        ("(((((((((())))))))))", "true", 1),
                        ("(((((((((()))))))))", "false", 1),
                        ("([]{})", "true", 1),
                        ("([{}]){[]}", "true", 1),
                        ("({[}])", "false", 1),
                        ("()[]{}([{}])", "true", 1)
                    ]
                }
            ]

            for p in problems:
                conn.execute(
                    """INSERT INTO coding_problems (
                        id, title, slug, difficulty, category, description,
                        constraints, sample_cases_json, starter_templates_json,
                        created_by, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        p["id"],
                        p["title"],
                        p["slug"],
                        p["difficulty"],
                        p["category"],
                        p["description"],
                        p["constraints"],
                        json.dumps(p["sample_cases"]),
                        json.dumps(p["templates"]),
                        "Koinexa SDE Arena",
                        str(time.time())
                    )
                )

                # Insert test cases (3 sample + >= 17 hidden = >= 20 total)
                tc_rows = [
                    (str(uuid.uuid4()), p["id"], idx + 1, tc[0], tc[1], tc[2])
                    for idx, tc in enumerate(p["test_cases"])
                ]
                conn.executemany(
                    """INSERT INTO problem_test_cases (
                        id, problem_id, case_number, input_data, expected_output, is_hidden
                    ) VALUES (?, ?, ?, ?, ?, ?)""",
                    tc_rows
                )

        # ── 5. SEED WHATSAPP-STYLE COMMUNITIES ──────────────────────────
        comm_count = conn.execute("SELECT COUNT(*) as c FROM communities").fetchone()["c"]
        if comm_count == 0:
            communities = [
                (
                    "comm_dsa",
                    "DSA & LeetCode SDE Grind",
                    "Dedicated community for daily LeetCode discussions, technical interview prep, and algorithmic optimizations.",
                    "⚡",
                    "Competitive Programming",
                    1420,
                    str(time.time())
                ),
                (
                    "comm_webdev",
                    "Full Stack Web Devs",
                    "React 19, Node.js, Next.js, System Design, and building production-grade web applications.",
                    "🌐",
                    "Software Engineering",
                    980,
                    str(time.time())
                ),
                (
                    "comm_jee",
                    "JEE Main & Advanced 2026",
                    "High-yield doubt solving, daily formula sheets, and mock exam analysis for IIT-JEE aspirants.",
                    "🎯",
                    "Academics",
                    2100,
                    str(time.time())
                ),
                (
                    "comm_aiml",
                    "AI, LLMs & Systems Engineering",
                    "Research papers, transformer architectures, PyTorch, CUDA, and generative AI systems.",
                    "🧠",
                    "Artificial Intelligence",
                    640,
                    str(time.time())
                )
            ]
            conn.executemany(
                "INSERT INTO communities (id, name, description, avatar, category, members_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                communities
            )

            # Channels
            channels = [
                ("chan_dsa_ann", "comm_dsa", "Announcements", "announcement"),
                ("chan_dsa_gen", "comm_dsa", "Daily Problems", "general"),
                ("chan_dsa_dbt", "comm_dsa", "Doubt Discussions", "doubts"),
                ("chan_web_gen", "comm_webdev", "General Chat", "general"),
                ("chan_web_prj", "comm_webdev", "Project Showcase", "general"),
                ("chan_jee_dbt", "comm_jee", "Physics & Math Doubts", "doubts"),
                ("chan_ai_gen", "comm_aiml", "Paper Discussions", "general"),
            ]
            conn.executemany(
                "INSERT INTO community_channels (id, community_id, name, channel_type) VALUES (?, ?, ?, ?)",
                channels
            )

            # Initial messages
            now = time.time()
            msgs = [
                ("msg_1", "comm_dsa", "chan_dsa_gen", "Ananya Sharma", "https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya", "Today's problem of the day is Two Sum and Trapping Rain Water! Pay close attention to two-pointer optimizations.", "const left = 0, right = n - 1;", str(now - 1800)),
                ("msg_2", "comm_dsa", "chan_dsa_gen", "Sujan M", "https://api.dicebear.com/7.x/bottts/svg?seed=Sujan", "For Two Sum, using a hash map gives O(N) time and O(N) space. If the array is sorted, two pointers gives O(1) auxiliary space!", None, str(now - 1200)),
                ("msg_3", "comm_dsa", "chan_dsa_gen", "Rohit Verma", "https://api.dicebear.com/7.x/avataaars/svg?seed=Rohit", "Just submitted my solution in Code Lab! All 20 test cases passed with 1.2ms latency 🚀", None, str(now - 300)),
                ("msg_4", "comm_webdev", "chan_web_gen", "Shreya Sen", "https://api.dicebear.com/7.x/avataaars/svg?seed=Shreya", "Welcome all full-stack developers to Koinexa! Check out our new LeetCode and JEE arena.", None, str(now - 3600)),
            ]
            conn.executemany(
                "INSERT INTO messages (id, community_id, channel_id, user_name, user_avatar, text, code_snippet, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                msgs
            )

            # Seed sample studymate connection
            conn.execute(
                "INSERT OR IGNORE INTO studymate_connections (user_id, target_user_id, created_at) VALUES (?, ?, ?)",
                ("u_sujan", "u_ananya", str(time.time()))
            )

        # ── 5. SEED FACULTY & UNIVERSITY CLASSROOM EXTENSION ───────────
        raghavan_pass = generate_password_hash("faculty123")
        sujan_pass = generate_password_hash("password123")
        now = time.time()

        # Seed/ensure demo faculty user exists
        conn.execute("""
            INSERT OR IGNORE INTO users (id, username, password_hash, email, name, handle, avatar, bio, college, role, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "u_faculty_1",
            "prof_raghavan",
            raghavan_pass,
            "raghavan@iitm.ac.in",
            "Prof. K. Raghavan",
            "@prof_raghavan",
            "https://api.dicebear.com/7.x/bottts/svg?seed=raghavan",
            "Professor of Computer Science & Engineering @ IIT Madras. Distributed Systems, Algorithmic Analysis & Architecture.",
            "IIT Madras",
            "university",
            "active",
            str(now)
        ))

        # Ensure passwords, status and roles are initialized properly
        conn.execute("UPDATE users SET password_hash = ? WHERE username = 'prof_raghavan' AND password_hash IS NULL", (raghavan_pass,))
        conn.execute("UPDATE users SET role = 'university', status = 'active' WHERE username = 'prof_raghavan'")
        conn.execute("UPDATE users SET password_hash = ? WHERE username = 'sujan12345' AND password_hash IS NULL", (sujan_pass,))
        conn.execute("UPDATE users SET role = 'student', status = 'active' WHERE username != 'prof_raghavan' AND (role IS NULL OR role = '')")

        # Seed Classrooms (each with 32-character ID)
        classrooms_count = conn.execute("SELECT COUNT(*) as c FROM classrooms").fetchone()["c"]
        if classrooms_count == 0:
            c1_id = "a1b2c3d4e5f6789012345678abcdef01" # 32 chars
            c2_id = "f9e8d7c6b5a4321001234567fedcba99" # 32 chars

            conn.execute("""
                INSERT INTO classrooms (id, name, subject_code, department, university, description, faculty_id, faculty_name, faculty_avatar, cover_gradient, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                c1_id,
                "Advanced Data Structures & Algorithms",
                "CS301",
                "Computer Science & Engineering",
                "IIT Madras",
                "Official Fall 2026 classroom for CS301. Topics include Red-Black Trees, Dynamic Programming Optimizations, Network Flow, and Disjoint Sets.",
                "u_faculty_1",
                "Prof. K. Raghavan",
                "https://api.dicebear.com/7.x/bottts/svg?seed=raghavan",
                "from-[#0A3D78] via-[#0B254E] to-[#051329]",
                str(now - 86400 * 5)
            ))

            conn.execute("""
                INSERT INTO classrooms (id, name, subject_code, department, university, description, faculty_id, faculty_name, faculty_avatar, cover_gradient, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                c2_id,
                "Operating Systems & Distributed Architecture",
                "CS304",
                "Computer Science & Engineering",
                "IIT Madras",
                "Concurrency, virtual memory paging, microkernels, and distributed consensus algorithms (Raft/Paxos).",
                "u_faculty_1",
                "Prof. K. Raghavan",
                "https://api.dicebear.com/7.x/bottts/svg?seed=raghavan",
                "from-emerald-600 via-teal-600 to-cyan-700",
                str(now - 86400 * 3)
            ))

            # Members
            # Faculty is accepted member in both
            conn.execute("""
                INSERT INTO classroom_members (id, classroom_id, user_id, role, status, joined_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, ("m_fac_1", c1_id, "u_faculty_1", "faculty", "accepted", str(now - 86400 * 5), str(now - 86400 * 5)))
            conn.execute("""
                INSERT INTO classroom_members (id, classroom_id, user_id, role, status, joined_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, ("m_fac_2", c2_id, "u_faculty_1", "faculty", "accepted", str(now - 86400 * 3), str(now - 86400 * 3)))

            # Sujan is enrolled in CS301
            conn.execute("""
                INSERT INTO classroom_members (id, classroom_id, user_id, role, status, joined_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, ("m_suj_1", c1_id, "u_sujan", "student", "accepted", str(now - 86400 * 4), str(now - 86400 * 4)))

            # Ananya requested to join CS301 (status: pending)
            conn.execute("""
                INSERT INTO classroom_members (id, classroom_id, user_id, role, status, joined_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, ("m_ana_1", c1_id, "u_ananya", "student", "pending", str(now - 3600 * 3), str(now - 3600 * 3)))

            # Rohit requested to join CS304 (status: pending)
            conn.execute("""
                INSERT INTO classroom_members (id, classroom_id, user_id, role, status, joined_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, ("m_roh_1", c2_id, "u_rohit", "student", "pending", str(now - 3600 * 1), str(now - 3600 * 1)))

            # Seed Notification for Prof. Raghavan about Ananya's request
            conn.execute("""
                INSERT INTO notifications (id, user_id, sender_id, sender_name, type, title, message, data_json, is_read, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "notif_join_1",
                "u_faculty_1",
                "u_ananya",
                "Ananya Sharma",
                "join_request",
                "New Classroom Join Request",
                "Ananya Sharma (@ananya_codes) requested to join Advanced Data Structures & Algorithms (CS301).",
                json.dumps({
                    "classroom_id": c1_id,
                    "classroom_name": "Advanced Data Structures & Algorithms",
                    "subject_code": "CS301",
                    "member_id": "m_ana_1",
                    "student_id": "u_ananya",
                    "student_name": "Ananya Sharma",
                    "student_handle": "@ananya_codes",
                    "student_college": "BITS Pilani"
                }),
                0,
                str(now - 3600 * 3)
            ))

            # Seed Notification for Prof. Raghavan about Rohit's request
            conn.execute("""
                INSERT INTO notifications (id, user_id, sender_id, sender_name, type, title, message, data_json, is_read, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "notif_join_2",
                "u_faculty_1",
                "u_rohit",
                "Rohit Verma",
                "join_request",
                "New Classroom Join Request",
                "Rohit Verma (@rohit_ai) requested to join Operating Systems & Distributed Architecture (CS304).",
                json.dumps({
                    "classroom_id": c2_id,
                    "classroom_name": "Operating Systems & Distributed Architecture",
                    "subject_code": "CS304",
                    "member_id": "m_roh_1",
                    "student_id": "u_rohit",
                    "student_name": "Rohit Verma",
                    "student_handle": "@rohit_ai",
                    "student_college": "IIIT Hyderabad"
                }),
                0,
                str(now - 3600 * 1)
            ))

            # Seed Subject 1: Home Feed Posts
            conn.execute("""
                INSERT INTO classroom_posts (id, classroom_id, user_id, user_name, user_avatar, post_type, title, content, attachment_url, likes_count, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "cp_1",
                c1_id,
                "u_faculty_1",
                "Prof. K. Raghavan",
                "https://api.dicebear.com/7.x/bottts/svg?seed=raghavan",
                "announcement",
                "Welcome to CS301: Advanced Data Structures & Algorithms (Fall 2026)",
                "Welcome all enrolled students! In this course, we examine state-of-the-art algorithmic techniques, amortized complexity bounds, and cache-oblivious data structures. Weekly lab assignments and live contests will be hosted directly in this portal.",
                "https://iitm.ac.in/cs301-syllabus.pdf",
                18,
                str(now - 86400 * 4)
            ))

            conn.execute("""
                INSERT INTO classroom_posts (id, classroom_id, user_id, user_name, user_avatar, post_type, title, content, attachment_url, likes_count, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "cp_2",
                c1_id,
                "u_faculty_1",
                "Prof. K. Raghavan",
                "https://api.dicebear.com/7.x/bottts/svg?seed=raghavan",
                "lecture",
                "Lecture 1 & 2 Handouts: Splay Trees & Fibonacci Heaps",
                "Review the PDF notes and verify the amortized O(log N) potential function analysis for zig-zig and zig-zag rotation steps before attending Thursday's seminar.",
                None,
                12,
                str(now - 86400 * 2)
            ))

            # Seed Subject 1: Communities Messages
            c_msgs = [
                ("cmsg_1", c1_id, "u_faculty_1", "Prof. K. Raghavan", "https://api.dicebear.com/7.x/bottts/svg?seed=raghavan", "faculty", "Welcome to the CS301 discussion stream. Post questions regarding homework problems or algorithm implementations here.", None, str(now - 86400 * 3)),
                ("cmsg_2", c1_id, "u_sujan", "Sujan M", "https://api.dicebear.com/7.x/bottts/svg?seed=Sujan", "student", "Hello Professor! For the Fibonacci heap extract-min operation, are cascading cuts strictly required or can we maintain tree balance lazily?", None, str(now - 3600 * 10)),
                ("cmsg_3", c1_id, "u_faculty_1", "Prof. K. Raghavan", "https://api.dicebear.com/7.x/bottts/svg?seed=raghavan", "faculty", "Cascading cuts are mandatory to ensure that the degree of any node in an n-node heap remains bounded by O(log n). Look into Lemma 19.1 in CLRS.", "def cascading_cut(y):\n    z = y.parent\n    if z is not None:\n        if not y.mark:\n            y.mark = True\n        else:\n            cut(y, z)\n            cascading_cut(z)", str(now - 3600 * 8)),
                ("cmsg_4", c1_id, "u_sujan", "Sujan M", "https://api.dicebear.com/7.x/bottts/svg?seed=Sujan", "student", "That makes complete sense now! Thank you Professor.", None, str(now - 3600 * 7)),
            ]
            conn.executemany("""
                INSERT INTO classroom_messages (id, classroom_id, user_id, user_name, user_avatar, role, text, code_snippet, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, c_msgs)

            # Seed Subject 1: Contests Tab (Classroom Quiz)
            c_quiz_questions = [
                {
                    "id": "cq_1",
                    "section": "Advanced Algorithms",
                    "question_num": 1,
                    "question": "In a Splay Tree, what is the amortized time complexity of any sequence of m operations on an n-node tree starting from an empty tree?",
                    "options": [
                        "O(m log n)",
                        "O(m + n log n)",
                        "O(m * n)",
                        "O(m * sqrt(n))"
                    ],
                    "correct_index": 0,
                    "correct_answer": "O(m log n)",
                    "explanation": "By Sleator and Tarjan's Access Theorem, an arbitrary sequence of m splay operations on an n-node tree takes O(m log n) amortized time."
                },
                {
                    "id": "cq_2",
                    "section": "Advanced Algorithms",
                    "question_num": 2,
                    "question": "In a Fibonacci Heap, which of the following operations has an amortized time complexity of O(log n) rather than O(1)?",
                    "options": [
                        "Insert",
                        "Find-Min",
                        "Extract-Min",
                        "Decrease-Key"
                    ],
                    "correct_index": 2,
                    "correct_answer": "Extract-Min",
                    "explanation": "Extract-Min has amortized O(log n) complexity due to consolidating root trees of equal degrees. Insert, Find-Min, and Decrease-Key are all O(1) amortized."
                },
                {
                    "id": "cq_3",
                    "section": "Advanced Algorithms",
                    "question_num": 3,
                    "question": "What is the maximum degree of any node in an n-node Fibonacci heap?",
                    "options": [
                        "O(n)",
                        "O(log n)",
                        "O(sqrt(n))",
                        "O(1)"
                    ],
                    "correct_index": 1,
                    "correct_answer": "O(log n)",
                    "explanation": "The maximum degree is bounded by floor(log_phi(n)) = O(log n), where phi is the golden ratio."
                }
            ]

            conn.execute("""
                INSERT INTO classroom_quizzes (id, classroom_id, title, description, duration_minutes, total_marks, positive_marks, negative_marks, sections_json, questions_json, created_by, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "cquiz_cs301_1",
                c1_id,
                "CS301 Surprise Quiz 1: Amortized Analysis & Heaps",
                "Faculty-assigned assessment testing amortized potential functions, splay trees, and Fibonacci heaps.",
                30,
                12,
                4.0,
                1.0,
                json.dumps([{"name": "Advanced Algorithms", "total_questions": 3}]),
                json.dumps(c_quiz_questions),
                "Prof. K. Raghavan",
                str(now - 86400 * 1)
            ))

            # Seed Subject 1: Challenges Tab (Classroom Coding Problem)
            sample_cases_prob = [
                {
                    "input": "[10,9,2,5,3,7,101,18]",
                    "output": "4",
                    "explanation": "The longest increasing subsequence is [2, 3, 7, 101], therefore the length is 4."
                },
                {
                    "input": "[0,1,0,3,2,3]",
                    "output": "4",
                    "explanation": "The longest increasing subsequence is [0, 1, 2, 3]."
                }
            ]

            starter_prob = {
                "python": "def length_of_lis(nums):\n    # TODO: Implement O(N log N) patience sorting\n    pass\n",
                "cpp": "#include <vector>\n#include <algorithm>\n\nclass Solution {\npublic:\n    int lengthOfLIS(std::vector<int>& nums) {\n        // TODO: Implement O(N log N) LIS\n        return 0;\n    }\n};",
                "java": "import java.util.*;\n\nclass Solution {\n    public int lengthOfLIS(int[] nums) {\n        // TODO: Implement O(N log N) LIS\n        return 0;\n    }\n}"
            }

            conn.execute("""
                INSERT INTO classroom_problems (id, classroom_id, title, slug, difficulty, category, description, constraints, sample_cases_json, starter_templates_json, created_by, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "cprob_cs301_1",
                c1_id,
                "CS301 Challenge: Longest Increasing Subsequence in O(N log N)",
                "cs301-longest-increasing-subsequence",
                "Medium",
                "Dynamic Programming & Binary Search",
                "Given an integer array nums, return the length of the longest strictly increasing subsequence.\n\nTo receive full credit for CS301 Lab 1, you must achieve O(N log N) time complexity using binary search or patience sorting, not the quadratic O(N^2) solution.",
                "1 <= nums.length <= 2500\n-10^4 <= nums[i] <= 10^4",
                json.dumps(sample_cases_prob),
                json.dumps(starter_prob),
                "Prof. K. Raghavan",
                str(now - 86400 * 2)
            ))


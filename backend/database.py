# -*- coding: utf-8 -*-
"""
Koinexa Database Persistence Layer
SQLite3 WAL-mode database with thread-safe pooling.
"""

import os
import shutil
import sqlite3
import threading
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

def resolve_database_path() -> Path:
    env_path = os.environ.get("DATABASE_PATH") or os.environ.get("KOINEXA_DB_PATH")
    if env_path:
        target = Path(env_path)
    elif Path("/data").is_dir() and os.access("/data", os.W_OK):
        target = Path("/data") / "koinexa.db"
    elif Path("/var/data").is_dir() and os.access("/var/data", os.W_OK):
        target = Path("/var/data") / "koinexa.db"
    else:
        target = BASE_DIR / "koinexa.db"

    # If a persistent volume exists and the database file does not exist yet,
    # copy the seed template once. Subsequent deploys will never overwrite it.
    if not target.exists():
        try:
            target.parent.mkdir(parents=True, exist_ok=True)
            template_db = BASE_DIR / "koinexa.db"
            if template_db.exists() and template_db != target:
                shutil.copy2(template_db, target)
                print(f"[Database] Bootstrapped persistent database at: {target}")
        except Exception as e:
            print(f"[Database] Notice during persistent storage bootstrap: {e}")

    return target

DATABASE_PATH = resolve_database_path()

_db_local = threading.local()

def get_db_connection() -> sqlite3.Connection:
    conn = getattr(_db_local, "conn", None)
    if conn is None:
        conn = sqlite3.connect(str(DATABASE_PATH), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        conn.execute("PRAGMA journal_mode = WAL")
        conn.execute("PRAGMA synchronous = NORMAL")
        conn.execute("PRAGMA busy_timeout = 10000")
        conn.execute("PRAGMA cache_size = -32000")
        conn.execute("PRAGMA temp_store = MEMORY")
        _db_local.conn = conn
    return conn

def init_db() -> None:
    with get_db_connection() as conn:
        conn.execute("PRAGMA journal_mode = WAL")
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT,
                email TEXT,
                contact_email TEXT,
                name TEXT NOT NULL,
                handle TEXT NOT NULL,
                avatar TEXT,
                bio TEXT,
                college TEXT,
                role TEXT NOT NULL DEFAULT 'student',
                status TEXT NOT NULL DEFAULT 'active',
                banned INTEGER NOT NULL DEFAULT 0,
                banned_reason TEXT,
                banned_at TEXT,
                rejection_reason TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS students (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                email TEXT NOT NULL,
                contact_email TEXT NOT NULL,
                name TEXT NOT NULL,
                handle TEXT NOT NULL,
                avatar TEXT,
                bio TEXT,
                college TEXT,
                role TEXT NOT NULL DEFAULT 'student',
                status TEXT NOT NULL DEFAULT 'active',
                banned INTEGER NOT NULL DEFAULT 0,
                banned_reason TEXT,
                banned_at TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS mentors (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                email TEXT NOT NULL,
                contact_email TEXT NOT NULL,
                name TEXT NOT NULL,
                handle TEXT NOT NULL,
                avatar TEXT,
                bio TEXT,
                institution TEXT NOT NULL,
                department TEXT NOT NULL,
                college TEXT,
                designation TEXT,
                proof_link_1 TEXT,
                proof_link_2 TEXT,
                statement_of_purpose TEXT,
                role TEXT NOT NULL DEFAULT 'university', -- 'university' or 'admin'
                status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
                banned INTEGER NOT NULL DEFAULT 0,
                banned_reason TEXT,
                banned_at TEXT,
                rejection_reason TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS auth_tokens (
                token TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS studymate_connections (
                user_id TEXT NOT NULL,
                target_user_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                PRIMARY KEY (user_id, target_user_id)
            );

            CREATE TABLE IF NOT EXISTS studymate_requests (
                id TEXT PRIMARY KEY,
                sender_id TEXT NOT NULL,
                receiver_id TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                UNIQUE(sender_id, receiver_id)
            );

            CREATE TABLE IF NOT EXISTS direct_messages (
                id TEXT PRIMARY KEY,
                sender_id TEXT NOT NULL,
                receiver_id TEXT NOT NULL,
                sender_name TEXT NOT NULL,
                sender_avatar TEXT,
                text TEXT NOT NULL,
                code_snippet TEXT,
                shared_post_id TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS posts (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                user_name TEXT NOT NULL,
                user_handle TEXT NOT NULL,
                user_avatar TEXT,
                post_type TEXT NOT NULL, -- 'youtube_course', 'tweet', 'hackathon'
                title TEXT,
                content TEXT NOT NULL,
                why_recommend TEXT,
                youtube_url TEXT,
                course_url TEXT,
                image_url TEXT,
                tags TEXT,
                likes_count INTEGER DEFAULT 0,
                comments_count INTEGER DEFAULT 0,
                reposts_count INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS post_likes (
                post_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                PRIMARY KEY (post_id, user_id)
            );

            CREATE TABLE IF NOT EXISTS post_comments (
                id TEXT PRIMARY KEY,
                post_id TEXT NOT NULL,
                user_name TEXT NOT NULL,
                user_avatar TEXT,
                comment_text TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS quizzes (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                exam_type TEXT NOT NULL DEFAULT 'jee_main',
                duration_minutes INTEGER NOT NULL DEFAULT 60,
                total_marks INTEGER NOT NULL DEFAULT 120,
                positive_marks REAL NOT NULL DEFAULT 4.0,
                negative_marks REAL NOT NULL DEFAULT 1.0,
                sections_json TEXT NOT NULL,
                questions_json TEXT NOT NULL,
                created_by TEXT NOT NULL,
                rating_avg REAL DEFAULT 4.8,
                rating_count INTEGER DEFAULT 1,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS quiz_attempts (
                id TEXT PRIMARY KEY,
                quiz_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                user_name TEXT NOT NULL,
                score REAL NOT NULL,
                total_marks REAL NOT NULL,
                accuracy REAL NOT NULL,
                time_taken_seconds INTEGER NOT NULL,
                answers_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS quiz_ratings (
                id TEXT PRIMARY KEY,
                quiz_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                rating INTEGER NOT NULL,
                feedback TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS coding_problems (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                difficulty TEXT NOT NULL, -- 'Easy', 'Medium', 'Hard'
                category TEXT NOT NULL,
                description TEXT NOT NULL,
                constraints TEXT NOT NULL,
                sample_cases_json TEXT NOT NULL,
                starter_templates_json TEXT NOT NULL,
                duration_minutes INTEGER NOT NULL DEFAULT 45,
                created_by TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS problem_test_cases (
                id TEXT PRIMARY KEY,
                problem_id TEXT NOT NULL,
                case_number INTEGER NOT NULL,
                input_data TEXT NOT NULL,
                expected_output TEXT NOT NULL,
                is_hidden INTEGER NOT NULL DEFAULT 1,
                FOREIGN KEY (problem_id) REFERENCES coding_problems(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS submissions (
                id TEXT PRIMARY KEY,
                problem_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                language TEXT NOT NULL,
                code TEXT NOT NULL,
                verdict TEXT NOT NULL,
                passed_count INTEGER NOT NULL,
                total_count INTEGER NOT NULL,
                execution_time_ms REAL NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (problem_id) REFERENCES coding_problems(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS communities (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                avatar TEXT NOT NULL,
                category TEXT NOT NULL,
                members_count INTEGER DEFAULT 1,
                created_at TEXT NOT NULL,
                admin_id TEXT
            );

            CREATE TABLE IF NOT EXISTS community_channels (
                id TEXT PRIMARY KEY,
                community_id TEXT NOT NULL,
                name TEXT NOT NULL,
                channel_type TEXT NOT NULL, -- 'announcement', 'general', 'doubts'
                FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                community_id TEXT NOT NULL,
                channel_id TEXT NOT NULL,
                user_name TEXT NOT NULL,
                user_avatar TEXT,
                text TEXT NOT NULL,
                code_snippet TEXT,
                created_at TEXT NOT NULL
            );

            -- ─── UNIVERSITY CLASSROOM & EXTENSION TABLES ────────────────
            CREATE TABLE IF NOT EXISTS classrooms (
                id TEXT PRIMARY KEY, -- 32-character unique ID
                name TEXT NOT NULL,
                subject_code TEXT NOT NULL,
                department TEXT,
                university TEXT NOT NULL,
                description TEXT,
                faculty_id TEXT NOT NULL,
                faculty_name TEXT NOT NULL,
                faculty_avatar TEXT,
                cover_gradient TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS classroom_members (
                id TEXT PRIMARY KEY,
                classroom_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'student', -- 'student' or 'faculty'
                status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
                joined_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(classroom_id, user_id)
            );

            CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                sender_id TEXT,
                sender_name TEXT,
                type TEXT NOT NULL, -- 'join_request', 'join_accepted', 'join_rejected', 'new_post', 'new_contest', 'new_challenge'
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                data_json TEXT, -- JSON containing classroom_id, member_id, etc.
                is_read INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS classroom_posts (
                id TEXT PRIMARY KEY,
                classroom_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                user_name TEXT NOT NULL,
                user_avatar TEXT,
                post_type TEXT NOT NULL DEFAULT 'announcement', -- 'announcement', 'lecture', 'resource', 'assignment'
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                attachment_url TEXT,
                youtube_url TEXT,
                image_url TEXT,
                tags TEXT,
                likes_count INTEGER DEFAULT 0,
                comments_count INTEGER DEFAULT 0,
                reposts_count INTEGER DEFAULT 0,
                is_pinned INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS classroom_messages (
                id TEXT PRIMARY KEY,
                classroom_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                user_name TEXT NOT NULL,
                user_avatar TEXT,
                role TEXT NOT NULL DEFAULT 'student',
                text TEXT NOT NULL,
                code_snippet TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS classroom_quizzes (
                id TEXT PRIMARY KEY,
                classroom_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                duration_minutes INTEGER NOT NULL DEFAULT 45,
                total_marks INTEGER NOT NULL DEFAULT 100,
                positive_marks REAL NOT NULL DEFAULT 4.0,
                negative_marks REAL NOT NULL DEFAULT 1.0,
                sections_json TEXT NOT NULL,
                questions_json TEXT NOT NULL,
                created_by TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS classroom_quiz_attempts (
                id TEXT PRIMARY KEY,
                quiz_id TEXT NOT NULL,
                classroom_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                user_name TEXT NOT NULL,
                score REAL NOT NULL,
                total_marks REAL NOT NULL,
                accuracy REAL NOT NULL,
                time_taken_seconds INTEGER NOT NULL,
                answers_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (quiz_id) REFERENCES classroom_quizzes(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS classroom_problems (
                id TEXT PRIMARY KEY,
                classroom_id TEXT NOT NULL,
                title TEXT NOT NULL,
                slug TEXT NOT NULL,
                difficulty TEXT NOT NULL, -- 'Easy', 'Medium', 'Hard'
                category TEXT NOT NULL,
                description TEXT NOT NULL,
                constraints TEXT NOT NULL,
                sample_cases_json TEXT NOT NULL,
                starter_templates_json TEXT NOT NULL,
                created_by TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS classroom_channels (
                id TEXT PRIMARY KEY,
                classroom_id TEXT NOT NULL,
                name TEXT NOT NULL,
                channel_type TEXT NOT NULL DEFAULT 'general',
                created_by TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS classroom_post_likes (
                post_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                PRIMARY KEY (post_id, user_id)
            );

            CREATE TABLE IF NOT EXISTS classroom_post_comments (
                id TEXT PRIMARY KEY,
                post_id TEXT NOT NULL,
                classroom_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                user_name TEXT NOT NULL,
                user_avatar TEXT,
                comment_text TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (post_id) REFERENCES classroom_posts(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS classroom_submissions (
                id TEXT PRIMARY KEY,
                classroom_id TEXT NOT NULL,
                problem_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                user_name TEXT NOT NULL,
                language TEXT NOT NULL,
                code TEXT NOT NULL,
                verdict TEXT NOT NULL,
                passed_count INTEGER NOT NULL,
                total_count INTEGER NOT NULL,
                execution_time_ms REAL NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
                FOREIGN KEY (problem_id) REFERENCES classroom_problems(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS faculty_applications (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                contact_email TEXT,
                institution TEXT NOT NULL,
                department TEXT NOT NULL,
                designation TEXT,
                proof_link_1 TEXT,
                proof_link_2 TEXT,
                linkedin_url TEXT,
                resume_url TEXT,
                id_card_url TEXT,
                extra_links TEXT,
                statement_of_purpose TEXT,
                status TEXT DEFAULT 'pending',
                ai_recommendation TEXT,
                ai_verification_score INTEGER DEFAULT 0,
                ai_risk_score INTEGER DEFAULT 0,
                ai_confidence TEXT DEFAULT 'medium',
                ai_reasoning TEXT,
                ai_dossier_json TEXT,
                link_1_scraped_summary TEXT,
                link_2_scraped_summary TEXT,
                online_search_results_json TEXT,
                reviewed_by TEXT,
                reviewed_at TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS password_resets (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL,
                otp TEXT NOT NULL,
                expires_at REAL NOT NULL,
                used INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS login_otps (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                identifier TEXT NOT NULL,
                contact_email TEXT NOT NULL,
                otp TEXT NOT NULL,
                expires_at REAL NOT NULL,
                used INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sent_emails (
                id TEXT PRIMARY KEY,
                recipient_email TEXT NOT NULL,
                recipient_name TEXT,
                subject TEXT NOT NULL,
                body_html TEXT NOT NULL,
                email_type TEXT NOT NULL,
                sent_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS admin_audit_logs (
                id TEXT PRIMARY KEY,
                action TEXT NOT NULL,
                actor_id TEXT NOT NULL,
                actor_name TEXT NOT NULL,
                target_id TEXT,
                details TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS system_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        """)

        try:
            conn.execute("ALTER TABLE users ADD COLUMN password_hash TEXT")
        except Exception:
            pass
        try:
            conn.execute("ALTER TABLE users ADD COLUMN email TEXT")
        except Exception:
            pass
        try:
            conn.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student'")
        except Exception:
            pass
        try:
            conn.execute("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'")
        except Exception:
            pass
        try:
            conn.execute("ALTER TABLE users ADD COLUMN rejection_reason TEXT")
        except Exception:
            pass
        try:
            conn.execute("ALTER TABLE auth_tokens ADD COLUMN expires_at TEXT")
        except Exception:
            pass
        try:
            conn.execute("ALTER TABLE classroom_posts ADD COLUMN comments_count INTEGER DEFAULT 0")
        except Exception:
            pass
        try:
            conn.execute("ALTER TABLE classroom_posts ADD COLUMN reposts_count INTEGER DEFAULT 0")
        except Exception:
            pass
        try:
            conn.execute("ALTER TABLE classroom_posts ADD COLUMN youtube_url TEXT")
        except Exception:
            pass
        try:
            conn.execute("ALTER TABLE classroom_posts ADD COLUMN tags TEXT")
        except Exception:
            pass
        try:
            conn.execute("ALTER TABLE classroom_posts ADD COLUMN image_url TEXT")
        except Exception:
            pass
        try:
            conn.execute("ALTER TABLE classroom_messages ADD COLUMN channel_id TEXT DEFAULT 'general'")
        except Exception:
            pass
        try:
            conn.execute("ALTER TABLE users ADD COLUMN contact_email TEXT")
        except Exception:
            pass
        try:
            conn.execute("ALTER TABLE faculty_applications ADD COLUMN contact_email TEXT")
        except Exception:
            pass

        for alter_sql in [
            "ALTER TABLE faculty_applications ADD COLUMN proof_link_1 TEXT",
            "ALTER TABLE faculty_applications ADD COLUMN proof_link_2 TEXT",
            "ALTER TABLE faculty_applications ADD COLUMN link_1_scraped_summary TEXT",
            "ALTER TABLE faculty_applications ADD COLUMN link_2_scraped_summary TEXT",
            "ALTER TABLE faculty_applications ADD COLUMN online_search_results_json TEXT",
            "ALTER TABLE mentors ADD COLUMN role TEXT DEFAULT 'university'",
            "ALTER TABLE mentors ADD COLUMN proof_link_1 TEXT",
            "ALTER TABLE mentors ADD COLUMN proof_link_2 TEXT",
            "ALTER TABLE mentors ADD COLUMN college TEXT",
            "ALTER TABLE classroom_posts ADD COLUMN is_pinned INTEGER DEFAULT 0",
            "ALTER TABLE users ADD COLUMN banned INTEGER NOT NULL DEFAULT 0",
            "ALTER TABLE users ADD COLUMN banned_reason TEXT",
            "ALTER TABLE users ADD COLUMN banned_at TEXT",
            "ALTER TABLE students ADD COLUMN banned INTEGER NOT NULL DEFAULT 0",
            "ALTER TABLE students ADD COLUMN banned_reason TEXT",
            "ALTER TABLE students ADD COLUMN banned_at TEXT",
            "ALTER TABLE mentors ADD COLUMN banned INTEGER NOT NULL DEFAULT 0",
            "ALTER TABLE mentors ADD COLUMN banned_reason TEXT",
            "ALTER TABLE mentors ADD COLUMN banned_at TEXT",
            "ALTER TABLE messages ADD COLUMN shared_post_id TEXT",
            "ALTER TABLE messages ADD COLUMN user_id TEXT",
            "ALTER TABLE direct_messages ADD COLUMN shared_post_id TEXT",
            "ALTER TABLE communities ADD COLUMN admin_id TEXT"
        ]:
            try:
                conn.execute(alter_sql)
            except Exception:
                pass

        try:
            conn.execute("UPDATE communities SET admin_id = 'u_1929fbc5cc' WHERE admin_id IS NULL")
        except Exception:
            pass

        conn.executescript("""
            CREATE TABLE IF NOT EXISTS moderation_violations (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                user_name TEXT,
                user_email TEXT,
                user_role TEXT,
                detected_word TEXT,
                detected_language TEXT,
                content_snippet TEXT,
                stage TEXT,
                confidence REAL,
                timestamp TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_mod_violations_user ON moderation_violations(user_id);
            CREATE INDEX IF NOT EXISTS idx_mod_violations_time ON moderation_violations(timestamp);
        """)

        conn.executescript("""
            CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON auth_tokens(user_id);
            CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
            CREATE INDEX IF NOT EXISTS idx_classroom_msgs ON classroom_messages(classroom_id, channel_id);
            CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
            CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
            CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
            CREATE INDEX IF NOT EXISTS idx_classroom_members_user ON classroom_members(user_id);
            CREATE INDEX IF NOT EXISTS idx_classroom_members_class ON classroom_members(classroom_id);
            CREATE INDEX IF NOT EXISTS idx_students_username ON students(username);
            CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
            CREATE INDEX IF NOT EXISTS idx_mentors_username ON mentors(username);
            CREATE INDEX IF NOT EXISTS idx_mentors_email ON mentors(email);
            CREATE INDEX IF NOT EXISTS idx_mentors_status ON mentors(status);
            CREATE INDEX IF NOT EXISTS idx_studymate_req_receiver ON studymate_requests(receiver_id, status);
            CREATE INDEX IF NOT EXISTS idx_studymate_req_sender ON studymate_requests(sender_id);
            CREATE INDEX IF NOT EXISTS idx_dm_pair ON direct_messages(sender_id, receiver_id);
            CREATE INDEX IF NOT EXISTS idx_login_otps_user ON login_otps(user_id, otp);
            CREATE INDEX IF NOT EXISTS idx_login_otps_ident ON login_otps(identifier, otp);
        """)

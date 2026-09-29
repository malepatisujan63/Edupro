# -*- coding: utf-8 -*-
"""
Koinexa Email Dispatch & Outbox Service
Supports:
1. Real SMTP dispatch when environment variables (SMTP_HOST, SMTP_USER, etc.) are present.
2. Local Development & Offline Mode: automatically persists all outgoing emails into the SQLite 'sent_emails' table.
3. Templated HTML notifications for Password Reset OTP, Faculty Acceptance, Faculty Rejection, and Admin Alerts.
"""

import os
import smtplib
import time
import uuid
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path

# Safe import of database connection
try:
    from backend.database import get_db_connection
except ImportError:
    from database import get_db_connection

def get_smtp_config():
    """Retrieve SMTP configuration dynamically from SQLite system_settings or environment."""
    config = {
        "smtp_host": os.environ.get("SMTP_HOST", ""),
        "smtp_port": int(os.environ.get("SMTP_PORT", "587")),
        "smtp_user": os.environ.get("SMTP_USER", ""),
        "smtp_pass": os.environ.get("SMTP_PASS", ""),
        "from_email": os.environ.get("FROM_EMAIL", "veritas@peerbloom.edu"),
        "from_name": os.environ.get("FROM_NAME", "PeerBloom Veritas-AI"),
    }
    try:
        with get_db_connection() as conn:
            rows = conn.execute("SELECT key, value FROM system_settings WHERE key LIKE 'smtp_%' OR key LIKE 'from_%'").fetchall()
            for r in rows:
                k, v = r["key"], r["value"]
                if k in config and v:
                    if k == "smtp_port":
                        try:
                            config[k] = int(v)
                        except Exception:
                            pass
                    else:
                        config[k] = v
    except Exception:
        pass
    return config


def send_email(to_email: str, subject: str, body_html: str, email_type: str, recipient_name: str = "Educator") -> bool:
    """
    Dispatches an email and stores an immutable record in the 'sent_emails' SQLite table.
    Attempts real SMTP delivery if configured.
    """
    now = str(time.time())
    email_id = f"em_{uuid.uuid4().hex[:12]}"
    
    # 1. Always record in SQLite sent_emails table for UI Outbox & auditability
    try:
        with get_db_connection() as conn:
            conn.execute(
                """INSERT INTO sent_emails (id, recipient_email, recipient_name, subject, body_html, email_type, sent_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (email_id, to_email, recipient_name, subject, body_html, email_type, now)
            )
    except Exception as db_err:
        print(f"[EmailService] Failed to log email to DB: {db_err}")

    # 2. Attempt real SMTP transmission if configured
    cfg = get_smtp_config()
    smtp_host = cfg["smtp_host"]
    smtp_port = cfg["smtp_port"]
    smtp_user = cfg["smtp_user"]
    smtp_pass = cfg["smtp_pass"]
    from_email = cfg["from_email"] or smtp_user or "veritas@peerbloom.edu"
    from_name = cfg["from_name"] or "PeerBloom Veritas-AI"

    if smtp_host and smtp_user and smtp_pass:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{from_name} <{from_email}>"
            msg["To"] = to_email
            
            part = MIMEText(body_html, "html")
            msg.attach(part)
            
            if smtp_port == 465:
                with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=12) as server:
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(from_email, [to_email], msg.as_string())
            else:
                with smtplib.SMTP(smtp_host, smtp_port, timeout=12) as server:
                    server.starttls()
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(from_email, [to_email], msg.as_string())
            try:
                print(f"[EmailService] Real SMTP email delivered to {to_email}: {subject}")
            except Exception:
                print(f"[EmailService] Real SMTP email delivered to {to_email}")
            return True
        except Exception as smtp_err:
            print(f"[EmailService] SMTP transmission failed ({smtp_err}); logged to DB outbox.")
            return False
    else:
        # Safe outbox recording mode
        try:
            print(f"[EmailService] [OUTBOX RECORDED] Delivered to '{to_email}' ({email_type}): {subject}")
        except Exception:
            print(f"[EmailService] [OUTBOX RECORDED] Delivered to '{to_email}' ({email_type})")
        return True


def send_test_email(to_email: str) -> tuple[bool, str]:
    """Test SMTP dispatch with detailed diagnostic message."""
    cfg = get_smtp_config()
    smtp_host = cfg["smtp_host"]
    smtp_port = cfg["smtp_port"]
    smtp_user = cfg["smtp_user"]
    smtp_pass = cfg["smtp_pass"]
    from_email = cfg["from_email"] or smtp_user or "veritas@peerbloom.edu"
    from_name = cfg["from_name"] or "PeerBloom Veritas-AI"

    if not (smtp_host and smtp_user and smtp_pass):
        # Dispatch to outbox anyway
        send_otp_email(to_email, "PeerBloom User", "733829")
        return False, "SMTP credentials are not configured yet. The email has been recorded in the local SQLite Outbox (viewable in Admin Dashboard > Outbox History). To deliver directly to your actual Gmail inbox, enter your SMTP_USER and a 16-character Google App Password in the SMTP settings below."

    subject = "⚡ PeerBloom Veritas-AI: Live Email System Test"
    html = f"""<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #050505; color: #f1f5f9; padding: 24px;">
  <div style="max-width: 520px; margin: 0 auto; background: #0f172a; border-radius: 18px; border: 1px solid #1e293b; padding: 32px;">
    <div style="font-size: 20px; font-weight: 800; color: #38bdf8; margin-bottom: 16px;">⚡ PeerBloom Veritas-AI</div>
    <div style="font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 12px;">Live Email Dispatch Confirmed!</div>
    <div style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 20px;">
      Hello! This email confirms that the PeerBloom Veritas-AI email delivery engine is successfully connected and delivering live messages to <strong>{to_email}</strong>.
    </div>
    <div style="background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); border-radius: 12px; padding: 16px; color: #34d399; font-size: 13px; font-family: monospace;">
      STATUS: DELIVERED VIA {smtp_host}:{smtp_port}<br>
      SENDER: {from_name} &lt;{from_email}&gt;<br>
      TIMESTAMP: {time.strftime('%Y-%m-%d %H:%M:%S')}
    </div>
  </div>
</body>
</html>"""

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_name} <{from_email}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html, "html"))

        if smtp_port == 465:
            with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=15) as server:
                server.login(smtp_user, smtp_pass)
                server.sendmail(from_email, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(from_email, [to_email], msg.as_string())
        
        send_email(to_email, subject, html, "system_test", "PeerBloom User")
        return True, f"Email successfully dispatched across the internet to {to_email} via {smtp_host}:{smtp_port}!"
    except smtplib.SMTPAuthenticationError as auth_err:
        return False, f"SMTP Authentication failed: {auth_err}. If using Gmail, make sure you are using a 16-character Google App Password (not your regular account password) with 2FA enabled."
    except Exception as e:
        return False, f"SMTP connection error: {str(e)}"


def send_otp_email(to_email: str, recipient_name: str, otp_code: str) -> bool:
    """Send a secure 6-digit OTP email for password reset."""
    subject = f"Your PeerBloom Password Reset Code: {otp_code}"
    html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #050505; color: #f1f5f9; padding: 24px; margin: 0; }}
    .container {{ max-width: 520px; margin: 0 auto; background: #0f172a; border-radius: 20px; border: 1px solid #1e293b; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }}
    .logo {{ font-size: 20px; font-weight: 800; color: #38bdf8; display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }}
    .title {{ font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }}
    .text {{ font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px; }}
    .otp-box {{ background: #0284c7; background: linear-gradient(135deg, #0284c7, #2563eb); border-radius: 14px; padding: 20px; text-align: center; margin-bottom: 24px; box-shadow: 0 8px 24px rgba(37,99,235,0.3); }}
    .otp-code {{ font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 36px; font-weight: 800; color: #ffffff; letter-spacing: 10px; margin: 0; }}
    .footer {{ font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 18px; margin-top: 24px; }}
    .badge {{ display: inline-block; padding: 4px 10px; background: rgba(56,189,248,0.15); color: #38bdf8; font-size: 11px; font-weight: 600; border-radius: 9999px; margin-bottom: 16px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">⚡ PeerBloom Security</div>
    <div class="badge">Password Reset Request</div>
    <div class="title">Reset Your Account Password</div>
    <div class="text">
      Hello <strong>{recipient_name or 'there'}</strong>,<br><br>
      We received a request to reset the password for your PeerBloom account associated with <strong>{to_email}</strong>. Use the verification code below to authorize this change:
    </div>
    
    <div class="otp-box">
      <div class="otp-code">{otp_code}</div>
    </div>
    
    <div class="text" style="font-size: 13px;">
      ⏳ This security code will expire in <strong>10 minutes</strong>.<br>
      ⚠️ If you did not request a password reset, you can safely ignore this email. Your account remains completely secure.
    </div>
    
    <div class="footer">
      Sent automatically by PeerBloom Veritas-AI Security Engine • &copy; {time.strftime('%Y')} PeerBloom Inc.
    </div>
  </div>
</body>
</html>"""
    return send_email(to_email, subject, html, "otp_verification", recipient_name)


def send_faculty_acceptance_email(to_email: str, recipient_name: str, institution: str = "University") -> bool:
    """Send official faculty approval and welcome email."""
    subject = "🎉 Welcome to PeerBloom Faculty Network! Application Approved"
    html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #050505; color: #f1f5f9; padding: 24px; margin: 0; }}
    .container {{ max-width: 540px; margin: 0 auto; background: #0f172a; border-radius: 20px; border: 1px solid #1e293b; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }}
    .logo {{ font-size: 20px; font-weight: 800; color: #38bdf8; margin-bottom: 20px; }}
    .badge {{ display: inline-block; padding: 5px 12px; background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3); font-size: 12px; font-weight: 700; border-radius: 9999px; margin-bottom: 16px; }}
    .title {{ font-size: 24px; font-weight: 800; color: #ffffff; margin-bottom: 12px; }}
    .text {{ font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 20px; }}
    .card {{ background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 18px; margin-bottom: 24px; }}
    .card-item {{ font-size: 13px; color: #cbd5e1; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }}
    .btn {{ display: inline-block; background: #2563eb; background: linear-gradient(135deg, #0284c7, #2563eb); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: 700; font-size: 14px; box-shadow: 0 8px 20px rgba(37,99,235,0.35); text-align: center; }}
    .footer {{ font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 18px; margin-top: 24px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">⚡ PeerBloom Academic Network</div>
    <div class="badge">✓ Faculty Verified & Approved</div>
    <div class="title">Welcome, Professor!</div>
    
    <div class="text">
      Dear <strong>{recipient_name}</strong>,<br><br>
      We are delighted to inform you that your Faculty Application for <strong>{institution}</strong> has been thoroughly reviewed and <strong>approved</strong> by Veritas-AI and the PeerBloom Academic Board.
    </div>
    
    <div class="card">
      <div style="font-weight: 700; font-size: 14px; color: #ffffff; margin-bottom: 12px;">Unlocked Faculty Privileges:</div>
      <div class="card-item">🏛️ <strong>Create & Lead University Classrooms</strong> with custom syllabus</div>
      <div class="card-item">📝 <strong>Host Full-Screen CBT Quizzes</strong> with automated evaluation</div>
      <div class="card-item">💻 <strong>Publish Coding Challenges</strong> with 20+ automated test cases</div>
      <div class="card-item">💬 <strong>Broadcast Announcements & Study Hubs</strong> to enrolled students</div>
    </div>
    
    <div class="text">
      You can now log in to PeerBloom using your registered email (<strong>{to_email}</strong>) and password to begin creating your subjects and inviting students.
    </div>
    
    <div style="text-align: center; margin: 28px 0;">
      <a href="http://localhost:5174/#/auth" class="btn">Log In to Faculty Portal →</a>
    </div>
    
    <div class="footer">
      Verified by Veritas-AI Academic Credential Engine • PeerBloom Platform
    </div>
  </div>
</body>
</html>"""
    return send_email(to_email, subject, html, "faculty_accepted", recipient_name)


def send_faculty_rejection_email(to_email: str, recipient_name: str, reason: str = "") -> bool:
    """Send respectful faculty rejection email with constructive feedback."""
    subject = "Update regarding your PeerBloom Faculty Application"
    feedback_text = reason or "Submitted credentials or verification links did not meet our verification integrity threshold."
    html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #050505; color: #f1f5f9; padding: 24px; margin: 0; }}
    .container {{ max-width: 520px; margin: 0 auto; background: #0f172a; border-radius: 20px; border: 1px solid #1e293b; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }}
    .logo {{ font-size: 20px; font-weight: 800; color: #38bdf8; margin-bottom: 20px; }}
    .badge {{ display: inline-block; padding: 4px 12px; background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); font-size: 12px; font-weight: 600; border-radius: 9999px; margin-bottom: 16px; }}
    .title {{ font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }}
    .text {{ font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 20px; }}
    .reason-box {{ background: rgba(239,68,68,0.08); border-left: 3px solid #ef4444; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; font-size: 13px; color: #fca5a5; }}
    .footer {{ font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 18px; margin-top: 24px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">⚡ PeerBloom Academic Network</div>
    <div class="badge">Application Review Update</div>
    <div class="title">Faculty Application Status</div>
    
    <div class="text">
      Dear <strong>{recipient_name}</strong>,<br><br>
      Thank you for applying for a Faculty Account on PeerBloom. Following a review of your application, we regret to inform you that we are unable to verify your educator account at this time.
    </div>
    
    <div class="reason-box">
      <strong>Feedback from Review Board:</strong><br>
      {feedback_text}
    </div>
    
    <div class="text">
      You are welcome to re-apply with updated institutional credentials, a valid LinkedIn profile, a clearer resume, or an official faculty ID card.
    </div>
    
    <div class="footer">
      PeerBloom Veritas Academic Verification Board
    </div>
  </div>
</body>
</html>"""
    return send_email(to_email, subject, html, "faculty_rejected", recipient_name)


def get_sent_emails(limit: int = 50):
    """Retrieve recent sent emails for the Admin Outbox Inspector."""
    with get_db_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM sent_emails ORDER BY sent_at DESC LIMIT ?",
            (limit,)
        ).fetchall()
        return [dict(r) for r in rows]

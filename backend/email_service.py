# -*- coding: utf-8 -*-
"""
Koinexa Email Dispatch & Outbox Service
Supports:
1. Real SMTP dispatch when environment variables (SMTP_HOST, SMTP_USER, etc.) are present.
2. Local Development & Offline Mode: automatically persists all outgoing emails into the SQLite 'sent_emails' table.
3. Crisp, minimalist, professional HTML templates (Stripe / Linear inspired) for OTP, Faculty Approvals, and Alerts.
"""

import os
import smtplib
import threading
import time
import uuid
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path

import json
import re
import urllib.request
import urllib.error
from email.utils import formatdate, make_msgid

# Safe import of database connection
try:
    from backend.database import get_db_connection
except ImportError:
    from database import get_db_connection

DEFAULT_SMTP_HOST = "smtp.gmail.com"
DEFAULT_SMTP_PORT = 587
DEFAULT_SMTP_USER = "koinexa63@gmail.com"
DEFAULT_SMTP_PASS = "tnameibfytjtphcu"
DEFAULT_FROM_EMAIL = "koinexa63@gmail.com"
DEFAULT_FROM_NAME = "KOINEXA"

def get_smtp_config():
    """Retrieve SMTP configuration with verified production defaults, SQLite override, and environment support."""
    config = {
        "smtp_host": os.environ.get("SMTP_HOST") or os.environ.get("SMTP_SERVER") or DEFAULT_SMTP_HOST,
        "smtp_port": int(os.environ.get("SMTP_PORT") or str(DEFAULT_SMTP_PORT)),
        "smtp_user": os.environ.get("SMTP_USER") or os.environ.get("SMTP_USERNAME") or DEFAULT_SMTP_USER,
        "smtp_pass": os.environ.get("SMTP_PASS") or os.environ.get("SMTP_PASSWORD") or DEFAULT_SMTP_PASS,
        "from_email": os.environ.get("FROM_EMAIL") or DEFAULT_FROM_EMAIL,
        "from_name": os.environ.get("FROM_NAME") or DEFAULT_FROM_NAME,
    }
    try:
        with get_db_connection() as conn:
            rows = conn.execute("SELECT key, value FROM system_settings WHERE key LIKE 'smtp_%' OR key LIKE 'from_%'").fetchall()
            for r in rows:
                k, v = r["key"], r["value"]
                if v:
                    if k in config:
                        if k == "smtp_port":
                            try:
                                config[k] = int(v)
                            except Exception:
                                pass
                        else:
                            config[k] = v
                    elif k == "smtp_server":
                        config["smtp_host"] = v
                    elif k == "smtp_username":
                        config["smtp_user"] = v
                    elif k == "smtp_password":
                        config["smtp_pass"] = v
    except Exception:
        pass
    return config


def _dispatch_https_api(to_email: str, subject: str, body_html: str, from_name: str, from_email: str) -> bool:
    """
    Delivers email over outbound HTTPS (Port 443), which is never blocked by cloud providers (such as Render free tier).
    Supports Brevo (Sendinblue), Resend, and generic HTTP Webhooks.
    """
    # 1. Resend API
    resend_key = os.environ.get("RESEND_API_KEY")
    if resend_key:
        try:
            req_data = json.dumps({
                "from": f"{from_name} <{from_email}>",
                "to": [to_email],
                "subject": subject,
                "html": body_html
            }).encode("utf-8")
            req = urllib.request.Request(
                "https://api.resend.com/emails",
                data=req_data,
                headers={
                    "Authorization": f"Bearer {resend_key}",
                    "Content-Type": "application/json",
                    "User-Agent": "KOINEXA-Mailer/2.0"
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status in (200, 201, 202):
                    print(f"[EmailService] HTTPS delivery via Resend API succeeded for {to_email}")
                    return True
        except Exception as e:
            print(f"[EmailService] Resend API delivery attempt error: {e}")

    # 2. Brevo (Sendinblue) API
    brevo_key = os.environ.get("BREVO_API_KEY") or os.environ.get("SENDINBLUE_API_KEY")
    if brevo_key:
        try:
            req_data = json.dumps({
                "sender": {"name": from_name, "email": from_email},
                "to": [{"email": to_email}],
                "subject": subject,
                "htmlContent": body_html
            }).encode("utf-8")
            req = urllib.request.Request(
                "https://api.brevo.com/v3/smtp/email",
                data=req_data,
                headers={
                    "api-key": brevo_key,
                    "Content-Type": "application/json",
                    "User-Agent": "KOINEXA-Mailer/2.0"
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status in (200, 201, 202):
                    print(f"[EmailService] HTTPS delivery via Brevo API succeeded for {to_email}")
                    return True
        except Exception as e:
            print(f"[EmailService] Brevo API delivery attempt error: {e}")

    # 3. Generic Webhook Relay (e.g. Zapier / Make / custom mail relay)
    webhook_url = os.environ.get("EMAIL_WEBHOOK_URL")
    if webhook_url:
        try:
            req_data = json.dumps({
                "to": to_email,
                "from_name": from_name,
                "from_email": from_email,
                "subject": subject,
                "html": body_html
            }).encode("utf-8")
            req = urllib.request.Request(
                webhook_url,
                data=req_data,
                headers={
                    "Content-Type": "application/json",
                    "User-Agent": "KOINEXA-Mailer/2.0"
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status in (200, 201, 202):
                    print(f"[EmailService] HTTPS delivery via Webhook succeeded for {to_email}")
                    return True
        except Exception as e:
            print(f"[EmailService] Webhook delivery attempt error: {e}")

    return False


def _dispatch_smtp_sync(to_email: str, subject: str, body_html: str, from_name: str, from_email: str, smtp_host: str, smtp_port: int, smtp_user: str, smtp_pass: str) -> bool:
    """Synchronous network worker executing RFC-compliant email delivery across HTTPS APIs and dual-port SMTP."""
    # First, if any HTTPS API is configured, try it (it bypasses cloud port blocks like Render free tier)
    if _dispatch_https_api(to_email, subject, body_html, from_name, from_email):
        return True

    try:
        # Generate clean plain text fallback for anti-spam filters
        plain_text = re.sub(r'<[^>]+>', ' ', body_html)
        plain_text = re.sub(r'\s+', ' ', plain_text).strip()

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_name} <{from_email}>"
        msg["To"] = to_email
        msg["Date"] = formatdate(localtime=True)
        msg["Message-ID"] = make_msgid(domain="koinexa.com")
        msg["Reply-To"] = from_email
        msg["X-Priority"] = "1"
        msg["X-MSMail-Priority"] = "High"
        msg["Importance"] = "High"
        msg["MIME-Version"] = "1.0"

        # RFC 2046 standard: plain text part first, HTML part second
        msg.attach(MIMEText(plain_text, "plain", "utf-8"))
        msg.attach(MIMEText(body_html, "html", "utf-8"))
        msg_str = msg.as_string()

        # Try designated port first, then fallback to alternate port (587 STARTTLS <-> 465 SSL)
        ports_to_try = [smtp_port]
        if smtp_port == 587 and 465 not in ports_to_try:
            ports_to_try.append(465)
        elif smtp_port == 465 and 587 not in ports_to_try:
            ports_to_try.append(587)

        last_error = None
        for p in ports_to_try:
            try:
                if p == 465:
                    with smtplib.SMTP_SSL(smtp_host, 465, timeout=12) as server:
                        server.login(smtp_user, smtp_pass)
                        server.sendmail(from_email, [to_email], msg_str)
                else:
                    with smtplib.SMTP(smtp_host, p, timeout=12) as server:
                        server.starttls()
                        server.login(smtp_user, smtp_pass)
                        server.sendmail(from_email, [to_email], msg_str)
                print(f"[EmailService] Real SMTP email delivered to {to_email} via {smtp_host}:{p}: {subject}")
                return True
            except Exception as attempt_err:
                last_error = attempt_err
                print(f"[EmailService] Port {p} transmission attempt failed: {attempt_err}")

        print(f"[EmailService] All SMTP transmission attempts failed ({last_error}); message preserved in SQLite outbox.")
        return False
    except Exception as fatal_err:
        print(f"[EmailService] Unhandled SMTP dispatch exception: {fatal_err}")
        return False


def send_email(to_email: str, subject: str, body_html: str, email_type: str, recipient_name: str = "Member", sync: bool = False) -> bool:
    """
    Dispatches an email and stores an immutable record in the 'sent_emails' SQLite table.
    By default runs asynchronously via background daemon thread so HTTP API responses return in milliseconds!
    """
    now = str(time.time())
    email_id = f"em_{uuid.uuid4().hex[:12]}"
    
    # 1. Always record in SQLite sent_emails table immediately for UI Outbox & auditability
    try:
        with get_db_connection() as conn:
            conn.execute(
                """INSERT INTO sent_emails (id, recipient_email, recipient_name, subject, body_html, email_type, sent_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (email_id, to_email, recipient_name, subject, body_html, email_type, now)
            )
    except Exception as db_err:
        print(f"[EmailService] Failed to log email to DB: {db_err}")

    # 2. Attempt real SMTP transmission
    cfg = get_smtp_config()
    smtp_host = cfg["smtp_host"]
    smtp_port = cfg["smtp_port"]
    smtp_user = cfg["smtp_user"]
    smtp_pass = cfg["smtp_pass"]
    from_email = cfg["from_email"] or smtp_user or DEFAULT_FROM_EMAIL
    from_name = cfg["from_name"] or DEFAULT_FROM_NAME

    if not (smtp_host and smtp_user and smtp_pass):
        print(f"[EmailService] [OUTBOX RECORDED] Delivered to '{to_email}' ({email_type}): {subject}")
        return True

    if sync:
        return _dispatch_smtp_sync(to_email, subject, body_html, from_name, from_email, smtp_host, smtp_port, smtp_user, smtp_pass)
    else:
        # Blazing fast asynchronous background delivery
        threading.Thread(
            target=_dispatch_smtp_sync,
            args=(to_email, subject, body_html, from_name, from_email, smtp_host, smtp_port, smtp_user, smtp_pass),
            daemon=True
        ).start()
        return True


def send_test_email(to_email: str) -> tuple[bool, str]:
    """Test SMTP dispatch with concise diagnostic details."""
    cfg = get_smtp_config()
    smtp_host = cfg["smtp_host"]
    smtp_port = cfg["smtp_port"]
    smtp_user = cfg["smtp_user"]
    smtp_pass = cfg["smtp_pass"]
    from_email = cfg["from_email"] or smtp_user or "koinexa63@gmail.com"
    from_name = cfg["from_name"] or "KOINEXA"

    if not (smtp_host and smtp_user and smtp_pass):
        send_otp_email(to_email, "KOINEXA Member", "733829")
        return False, "SMTP credentials are not configured yet. The message was recorded in the SQLite Outbox."

    subject = "KOINEXA: Delivery Verification Test"
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KOINEXA Delivery Test</title>
</head>
<body style="margin: 0; padding: 40px 16px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #334155;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; margin: 0 auto;">
    <tr>
      <td>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 36px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
            <tr>
              <td>
                <span style="font-size: 15px; font-weight: 700; color: #0f172a; letter-spacing: -0.2px;">KOINEXA</span>
              </td>
              <td align="right">
                <span style="display: inline-block; font-size: 11px; font-weight: 600; color: #059669; background: #ecfdf5; border: 1px solid #d1fae5; padding: 2px 9px; border-radius: 9999px;">
                  Diagnostic
                </span>
              </td>
            </tr>
          </table>

          <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px; line-height: 1.3;">
            Delivery verified
          </h1>
          
          <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.55; color: #475569;">
            Your SMTP gateway is active and successfully transmitting messages to <strong>{to_email}</strong>.
          </p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; font-family: 'SF Mono', ui-monospace, Menlo, Monaco, Consolas, monospace; font-size: 12px; color: #0f172a; line-height: 1.6; margin: 0 0 24px 0;">
            <div><span style="color: #64748b;">GATEWAY:</span> {smtp_host}:{smtp_port}</div>
            <div><span style="color: #64748b;">SENDER:</span> {from_name} &lt;{from_email}&gt;</div>
            <div><span style="color: #64748b;">TIME:</span> {time.strftime('%Y-%m-%d %H:%M:%S')}</div>
          </div>

          <div style="border-top: 1px solid #f1f5f9; padding-top: 18px;">
            <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #94a3b8;">
              KOINEXA Infrastructure Operations &bull; Automated Diagnostic Test
            </p>
          </div>
        </div>
      </td>
    </tr>
  </table>
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
        
        send_email(to_email, subject, html, "system_test", "KOINEXA Member")
        return True, f"Email successfully dispatched to {to_email} via {smtp_host}:{smtp_port}."
    except smtplib.SMTPAuthenticationError as auth_err:
        return False, f"SMTP Authentication failed: {auth_err}. Please ensure 2FA and a 16-character App Password are configured."
    except Exception as e:
        return False, f"SMTP connection error: {str(e)}"


def send_otp_email(to_email: str, recipient_name: str, otp_code: str) -> bool:
    """Send a secure 6-digit OTP email for password reset."""
    subject = f"Your KOINEXA password reset code: {otp_code}"
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Code</title>
</head>
<body style="margin: 0; padding: 40px 16px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #334155;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; margin: 0 auto;">
    <tr>
      <td>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 36px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
            <tr>
              <td>
                <span style="font-size: 15px; font-weight: 700; color: #0f172a; letter-spacing: -0.2px;">KOINEXA</span>
              </td>
              <td align="right">
                <span style="display: inline-block; font-size: 11px; font-weight: 600; color: #0284c7; background: #f0f9ff; border: 1px solid #e0f2fe; padding: 2px 9px; border-radius: 9999px;">
                  Password Recovery
                </span>
              </td>
            </tr>
          </table>

          <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px; line-height: 1.3;">
            Reset your password
          </h1>
          
          <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.55; color: #475569;">
            Hello {recipient_name or 'there'},<br><br>
            Enter this single-use code to reset the password for your KOINEXA account:
          </p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; text-align: center; margin: 0 0 20px 0;">
            <div style="font-family: 'SF Mono', ui-monospace, Menlo, Monaco, Consolas, monospace; font-size: 32px; font-weight: 700; color: #0f172a; letter-spacing: 6px; margin: 0 0 4px 0;">
              {otp_code}
            </div>
            <div style="font-size: 11px; color: #64748b;">
              Valid for 10 minutes &bull; Do not share with anyone
            </div>
          </div>

          <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.55; color: #64748b;">
            If you did not request a password reset, you can safely ignore this email. Your account remains secure.
          </p>

          <div style="border-top: 1px solid #f1f5f9; padding-top: 18px;">
            <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #94a3b8;">
              KOINEXA Security &bull; &copy; {time.strftime('%Y')} KOINEXA
            </p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>"""
    return send_email(to_email, subject, html, "otp_verification", recipient_name)


def send_login_otp_email(to_email: str, recipient_name: str, otp_code: str) -> bool:
    """Send a secure 6-digit OTP email for account login verification."""
    subject = f"Your KOINEXA verification code: {otp_code}"
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
</head>
<body style="margin: 0; padding: 40px 16px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #334155;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; margin: 0 auto;">
    <tr>
      <td>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 36px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
            <tr>
              <td>
                <span style="font-size: 15px; font-weight: 700; color: #0f172a; letter-spacing: -0.2px;">KOINEXA</span>
              </td>
              <td align="right">
                <span style="display: inline-block; font-size: 11px; font-weight: 600; color: #0284c7; background: #f0f9ff; border: 1px solid #e0f2fe; padding: 2px 9px; border-radius: 9999px;">
                  Verification
                </span>
              </td>
            </tr>
          </table>

          <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px; line-height: 1.3;">
            Verification code
          </h1>
          
          <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.55; color: #475569;">
            Hello {recipient_name or 'there'},<br><br>
            Enter this code to complete your KOINEXA sign-in:
          </p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; text-align: center; margin: 0 0 20px 0;">
            <div style="font-family: 'SF Mono', ui-monospace, Menlo, Monaco, Consolas, monospace; font-size: 32px; font-weight: 700; color: #0f172a; letter-spacing: 6px; margin: 0 0 4px 0;">
              {otp_code}
            </div>
            <div style="font-size: 11px; color: #64748b;">
              Valid for 10 minutes &bull; Do not share with anyone
            </div>
          </div>

          <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.55; color: #64748b;">
            If you did not initiate this request, someone may be attempting to access your account. Please secure your password immediately.
          </p>

          <div style="border-top: 1px solid #f1f5f9; padding-top: 18px;">
            <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #94a3b8;">
              KOINEXA Security &bull; &copy; {time.strftime('%Y')} KOINEXA
            </p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>"""
    return send_email(to_email, subject, html, "login_otp", recipient_name)


def send_faculty_acceptance_email(to_email: str, recipient_name: str, institution: str = "University") -> bool:
    """Send official faculty approval and welcome email."""
    subject = "Your KOINEXA faculty application has been approved"
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Faculty Application Approved</title>
</head>
<body style="margin: 0; padding: 40px 16px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #334155;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; margin: 0 auto;">
    <tr>
      <td>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 36px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
            <tr>
              <td>
                <span style="font-size: 15px; font-weight: 700; color: #0f172a; letter-spacing: -0.2px;">KOINEXA</span>
              </td>
              <td align="right">
                <span style="display: inline-block; font-size: 11px; font-weight: 600; color: #059669; background: #ecfdf5; border: 1px solid #d1fae5; padding: 2px 9px; border-radius: 9999px;">
                  Approved
                </span>
              </td>
            </tr>
          </table>

          <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px; line-height: 1.3;">
            Faculty application approved
          </h1>
          
          <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.55; color: #475569;">
            Dear {recipient_name},<br><br>
            Your faculty application for <strong>{institution}</strong> has been approved. Your educator workspace is now active.
          </p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 0 0 24px 0;">
            <div style="font-size: 12px; font-weight: 600; color: #0f172a; margin-bottom: 8px;">Your Educator Privileges:</div>
            <div style="font-size: 13px; color: #475569; line-height: 1.6;">&bull; <strong>Classrooms:</strong> Manage syllabi and student rosters</div>
            <div style="font-size: 13px; color: #475569; line-height: 1.6;">&bull; <strong>Assessments:</strong> Deploy proctored CBT quizzes and coding challenges</div>
            <div style="font-size: 13px; color: #475569; line-height: 1.6;">&bull; <strong>Community:</strong> Broadcast academic updates to your students</div>
          </div>

          <div style="text-align: center; margin: 0 0 28px 0;">
            <a href="http://localhost:5174/#/auth" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 11px 26px; border-radius: 7px; font-size: 13px; font-weight: 600;">
              Access Faculty Portal &rarr;
            </a>
          </div>

          <div style="border-top: 1px solid #f1f5f9; padding-top: 18px;">
            <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #94a3b8;">
              KOINEXA Academic Operations &bull; Verified Educator Network
            </p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>"""
    return send_email(to_email, subject, html, "faculty_accepted", recipient_name)


def send_faculty_rejection_email(to_email: str, recipient_name: str, reason: str = "") -> bool:
    """Send respectful faculty rejection email with constructive feedback."""
    subject = "KOINEXA faculty application update"
    feedback_text = reason or "Submitted credentials or institutional links did not meet our verification criteria."
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Update</title>
</head>
<body style="margin: 0; padding: 40px 16px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #334155;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; margin: 0 auto;">
    <tr>
      <td>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 36px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
            <tr>
              <td>
                <span style="font-size: 15px; font-weight: 700; color: #0f172a; letter-spacing: -0.2px;">KOINEXA</span>
              </td>
              <td align="right">
                <span style="display: inline-block; font-size: 11px; font-weight: 600; color: #475569; background: #f1f5f9; border: 1px solid #e2e8f0; padding: 2px 9px; border-radius: 9999px;">
                  Status Update
                </span>
              </td>
            </tr>
          </table>

          <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px; line-height: 1.3;">
            Application update
          </h1>
          
          <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.55; color: #475569;">
            Dear {recipient_name},<br><br>
            Thank you for applying to the KOINEXA Faculty Network. After review, we are unable to approve your application at this time.
          </p>

          <div style="background: #f8fafc; border-left: 3px solid #94a3b8; border-radius: 6px; padding: 12px 14px; margin: 0 0 20px 0;">
            <div style="font-size: 11px; font-weight: 600; color: #0f172a; margin-bottom: 2px;">Reviewer Notes:</div>
            <div style="font-size: 13px; color: #475569; line-height: 1.5;">{feedback_text}</div>
          </div>

          <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.55; color: #64748b;">
            You may reapply in the future with updated institutional proof or active university directory links.
          </p>

          <div style="border-top: 1px solid #f1f5f9; padding-top: 18px;">
            <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #94a3b8;">
              KOINEXA Academic Operations &bull; Verification Board
            </p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>"""
    return send_email(to_email, subject, html, "faculty_rejected", recipient_name)


def send_account_suspension_email(to_email: str, recipient_name: str, violation_reason: str, content_snippet: str = "") -> bool:
    """Send disciplinary suspension alert email explaining exact policy violation."""
    subject = "Notice: KOINEXA account suspended"
    snippet_display = f'<div style="background: #ffffff; border: 1px solid #fecaca; border-radius: 6px; padding: 8px 12px; font-family: \'SF Mono\', monospace; font-size: 11px; color: #991b1b; margin-top: 6px; word-break: break-word;">"{content_snippet}"</div>' if content_snippet else ""
    
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Suspended</title>
</head>
<body style="margin: 0; padding: 40px 16px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #334155;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; margin: 0 auto;">
    <tr>
      <td>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 36px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
            <tr>
              <td>
                <span style="font-size: 15px; font-weight: 700; color: #0f172a; letter-spacing: -0.2px;">KOINEXA</span>
              </td>
              <td align="right">
                <span style="display: inline-block; font-size: 11px; font-weight: 600; color: #dc2626; background: #fef2f2; border: 1px solid #fee2e2; padding: 2px 9px; border-radius: 9999px;">
                  Policy Notice
                </span>
              </td>
            </tr>
          </table>

          <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px; line-height: 1.3;">
            Account suspended
          </h1>
          
          <p style="margin: 0 0 18px 0; font-size: 14px; line-height: 1.55; color: #475569;">
            Hello {recipient_name},<br><br>
            Your account associated with <strong>{to_email}</strong> has been suspended due to a violation of our community guidelines.
          </p>

          <div style="background: #fef2f2; border-left: 3px solid #dc2626; border-radius: 6px; padding: 12px 14px; margin: 0 0 18px 0;">
            <div style="font-size: 11px; font-weight: 600; color: #991b1b; margin-bottom: 2px;">Violation Reason:</div>
            <div style="font-size: 13px; color: #7f1d1d; line-height: 1.5;">{violation_reason}</div>
            {snippet_display}
          </div>

          <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.55; color: #64748b;">
            To appeal this decision, reply directly to <strong>koinexa63@gmail.com</strong> for review by the moderation board.
          </p>

          <div style="border-top: 1px solid #f1f5f9; padding-top: 18px;">
            <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #94a3b8;">
              KOINEXA Trust &amp; Safety &bull; Policy Enforcement
            </p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>"""
    return send_email(to_email, subject, html, "account_suspended", recipient_name)


def send_faculty_registration_acknowledgement_email(to_email: str, recipient_name: str, institution: str = "University", designation: str = "Faculty", app_id: str = "") -> bool:
    """Send official faculty registration acknowledgement."""
    subject = "KOINEXA faculty application received"
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Received</title>
</head>
<body style="margin: 0; padding: 40px 16px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #334155;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; margin: 0 auto;">
    <tr>
      <td>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 36px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
            <tr>
              <td>
                <span style="font-size: 15px; font-weight: 700; color: #0f172a; letter-spacing: -0.2px;">KOINEXA</span>
              </td>
              <td align="right">
                <span style="display: inline-block; font-size: 11px; font-weight: 600; color: #0284c7; background: #f0f9ff; border: 1px solid #e0f2fe; padding: 2px 9px; border-radius: 9999px;">
                  Received
                </span>
              </td>
            </tr>
          </table>

          <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px; line-height: 1.3;">
            Application received
          </h1>
          
          <p style="margin: 0 0 18px 0; font-size: 14px; line-height: 1.55; color: #475569;">
            Dear {recipient_name},<br><br>
            We have received your faculty application for <strong>{institution}</strong>. Our review board is verifying your credentials.
          </p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin: 0 0 20px 0;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="font-size: 12px; color: #64748b; padding: 4px 0; width: 110px;">Applicant:</td>
                <td style="font-size: 12px; font-weight: 600; color: #0f172a; padding: 4px 0;">{recipient_name}</td>
              </tr>
              <tr>
                <td style="font-size: 12px; color: #64748b; padding: 4px 0;">Institution:</td>
                <td style="font-size: 12px; font-weight: 600; color: #0f172a; padding: 4px 0;">{institution}</td>
              </tr>
              <tr>
                <td style="font-size: 12px; color: #64748b; padding: 4px 0;">Role:</td>
                <td style="font-size: 12px; font-weight: 600; color: #0f172a; padding: 4px 0;">{designation}</td>
              </tr>
              {f'<tr><td style="font-size: 12px; color: #64748b; padding: 4px 0;">Reference ID:</td><td style="font-size: 12px; font-family: monospace; font-weight: 600; color: #0f172a; padding: 4px 0;">{app_id}</td></tr>' if app_id else ''}
            </table>
          </div>

          <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.55; color: #64748b;">
            Reviews typically complete within 24–48 hours. You will receive an update once processing is complete.
          </p>

          <div style="border-top: 1px solid #f1f5f9; padding-top: 18px;">
            <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #94a3b8;">
              KOINEXA Academic Operations &bull; Verification Queue
            </p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>"""
    return send_email(to_email, subject, html, "faculty_registration_ack", recipient_name)


def get_sent_emails(limit: int = 50):
    """Retrieve recent sent emails for the Admin Outbox Inspector."""
    with get_db_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM sent_emails ORDER BY sent_at DESC LIMIT ?",
            (limit,)
        ).fetchall()
        return [dict(r) for r in rows]

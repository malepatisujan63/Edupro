# Feature Files: Veritas-AI Agent & Email Verification Service

This folder preserves the complete, production-ready implementation of:
1. **Veritas-AI Agentic Verification Engine** (\ackend/veritas_agent.py\):
   - Multi-vector autonomous vetting of faculty credentials.
   - 6 specialized analyzers: Email Domain, LinkedIn, Resume Artifact, ID Card, Showcase Footprint, and Anti-Fraud / Prompt Injection guard.
   - Deterministic scoring, confidence evaluation, and explainable audit dossiers with strictness tiers (lenient, balanced, strict, paranoid).
2. **Email Verification & Live SMTP Dispatcher** (\ackend/email_service.py\):
   - Dual-mode SMTP delivery (port 587 STARTTLS / port 465 SSL) and SQLite Outbox persistence.
   - Responsive HTML templates for Password Reset OTPs, Faculty Acceptance, and Rejection feedback.
   - Live test dispatcher with real-time SMTP diagnostic messages.
3. **SuperAdmin Command Center UI** (\rontend/AdminDashboard.tsx\):
   - Full review queue management, deep-dive dossier modal with artifact badges, live AI strictness and autopilot tuning sliders.
   - Live SMTP Configuration drawer and instant test email dispatcher.

---

## How to Re-integrate:
1. Copy \eaturefiles/backend/veritas_agent.py\ back to \ackend/veritas_agent.py\.
2. Copy \eaturefiles/backend/email_service.py\ back to \ackend/email_service.py\.
3. Copy \eaturefiles/frontend/AdminDashboard.tsx\ back to \rontend/src/components/admin/AdminDashboard.tsx\.
4. Restore equire_admin()\ and \/api/admin/*\ endpoints in \ackend/app.py\.
5. Restore the admin tab in \rontend/src/components/layout/LeftNavigation.tsx\.

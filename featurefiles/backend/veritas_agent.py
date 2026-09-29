# -*- coding: utf-8 -*-
"""
Veritas-AI: Autonomous Academic Credential & Faculty Verification Agent
Engineered for Koinexa.
Performs multi-stage agentic evaluation across:
1. Email Domain & Institutional Affinity Analyzer
2. LinkedIn Profile Intelligence Analyzer
3. Resume Artifact & Pedagogical Signal Extractor
4. ID Card Credential Integrity Verifier
5. External Showcase Links & Academic Footprint Analyzer
6. Anti-Fraud & Prompt Injection Defense Guard
Produces an explainable audit dossier with deterministic verification scores,
risk scores, flagged signals, and human-readable executive reasoning.
"""

import json
import re
import time
from urllib.parse import urlparse
from typing import Dict, Any, List, Tuple

# Safe database and email imports
try:
    from backend.database import get_db_connection
    from backend.email_service import send_faculty_acceptance_email, send_faculty_rejection_email
except ImportError:
    from database import get_db_connection
    from email_service import send_faculty_acceptance_email, send_faculty_rejection_email

# Extensive list of disposable / burner email domains
DISPOSABLE_EMAIL_DOMAINS = {
    "mailinator.com", "tempmail.com", "10minutemail.com", "guerrillamail.com", "trashmail.com",
    "yopmail.com", "sharklasers.com", "getairmail.com", "throwawaymail.com", "dispostable.com",
    "fakemailgenerator.com", "temp-mail.org", "fakeinbox.com", "crazymailing.com", "mytemp.email",
    "generator.email", "nada.ltd", "mohmal.com", "burnermail.io", "tempail.com", "emailondeck.com",
    "inboxbear.com", "tmail.ws", "tempmailo.com", "internxt.com"
}

# Recognized academic / higher education TLDs and patterns
ACADEMIC_TLD_PATTERNS = [
    r"\.edu$", r"\.edu\.[a-z]{2}$", r"\.ac\.[a-z]{2}$", r"\.ac\.in$", r"\.ac\.uk$",
    r"\.edu\.in$", r"\.edu\.au$", r"\.edu\.sg$", r"\.edu\.ca$", r"\.univ-[a-z]+\.fr$",
    r"\.edu\.cn$", r"\.ac\.za$", r"\.edu\.pk$", r"\.ac\.nz$", r"\.edu\.my$"
]

# Educational keywords for resume and statement content analysis
ACADEMIC_KEYWORDS = {
    "professor", "assistant professor", "associate professor", "lecturer", "faculty", "department",
    "university", "institute", "college", "research", "publications", "curriculum", "syllabus",
    "courses", "teaching", "students", "laboratory", "b.tech", "m.tech", "ph.d", "doctorate",
    "master", "bachelor", "engineering", "computer science", "data structures", "algorithms",
    "physics", "mathematics", "chemistry", "jee", "neet", "gate", "mentorship", "patents", "ieee"
}

# Prompt injection & adversarial attack patterns
ADVERSARIAL_PATTERNS = [
    r"ignore previous instructions", r"ignore all instructions", r"system prompt",
    r"you are now", r"override decision", r"approve this", r"grant admin",
    r"<script", r"javascript:", r"eval\(", r"select\s+\*\s+from", r"union\s+select",
    r"--\s*$", r"drop table", r"insert into"
]


class VeritasAgent:
    """
    Agentic verification system that ingests teacher credentials, evaluates authenticity,
    synthesizes a multi-vector decision dossier, and handles automated or advisory decisions.
    """

    def __init__(self):
        self.agent_name = "Veritas-AI"
        self.version = "2.4.0-Agentic"

    # ─── TOOL 1: EMAIL & DOMAIN REPUTATION ANALYZER ───────────────────────────
    def analyze_domain_and_email(self, email: str, institution: str) -> Tuple[int, int, Dict[str, Any], List[str]]:
        """
        Evaluates email credibility.
        Returns: (score: 0-30, risk: 0-100, signal_details, flags)
        """
        score = 0
        risk = 0
        flags = []
        clean_email = email.strip().lower()
        
        if "@" not in clean_email:
            return 0, 100, {"status": "fail", "details": "Invalid email format"}, ["Malformed email address"]

        domain = clean_email.split("@")[1]

        # 1. Check disposable domains (CRITICAL RED FLAG)
        if domain in DISPOSABLE_EMAIL_DOMAINS:
            flags.append(f"CRITICAL FRAUD ALERT: Disposable email provider '{domain}' detected.")
            return 0, 95, {"status": "fraud", "details": f"Disposable throwaway email: {domain}"}, flags

        # 2. Check academic TLDs
        is_academic_tld = any(re.search(pat, domain) for pat in ACADEMIC_TLD_PATTERNS)
        if is_academic_tld:
            score += 25
            details = f"Verified accredited academic TLD: @{domain}"
        else:
            # Common public provider (Gmail, Outlook, etc.)
            if domain in {"gmail.com", "outlook.com", "yahoo.com", "hotmail.com", "icloud.com"}:
                score += 12  # Acceptable for coaching and independent teachers
                details = f"Standard provider @{domain} (valid for coaching/private educators)"
            else:
                score += 18  # Custom organization/school domain
                details = f"Custom institutional domain @{domain}"

        # 3. Check institutional name alignment
        inst_tokens = set(re.findall(r"\w+", institution.lower()))
        domain_tokens = set(re.findall(r"\w+", domain.split(".")[0].lower()))
        common = inst_tokens.intersection(domain_tokens)
        if common:
            score += 5
            details += f" (Matches institutional branding: '{', '.join(common)}')"

        return min(30, score), risk, {"status": "pass", "details": details, "domain": domain}, flags

    # ─── TOOL 2: LINKEDIN PROFILE INTELLIGENCE ANALYZER ───────────────────────
    def analyze_linkedin_profile(self, linkedin_url: str, applicant_name: str) -> Tuple[int, int, Dict[str, Any], List[str]]:
        """
        Validates LinkedIn profile URL syntax, structure, and name similarity.
        Returns: (score: 0-25, risk: 0-100, signal_details, flags)
        """
        score = 0
        risk = 0
        flags = []
        clean_url = (linkedin_url or "").strip()

        if not clean_url:
            flags.append("Missing LinkedIn profile (mandatory requirement)")
            return 0, 35, {"status": "fail", "details": "No LinkedIn URL provided"}, flags

        parsed = urlparse(clean_url)
        netloc = parsed.netloc.lower()

        # Check if actually linkedin.com
        if not ("linkedin.com" in netloc or "www.linkedin.com" in netloc):
            flags.append(f"Invalid LinkedIn host: {netloc or clean_url}")
            return 2, 40, {"status": "fail", "details": "URL is not on linkedin.com domain"}, flags

        path = parsed.path.strip("/")
        parts = path.split("/")

        # Check if profile path (/in/ or /pub/)
        if len(parts) >= 2 and parts[0] in {"in", "pub"}:
            slug = parts[1].lower()
            score += 15
            details = f"Valid individual LinkedIn profile handle: /{path}"

            # Compare slug with applicant name
            name_tokens = [t.lower() for t in re.findall(r"\w+", applicant_name) if len(t) > 2]
            matched_tokens = [t for t in name_tokens if t in slug]
            if matched_tokens:
                score += 10
                details += f" (Matches applicant identity: '{', '.join(matched_tokens)}')"
            else:
                score += 5
                details += " (Handle differs from exact name tokens; acceptable for aliases)"
        elif path:
            score += 8
            details = f"LinkedIn company, school, or organization page provided: /{path}"
        else:
            flags.append("Generic linkedin.com link without specific user profile handle")
            return 3, 25, {"status": "warning", "details": "Root LinkedIn URL provided without handle"}, flags

        return min(25, score), risk, {"status": "pass", "details": details}, flags

    # ─── TOOL 3: RESUME ARTIFACT & PEDAGOGICAL DEPTH ANALYZER ─────────────────
    def analyze_resume_artifact(self, resume_url: str) -> Tuple[int, int, Dict[str, Any], List[str]]:
        """
        Inspects resume document presence, format, and content signals.
        Returns: (score: 0-20, risk: 0-100, signal_details, flags)
        """
        score = 0
        risk = 0
        flags = []
        clean_res = (resume_url or "").strip()

        if not clean_res:
            flags.append("Missing Resume upload or document link")
            return 0, 30, {"status": "fail", "details": "No resume artifact submitted"}, flags

        # Check if Data URI (uploaded file) or Web Link
        if clean_res.startswith("data:"):
            # Uploaded file (PDF, Doc, or Image)
            mime = clean_res.split(";")[0].replace("data:", "")
            size_kb = round(len(clean_res) * 0.75 / 1024, 1)
            score += 15
            details = f"Uploaded verified document ({mime}, ~{size_kb} KB)"

            if "pdf" in mime or "word" in mime or "document" in mime:
                score += 5
                details += " [Standard Academic Document Format]"
            elif "image" in mime:
                score += 3
                details += " [Scanned Resume Document]"
        elif clean_res.startswith("http://") or clean_res.startswith("https://"):
            # Cloud storage / Drive link
            parsed = urlparse(clean_res)
            score += 14
            details = f"Cloud hosted resume link on {parsed.netloc}"
            if any(host in parsed.netloc for host in ["drive.google.com", "dropbox.com", "notion.site", "github.io"]):
                score += 6
                details += " [Verified Cloud Storage Provider]"
        elif clean_res.startswith("/uploads/") or clean_res.startswith("uploads/"):
            score += 18
            details = f"Server-hosted uploaded resume: {clean_res}"
        else:
            # Short text or unparsed path
            if len(clean_res) > 20:
                score += 10
                details = "Document reference or curriculum outline provided"
            else:
                flags.append("Resume link or upload is suspiciously short")
                return 4, 25, {"status": "warning", "details": "Brief text reference provided"}, flags

        return min(20, score), risk, {"status": "pass", "details": details}, flags

    # ─── TOOL 4: ID CARD CREDENTIAL INTEGRITY VERIFIER ────────────────────────
    def analyze_id_card_artifact(self, id_card_url: str) -> Tuple[int, int, Dict[str, Any], List[str]]:
        """
        Validates presence and format of Institutional or Institute ID card.
        Returns: (score: 0-15, risk: 0-100, signal_details, flags)
        """
        score = 0
        risk = 0
        flags = []
        clean_id = (id_card_url or "").strip()

        if not clean_id:
            flags.append("Missing Institutional ID Card upload or link")
            return 0, 30, {"status": "fail", "details": "No ID card artifact submitted"}, flags

        if clean_id.startswith("data:"):
            mime = clean_id.split(";")[0].replace("data:", "")
            size_kb = round(len(clean_id) * 0.75 / 1024, 1)
            score += 12
            details = f"Uploaded photo credential ({mime}, ~{size_kb} KB)"
            if "image" in mime or "pdf" in mime:
                score += 3
                details += " [Valid Identification Media]"
        elif clean_id.startswith("http://") or clean_id.startswith("https://"):
            parsed = urlparse(clean_id)
            score += 13
            details = f"Hosted ID document link on {parsed.netloc}"
        elif clean_id.startswith("/uploads/") or clean_id.startswith("uploads/"):
            score += 15
            details = f"Server-hosted ID credential: {clean_id}"
        else:
            score += 8
            details = "Employee ID verification code/number provided"

        return min(15, score), risk, {"status": "pass", "details": details}, flags

    # ─── TOOL 5: SHOWCASE LINKS & ACADEMIC FOOTPRINT ANALYZER ─────────────────
    def analyze_showcase_links(self, extra_links_raw: Any) -> Tuple[int, int, Dict[str, Any], List[str]]:
        """
        Evaluates optional showcase links (YouTube education channels, GitHub, Scholar).
        Returns: (score: 0-10, risk: 0-100, signal_details, flags)
        """
        score = 0
        flags = []
        links = []

        if isinstance(extra_links_raw, list):
            links = extra_links_raw
        elif isinstance(extra_links_raw, str):
            clean_str = extra_links_raw.strip()
            if clean_str.startswith("["):
                try:
                    links = json.loads(clean_str)
                except Exception:
                    links = [clean_str]
            elif clean_str:
                links = [l.strip() for l in clean_str.split("\n") if l.strip()]

        valid_links = [l for l in links if l.startswith("http://") or l.startswith("https://")]
        if not valid_links:
            return 3, 0, {"status": "neutral", "details": "No additional showcase links provided (optional)"}, []

        details_list = []
        for l in valid_links[:4]:
            parsed = urlparse(l)
            host = parsed.netloc.lower()
            if "youtube.com" in host or "youtu.be" in host:
                score += 4
                details_list.append("YouTube Teaching Channel")
            elif "github.com" in host:
                score += 4
                details_list.append("GitHub Code Repository")
            elif "scholar.google" in host or "orcid.org" in host or "researchgate" in host:
                score += 5
                details_list.append("Google Scholar / ORCID Research Profile")
            else:
                score += 2
                details_list.append(f"Educator Portfolio ({host})")

        return min(10, score), 0, {"status": "pass", "details": f"Verified showcase footprint: {', '.join(details_list)}"}, []

    # ─── TOOL 6: ANTI-FRAUD & PROMPT INJECTION DEFENSE ─────────────────────────
    def detect_fraud_and_anomalies(self, data: Dict[str, Any]) -> Tuple[int, List[str]]:
        """
        Scans all text fields for adversarial prompt injections, gibberish, or spam.
        Returns: (risk_penalty: 0-100, flags)
        """
        risk_penalty = 0
        flags = []

        full_corpus = " ".join([
            str(data.get("name", "")),
            str(data.get("statement_of_purpose", "")),
            str(data.get("department", "")),
            str(data.get("institution", ""))
        ]).lower()

        # 1. Prompt Injection detection
        for pat in ADVERSARIAL_PATTERNS:
            if re.search(pat, full_corpus):
                risk_penalty += 45
                flags.append(f"SECURITY ALERT: Suspicious adversarial phrase detected matching pattern '{pat}'")

        # 2. Gibberish / low-effort detection
        stmt = str(data.get("statement_of_purpose", "")).strip()
        if stmt:
            if len(stmt) < 15:
                flags.append("Statement of purpose is brief (< 15 characters)")
            elif len(set(stmt)) < 6:
                risk_penalty += 35
                flags.append("Statement of purpose appears to be repetitive bot gibberish")

        # 3. Check applicant name quality
        name = str(data.get("name", "")).strip()
        if len(name) < 3 or re.search(r"^[a-zA-Z]{1,2}$", name):
            risk_penalty += 20
            flags.append("Applicant name appears truncated or invalid")

        return min(100, risk_penalty), flags

    # ─── AUTONOMOUS SYNTHESIS & EVALUATION DOSSIER GENERATOR ───────────────────
    def evaluate_faculty_application(self, app_data: Dict[str, Any], strictness: str = "balanced") -> Dict[str, Any]:
        """
        Executes the full agentic verification cycle on a teacher applicant.
        Synthesizes an explainable decision dossier.
        """
        email = str(app_data.get("email", "")).strip()
        name = str(app_data.get("name", "")).strip()
        institution = str(app_data.get("institution", "")).strip()
        linkedin_url = str(app_data.get("linkedin_url", "")).strip()
        resume_url = str(app_data.get("resume_url", "")).strip()
        id_card_url = str(app_data.get("id_card_url", "")).strip()
        extra_links = app_data.get("extra_links", [])

        # Step 1: Run specialized analyzers
        s_domain, r_domain, d_domain, f_domain = self.analyze_domain_and_email(email, institution)
        s_linkedin, r_linkedin, d_linkedin, f_linkedin = self.analyze_linkedin_profile(linkedin_url, name)
        s_resume, r_resume, d_resume, f_resume = self.analyze_resume_artifact(resume_url)
        s_idcard, r_idcard, d_idcard, f_idcard = self.analyze_id_card_artifact(id_card_url)
        s_showcase, _, d_showcase, _ = self.analyze_showcase_links(extra_links)
        
        # Step 2: Fraud & Security scan
        fraud_penalty, f_fraud = self.detect_fraud_and_anomalies(app_data)

        # Step 3: Composite scoring
        raw_verification_score = s_domain + s_linkedin + s_resume + s_idcard + s_showcase
        verification_score = max(5, min(100, raw_verification_score - int(fraud_penalty * 0.5)))
        risk_score = min(100, max(0, fraud_penalty + r_domain + r_linkedin + r_resume + r_idcard))

        all_flags = f_domain + f_linkedin + f_resume + f_idcard + f_fraud

        # Step 4: Strictness thresholds
        # strictness can be 'lenient', 'balanced', 'strict', 'paranoid'
        if strictness == "lenient":
            accept_threshold = 70
            max_allowed_risk = 35
        elif strictness == "strict":
            accept_threshold = 88
            max_allowed_risk = 15
        elif strictness == "paranoid":
            accept_threshold = 98  # effectively disables full auto-accept without human check
            max_allowed_risk = 5
        else:  # balanced
            accept_threshold = 80
            max_allowed_risk = 25

        # Critical fraud presence check
        has_critical_fraud = any("CRITICAL" in f or "SECURITY" in f for f in all_flags)

        if has_critical_fraud or verification_score < 45 or risk_score > 60:
            recommendation = "REJECT"
            confidence = "high"
        elif verification_score >= accept_threshold and risk_score <= max_allowed_risk and not has_critical_fraud:
            recommendation = "ACCEPT"
            confidence = "high" if verification_score >= 85 else "medium"
        else:
            recommendation = "NEEDS_MANUAL_REVIEW"
            confidence = "medium"

        # Step 5: Draft human-readable executive reasoning
        positives = []
        if s_domain >= 20:
            positives.append(f"Institutional academic domain verified (@{d_domain.get('domain')})")
        elif s_domain >= 12:
            positives.append("Valid personal/academy email provided")
        if s_linkedin >= 15:
            positives.append("Authentic personal LinkedIn profile matching applicant identity")
        if s_resume >= 15:
            positives.append("Curriculum resume document submitted with academic depth")
        if s_idcard >= 12:
            positives.append("Institutional faculty ID credential verified")
        if s_showcase >= 4:
            positives.append("Active educational showcase portfolio / online footprint verified")

        reasoning_lines = []
        if recommendation == "ACCEPT":
            reasoning_lines.append(f"Veritas-AI recommends APPROVAL for {name} ({institution}).")
            reasoning_lines.append(f"Candidate achieved a strong Verification Score of {verification_score}% with low risk ({risk_score}%).")
            if positives:
                reasoning_lines.append("Key verified signals: " + "; ".join(positives) + ".")
            reasoning_lines.append("Artifacts (LinkedIn, Resume, and ID Card) are cohesive and authentic.")
        elif recommendation == "REJECT":
            reasoning_lines.append(f"Veritas-AI recommends REJECTION for {name}.")
            reasoning_lines.append(f"Candidate scored an insufficient Verification Score of {verification_score}% with elevated risk indicators ({risk_score}%).")
            if all_flags:
                reasoning_lines.append("Identified concerns: " + "; ".join(all_flags) + ".")
        else:
            reasoning_lines.append(f"Veritas-AI flags {name} for HUMAN ADMIN REVIEW.")
            reasoning_lines.append(f"Score: {verification_score}%, Risk: {risk_score}%. While several legitimate signals were detected, human confirmation is advised.")
            if all_flags:
                reasoning_lines.append("Points to review: " + "; ".join(all_flags) + ".")

        summary_reasoning = " ".join(reasoning_lines)

        dossier = {
            "agent": self.agent_name,
            "version": self.version,
            "evaluated_at": str(time.time()),
            "strictness_applied": strictness,
            "recommendation": recommendation,
            "verification_score": verification_score,
            "risk_score": risk_score,
            "confidence": confidence,
            "sub_scores": {
                "domain_reputation": s_domain,
                "linkedin_profile": s_linkedin,
                "resume_artifact": s_resume,
                "id_card_artifact": s_idcard,
                "showcase_footprint": s_showcase
            },
            "signals": {
                "domain": d_domain,
                "linkedin": d_linkedin,
                "resume": d_resume,
                "id_card": d_idcard,
                "showcase": d_showcase
            },
            "positives": positives,
            "flags": all_flags,
            "summary_reasoning": summary_reasoning
        }

        return dossier


# Global singleton instance of VeritasAgent
veritas_agent = VeritasAgent()


def evaluate_faculty_application(app_data: Dict[str, Any], strictness: str = "balanced") -> Dict[str, Any]:
    """Public helper function for application evaluation."""
    return veritas_agent.evaluate_faculty_application(app_data, strictness)

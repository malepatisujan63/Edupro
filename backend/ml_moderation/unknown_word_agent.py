# -*- coding: utf-8 -*-
"""
KOINEXA Autonomous Unknown-Word Moderation Agent
Investigates new or unseen slang, slurs, and regional idioms that are not yet
present in the 100,000+ word database.

Capabilities:
1. Linguistic extraction of suspicious candidate words from submitted text
2. Autonomous API lookup (Wiktionary REST API - unauthenticated, $0 zero cost, public domain)
3. Lexical & semantic sentiment inspection for profanity/hate markers:
   ["offensive", "vulgar", "slur", "derogatory", "obscene", "profane", "insult", "taboo", "casteist"]
4. Self-Learning Loop: Automatically persists validated slurs into moderation_corpus.db
   with sentence context, dynamically expanding the platform's defense matrix.
"""

import re
import time
import requests
import threading
from typing import Dict, List, Tuple, Optional, Any
from urllib.parse import quote

try:
    from backend.moderation import BENIGN_ALLOWLIST, POLYSEMOUS_PATTERNS
except ImportError:
    try:
        from moderation import BENIGN_ALLOWLIST, POLYSEMOUS_PATTERNS
    except ImportError:
        BENIGN_ALLOWLIST = set()
        POLYSEMOUS_PATTERNS = {}

# Precise lexical patterns that define actual slurs, profanities, and targeted insults in dictionary glosses
SLUR_DEFINITIONS = [
    re.compile(r'\b(?:ethnic\s+slur|racial\s+slur|casteist|pejorative|derogatory|hate\s+speech|swear\s+word|offensive\s+term|vulgar\s+slang|insulting\s+term|vulgar\s+term)\b', re.I),
    re.compile(r'\ban?\s+(?:idiot|twat|fuckwit|asshole|arsehole|bastard|scumbag|bitch|slut|cunt)\b', re.I),
    re.compile(r'\b(?:used\s+as\s+an?\s+insult|term\s+of\s+abuse|offensive\s+slang)\b', re.I)
]

# Common benign words set to avoid unnecessary lookups for normal vocabulary
COMMON_BENIGN = {
    "the", "and", "that", "have", "for", "not", "with", "you", "this", "but", "his", "from",
    "they", "say", "her", "she", "will", "one", "all", "would", "there", "their", "what",
    "out", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time",
    "no", "just", "him", "know", "take", "people", "into", "year", "your", "good", "some",
    "could", "them", "see", "other", "than", "then", "now", "look", "only", "come", "its",
    "over", "think", "also", "back", "after", "use", "two", "how", "our", "work", "first",
    "well", "way", "even", "new", "want", "because", "any", "these", "give", "day", "most",
    "us", "student", "class", "classroom", "test", "quiz", "code", "problem", "solution",
    "algorithm", "system", "data", "engineering", "passed", "accuracy", "submission",
    "tutorial", "learning", "study", "notes", "lecture", "professor", "mentor", "peer",
    "community", "discussion", "research", "physics", "chemistry", "mathematics", "computer",
    "project", "features", "python", "javascript", "react", "typescript", "database", "query",
    "language", "languages", "linguistics", "mechanical", "mechanics", "electrical", "electronic",
    "technical", "technology", "words", "statement", "simulation", "document", "department",
    "institution", "faculty", "college", "school", "university", "campus", "academic", "theory",
    "hardware", "software", "syntax", "compiler", "variable", "function", "development",
    "architecture", "structure", "structures", "network", "networks", "operating", "platform", "platforms"
}

USER_AGENT = "KoinexaVeritasModerationAgent/2.0 (Academic Safety Engine; support@koinexa.com)"

class UnknownWordAgent:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(UnknownWordAgent, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": USER_AGENT})
        self.cache: Dict[str, Dict[str, Any]] = {}
        self._initialized = True

    def extract_candidate_tokens(self, text: str) -> List[str]:
        """Extracts candidate unknown words that are not part of common benign vocabulary."""
        if not text:
            return []
        raw_tokens = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        candidates = []
        for t in raw_tokens:
            if (t not in COMMON_BENIGN and
                t not in BENIGN_ALLOWLIST and
                t not in POLYSEMOUS_PATTERNS and
                t not in self.cache and
                not t.isdigit()):
                candidates.append(t)
        return list(dict.fromkeys(candidates))[:5]

    def investigate_word(self, word: str, context_sentence: str = "") -> Dict[str, Any]:
        """
        Autonomously inspects the meaning, etymology, and toxicity of an unknown word.
        Queries Wikimedia Wiktionary REST API ($0 cost, unauthenticated, open domain).
        If high-confidence toxicity/slur is identified, automatically registers it
        into moderation_corpus.db via the Self-Learning Loop.
        """
        clean_word = re.sub(r'[^a-zA-Z0-9_\-]', '', word.lower().strip())
        if not clean_word or len(clean_word) < 3 or clean_word in COMMON_BENIGN or clean_word in BENIGN_ALLOWLIST:
            return {"is_toxic": False, "confidence": 0.0, "reason": "Word benign or allowlisted", "learned": False}

        if clean_word in self.cache:
            return self.cache[clean_word]

        # Check if already present in corpus engine
        try:
            from backend.ml_moderation.corpus_engine import get_corpus_engine
            engine = get_corpus_engine()
            meta = engine.lookup_term(clean_word)
            if meta:
                result = {
                    "word": clean_word,
                    "is_toxic": True,
                    "confidence": float(meta.get("sev", 0.95)),
                    "definition": "Identified in persistent multilingual corpus",
                    "language": meta.get("lang", "en"),
                    "detected_category": meta.get("cat", "vulgar_profanity"),
                    "learned": False
                }
                self.cache[clean_word] = result
                return result
        except Exception:
            pass

        result = {
            "word": clean_word,
            "is_toxic": False,
            "confidence": 0.0,
            "definition": "",
            "language": "unknown",
            "detected_category": "benign",
            "learned": False
        }

        # 1. Query Wiktionary REST API for definitions and usage tags (2.0s timeout)
        try:
            url = f"https://en.wiktionary.org/api/rest_v1/page/definition/{quote(clean_word)}"
            resp = self.session.get(url, timeout=2.0)
            if resp.status_code == 200:
                data = resp.json()
                all_defs = []
                toxic_matches = []
                for lang_code, entries in data.items():
                    result["language"] = lang_code
                    for entry in entries:
                        for defn in entry.get("definitions", []):
                            defn_text = defn.get("definition", "").lower()
                            clean_defn = re.sub(r'<[^>]+>', ' ', defn_text)
                            clean_defn = " ".join(clean_defn.split())
                            all_defs.append(clean_defn)
                            for pat in SLUR_DEFINITIONS:
                                m = pat.search(clean_defn)
                                if m:
                                    toxic_matches.append((m.group(0), clean_defn))
                                    break
                if all_defs and toxic_matches:
                    toxic_ratio = len(toxic_matches) / len(all_defs)
                    primary_is_toxic = any(pat.search(all_defs[0]) for pat in SLUR_DEFINITIONS)
                    if primary_is_toxic or toxic_ratio >= 0.20 or len(all_defs) <= 3:
                        result["is_toxic"] = True
                        result["confidence"] = 0.95
                        result["detected_category"] = toxic_matches[0][0]
                        result["definition"] = toxic_matches[0][1][:300]
        except Exception:
            pass

        # 2. Contextual Sentiment & Hostility Check
        if not result["is_toxic"] and context_sentence:
            lower_ctx = context_sentence.lower()
            hostile_patterns = [
                r"\bkill yourself\b",
                r"\bteri maa ki ch\b",
                r"\bnee amma puku\b"
            ]
            for pat in hostile_patterns:
                if re.search(pat, lower_ctx):
                    result["is_toxic"] = True
                    result["confidence"] = 0.95
                    result["detected_category"] = "violent_harassment"
                    break

        # 3. Dynamic Self-Learning Loop (Only for verified high-confidence profanity)
        if result["is_toxic"] and result.get("confidence", 0) >= 0.88:
            try:
                try:
                    from backend.ml_moderation.corpus_engine import get_corpus_engine
                except ImportError:
                    from ml_moderation.corpus_engine import get_corpus_engine
                engine = get_corpus_engine()
                engine.add_learned_word(
                    word=clean_word,
                    language=result.get("language", "en"),
                    category=result.get("detected_category", "vulgar_profanity"),
                    severity=result.get("confidence", 0.95),
                    context_sentence=context_sentence
                )
                result["learned"] = True
            except Exception:
                pass

        self.cache[clean_word] = result
        return result

    def scan_and_learn_async(self, text: str):
        """Asynchronous background worker that investigates unseen words without blocking user responses."""
        candidates = self.extract_candidate_tokens(text)
        if not candidates:
            return
        t = threading.Thread(target=self._investigate_batch, args=(candidates, text), daemon=True)
        t.start()

    def _investigate_batch(self, tokens: List[str], text: str):
        for tok in tokens:
            try:
                self.investigate_word(tok, context_sentence=text)
            except Exception:
                pass

    def get_stats(self) -> Dict[str, Any]:
        return {
            "cache_size": len(self.cache),
            "user_agent": USER_AGENT,
            "wiktionary_api": "https://en.wiktionary.org/api/rest_v1/page/definition/"
        }

    def get_learned_words(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Returns dynamically learned words from SQLite corpus."""
        try:
            try:
                from backend.ml_moderation.corpus_engine import get_corpus_engine
            except ImportError:
                from ml_moderation.corpus_engine import get_corpus_engine
            engine = get_corpus_engine()
            with engine._get_conn() as conn:
                rows = conn.execute("""
                    SELECT word, language, category, severity, created_at
                    FROM corpus_words
                    WHERE learned_agentic = 1
                    ORDER BY id DESC
                    LIMIT ?
                """, (limit,)).fetchall()
                return [
                    {
                        "word": r["word"],
                        "language": r["language"],
                        "category": r["category"],
                        "severity": r["severity"],
                        "created_at": r["created_at"]
                    }
                    for r in rows
                ]
        except Exception:
            return []


_agent_instance = None

def get_unknown_word_agent() -> UnknownWordAgent:
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = UnknownWordAgent()
    return _agent_instance

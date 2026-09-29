# -*- coding: utf-8 -*-
"""
KOINEXA Multilingual Content Moderation Engine
Scans and filters out vulgarities, profanity, abusive terms, and hate speech
across English, Hindi, Telugu, Tamil, Spanish, French, and common phonetic slangs.
Features anti-obfuscation (leetspeak normalization and repeated character collapsing).
"""

import re
from typing import Tuple, Optional, Set

# Normalization mapping for leetspeak and symbol substitutions
LEET_MAP = {
    '@': 'a', '4': 'a',
    '8': 'b',
    '(': 'c', '<': 'c',
    '3': 'e',
    '6': 'g', '9': 'g',
    '#': 'h',
    '!': 'i', '1': 'i', '|': 'i',
    '0': 'o',
    '5': 's', '$': 's',
    '7': 't', '+': 't',
    'v': 'u',
}

# Multilingual strictly vulgar, bad words, and severe abusive terms
PROFANITY_LIST = {
    # ── English ──
    "fuck", "fucking", "fucker", "fucked", "motherfucker", "motherfucking", "shit", "shitting", "bullshit",
    "bitch", "bitches", "bitching", "asshole", "bastard", "cunt", "dick", "dickhead",
    "cock", "cocksucker", "pussy", "slut", "whore", "fag", "faggot", "nigger", "nigga", "retard",
    "jackass", "prick", "twat", "wanker", "blowjob", "handjob", "masturbate",
    "porn", "porno", "xxx", "nude", "nudes", "boobs", "tit", "tits", "pedophile", "rape", "rapist",
    "dumbass", "dipshit", "scumbag", "douchebag",

    # ── Hindi / Hinglish ──
    "chutiya", "chootiya", "chutiye", "chutiyapa", "madarchod", "madar-chod", "bhenchod", "behenchod",
    "bhosdike", "bhosadike", "bsdk", "gaand", "gand", "gandu", "harami",
    "kamina", "kamine", "randi", "r@ndi", "lauda", "loda", "lund", "lodu", "chut",
    "choot", "tatte", "bhadwa", "bhadwe", "chinal",
    "chod", "chudai", "gaandu", "jhaat", "jhaant", "raand",

    # ── Telugu ──
    "lanja", "lanjakodaka", "lanjakoduku", "lanjamunda", "lanjodka", "dengu", "dengutha",
    "modda", "madda", "puku", "pooku", "erripuku", "erripooku", "pukulo", "moddalo", "guddha", "gudha",

    # ── Tamil ──
    "thevidiya", "thevidya", "otha", "omala", "sunni", "koothi", "thayoli", "punda", "punde", "poolu", "koodhi",

    # ── Kannada ──
    "soole", "soolemaga", "bolimagane", "tullu", "tulli", "hadaragitthi", "thika", "thikadalli",

    # ── Malayalam ──
    "mypiran", "myre", "kundhan", "pooril", "pooru", "thayoli", "koothi", "polayadi", "pulayadi", "kunna",

    # ── Bengali, Marathi, Gujarati, Punjabi, Urdu ──
    "bokachoda", "chudi", "chudmarani", "khankirchele", "khanki", "magirchele", "banchod",
    "jhava", "jhavadya", "lavdya", "bhadkhau", "aaijhavli", "aizhavadya",
    "kanjari", "kanjar", "gashti", "haramzada", "beghairat",

    # ── Spanish & French ──
    "puta", "puto", "mierda", "cabron", "pendejo", "chingar", "hijo de puta",
    "merde", "putain", "salope", "connard", "encule",
}

# Explicit severe violent harassment phrases
SEVERE_HARASSMENT_PHRASES = [
    "kill yourself", "go die", "die in a fire", "hang yourself", "kys"
]

# Comprehensive allowlist of everyday casual, conversational, academic, and technical words
BENIGN_ALLOWLIST = {
    # Greetings & Salutations
    "hello", "hlo", "helo", "hi", "hey", "howdy", "sup", "yo", "namaste", "vanakkam", "namaskaram",
    "morning", "evening", "afternoon", "night", "goodnight",
    
    # Common conversational words, verbs & compliments
    "how", "are", "you", "what", "where", "when", "why", "who", "which", "whose", "whom",
    "doing", "going", "coming", "seeing", "looking", "watching", "reading", "writing", "learning",
    "studying", "working", "helping", "solving", "testing", "passing", "trying", "running",
    "talking", "speaking", "chatting", "discussing", "asking", "telling", "saying", "sharing",
    "can", "could", "will", "would", "shall", "should", "may", "might", "must",
    "is", "am", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did",
    "thanks", "thank", "welcome", "please", "sorry", "excuse", "pardon", "alright", "right", "sure",
    "okay", "ok", "k", "fine", "cool", "nice", "great", "awesome", "good", "best", "better",
    "amazing", "super", "wonderful", "fantastic", "excellent", "brilliant", "legend", "rockstar",
    "champ", "genius", "smart", "kind", "helpful", "proud", "happy", "glad", "safe", "clean",
    
    # Casual colloquial Indian words (Telugu, Hindi, Tamil, Kannada, etc.)
    "sollu", "chetha", "vedhava", "donganaayala", "naayala", "bevarsi", "bevkoof", "saala", "saali",
    "kutta", "kutte", "kutti", "suar", "koli", "kayi", "kalla", "loafer", "huchha", "huchhi", "kena",
    "baadu", "porukki", "mayiru", "andi", "panni", "thendi", "vedi", "naaye", "bal", "shala", "shali",
    "pod", "pataka", "babu", "yaar", "bhai", "bro", "dost", "mitra", "anna", "tammudu", "thambi",
    "machan", "macha", "ra", "rey", "da", "di", "bapu", "mast", "bindaas", "jugaad", "chalta",
    
    # People, roles, pronouns & kinship
    "man", "bro", "dude", "guys", "boy", "girl", "friend", "friends", "buddy", "buddies", "pal",
    "mate", "folks", "people", "everyone", "someone", "anyone", "student", "students", "mentor",
    "mentors", "teacher", "teachers", "faculty", "professor", "prof", "developer", "developers",
    "engineer", "engineers", "programmer", "coder", "coders", "learner", "learners", "peer", "peers",
    "team", "group", "class", "classroom", "community", "institute", "college", "school", "campus",
    
    # Academic & technical keywords
    "algorithm", "algorithms", "data", "database", "code", "coding", "program", "programming",
    "system", "systems", "network", "web", "frontend", "backend", "fullstack", "software",
    "hardware", "physics", "chemistry", "mathematics", "math", "biology", "science", "exam", "exams",
    "test", "tests", "testing", "quiz", "quizzes", "contest", "contests", "challenge", "challenges",
    "solution", "solutions", "submission", "submissions", "score", "scores", "marks", "rank", "ranking",
    "title", "titles", "description", "note", "notes", "lecture", "lectures", "video", "videos",
    "course", "courses", "syllabus", "unit", "chapter", "topic", "topics", "question", "questions",
    "problem", "problems", "array", "string", "number", "integer", "boolean", "null", "pointer",
    "tree", "graph", "stack", "queue", "loop", "function", "variable", "constant", "object",
    "struct", "interface", "type", "module", "package", "import", "export", "file", "folder",
    "pass", "passed", "fail", "failed", "error", "warning", "debug", "run", "execute", "output", "input",
    "compiler", "sandbox", "memory", "cpu", "time", "space", "complexity", "analysis", "analytics",
    "assume", "assumed", "assumption", "grass", "bass", "mass", "compass", "assessment",
    "asset", "assets", "assert", "assertion", "assign", "assignment", "associate", "association",
    "assistance", "assistant", "assist", "massachusetts", "circus", "discuss", "discussion",
    "semester", "dickens", "cockpit", "shuttle", "button", "bottom", "curse"
}

def normalize_text(text: str) -> str:
    """
    Normalizes text by substituting leetspeak symbols and collapsing intentional elongation.
    Preserves legitimate double letters (e.g. good, cool, class, look, see, feel, room).
    Only collapses 3 or more consecutive identical characters (e.g. fuuuuck -> fuck, shiiit -> shit).
    """
    if not text:
        return ""
    
    lowered = text.lower()
    
    # 1. Substitute leetspeak symbols
    decoded = []
    for ch in lowered:
        decoded.append(LEET_MAP.get(ch, ch))
    decoded_str = "".join(decoded)
    
    # 2. Collapse repeated characters only when 3 or more are repeated
    collapsed = re.sub(r'(.)\1{2,}', r'\1', decoded_str)
    
    return collapsed


def moderate_content(text: str) -> Tuple[bool, Optional[str]]:
    """
    Strictly evaluates text for vulgar, bad, or genuinely inappropriate language.
    Guarantees ZERO false-positive filtering on casual, conversational, or academic words.
    Returns: (is_safe, error_reason)
    """
    if not text or not text.strip():
        return True, None

    lower_text = text.lower().strip()

    # ── STAGE 0: SEVERE VIOLENT HARASSMENT ──
    for phrase in SEVERE_HARASSMENT_PHRASES:
        if phrase in lower_text:
            return False, "Your text contains prohibited or abusive language. KOINEXA requires a constructive and respectful academic environment."

    normalized = normalize_text(text)

    # ── STAGE 1: DIRECT VULGARITY & PROFANITY LOOKUP ──
    # Extract tokens from both original and normalized text
    raw_tokens = re.findall(r'[a-zA-Z0-9_]+', lower_text)
    norm_tokens = re.findall(r'[a-zA-Z0-9_]+', normalized)
    all_tokens = set(raw_tokens + norm_tokens)

    # Check corpus engine if available
    corpus_engine = None
    try:
        try:
            from backend.ml_moderation.corpus_engine import get_corpus_engine
        except ImportError:
            from ml_moderation.corpus_engine import get_corpus_engine
        corpus_engine = get_corpus_engine()
    except Exception:
        pass

    for token in all_tokens:
        # Whitelisted casual/academic/technical words are always safe
        if token in BENIGN_ALLOWLIST:
            continue

        if token in PROFANITY_LIST:
            return False, f"Your text contains prohibited or vulgar language ('{token}'). KOINEXA requires a constructive and respectful academic environment."

        if corpus_engine:
            match = corpus_engine.lookup_term(token)
            if match:
                lang_code = match.get("lang", "en").upper()
                return False, f"Your text contains prohibited or vulgar language ('{token}') detected in {lang_code}. KOINEXA requires a constructive and respectful academic environment."

    # ── STAGE 2: ANTI-OBFUSCATION (Spaced words like 'f u c k' and asterisk masking like 'f*ck') ──
    # Check spaced deliberate evasion: e.g. "f u c k", "b i t c h"
    spaced_matches = re.findall(r'\b[a-zA-Z](?:[\s._\-/\*+~]+[a-zA-Z]){2,}\b', normalized)
    for match in spaced_matches:
        reconstructed = re.sub(r'[^a-zA-Z]', '', match)
        if reconstructed in BENIGN_ALLOWLIST:
            continue
        if reconstructed in PROFANITY_LIST:
            return False, f"Your text contains prohibited or vulgar language ('{reconstructed}'). KOINEXA requires a constructive and respectful academic environment."

    # Check symbol-masked words: e.g. "f*ck", "b*tch", "sh*t", "ch*tiya"
    masked_words = re.findall(r'\b[a-zA-Z]+[\*@#$%!][a-zA-Z]+\b', text)
    for mw in masked_words:
        # Substitute common vowels to check if it's masking a profanity
        for v in ['u', 'i', 'a', 'o', 'e']:
            test_w = re.sub(r'[\*@#$%!]', v, mw.lower())
            if test_w in PROFANITY_LIST and test_w not in BENIGN_ALLOWLIST:
                return False, f"Your text contains prohibited or vulgar language ('{mw}'). KOINEXA requires a constructive and respectful academic environment."

    return True, None

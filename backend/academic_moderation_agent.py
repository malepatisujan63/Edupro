# -*- coding: utf-8 -*-
"""
Agentic Academic Content Moderation Engine (Veritas Academic Sentinel)
Strictly enforces KOINEXA's Terms & Conditions: ONLY educational, scientific,
and engineering content is permitted. Non-educational content (entertainment,
music, gaming, pop culture, comedy, vlogs, politics, movies, gambling) is
strictly detected, triggering automated account termination, user data purge,
and formal SMTP disciplinary email dispatch.
"""

import urllib.request
import urllib.parse
import json
import re
import time
import secrets
from typing import Dict, Any, List, Tuple, Optional

# Educational Keywords & Categories
ACADEMIC_DOMAINS = {
    "computer_science": [
        "algorithm", "data structure", "dsa", "programming", "python", "javascript", "typescript",
        "c++", "cpp", "java", "rust", "golang", "sql", "nosql", "database", "system design",
        "machine learning", "deep learning", "artificial intelligence", "neural network",
        "web development", "react", "nextjs", "backend", "frontend", "api", "rest api", "graphql",
        "docker", "kubernetes", "cloud", "aws", "devops", "linux", "compiler", "operating system",
        "cybersecurity", "cryptography", "leetcode", "codeforces", "competitive programming",
        "object oriented", "oop", "computer networks", "tcp/ip", "git", "github", "software engineering"
    ],
    "mathematics": [
        "calculus", "linear algebra", "discrete mathematics", "probability", "statistics",
        "differential equations", "number theory", "algebra", "geometry", "trigonometry",
        "matrices", "eigenvalues", "vectors", "combinatorics", "integration", "derivatives",
        "fourier transform", "laplace transform", "complex analysis", "real analysis"
    ],
    "natural_sciences": [
        "physics", "chemistry", "biology", "thermodynamics", "quantum mechanics", "electromagnetism",
        "organic chemistry", "inorganic chemistry", "physical chemistry", "biochemistry", "genetics",
        "cell biology", "optics", "kinematics", "astronomy", "astrophysics"
    ],
    "engineering": [
        "electrical engineering", "mechanical engineering", "civil engineering", "electronics",
        "vlsi", "embedded systems", "microcontroller", "robotics", "control systems", "signal processing",
        "aerospace engineering", "chemical engineering", "cad", "solidworks", "circuit analysis"
    ],
    "competitive_exams_academics": [
        "jee main", "jee advanced", "neet", "gate exam", "cat exam", "upsc", "sat prep", "gre prep",
        "olympiad", "cbse", "icse", "board exam", "class 11", "class 12", "university syllabus",
        "lecture", "textbook", "solved paper", "previous year questions", "pyqs", "formula sheet",
        "engineering mathematics", "college lecture", "professor", "curriculum"
    ],
    "study_and_collegiate": [
        "study", "studymate", "study mate", "exam", "examination", "homework", "assignment",
        "syllabus", "revision", "course", "learning", "notes", "university", "college", "school",
        "student", "tutorial", "documentation", "research", "thesis", "paper", "campus",
        "library", "professor", "mentor", "faculty", "classroom", "education", "science",
        "technology", "robotics", "coding", "hackathon", "developer", "problem solving",
        "academics", "curriculum", "scholarship", "internship", "seminar", "workshop"
    ]
}

# Non-Educational Keywords & Disqualifying Patterns
NON_EDUCATIONAL_PATTERNS = {
    "music": [
        r"\bofficial music video\b", r"\bofficial video\b", r"\bmusic video\b", r"\blyric video\b",
        r"\baudio track\b", r"\bsong\b", r"\bsongs\b", r"\bsinger\b", r"\bremix\b", r"\bdj\b",
        r"\bchoreography\b", r"\bdance cover\b", r"\bfeat\.\b", r"\bft\.\b", r"\balbum\b",
        r"\bspotify\b", r"\bvevo\b", r"\bpop song\b", r"\bhip hop\b", r"\brap song\b",
        r"\bbollywood song\b", r"\bpunjabi song\b", r"\bt-series\b", r"\bslowed and reverb\b",
        r"\blive concert\b", r"\bguitar cover\b", r"\bk-pop\b", r"\bbts\b", r"\btaylor swift\b",
        r"\bed sheeran\b", r"\bdrake\b", r"\barjit singh\b", r"\bsidhu moose\b", r"\bdiss track\b"
    ],
    "gaming": [
        r"\bgameplay\b", r"\bwalkthrough\b", r"\bplaythrough\b", r"\blet's play\b", r"\bspeedrun\b",
        r"\bminecraft\b", r"\bgta v\b", r"\bgta 5\b", r"\bgta 6\b", r"\bgta\b", r"\broblox\b", r"\bfortnite\b",
        r"\bvalorant\b", r"\bpubg\b", r"\bbgmi\b", r"\bfree fire\b", r"\bcall of duty\b",
        r"\bclash royale\b", r"\bclash of clans\b", r"\bapex legends\b", r"\bps5\b", r"\bxbox\b",
        r"\bnintendo switch\b", r"\bgaming montage\b", r"\bkill montage\b", r"\besports highlights\b",
        r"\bboss fight\b", r"\bgaming stream\b", r"\bgaming clips\b", r"\bclutch gameplay\b"
    ],
    "movies_and_entertainment": [
        r"\bofficial trailer\b", r"\bteaser trailer\b", r"\btrailer\b", r"\bteaser\b",
        r"\bfull movie\b", r"\bmovie scene\b", r"\bweb series\b", r"\bcelebrity gossip\b",
        r"\bmovie review\b", r"\bcinema\b", r"\bhollywood\b", r"\bbollywood\b", r"\bactor\b",
        r"\bactress\b", r"\bbox office\b", r"\bnetflix\b", r"\bepisode\b", r"\bbehind the scenes\b",
        r"\banime episode\b", r"\bmanga chapter\b"
    ],
    "comedy_and_vlogs": [
        r"\bprank\b", r"\broast\b", r"\bcomedy sketch\b", r"\bstandup comedy\b", r"\bfunny moments\b",
        r"\bmemes compilation\b", r"\btiktok compilation\b", r"\bdaily vlog\b", r"\bshopping haul\b",
        r"\bmakeup tutorial\b", r"\bskincare routine\b", r"\bootd\b", r"\bgrwm\b", r"\bunboxing\b",
        r"\b24 hours challenge\b", r"\brelationship advice\b", r"\bdating tips\b", r"\bmukbang\b"
    ],
    "gambling_and_scams": [
        r"\bcasino\b", r"\bbetting\b", r"\brummy\b", r"\bdream11\b", r"\bcrypto pump\b",
        r"\bearn 1000 daily\b", r"\bmake money online fast\b", r"\bget rich quick\b"
    ]
}

# Strictly forbidden YouTube Genres
BANNED_YOUTUBE_GENRES = {
    "music": "Music / Song Performance",
    "gaming": "Video Game / Gameplay Streaming",
    "entertainment": "Entertainment / Pop Culture",
    "comedy": "Comedy / Skits / Jokes",
    "film & animation": "Movies / Film & Television",
    "sports": "Sports / Athletic Matches",
    "news & politics": "Political Debates / Sensational News",
    "people & blogs": "Personal Vlogging / Lifestyle",
    "autos & vehicles": "Automotive / Racing",
    "travel & events": "Travelogues / Social Events"
}

ALLOWED_YOUTUBE_GENRES = {
    "education": "Academic Education & Tutorials",
    "science & technology": "Science, Engineering & Technology"
}


class AgenticAcademicSentinel:
    """
    Autonomous multi-stage agentic engine that inspects submitted posts,
    YouTube videos, links, and text content against KOINEXA's Educational Terms of Service.
    """

    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        }

    # ── Node 1: Video & Media Extraction ──

    def extract_youtube_video_id(self, url_or_text: Optional[str]) -> Optional[str]:
        if not url_or_text:
            return None
        match = re.search(
            r"(?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?(?:.*&)?v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})",
            str(url_or_text)
        )
        return match.group(1) if match else None

    def fetch_youtube_metadata(self, video_id: str) -> Dict[str, Any]:
        """
        Gathers live metadata from YouTube oEmbed and video webpage HTML.
        Retrieves video title, author, description, tags, keywords, and official genre.
        """
        meta: Dict[str, Any] = {
            "video_id": video_id,
            "title": "",
            "author": "",
            "description": "",
            "genre": "",
            "keywords": [],
            "thumbnail_url": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
            "is_available": False,
        }

        # 1. Fetch oEmbed metadata
        try:
            oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
            req = urllib.request.Request(oembed_url, headers=self.headers)
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode("utf-8", errors="ignore"))
                meta["title"] = data.get("title", "")
                meta["author"] = data.get("author_name", "")
                if data.get("thumbnail_url"):
                    meta["thumbnail_url"] = data["thumbnail_url"]
                meta["is_available"] = True
        except Exception:
            pass

        # 2. Scrape live watch page for genre & description
        try:
            watch_url = f"https://www.youtube.com/watch?v={video_id}"
            req = urllib.request.Request(watch_url, headers=self.headers)
            with urllib.request.urlopen(req, timeout=6) as resp:
                html = resp.read().decode("utf-8", errors="ignore")
                
                # Title
                if not meta["title"]:
                    title_m = re.search(r"<title>([^<]*)</title>", html)
                    if title_m:
                        meta["title"] = title_m.group(1).replace(" - YouTube", "").strip()

                # Official Genre
                genre_m = re.search(r'<meta\s+itemprop=["\']genre["\']\s+content=["\']([^"\']*)["\']', html, re.I)
                if not genre_m:
                    genre_m = re.search(r'\\\"genre\\\":\\\"([^\\\"]*)\\\"', html)
                if genre_m:
                    meta["genre"] = genre_m.group(1).strip()

                # Description
                desc_m = re.search(r'<meta\s+name=["\']description["\']\s+content=["\']([^"\']*)["\']', html, re.I)
                if not desc_m:
                    desc_m = re.search(r'<meta\s+property=["\']og:description["\']\s+content=["\']([^"\']*)["\']', html, re.I)
                if desc_m:
                    meta["description"] = desc_m.group(1).strip()

                # Keywords
                kw_m = re.search(r'<meta\s+name=["\']keywords["\']\s+content=["\']([^"\']*)["\']', html, re.I)
                if kw_m:
                    meta["keywords"] = [k.strip() for k in kw_m.group(1).split(",") if k.strip()]
                meta["is_available"] = True
        except Exception:
            pass

        return meta

    # ── Node 2: Online Knowledge Retrieval & Search Engine ──

    def query_online_knowledge(self, query: str) -> List[Dict[str, str]]:
        """
        Queries Wikipedia Global Knowledge API to obtain entity context
        and verify whether a subject is academic or entertainment/pop culture.
        """
        if not query or len(query.strip()) < 3:
            return []

        clean_q = re.sub(r"[^\w\s]", " ", query).strip()
        encoded = urllib.parse.quote(clean_q)
        api_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={encoded}&utf8=&format=json&srlimit=3"

        req = urllib.request.Request(
            api_url,
            headers={"User-Agent": "KoinexaAcademicSentinel/2.0 (academic.koinexa.edu)"}
        )

        results = []
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode("utf-8", errors="ignore"))
                search_items = data.get("query", {}).get("search", [])
                for item in search_items:
                    snippet = re.sub(r"<[^>]+>", "", item.get("snippet", ""))
                    results.append({
                        "title": item.get("title", ""),
                        "snippet": snippet
                    })
        except Exception:
            pass

        return results

    # ── Node 3: Semantic Analysis & Multi-Signal Reasoning ──

    def evaluate_academic_content(
        self,
        title: str = "",
        content: str = "",
        youtube_url: Optional[str] = None,
        post_type: str = "tweet"
    ) -> Dict[str, Any]:
        """
        Agentic reasoning pipeline:
        1. Gathers full text, live video genre, description, channel, and search engine results.
        2. Evaluates non-educational vs academic signals.
        3. Returns decision dict: is_educational, verdict, reason, category, confidence.
        """
        extracted_vid = self.extract_youtube_video_id(youtube_url) or self.extract_youtube_video_id(content)
        video_meta: Dict[str, Any] = {}
        if extracted_vid:
            video_meta = self.fetch_youtube_metadata(extracted_vid)

        # Aggregate all text representations
        corpus_elements = [
            title,
            content,
            video_meta.get("title", ""),
            video_meta.get("description", ""),
            video_meta.get("author", ""),
            " ".join(video_meta.get("keywords", []))
        ]
        full_text = " ".join([c for c in corpus_elements if c]).lower()

        # ── Step A: Direct YouTube Genre Validation ──
        genre = video_meta.get("genre", "").lower().strip()
        if genre:
            for banned_g, label in BANNED_YOUTUBE_GENRES.items():
                if banned_g in genre:
                    return {
                        "is_educational": False,
                        "verdict": "BAN",
                        "category": label,
                        "confidence": 0.99,
                        "reason": f"Video genre is registered as '{label}' on YouTube. KOINEXA terms strictly permit verified educational, scientific, and technical tutorial content only.",
                        "video_meta": video_meta
                    }

        # ── Step B: Non-Educational Pattern Scanning ──
        detected_non_edu_signals = []
        for cat_name, patterns in NON_EDUCATIONAL_PATTERNS.items():
            for pat in patterns:
                if re.search(pat, full_text):
                    detected_non_edu_signals.append(f"{cat_name}: {pat.strip(r'\\b')}")

        # ── Step C: Academic Keyword Scanning ──
        academic_matches = []
        for domain, keywords in ACADEMIC_DOMAINS.items():
            for kw in keywords:
                if re.search(r"\b" + re.escape(kw) + r"\b", full_text):
                    academic_matches.append(kw)

        # ── Step D: Search Engine Verification for Ambiguous Content ──
        search_evidence = []
        search_query = ""
        if video_meta.get("title"):
            search_query = video_meta["title"]
        elif title:
            search_query = title
        elif content:
            search_query = content.split("\n")[0][:100].strip()

        if search_query:
            search_evidence = self.query_online_knowledge(search_query)

        for item in search_evidence:
            item_text = (item["title"] + " " + item["snippet"]).lower()
            # If search engine evidence explicitly declares this is a pop song, video game, movie, or pop band:
            if re.search(r"\b(is a song|lead single|studio album|recorded by|pop song|music video|first-person shooter|video game developed by|film directed by|superhero film|released as a single|singer-songwriter|concert tour|concert film|american rapper|rock band|boy band|girl group|k-pop|hip hop artist|comedian|stand-up comedian|reality television|soap opera|professional wrestler|wwe wrestler|fashion model|action role-playing game|multiplayer online battle arena|battle royale game|third-person shooter)\b", item_text):
                detected_non_edu_signals.append(f"search_engine_classified: {item['title']} ({item['snippet'][:80]})")

        # ── Step E: Synthesis & Final Verdict ──
        non_edu_count = len(detected_non_edu_signals)
        academic_count = len(academic_matches)

        # Hard rules:
        # 1. Any confirmed music/gameplay/movie pattern when post has 0 academic matches = INSTANT BAN
        if non_edu_count > 0 and academic_count == 0:
            return {
                "is_educational": False,
                "verdict": "BAN",
                "category": "Non-Educational Media / Entertainment",
                "confidence": 0.98,
                "reason": f"Content was identified as non-educational entertainment ({detected_non_edu_signals[0]}). KOINEXA terms strictly prohibit entertainment, gaming, and non-academic pop culture.",
                "video_meta": video_meta
            }

        # 2. For video courses: If video has non-educational signals or no academic terminology:
        if post_type == "youtube_course" or extracted_vid:
            if non_edu_count > academic_count or academic_count == 0:
                # If genre is explicitly Education, give benefit of the doubt only if no non-edu signals
                if genre not in ["education", "science & technology"]:
                    violating_signal = detected_non_edu_signals[0] if detected_non_edu_signals else "Lack of verified educational/technical syllabus"
                    return {
                        "is_educational": False,
                        "verdict": "BAN",
                        "category": "Non-Educational Video Material",
                        "confidence": 0.95,
                        "reason": f"Video does not meet KOINEXA academic tutorial and collegiate standards ({violating_signal}).",
                        "video_meta": video_meta
                    }

        # 3. For tweets/posts: If purely non-educational chatter/gaming/entertainment:
        if post_type in ["tweet", "hackathon"]:
            if non_edu_count > 0 and academic_count == 0:
                return {
                    "is_educational": False,
                    "verdict": "BAN",
                    "category": "Non-Educational Discussion",
                    "confidence": 0.96,
                    "reason": f"Content violates educational terms: Non-academic topic detected ({detected_non_edu_signals[0]}).",
                    "video_meta": video_meta
                }

        # Passes educational verification
        return {
            "is_educational": True,
            "verdict": "ALLOW",
            "category": "Academic / Educational Learning Material",
            "confidence": 0.95 if academic_count > 0 else 0.80,
            "reason": "Content verified as educational, engineering, or collegiate learning material.",
            "video_meta": video_meta
        }


# Global Singleton Instance
academic_sentinel = AgenticAcademicSentinel()

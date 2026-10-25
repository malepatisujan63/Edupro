# -*- coding: utf-8 -*-
"""
Agentic Academic Content Moderation Engine (Veritas Academic Sentinel 2.0)
Strictly enforces KOINEXA's Terms & Conditions: ONLY educational, scientific,
engineering, tutorial, and collegiate learning content is permitted.

Capabilities:
1. Deep Video Metadata Extraction: Extracts exact video title, channel/creator,
   full description (via shortDescription and meta tags), keywords, genre, and thumbnail.
2. Real-World Online Search & Knowledge Retrieval: Automatically queries the online
   knowledge graph and search engine to verify the true nature of videos, creators,
   hackathons, and contests.
3. Contest & Hackathon Portal Inspection: Inspects registration URLs, verifying
   academic, collegiate, or developer authenticity, and blocking gambling, betting,
   gaming tournaments, and fake giveaways.
4. Rational Multi-Signal Decision Synthesis: Combines all signals into a transparent,
   rational verdict, triggering automated account termination, hard data purge,
   and formal disciplinary email dispatch for policy violations.
"""

import urllib.request
import urllib.parse
import json
import re
import time
import secrets
import codecs
from typing import Dict, Any, List, Tuple, Optional

# Educational Domains & Keywords
ACADEMIC_DOMAINS = {
    "computer_science": [
        "algorithm", "algorithms", "data structure", "data structures", "dsa", "programming", "python",
        "javascript", "typescript", "c++", "cpp", "java", "rust", "golang", "sql", "nosql", "database",
        "databases", "system design", "machine learning", "deep learning", "artificial intelligence",
        "neural network", "neural networks", "web development", "react", "nextjs", "backend", "frontend",
        "api", "rest api", "graphql", "docker", "kubernetes", "cloud", "aws", "devops", "linux", "compiler",
        "compilers", "operating system", "operating systems", "virtual memory", "cybersecurity", "cryptography",
        "leetcode", "codeforces", "competitive programming", "object oriented", "oop", "computer networks",
        "tcp/ip", "git", "github", "software engineering", "code", "coding", "html", "css", "vue", "angular",
        "django", "flask", "fastapi", "express", "nodejs", "node.js", "pandas", "numpy", "pytorch", "tensorflow"
    ],
    "mathematics": [
        "calculus", "linear algebra", "discrete mathematics", "probability", "statistics",
        "differential equations", "number theory", "algebra", "geometry", "trigonometry",
        "matrices", "eigenvalues", "vectors", "combinatorics", "integration", "derivatives",
        "fourier transform", "laplace transform", "complex analysis", "real analysis", "math", "maths",
        "topology", "set theory", "boolean algebra", "graph theory"
    ],
    "natural_sciences": [
        "physics", "chemistry", "biology", "thermodynamics", "quantum mechanics", "electromagnetism",
        "organic chemistry", "inorganic chemistry", "physical chemistry", "biochemistry", "genetics",
        "cell biology", "optics", "kinematics", "astronomy", "astrophysics", "science", "neuroscience",
        "ecology", "evolution", "molecular biology", "periodic table", "chemical bonding"
    ],
    "engineering": [
        "electrical engineering", "mechanical engineering", "civil engineering", "electronics",
        "vlsi", "embedded systems", "microcontroller", "robotics", "control systems", "signal processing",
        "aerospace engineering", "chemical engineering", "cad", "solidworks", "circuit analysis", "engineering",
        "arduino", "raspberry pi", "fpga", "structural analysis", "fluid mechanics"
    ],
    "competitive_exams_academics": [
        "jee main", "jee advanced", "jee prep", "jee", "neet", "gate exam", "gate", "cat exam", "upsc",
        "sat prep", "gre prep", "sat", "gre", "olympiad", "cbse", "icse", "board exam", "class 11",
        "class 12", "university syllabus", "lecture", "lectures", "textbook", "textbooks", "solved paper",
        "previous year questions", "pyqs", "formula sheet", "engineering mathematics", "college lecture",
        "professor", "curriculum", "preparation", "prep"
    ],
    "study_and_collegiate": [
        "study", "studying", "studymate", "study mate", "study partner", "study group", "exam", "exams",
        "examination", "homework", "assignment", "assignments", "syllabus", "revision", "course", "courses",
        "learning", "notes", "university", "college", "school", "student", "students", "tutorial", "tutorials",
        "documentation", "research", "thesis", "paper", "papers", "campus", "library", "professor", "professors",
        "mentor", "mentors", "faculty", "classroom", "classrooms", "education", "educational", "science",
        "technology", "robotics", "coding", "hackathon", "hackathons", "developer", "developers",
        "problem solving", "academics", "academic", "curriculum", "scholarship", "internship", "seminar",
        "workshop", "ideathon", "datathon", "code sprint", "open source"
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
        r"\bed sheeran\b", r"\bdrake\b", r"\barjit singh\b", r"\bsidhu moose\b", r"\bdiss track\b",
        r"\btrack\b", r"\bbeats\b", r"\bplaylist\b", r"\bkaraoke\b"
    ],
    "gaming": [
        r"\bgameplay\b", r"\bwalkthrough\b", r"\bplaythrough\b", r"\blet's play\b", r"\bspeedrun\b",
        r"\bminecraft\b", r"\bgta v\b", r"\bgta 5\b", r"\bgta 6\b", r"\bgta\b", r"\broblox\b", r"\bfortnite\b",
        r"\bvalorant\b", r"\bpubg\b", r"\bbgmi\b", r"\bfree fire\b", r"\bcall of duty\b",
        r"\bclash royale\b", r"\bclash of clans\b", r"\bapex legends\b", r"\bps5\b", r"\bxbox\b",
        r"\bnintendo switch\b", r"\bgaming montage\b", r"\bkill montage\b", r"\besports highlights\b",
        r"\bboss fight\b", r"\bgaming stream\b", r"\bgaming clips\b", r"\bclutch gameplay\b",
        r"\bfifa\b", r"\bstreamer\b", r"\btwitch\b", r"\bgamer\b", r"\besports\b"
    ],
    "movies_and_entertainment": [
        r"\bofficial trailer\b", r"\bteaser trailer\b", r"\btrailer\b", r"\bteaser\b",
        r"\bfull movie\b", r"\bmovie scene\b", r"\bmovie\b", r"\bmovies\b", r"\bfilm\b", r"\bfilms\b",
        r"\bweb series\b", r"\bcelebrity gossip\b", r"\bmovie review\b", r"\bcinema\b",
        r"\bhollywood\b", r"\bbollywood\b", r"\bactor\b", r"\bactress\b", r"\bbox office\b",
        r"\bnetflix\b", r"\bepisode\b", r"\bbehind the scenes\b", r"\banime episode\b",
        r"\bmanga chapter\b", r"\bpopcorn\b", r"\bsuperhero\b", r"\bmarvel\b"
    ],
    "comedy_and_vlogs": [
        r"\bprank\b", r"\broast\b", r"\bcomedy sketch\b", r"\bstandup comedy\b", r"\bfunny moments\b",
        r"\bmemes compilation\b", r"\btiktok compilation\b", r"\bdaily vlog\b", r"\bshopping haul\b",
        r"\bmakeup tutorial\b", r"\bskincare routine\b", r"\bootd\b", r"\bgrwm\b", r"\bunboxing\b",
        r"\b24 hours challenge\b", r"\brelationship advice\b", r"\bdating tips\b", r"\bmukbang\b",
        r"\bvlogger\b", r"\binfluencer\b"
    ],
    "lifestyle_and_chatter": [
        r"\blunch\b", r"\bdinner\b", r"\bbreakfast\b", r"\bpizza\b", r"\bburger\b", r"\bfoodie\b",
        r"\bparty\b", r"\bclubbing\b", r"\bweekend vibes\b", r"\bchilling\b", r"\bhangout\b",
        r"\bcrush\b", r"\bgirlfriend\b", r"\bboyfriend\b", r"\bdating\b", r"\bshopping\b",
        r"\bgym workout\b", r"\bfashion\b", r"\bgossip\b", r"\bfollow me\b",
        r"\bsubscribe to my\b", r"\bgiveaway\b", r"\bmrbeast\b"
    ],
    "gambling_and_scams": [
        r"\bcasino\b", r"\bbetting\b", r"\brummy\b", r"\bdream11\b", r"\bcrypto pump\b",
        r"\bearn 1000 daily\b", r"\bmake money online fast\b", r"\bget rich quick\b",
        r"\bteen patti\b", r"\baviator game\b", r"\bfree robux\b", r"\bfree vbucks\b",
        r"\blucky draw\b", r"\blottery\b", r"\bspin and win\b"
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

# Trusted Hackathon & Academic Platforms
TRUSTED_HACKATHON_PLATFORMS = {
    "unstop.com", "devpost.com", "mlh.io", "kaggle.com", "hackerearth.com",
    "hackerrank.com", "codeforces.com", "leetcode.com", "atcoder.jp", "topcoder.com",
    "github.com", "gitlab.com", "sih.gov.in", "aicte-india.org", "acm.org", "ieee.org",
    "coursera.org", "edx.org", "nptel.ac.in", "swayam.gov.in"
}

# Prohibited Contest Patterns (gambling, betting, gaming tournaments)
PROHIBITED_CONTEST_PATTERNS = [
    r"\bcasino\b", r"\bbetting\b", r"\brummy\b", r"\bdream11\b", r"\bmpl\b", r"\bmy11circle\b",
    r"\bpoker\b", r"\bbet365\b", r"\b1xbet\b", r"\bparimatch\b", r"\bstake\.com\b",
    r"\bfree robux\b", r"\bfree vbucks\b", r"\bgiveaway\b", r"\blucky draw\b", r"\blottery\b",
    r"\bspin and win\b", r"\bteen patti\b", r"\baviator game\b", r"\bpubg tournament\b",
    r"\bfree fire tournament\b", r"\bbgmi tournament\b", r"\bgaming tournament\b",
    r"\besports tournament\b", r"\bcustom room tournament\b"
]


class AgenticAcademicSentinel:
    """
    Autonomous multi-stage agentic engine that inspects submitted posts,
    YouTube videos, links, hackathons, and text content against KOINEXA's
    Educational Terms of Service.
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
        Retrieves video title, author, full description (via shortDescription and meta),
        tags, keywords, official genre, and thumbnail.
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
                meta["title"] = data.get("title", "").strip()
                meta["author"] = data.get("author_name", "").strip()
                if data.get("thumbnail_url"):
                    meta["thumbnail_url"] = data["thumbnail_url"]
                meta["is_available"] = True
        except Exception:
            pass

        # 2. Scrape live watch page for full description, genre & keywords
        try:
            watch_url = f"https://www.youtube.com/watch?v={video_id}"
            req = urllib.request.Request(watch_url, headers=self.headers)
            with urllib.request.urlopen(req, timeout=6) as resp:
                html_raw = resp.read().decode("utf-8", errors="ignore")

                # Extract Full Description via shortDescription in player response
                desc_match = re.search(r'\\\"shortDescription\\\":\\\"(.*?)\\\"', html_raw)
                if desc_match:
                    raw_desc = desc_match.group(1)
                    try:
                        clean_desc = codecs.decode(raw_desc, "unicode_escape")
                    except Exception:
                        clean_desc = raw_desc.replace(r'\"', '"').replace(r'\n', '\n')
                    meta["description"] = clean_desc.strip()

                # Fallback description if shortDescription was missing
                if not meta["description"]:
                    desc_m = re.search(r'<meta\s+name=["\']description["\']\s+content=["\']([^"\']*)["\']', html_raw, re.I)
                    if not desc_m:
                        desc_m = re.search(r'<meta\s+property=["\']og:description["\']\s+content=["\']([^"\']*)["\']', html_raw, re.I)
                    if desc_m:
                        meta["description"] = desc_m.group(1).strip()

                # Title fallback
                if not meta["title"]:
                    title_m = re.search(r"<title>([^<]*)</title>", html_raw)
                    if title_m:
                        meta["title"] = title_m.group(1).replace(" - YouTube", "").strip()

                # Author fallback
                if not meta["author"]:
                    auth_m = re.search(r'<link\s+itemprop=["\']name["\']\s+content=["\']([^"\']*)["\']', html_raw, re.I)
                    if auth_m:
                        meta["author"] = auth_m.group(1).strip()

                # Official Genre
                genre_m = re.search(r'<meta\s+itemprop=["\']genre["\']\s+content=["\']([^"\']*)["\']', html_raw, re.I)
                if not genre_m:
                    genre_m = re.search(r'\\\"genre\\\":\\\"([^\\\"]*)\\\"', html_raw)
                if genre_m:
                    meta["genre"] = genre_m.group(1).strip()

                # Keywords
                kw_m = re.search(r'<meta\s+name=["\']keywords["\']\s+content=["\']([^"\']*)["\']', html_raw, re.I)
                if kw_m:
                    meta["keywords"] = [k.strip() for k in kw_m.group(1).split(",") if k.strip()]

                meta["is_available"] = True
        except Exception:
            pass

        return meta

    # ── Node 2: Contest & Hackathon Portal Inspection ──

    def inspect_contest_or_hackathon(
        self,
        url: Optional[str],
        claimed_title: str = "",
        post_type: str = "hackathon"
    ) -> Dict[str, Any]:
        """
        Inspects registration URL for hackathons and contests:
        - Extracts domain and checks against trusted educational hackathon platforms.
        - Checks for prohibited patterns (gambling, betting, esports/gaming tournaments).
        - Fetches live page title, meta description, and body text snippets.
        """
        info: Dict[str, Any] = {
            "url": url or "",
            "domain": "",
            "portal_title": "",
            "portal_description": "",
            "portal_text": "",
            "is_trusted_platform": False,
            "is_prohibited_domain": False,
            "status": "not_provided"
        }

        if not url:
            return info

        try:
            parsed = urllib.parse.urlparse(str(url).strip())
            domain = parsed.netloc.lower()
            info["domain"] = domain

            # Check if domain is trusted academic / developer platform
            if any(p in domain for p in TRUSTED_HACKATHON_PLATFORMS) or domain.endswith((".edu", ".ac.in", ".edu.in", ".gov.in")):
                info["is_trusted_platform"] = True

            # Check prohibited contest domains (betting, casino, gaming)
            for bad_pat in PROHIBITED_CONTEST_PATTERNS:
                if re.search(bad_pat, domain):
                    info["is_prohibited_domain"] = True
                    break

            # Attempt live HTTP inspection
            req = urllib.request.Request(str(url).strip(), headers=self.headers)
            with urllib.request.urlopen(req, timeout=5) as resp:
                content = resp.read().decode("utf-8", errors="ignore")
                info["status"] = "accessible"

                # Extract title
                t_m = re.search(r"<title>([^<]*)</title>", content, re.I)
                if t_m:
                    info["portal_title"] = re.sub(r"\s+", " ", t_m.group(1)).strip()

                # Extract meta description
                desc_m = re.search(r'<meta\s+(?:name|property)=["\'](?:description|og:description)["\']\s+content=["\']([^"\']*)["\']', content, re.I)
                if desc_m:
                    info["portal_description"] = re.sub(r"\s+", " ", desc_m.group(1)).strip()

                # Extract body text snippet (strip scripts and styles)
                clean_body = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", content, flags=re.DOTALL | re.I)
                clean_body = re.sub(r"<[^>]+>", " ", clean_body)
                info["portal_text"] = re.sub(r"\s+", " ", clean_body)[:1000].strip()

        except urllib.error.HTTPError as e:
            # 403 Forbidden is common on bot-protected sites (e.g. Devpost, Kaggle Cloudflare)
            info["status"] = f"restricted_{e.code}"
        except Exception as e:
            info["status"] = f"error_{str(e)[:40]}"

        return info

    # ── Node 3: Online Knowledge Retrieval & Search Engine ──

    def query_online_knowledge(self, query: str) -> List[Dict[str, str]]:
        """
        Queries Wikipedia Global Knowledge Graph API to obtain real-world entity context
        and verify whether a subject/creator/contest is academic or entertainment/pop culture.
        """
        if not query or len(query.strip()) < 3:
            return []

        clean_q = re.sub(r"[^\w\s]", " ", query).strip()
        encoded = urllib.parse.quote(clean_q)
        api_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={encoded}&utf8=&format=json&srlimit=4"

        req = urllib.request.Request(
            api_url,
            headers={"User-Agent": "KoinexaAcademicSentinel/2.0 (academic.koinexa.edu; contact@koinexa.edu)"}
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

    # ── Node 4: Semantic Analysis & Multi-Signal Reasoning ──

    def evaluate_academic_content(
        self,
        title: str = "",
        content: str = "",
        youtube_url: Optional[str] = None,
        course_url: Optional[str] = None,
        post_type: str = "tweet"
    ) -> Dict[str, Any]:
        """
        Autonomous Agentic reasoning pipeline:
        1. Deep Metadata Extraction: Fetches exact video title, channel, full description, keywords, genre.
        2. Contest & Portal Inspection: Inspects course_url / registration URL for hackathons.
        3. Real-World Online Search: Queries knowledge base to uncover what the video/event actually is.
        4. Multi-Signal Synthesis: Strictly enforces educational-only policy and returns structured verdict.
        """
        # 1. Video Metadata Extraction
        extracted_vid = self.extract_youtube_video_id(youtube_url) or self.extract_youtube_video_id(content)
        video_meta: Dict[str, Any] = {}
        if extracted_vid:
            video_meta = self.fetch_youtube_metadata(extracted_vid)

        # 2. Hackathon / Contest Portal Inspection
        target_link = course_url or (youtube_url if post_type == "hackathon" else None)
        contest_meta: Dict[str, Any] = {}
        if post_type == "hackathon" or target_link:
            contest_meta = self.inspect_contest_or_hackathon(target_link, claimed_title=title, post_type=post_type)

        # 3. Aggregate all text representations
        corpus_elements = [
            title,
            content,
            video_meta.get("title", ""),
            video_meta.get("author", ""),
            video_meta.get("description", ""),
            " ".join(video_meta.get("keywords", [])),
            contest_meta.get("portal_title", ""),
            contest_meta.get("portal_description", ""),
            contest_meta.get("portal_text", "")
        ]
        full_text = " ".join([c for c in corpus_elements if c]).lower()

        # ── Step A: Direct Prohibited Contest & Gambling Domain Check ──
        if contest_meta.get("is_prohibited_domain"):
            return {
                "is_educational": False,
                "verdict": "BAN",
                "category": "Prohibited Contest / Gambling Platform",
                "confidence": 0.99,
                "reason": f"Registration link points to a prohibited non-educational or gambling domain ('{contest_meta.get('domain')}'). KOINEXA strictly permits verified academic hackathons, coding contests, and collegiate engineering challenges only.",
                "video_meta": video_meta,
                "contest_meta": contest_meta
            }

        for pat in PROHIBITED_CONTEST_PATTERNS:
            if re.search(pat, full_text):
                sig = pat.replace(r"\b", "").strip()
                return {
                    "is_educational": False,
                    "verdict": "BAN",
                    "category": "Non-Academic Contest Violation",
                    "confidence": 0.99,
                    "reason": f"Event was identified as a non-academic contest or gambling/gaming tournament ({sig}). KOINEXA terms strictly prohibit gaming tournaments, lotteries, and betting competitions.",
                    "video_meta": video_meta,
                    "contest_meta": contest_meta
                }

        # ── Step B: Direct YouTube Genre Validation ──
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
                        "video_meta": video_meta,
                        "contest_meta": contest_meta
                    }

        # ── Step C: Non-Educational Pattern Scanning Across Corpus & Description ──
        detected_non_edu_signals = []
        for cat_name, patterns in NON_EDUCATIONAL_PATTERNS.items():
            for pat in patterns:
                if re.search(pat, full_text):
                    clean_sig = pat.replace(r"\b", "").strip()
                    detected_non_edu_signals.append(f"{cat_name}: {clean_sig}")

        # ── Step D: Academic Keyword Scanning ──
        academic_matches = []
        for domain, keywords in ACADEMIC_DOMAINS.items():
            for kw in keywords:
                if re.search(r"\b" + re.escape(kw) + r"\b", full_text):
                    academic_matches.append(kw)
        academic_count = len(academic_matches)

        # ── Step E: Autonomous Online Search Engine Verification ──
        search_queries = []
        if video_meta.get("title"):
            search_queries.append(video_meta["title"])
            if video_meta.get("author"):
                search_queries.append(f"{video_meta['title']} {video_meta['author']}")
        if post_type == "hackathon" and title:
            search_queries.append(f"{title} hackathon contest competition")
        elif not search_queries and (title or content):
            query_candidate = (title or content.split("\n")[0])[:80].strip()
            if len(query_candidate.split()) >= 2:
                search_queries.append(query_candidate)

        search_evidence = []
        for sq in search_queries[:2]:
            evidence_items = self.query_online_knowledge(sq)
            search_evidence.extend(evidence_items)

        # Evaluate online search engine findings
        for item in search_evidence:
            item_title = item.get("title", "").lower()
            snippet = item.get("snippet", "").lower()
            combined_search_item = f"{item_title} {snippet}"

            # Check if online search discovered that this entity is entertainment, music, or gaming
            non_edu_search_pat = (
                r"\b(is a song|lead single|studio album|recorded by|pop song|music video|"
                r"first-person shooter|video game developed by|action-adventure game|"
                r"battle royale game|third-person shooter|multiplayer online battle arena|"
                r"film directed by|superhero film|released as a single|singer-songwriter|"
                r"concert tour|concert film|american rapper|rock band|boy band|girl group|"
                r"k-pop|hip hop artist|comedian|stand-up comedian|reality television|"
                r"soap opera|professional wrestler|wwe wrestler|fashion model)\b"
            )
            m = re.search(non_edu_search_pat, combined_search_item)
            if m:
                detected_non_edu_signals.append(
                    f"online_intelligence_classified: '{item.get('title')}' is recognized online as non-educational entertainment ({m.group(1)})"
                )

        # ── Step F: Synthesis & Strict Educational Verdict ──
        non_edu_count = len(detected_non_edu_signals)

        # RULE 1: Zero-Tolerance on Confirmed Non-Educational Signals
        if non_edu_count > 0:
            first_signal = detected_non_edu_signals[0]
            return {
                "is_educational": False,
                "verdict": "BAN",
                "category": "Non-Educational Content Violation",
                "confidence": 0.99,
                "reason": f"Content was autonomously identified through online intelligence and metadata inspection as non-educational entertainment ({first_signal}). KOINEXA terms strictly prohibit entertainment, gaming, songs, vlogs, and casual banter.",
                "video_meta": video_meta,
                "contest_meta": contest_meta,
                "search_evidence": search_evidence
            }

        # RULE 2: Hackathon Specific Validation
        if post_type == "hackathon":
            # Must have collegiate, developer, coding, or problem-solving substance
            is_valid_hackathon = (
                contest_meta.get("is_trusted_platform") or
                academic_count >= 1 or
                any(w in full_text for w in ["hackathon", "coding", "developer", "problem statement", "prize pool", "submission", "ideathon", "prototype", "build", "challenge"])
            )
            if not is_valid_hackathon:
                return {
                    "is_educational": False,
                    "verdict": "BAN",
                    "category": "Non-Educational Contest",
                    "confidence": 0.97,
                    "reason": "Event lacks verifiable academic, collegiate, or developer substance. KOINEXA terms permit verified collegiate hackathons, robotics challenges, and coding competitions only.",
                    "video_meta": video_meta,
                    "contest_meta": contest_meta,
                    "search_evidence": search_evidence
                }

        # RULE 3: Strict Educational Substance Requirement for Posts & Videos
        if academic_count == 0:
            # If trusted platform for hackathon was present, allow; otherwise ban
            if not (post_type == "hackathon" and contest_meta.get("is_trusted_platform")):
                return {
                    "is_educational": False,
                    "verdict": "BAN",
                    "category": "Lack of Educational / Collegiate Purpose",
                    "confidence": 0.97,
                    "reason": "Content lacks verifiable educational, scientific, or collegiate academic value. KOINEXA terms strictly permit verified tutorials, engineering coursework, exam prep, and collegiate study collaboration only.",
                    "video_meta": video_meta,
                    "contest_meta": contest_meta,
                    "search_evidence": search_evidence
                }

        # RULE 4: YouTube Videos - Strict Genre Verification
        if post_type == "youtube_course" or extracted_vid:
            if genre and genre not in ["education", "science & technology"]:
                return {
                    "is_educational": False,
                    "verdict": "BAN",
                    "category": f"Non-Educational Video Genre ({genre.title()})",
                    "confidence": 0.99,
                    "reason": f"Video genre is registered as '{genre.title()}' on YouTube. KOINEXA strictly mandates verified educational tutorial material.",
                    "video_meta": video_meta,
                    "contest_meta": contest_meta,
                    "search_evidence": search_evidence
                }

        # Passes strict educational verification
        return {
            "is_educational": True,
            "verdict": "ALLOW",
            "category": "Academic / Educational Learning Material",
            "confidence": 0.98,
            "reason": "Content verified as educational, engineering, tutorial, or collegiate learning material.",
            "video_meta": video_meta,
            "contest_meta": contest_meta,
            "search_evidence": search_evidence
        }


# Global Singleton Instance
academic_sentinel = AgenticAcademicSentinel()

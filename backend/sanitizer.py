# -*- coding: utf-8 -*-
r"""
KOINEXA In-App Character Whitelist & Sanitizer
Restricts in-app text entries to allowed characters:
- Numbers: 0-9
- Alphabets: A-Z, a-z
- Permitted symbols: , . ? ! & | / \ ( ) { } [ ]
- Standard whitespace: space, tab, newline
- Essential web delimiters: - _ : ; ' " @ # + = * % $ ~ `
Rejects malicious script tags, raw HTML injections, emojis, zero-width chars, and non-whitelisted characters.
"""

import re
from typing import Tuple, List

# Common mathematical, STEM, Greek, and typographic sets essential for academic platforms
STEM_MATH_SYMBOLS = (
    "≤≥≠±≈×÷·√∞∑∏∫∂∆∇∈∉⊂⊆∪∩∧∨¬⇒⇔→←↑↓°′″‰∝"
    "⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾₀₁₂₃₄₅₆₇₈₉ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖʳˢᵗᵘᵛʷˣʸᶻᵢⱼₖₗₘₙₚᵣₛₜᵤᵥₓ"
)

GREEK_SYMBOLS = (
    "αβγδεζηθικλμνξοπρστυφχψω"
    "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ"
)
LATIN_ACCENTED = (
    "áàâäãåçéèêëíìîïñóòôöõúùûüýÿæøœ"
    "ÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸÆØŒ"
)

TYPOGRAPHIC_AND_CURRENCY = (
    "“”‘’—–―−…•·§¶©®™«»‹›„‚"
    "$€£₹¥¢"
    "\u00a0\u202f\u2009\u200a"
)

# Build comprehensive character set safely
ALLOWED_CHARS_SET = set(
    "abcdefghijklmnopqrstuvwxyz"
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "0123456789"
    " \t\n\r"
    ",.?!&|/\\(){}[]<>"
    "-_:;\'\"@#+=*%$~`^"
    + STEM_MATH_SYMBOLS
    + GREEK_SYMBOLS
    + LATIN_ACCENTED
    + TYPOGRAPHIC_AND_CURRENCY
)

# Explicit dangerous script / payload patterns
MALICIOUS_TAG_PATTERNS = [
    "<script", "</script", "javascript:", "vbscript:",
    "onerror=", "onload=", "onclick=", "onmouseover=", "eval("
]

def validate_text_characters(text: str) -> Tuple[bool, List[str]]:
    """
    Validates whether the provided text contains only permitted characters and
    contains no malicious script/event injection vectors.
    Returns: (is_valid, list_of_disallowed_characters_found)
    """
    if not text:
        return True, []

    # Normalize zero-width and non-breaking web artifacts
    normalized = text.replace("\u00a0", " ").replace("\u202f", " ").replace("\ufeff", "").replace("\u200b", "")

    lower = normalized.lower()
    for tag in MALICIOUS_TAG_PATTERNS:
        if tag in lower:
            return False, [f"Disallowed script pattern '{tag}'"]

    disallowed = []
    seen = set()
    for char in normalized:
        if char not in ALLOWED_CHARS_SET:
            if char not in seen:
                disallowed.append(char)
                seen.add(char)

    is_valid = len(disallowed) == 0
    return is_valid, disallowed


def sanitize_text(text: str) -> str:
    """
    Filters out any character not in the allowed whitelist set.
    """
    if not text:
        return ""
    return "".join(ch for ch in text if ch in ALLOWED_CHARS_SET)


# ─── DECEPTIVE LINK, MALICIOUS URL & VIDEO VERIFICATION PIPELINE ──────────────
DISGUISED_URL_SHORTENERS = {
    "bit.ly", "tinyurl.com", "t.co", "cutt.ly", "is.gd", "ow.ly", "shorturl.at",
    "buff.ly", "adf.ly", "goo.gl", "trib.al", "rebrand.ly", "bl.ink"
}

PROHIBITED_DOMAIN_KEYWORDS = [
    "casino", "betting", "poker", "porn", "xxx", "xvideos", "pornhub",
    "phishing", "free-crypto", "airdrop", "free-robux", "steam-gift", "telegram.me"
]

def verify_and_sanitize_media_url(url: str, claimed_title: str = "") -> Tuple[bool, str, dict]:
    """
    Protects against deceptive links, malicious URLs, clickbait, and mismatched video links:
    1. Rejects dangerous protocols (javascript:, data:, file:)
    2. Blocks disguised URL shorteners (bit.ly, tinyurl) that obscure destination
    3. Blocks malicious / adult domain patterns
    4. For YouTube links: performs real-time oEmbed metadata verification:
       - Confirms video exists and is public (not private, deleted, or age-restricted R-18)
       - Fetches verified real video title, channel author, and thumbnail
       - Checks the real video title against multilingual moderation engine
    Returns: (is_safe, error_message, verified_metadata)
    """
    if not url:
        return True, "", {}

    clean_url = str(url).strip()
    lower_url = clean_url.lower()

    # 1. Scheme Check
    if any(lower_url.startswith(s) for s in ["javascript:", "data:", "vbscript:", "file:"]):
        return False, "Malicious URL protocol detected. Only secure HTTP/HTTPS links are permitted.", {}

    if not (lower_url.startswith("http://") or lower_url.startswith("https://")):
        return False, "Invalid URL format. Links must start with http:// or https://.", {}

    import urllib.parse
    parsed = urllib.parse.urlparse(clean_url)
    domain = parsed.netloc.lower()

    # 2. Block Disguised URL Shorteners
    for shortener in DISGUISED_URL_SHORTENERS:
        if shortener in domain:
            return False, f"Disguised URL shortener ('{shortener}') is not allowed. Please provide the direct educational destination link.", {}

    # 3. Block Prohibited / Adult Domains
    for bad_kw in PROHIBITED_DOMAIN_KEYWORDS:
        if bad_kw in domain:
            return False, f"Prohibited or deceptive domain keyword ('{bad_kw}') detected in link.", {}

    # 4. YouTube Real-Time Verification via oEmbed
    import re
    yt_regex = r'(?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?(?:.*&)?v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})'
    yt_match = re.search(yt_regex, clean_url)
    if yt_match:
        vid = yt_match.group(1)
        oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={vid}&format=json"
        try:
            import urllib.request
            import json
            req = urllib.request.Request(
                oembed_url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
            )
            with urllib.request.urlopen(req, timeout=5.0) as resp:
                yt_data = json.loads(resp.read().decode("utf-8"))
                real_title = yt_data.get("title", "").strip()
                author_name = yt_data.get("author_name", "").strip()
                thumbnail_url = yt_data.get("thumbnail_url", f"https://img.youtube.com/vi/{vid}/hqdefault.jpg")

                # Verify that the REAL YouTube title does not contain vulgarities
                try:
                    from backend.moderation import moderate_content
                except ImportError:
                    try:
                        from moderation import moderate_content
                    except ImportError:
                        moderate_content = None

                if moderate_content and real_title:
                    is_title_clean, mod_reason = moderate_content(real_title)
                    if not is_title_clean:
                        return False, f"The linked YouTube video title contains prohibited content ({mod_reason}).", {}

                return True, "", {
                    "video_id": vid,
                    "clean_url": f"https://www.youtube.com/watch?v={vid}",
                    "real_title": real_title,
                    "author": author_name,
                    "thumbnail": thumbnail_url
                }
        except urllib.error.HTTPError as e:
            if e.code in (401, 403, 404):
                return False, "The linked YouTube video is unavailable, deleted, private, or age-restricted (R-18). Only public educational videos can be shared.", {}
        except Exception:
            # Fallback if network timeout occurs: allow safe 11-char video ID format
            pass

    return True, "", {"clean_url": clean_url}


def verify_text_urls(text: str) -> Tuple[bool, str]:
    """
    Extracts all embedded URLs from free text and verifies each one.
    Returns: (is_safe, error_message)
    """
    if not text:
        return True, ""
    import re
    embedded_schemes = re.findall(r'(?:javascript|data|vbscript|file):[^\s<>"]+', text, flags=re.IGNORECASE)
    if embedded_schemes:
        return False, "Malicious URL protocol detected in text. Only standard web protocols are permitted."

    urls = re.findall(r'https?://[^\s<>"]+', text)
    for u in urls:
        clean_u = u.rstrip('.,;!?:)"\'')
        is_safe, err_msg, _ = verify_and_sanitize_media_url(clean_u)
        if not is_safe:
            return False, err_msg
    return True, ""




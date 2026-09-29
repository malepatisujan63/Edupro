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

from typing import Tuple, List

# Build character set safely
ALLOWED_CHARS_SET = set(
    "abcdefghijklmnopqrstuvwxyz"
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "0123456789"
    " \t\n\r"
    ",.?!&|/\\(){}[]"
    "-_:;\'\"@#+=*%$~`"
)

def validate_text_characters(text: str) -> Tuple[bool, List[str]]:
    """
    Validates whether the provided text contains only permitted characters.
    Returns: (is_valid, list_of_disallowed_characters_found)
    """
    if not text:
        return True, []

    disallowed = []
    seen = set()
    for char in text:
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

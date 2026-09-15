"""
MindSet Sentinel — Backend Crisis Keyword Engine
=================================================
Single source of truth for self-harm / suicidal ideation detection in the
Python backend.  All modules that need keyword detection MUST import from
here; do NOT maintain a local inline list.

Frontend counterpart: mindset-safebio-vault-main/utils/crisisDetection.ts
When updating either file, update BOTH to keep them in sync.

Pattern design:
  - Word-boundary (\\b) enforcement prevents false positives on common words
    (e.g. "diet" does NOT match \\bdie\\b because "diet" ends with 't' after
    the 'e', so the boundary is not at 'die').
  - Python re.IGNORECASE applied at match time.
  - Devanagari and Hinglish patterns use raw substring matching (no \\b
    needed — Devanagari script characters are already word-delimited).
"""

import re
from typing import List

# ── Compiled patterns (word-boundary enforced where applicable) ────────────────
# Keep in sync with CRISIS_PATTERNS in utils/crisisDetection.ts

_PATTERN_STRINGS: List[str] = [
    # English — Explicit Intent & Clinical Terms (PHQ-9 Item 9 aligned)
    r"\bbetter off dead\b",
    r"\bnot worth living\b",
    r"\bcan'?t go on\b",          # "can't go on" / "cant go on"
    r"\bwant to die\b",
    r"\bwanna die\b",
    r"\bdon'?t want to live\b",   # "don't want to live" / "dont want to live"
    r"\bno reason to live\b",
    r"\bkill myself\b",
    r"\bkilling myself\b",
    r"\bend my life\b",
    r"\bending my life\b",
    r"\bend it all\b",
    r"\btake my life\b",
    r"\btaking my life\b",
    r"\bhurt myself\b",
    r"\bhurting myself\b",
    r"\bharm myself\b",
    r"\bharming myself\b",
    r"\bself[\s\-]harm\b",        # "self harm" / "self-harm"
    r"\bcutting myself\b",
    r"\bcut myself\b",
    r"\boverdose\b",
    r"\bod['‌\s]?ing\b",
    r"\bjump off\b",
    r"\bhang myself\b",
    r"\bsuicide\b",
    r"\bsuicidal\b",
    r"\bdie\b",                   # strict word boundary: "diet" does NOT match
    r"\bno way out\b",
    r"\bhopeless\b",
    r"\bnot worth it\b",
    r"\bwant to end it\b",
    r"\bend the pain\b",
    r"\bslit my wrists?\b",
    r"\btake my own life\b",

    # Hinglish student vernacular
    r"\bjeene ka man{1,2} nahi\b",
    r"\bjeene ki ich{1,2}ha nahi\b",
    r"\bkhud ko khatam\b",
    r"\bzindagi khatam\b",
    r"\bmarna chahta\b",
    r"\bmarna chahti\b",
    r"\bmarne ka man{1,2}\b",
    r"\bjaan de den[a-z]*\b",
    r"\bjaan de dung[ai]\b",
    r"\bjaan deni hai\b",
    r"\bmar jaunga\b",
    r"\bmar jaungi\b",
    r"\bmar jau\b",
    r"\bkhudkushi\b",
    r"\baatmaghat\b",
    r"\batmaghat\b",
    r"\bapne aap ko chot\b",
    r"\bapne aap ko nuksan\b",
    r"\bjeena nahi\b",
    r"\bkhatam karna\b",
    r"\bjaan lena\b",
    r"\bjaan deni\b",
    r"\bzeher\b",
    r"\bmar jana\b",
    r"\batmahatya\b",

    # Devanagari Hindi script (no word boundaries needed — script is self-delimiting)
    r"आत्महत्या",
    r"खुदकुशी",
    r"जान देनी|जान दे दूंगा|जान दे दूंगी",
    r"मरना चाहता|मरना चाहती|मरने का मन",
    r"जीना नहीं चाहता|जीना नहीं चाहती|जीने का मन नहीं",
    r"जिंदगी खत्म|खुद को खत्म",
    r"मर जाऊंगा|मर जाऊंगी|मर जाना",
    r"ज़हर|जहर",
]

# Compile once at import time for performance
CRISIS_PATTERNS: List[re.Pattern] = [
    re.compile(p, re.IGNORECASE) for p in _PATTERN_STRINGS
]


def has_crisis_language(text: str) -> bool:
    """
    Return True if `text` contains any crisis / self-harm keyword pattern.

    This is the canonical backend crisis detection function.  It uses compiled
    word-boundary regex patterns to avoid false positives (e.g. "diet" does
    NOT match \\bdie\\b).

    Args:
        text: Raw user message text.

    Returns:
        True if any crisis pattern matches, False otherwise.
    """
    if not text or not isinstance(text, str):
        return False
    for pattern in CRISIS_PATTERNS:
        if pattern.search(text):
            return True
    return False

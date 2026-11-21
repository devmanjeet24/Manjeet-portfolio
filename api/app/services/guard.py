"""Cheap checks that run BEFORE the model is called, plus helpers for safe prompts and logs.

Nothing here replaces the system prompt rules: these filters just stop the obvious cases early
(no tokens spent, a fixed reply that cannot be talked out of anything). They are heuristics, so
they will miss clever attempts. The prompt rules and the delimiter around the visitor's text are
the second layer.
"""

from __future__ import annotations

import re
import unicodedata
from collections.abc import Sequence
from dataclasses import dataclass
from typing import Literal

from app.core.config import Settings

Verdict = Literal["ok", "abuse", "injection", "off_topic"]

# ---- abuse ------------------------------------------------------------------------------
# A short list on purpose: it catches plain insults, not every spelling. Whole words only, so
# "class" or "Scunthorpe" are never flagged.
_ABUSE_WORDS = (
    "fuck",
    "fucking",
    "fucker",
    "shit",
    "bitch",
    "bastard",
    "asshole",
    "dickhead",
    "cunt",
    "slut",
    "whore",
    "motherfucker",
    "bhenchod",
    "behenchod",
    "madarchod",
    "chutiya",
    "bhosdike",
    "gandu",
    "harami",
)
_ABUSE_RE = re.compile(r"\b(?:" + "|".join(_ABUSE_WORDS) + r")\b", re.IGNORECASE)
_LEET = str.maketrans("01345@$!", "oleasasi")

# ---- prompt injection -------------------------------------------------------------------
_INJECTION_PATTERNS = [
    # "ignore all previous instructions", "disregard the rules above", "forget your prompt"
    r"\b(?:ignore|disregard|forget|override|bypass)\b[^.\n]{0,40}\b(?:previous|prior|above|earlier|all|your|the|these|any)\b"
    r"[^.\n]{0,30}\b(?:instructions?|rules?|prompts?|guidelines?|directions?|constraints?)\b",
    # "reveal / show / print your system prompt (or instructions, rules, api key, secrets)"
    r"\b(?:reveal|show|print|repeat|display|leak|tell me|give me|output|dump|share)\b[^.\n]{0,40}"
    r"\b(?:system prompt|initial prompt|hidden prompt|your instructions|your rules|your prompt|"
    r"api[ _-]?keys?|secrets?|credentials?|environment variables?|\.env)\b",
    r"\bwhat (?:is|are|were) your (?:system )?(?:instructions|rules|prompt|guidelines)\b",
    # role hijacking
    r"\byou are now\b[^.\n]{0,40}"
    r"\b(?:dan|developer mode|unfiltered|jailbroken|an? (?:ai|assistant|model) (?:without|with no))\b",
    r"\b(?:developer|debug|god|dan|jailbreak) mode\b",
    r"\bpretend (?:that )?(?:you (?:are|have)|there (?:are|is) no) [^.\n]{0,40}"
    r"(?:rules|restrictions|filters|limits)\b",
    r"\bact as (?:if you (?:have|had) no|an? unrestricted)\b",
    # fake delimiters / chat-template tokens
    r"</?\s*(?:visitor_message|context|system|assistant)\s*>",
    r"<\|(?:im_start|im_end|system|endoftext)\|>",
    r"^\s*(?:system|assistant)\s*:",
]
_INJECTION_RE = re.compile("|".join(f"(?:{p})" for p in _INJECTION_PATTERNS), re.IGNORECASE | re.MULTILINE)

# ---- light off-topic detection ----------------------------------------------------------
# Only fires when the message asks for a generic task AND says nothing about the portfolio.
_OFF_TOPIC_RE = re.compile(
    r"\b(?:write|compose|generate)\s+(?:me\s+)?(?:an?\s+)?(?:poem|song|essay|story|joke|haiku|cover letter)\b"
    r"|\b(?:capital of|weather|stock price|bitcoin|cricket score|who won|"
    r"who is the (?:president|prime minister)|recipe for|horoscope|lottery)\b"
    r"|\b(?:solve|calculate|what is)\s+[\d\s+\-*/^().x=]{3,}$"
    r"|\btranslate\b[^.\n]{0,60}\b(?:into|to)\b"
    r"|\b(?:debug|fix)\s+my\s+(?:code|program|script)\b",
    re.IGNORECASE,
)
_ON_TOPIC_RE = re.compile(
    r"\b(?:he|his|him|she|her|they|their|portfolio|project|projects|skill|skills|experience|work|worked|"
    r"education|study|studied|resume|cv|contact|hire|available|availability|stack|built|build|tech|rag|ai)\b",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class Screening:
    verdict: Verdict
    reply: str = ""


def _normalise(text: str) -> str:
    """Fold look-alike characters and common leetspeak so `f*ck`-style tricks do not skip the filter."""
    folded = unicodedata.normalize("NFKC", text).lower()
    return folded.translate(_LEET)


def is_abusive(text: str) -> bool:
    return bool(_ABUSE_RE.search(_normalise(text)) or _ABUSE_RE.search(text))


def looks_like_injection(text: str) -> bool:
    return bool(_INJECTION_RE.search(unicodedata.normalize("NFKC", text)))


def looks_off_topic(text: str) -> bool:
    return bool(_OFF_TOPIC_RE.search(text)) and not _ON_TOPIC_RE.search(text)


def screen(settings: Settings, text: str) -> Screening:
    """Decide whether a message may reach the model. The `reply` is a fixed, safe answer."""
    name = settings.owner_name
    if is_abusive(text):
        return Screening(
            "abuse",
            "Let's keep this conversation respectful. I'm happy to answer questions about "
            f"{name}'s work, projects, skills or experience.",
        )
    if looks_like_injection(text):
        return Screening(
            "injection",
            f"I can only help with questions about {name} and this portfolio, and I can't share or "
            "change how I work. Ask me about projects, skills, experience or how to get in touch.",
        )
    if looks_off_topic(text):
        return Screening(
            "off_topic",
            f"I can only help with questions about {name} and this portfolio. Try asking about "
            "projects, skills, experience or education.",
        )
    return Screening("ok")


# ---- safe prompts -----------------------------------------------------------------------
_TAGS_RE = re.compile(r"</?\s*(?:visitor_message|context)\s*>", re.IGNORECASE)


def wrap_visitor_text(text: str) -> str:
    """Put the visitor's words inside delimiters (the system prompt says they are data), after
    removing any copy of the delimiter so the text cannot close the block early."""
    cleaned = _TAGS_RE.sub("", text).strip()
    return f"<visitor_message>\n{cleaned}\n</visitor_message>"


# ---- privacy-safe logs ------------------------------------------------------------------
_EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")
_PHONE_RE = re.compile(r"(?<!\w)\+?\d[\d\s().-]{7,}\d(?!\w)")


def redact(text: str, limit: int = 2000) -> str:
    """Hide e-mail addresses and phone numbers before a message is stored."""
    text = _EMAIL_RE.sub("[email]", text)
    text = _PHONE_RE.sub("[phone]", text)
    return text[:limit]


# ---- suggested follow-ups ---------------------------------------------------------------
# Picked from fixed lists by what was retrieved, so they cost nothing and can never promise
# something the knowledge base does not have.
_BY_SOURCE: dict[str, tuple[str, ...]] = {
    "projects.md": (
        "Which technologies were used in those projects?",
        "Which project is {owner} most proud of?",
    ),
    "ai-projects.md": (
        "How does the RAG pipeline work?",
        "Which AI models and tools has {owner} used?",
    ),
    "skills.md": (
        "Which technologies does {owner} work with most?",
        "What projects show those skills?",
    ),
    "experience.md": (
        "What was {owner}'s most recent role?",
        "What did {owner} work on there?",
    ),
    "education.md": (
        "What did {owner} study?",
        "How does {owner} keep learning?",
    ),
    "about.md": (
        "What kind of work does {owner} enjoy most?",
        "What projects has {owner} built?",
    ),
    "faq.md": (
        "How can I contact {owner}?",
        "What projects has {owner} built?",
    ),
}
_DEFAULTS = (
    "What projects has {owner} built?",
    "Which technologies does {owner} work with?",
    "Where has {owner} worked before?",
    "How can I contact {owner}?",
)


def _key(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def suggest_followups(
    settings: Settings,
    *,
    sources: Sequence[str],
    asked: Sequence[str],
    count: int = 3,
) -> list[str]:
    """Up to `count` (2-3) questions the visitor could ask next, never one already asked."""
    owner = settings.owner_name
    seen = {_key(q) for q in asked}
    picked: list[str] = []

    def add(template: str) -> None:
        question = template.format(owner=owner)
        if _key(question) not in seen and question not in picked and len(picked) < count:
            picked.append(question)

    for source in sources:
        for template in _BY_SOURCE.get(source.split("/")[-1], ()):
            add(template)
            break  # one per file first, so the three suggestions differ
    for source in sources:
        for template in _BY_SOURCE.get(source.split("/")[-1], ()):
            add(template)
    for template in _DEFAULTS:
        add(template)
    return picked

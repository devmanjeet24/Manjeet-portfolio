"""The 10 questions used to check the assistant.

`expect` lists the passages that should come back, as (file, heading text) pairs. A retrieved passage
counts when its file matches and its heading contains the text (an empty text matches any heading
in that file). `expect=None` means the question is off-topic: nothing relevant should be found.
Checking the heading as well as the file catches the case where the right file comes back but not the
passage that holds the answer.
"""

from __future__ import annotations

from typing import TypedDict

Expected = list[tuple[str, str]]


class Sample(TypedDict):
    question: str
    expect: Expected | None
    history: list[tuple[str, str]]  # earlier (role, text) turns, for follow-up questions
    note: str


SAMPLES: list[Sample] = [
    {
        "question": "What projects has he built?",
        "expect": [("projects.md", "Overview"), ("ai-projects.md", "Overview")],
        "history": [],
        "note": "overview",
    },
    {
        "question": "What is his tech stack?",
        "expect": [("skills.md", "Summary"), ("skills.md", "preferences")],
        "history": [],
        "note": "skills",
    },
    {
        "question": "Does he have experience with AI or RAG?",
        "expect": [("faq.md", "AI"), ("ai-projects.md", "Overview"), ("skills.md", "AI")],
        "history": [],
        "note": "AI experience",
    },
    {
        "question": "Where has he worked before?",
        "expect": [("experience.md", "Overview"), ("faq.md", "worked before")],
        "history": [],
        "note": "work history",
    },
    {
        "question": "What did he study and where?",
        "expect": [("education.md", "Degree"), ("faq.md", "study")],
        "history": [],
        "note": "education",
    },
    {
        "question": "Is he available for a new role or a freelance project?",
        "expect": [("faq.md", "open to new work")],
        "history": [],
        "note": "availability (must stay neutral)",
    },
    {
        "question": "What is his salary expectation?",
        "expect": [("faq.md", "salary")],
        "history": [],
        "note": "must NOT invent a number",
    },
    {
        "question": "How can I contact him?",
        "expect": [("faq.md", "contact him"), ("about.md", "get in touch")],
        "history": [],
        "note": "contact",
    },
    {
        "question": "What is the capital of France?",
        "expect": None,
        "history": [],
        "note": "off-topic: steer back, no answer",
    },
    {
        "question": "Which technologies did he use for that?",
        "expect": [("ai-projects.md", "")],
        "history": [
            ("user", "Does he have experience with AI or RAG?"),
            ("assistant", "Yes. He built a RAG document Q&A tool, an AI chatbot and an AI lead scraper."),
        ],
        "note": "follow-up: needs the earlier turn",
    },
]

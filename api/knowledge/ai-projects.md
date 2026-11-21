<!-- PLACEHOLDER: made-up example content. Replace it with real information, then run: python -m scripts.ingest
     The assistant answers ONLY from these files. Anything missing here it will say it does not know.
     Tips: write facts as full sentences that include the name; keep one topic per section; use "##" and "###" headings, because they are used to find the right passage. HTML comments are ignored. -->

# AI projects by Manjeet Singh

## Overview

Manjeet Singh builds applications around language models. Three of his projects are AI projects: RAG Document Q&A, AI Chatbot and AI Lead Scraper. All three have a Python backend built with FastAPI. Each is described below, including how it works step by step.

## RAG Document Q&A

RAG Document Q&A lets people ask questions across their documents and get answers that cite the page they came from. It is live.

The problem: teams lose time searching long PDFs and internal documents for one specific answer, and keyword search misses pages that use different words.

How it works, step by step:
1. Upload: the user adds PDFs or documents from the browser.
2. Chunking: the text is split into short passages, on headings and paragraphs first.
3. Embeddings: each passage is turned into a vector that captures its meaning.
4. Vector database: the vectors are stored in PostgreSQL with pgvector, next to the page number.
5. Retrieval: the passages closest in meaning to the question are found.
6. LLM: the model is asked to answer using only those passages.
7. Answer: the answer is returned together with the file and page it came from.

Technologies: Python, FastAPI, LangChain, PostgreSQL, pgvector, the OpenAI API and Next.js.

## AI Chatbot

AI Chatbot is a chat assistant that remembers the conversation and answers from a knowledge base. It is live.

The problem: static FAQs and rule-based bots fail on open-ended questions and forget what was said a minute ago.

How it works: the user's message arrives over a WebSocket, the recent conversation is loaded, the knowledge base is searched for relevant material, the model decides whether to answer directly or call a tool, the reply streams back token by token, and the exchange is saved so the next message has context.

Technologies: Python, FastAPI, LangChain, PostgreSQL, WebSockets, the Claude API and React.

## AI Lead Scraper

AI Lead Scraper finds, reads and ranks business leads so that research is done before the first call. It is still in progress.

The problem: manual prospect research is slow, repetitive and inconsistent from one person to the next.

How it works: it collects candidate pages from search results and directories, fetches and cleans each page while respecting robots rules, pulls company name, size and contact details into a fixed schema with a language model, ranks every lead against criteria the user defines, and exports the list to a CSV file or a CRM through its API.

Technologies: Python, Playwright, LangChain, Pydantic, PostgreSQL and FastAPI.

## This website's assistant

The chat assistant on this website is itself a small RAG application written by Manjeet: it searches a knowledge base stored in PostgreSQL with pgvector and answers only from what it finds.

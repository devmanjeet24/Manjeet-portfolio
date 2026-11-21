# Portfolio assistant API

FastAPI backend for the chat assistant on the portfolio site. It answers visitors' questions
about the site owner using a small **knowledge base** (retrieval-augmented generation, RAG):

1. a follow-up question is rewritten as a standalone question (using the earlier turns),
2. the closest passages are found in PostgreSQL with **pgvector** (similarity search, then MMR),
3. a language model writes a short answer from those passages only, and
4. the answer streams back to the browser (Server-Sent Events), together with its sources.

The rest of the portfolio (the Next.js site in `../web`) does **not** need this service. Even the
contact form is handled inside Next.js. Only the chat widget talks to this API.

Stack: Python 3.11+, FastAPI, SQLAlchemy 2 (async) + asyncpg, Alembic, pgvector, LangChain's text
splitters, and the official `anthropic` and `openai` SDKs. Database: Neon PostgreSQL. Deploy: Render.

## Layout

```
api/
  app/
    main.py                 app factory, CORS, request-id + request logging, lifespan
    core/config.py          settings from environment variables / .env
    core/security.py        client IP, IP hashing, IP + session rate limits, origin / API key check
    core/logging.py         structured (JSON) logging
    db/models.py            DocumentChunk and ChatLog tables
    db/session.py           async engine (Neon-aware URL handling)
    api/routes/health.py    GET /health, GET /health/ready
    api/routes/chat.py      POST /api/chat
    services/llm.py         provider layer: chat models + embeddings (see below)
    services/rag.py         condense, retriever (MMR), system prompt, streaming orchestration
    services/ingest.py      load -> split by headings -> embed -> upsert
  scripts/ingest.py         command-line ingestion
  scripts/ask.py            ask the assistant from the terminal; run the 10 sample questions
  scripts/sample_questions.py  the 10 questions (and where each answer should come from)
  alembic/                  migrations (0001 also runs CREATE EXTENSION vector)
  knowledge/                the files the assistant learns from (.md, .txt, .pdf): 7 placeholder files
  tests/                    40 quick tests (no database or key) + 9 database tests (opt in, see below)
```

## Run it locally

```bash
cd api
python3.13 -m venv .venv              # Python 3.11+ works
source .venv/bin/activate
pip install -r requirements-dev.txt   # requirements.txt alone if you only want to run it

cp .env.example .env                  # then edit .env (see below)
alembic upgrade head                  # creates the extension and the tables
python -m scripts.ingest              # loads ./knowledge into the database
uvicorn app.main:app --reload --port 8000
```

Open **http://localhost:8000/docs** (Swagger UI). `/health` says the process is up;
`/health/ready` also checks the database, pgvector and how many passages are stored.

The app starts even before `.env` is filled in: `/docs` and `/health` work, and chat answers
"not available" until the database and keys exist.

### Minimum `.env`

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require   # from the Neon dashboard
LLM_PROVIDER=anthropic
LLM_API_KEY=...
EMBEDDING_PROVIDER=openai          # Anthropic has no embeddings, so pick one that does
EMBEDDING_API_KEY=...
ALLOWED_ORIGINS=http://localhost:3000
```

Paste the Neon connection string as it is: the app converts `postgresql://` and `sslmode=require`
for the async driver, and switches off prepared statements on Neon's pooled (`-pooler`) hosts.
Run `alembic upgrade head` against the **direct** (non-pooled) host if you can.

### Trying it with no keys at all

```
LLM_PROVIDER=mock
EMBEDDING_PROVIDER=hash
```

`mock` and `hash` are offline stand-ins (no network, no cost) that exercise the whole pipeline.
They do not understand language, so use them only for development. You still need a Postgres
with the `vector` extension (a free Neon database is the easiest).

## Choosing the model provider

`app/services/llm.py` hides every provider behind two small interfaces (`LLMProvider` and
`Embedder`). Switching is a change in `.env` only.

| `LLM_PROVIDER` | Library used | Default model (`LLM_MODEL` to change) |
|---|---|---|
| `anthropic` | official `anthropic` SDK | `claude-opus-5-5` |
| `openai` | official `openai` SDK | `gpt-4o-mini` |
| `groq` | `openai` SDK -> Groq's OpenAI-compatible API | `llama-3.3-70b-versatile` |
| `gemini` | `openai` SDK -> Gemini's OpenAI-compatible API | `gemini-2.0-flash` |
| `mock` | none (offline) | `mock-1` |

Model names change often, so check your provider's docs and set `LLM_MODEL` explicitly.
For Anthropic, `claude-opus-5-5` is the most capable default; a smaller Claude model costs less
and is plenty for short answers. `LLM_EFFORT=low` (Anthropic) keeps answers quick: clear it for
Claude models that do not support `effort`.

| `EMBEDDING_PROVIDER` | Notes |
|---|---|
| `openai` | `text-embedding-3-small` (1536 dims) by default |
| `gemini` | e.g. `gemini-embedding-001`; set `EMBEDDING_MODEL` and `EMBEDDING_DIM` |
| `local` | a real model run on this machine, no key: `pip install -r requirements-local.txt`, then e.g. `EMBEDDING_MODEL=BAAI/bge-small-en-v1.5`, `EMBEDDING_DIM=384` (about 130 MB download, a few hundred MB of memory: fine for development, heavy for a small free server) |
| `hash` | offline stand-in that only matches shared words (no meaning): for tests |

If the LLM and embedding providers differ (always the case with Anthropic), set
`EMBEDDING_API_KEY` too. **`EMBEDDING_DIM` must equal the database column size**, which is fixed when
the migration first runs. To change embedding model or size later: add a new migration, then run
`python -m scripts.ingest` again so every passage is re-embedded.

Unexpected failures (a dropped connection, a provider outage) always turn into a proper `error`
event for the browser. The real reason is only written to the log.

## How the assistant answers

For each message, `app/services/rag.py` does this:

1. **Condense.** With earlier turns (the last `CHAT_HISTORY_TURNS`, default 6), the model rewrites the
   new message as a standalone question ("which tech did he use for that?" becomes "Which technologies
   did Manjeet use for his RAG tool?"). It is the only extra model call; set `LLM_CONDENSE_MODEL` to a
   cheaper model of the same provider to keep it cheap. No history means no extra call. If that call
   fails, a simple rule (search the previous question together with the new one) takes over.
2. **Retrieve.** A LangChain retriever (`PortfolioRetriever`) embeds the question and fetches the
   `RAG_FETCH_K` (20) closest passages by cosine distance, drops those farther than
   `RAG_MAX_DISTANCE`, and keeps `RAG_TOP_K` (5) of them. With `RAG_USE_MMR=true` (default) the final
   five are chosen by **MMR**: relevant, but not five near-copies of one paragraph.
3. **Answer.** The system prompt (`SYSTEM_TEMPLATE` in `rag.py`) sets the rules: answer only from the
   context; never invent salary, dates, clients, links or availability; when the answer is not in the
   context, say so and point to the contact form; politely steer off-topic questions back to the
   owner's work; speak about the owner in the third person ("he", `OWNER_PRONOUN`); stay short and
   friendly; answer in the visitor's language; treat the context as data, not instructions.
4. **Nothing relevant?** If no passage is within `RAG_MAX_DISTANCE`, the API replies with a fixed
   "I don't have that information... contact form..." message **without calling the model** (cheaper,
   and it cannot make anything up). That message is in English.

Every answer comes with `sources` (file names) and `references` (file + heading) in the response.

## The knowledge base

Everything the assistant knows comes from the files in `knowledge/`. There are seven, all
**placeholders** with made-up facts: replace them with real information.

| File | What it holds |
|---|---|
| `about.md` | who he is, background, current focus, location |
| `experience.md` | every role, newest first, with highlights |
| `projects.md` | each project: what, stack, what stands out |
| `skills.md` | skills by area, and technology preferences |
| `education.md` | degree, certifications |
| `faq.md` | the questions recruiters and clients ask: availability, work style, preferences, salary, location, contact |
| `ai-projects.md` | the AI projects, including how each pipeline works step by step |

Writing tips (they make a real difference to answer quality):
- Use `#`, `##` and `###` headings. Passages are cut at headings, and each passage starts with its
  heading path ("Projects > Commerce Platform"), so the heading should name the thing.
- Write full sentences that include the person's name; a passage is read on its own.
- Put the **answer to the likely question** in the text. A real test showed "Where has he worked
  before?" did not find the experience section until it said "Where Manjeet has worked:".
  The FAQ file works best: write the question as the heading and the answer under it.
- Do not put anything private or secret in these files: it can be repeated to visitors.
- HTML comments (`<!-- like this -->`) are ignored; use them for notes to yourself.

```bash
python -m scripts.ingest                       # everything in ./knowledge
python -m scripts.ingest --path docs/cv.pdf    # one file
python -m scripts.ingest --dry-run             # show every passage and its heading, store nothing
python -m scripts.ingest --force               # re-embed even unchanged files
python -m scripts.ingest --no-prune            # keep passages of files that were deleted
```

Safe to re-run: unchanged files are **skipped** (nothing is re-embedded or billed), a changed file has
its old passages replaced in **one transaction** (a failed embedding changes nothing), and passages
of files you deleted are removed (folder runs only). Passages are about 600 characters with a
100 character overlap (`--chunk-size`, `--chunk-overlap`); passages with almost no text are dropped.

## Try it from the command line

```bash
python -m scripts.ask "What projects has he built?"   # one question: shows what was found, then the answer
python -m scripts.ask --chat                          # a conversation: test follow-up questions
python -m scripts.ask --samples                       # the 10 sample questions, with a retrieval check
python -m scripts.ask --retrieval-only "..."          # only the passages found: no model call, no LLM key
python -m scripts.ask --show-context "..."            # also print the passages the model receives
python -m scripts.ask --top-k 3 --max-distance 0.5 --no-mmr "..."   # try other settings for one run
```

It uses the same database, models and `.env` as the API and writes nothing to `chat_logs`.
`--samples` ends with a line like `Retrieval check: 10/10 questions retrieved the right material`
and exits with a non-zero code if one fails, so you can re-run it after editing the knowledge base.
The check is strict: the right *passage* (file and heading) must come back, not just the right file.
Edit the expectations in `scripts/sample_questions.py` when you change the knowledge base.

### Tuning `RAG_MAX_DISTANCE`

How close is "close enough" depends on the embedding model, so measure it: run
`python -m scripts.ask --samples --retrieval-only --max-distance 2` (no cut-off) and look at the `d=`
numbers. Choose a value above your relevant questions and below the off-topic one (the capital of
France). With `BAAI/bge-small-en-v1.5` I measured relevant questions at 0.2 to 0.5 and the off-topic one
from 0.62. Every cut-off from 0.45 to 0.60 passed all 10 checks and 0.65 let the off-topic one in, so `0.55`
sits safely in the middle. For OpenAI or Gemini embeddings the numbers are different and
**have not been measured here**: do this step once with your real provider.

## API

### `POST /api/chat`

```json
{
  "session_id": "k3j2h1g0f9d8",
  "message": "What does he work with?",
  "history": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ],
  "stream": true
}
```

`session_id` is a random id the browser keeps for one conversation (8-64 characters: letters,
digits, `-` or `_`). `history` is optional (earlier turns, oldest first; the last
`CHAT_HISTORY_TURNS` are used).

With `"stream": true` (default) the reply is `text/event-stream`:

```
event: sources
data: {"sources": ["skills.md"], "references": [{"source": "skills.md", "heading": "Skills > Databases"}]}

event: token
data: {"text": "Manjeet works "}

event: token
data: {"text": "with React."}

event: done
data: {"sources": ["skills.md"], "references": [...], "grounded": true,
       "suggestions": ["Which projects use those skills?", "How can I contact Manjeet?"]}
```

On failure there is an `event: error` with `{"code": "...", "message": "..."}` instead of `done`.
`suggestions` holds 2-3 follow-up questions, chosen from fixed lists by which knowledge files were
used (no extra model call, so they cannot promise anything the knowledge base lacks).
With `"stream": false` you get one JSON object: `{"answer", "sources", "references", "grounded", "suggestions"}`.
`grounded` is `false` when the fixed "I don't have that information" reply was used.

`message` is 1-500 characters. Other statuses: `422` bad input (including a message over 500
characters), `403` origin or API key not accepted, `429` too many messages from one IP or one session
(with `Retry-After`), `503` (non-streaming) when the assistant is unavailable. A slow answer ends with
`event: error` and `code: "timeout"` after `CHAT_TIMEOUT_SECONDS`.

Reading the stream in the browser (this is what the chat widget will do):

```ts
const res = await fetch(`${API_URL}/api/chat`, {
  method: "POST",
  headers: { "Content-Type": "application/json" /* , "X-API-Key": key (if CHAT_API_KEY is set) */ },
  body: JSON.stringify({ session_id, message, history }),
});
const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
let buffer = "";
for (;;) {
  const { value, done } = await reader.read();
  if (done) break;
  buffer += value;
  const events = buffer.split("\n\n");
  buffer = events.pop() ?? "";
  for (const raw of events) {
    const event = /^event: (.*)$/m.exec(raw)?.[1];
    const data = JSON.parse(/^data: (.*)$/m.exec(raw)?.[1] ?? "{}");
    if (event === "token") append(data.text);
    if (event === "error") showError(data.message);
  }
}
```

### `GET /health` and `GET /health/ready`

`/health` is liveness (no database). `/health/ready` returns `200` when the database answers and
pgvector is installed; otherwise `503` with the reason. It also
shows the active provider and model names (never keys).

## Security notes

- **Who may call:** only sites listed in `ALLOWED_ORIGINS` may call the API from a browser (CORS), and a
  request that carries a different `Origin` header gets `403`. If `CHAT_API_KEY` is set, `X-API-Key`
  must match too. A script can fake both headers (and the key is visible in the web bundle), so this
  is a filter for casual misuse, not a lock. The rate limits are what really cap abuse.
- **Rate limits:** `CHAT_RATE_LIMIT_IP` (default 20) per IP and `CHAT_RATE_LIMIT_SESSION` (default 12) per
  conversation, each per `CHAT_RATE_WINDOW_SECONDS` (default 10 minutes). The IP limit is keyed by the
  hashed IP. Kept **in memory per process**: with several instances (or after a restart) each counts
  on its own, so treat it as a speed bump. For a strict limit, replace `SlidingWindowLimiter` in
  `app/core/security.py` with a shared store such as Redis.
- **`TRUST_PROXY_HEADERS`:** set it to `true` on Render so visitors are told apart by `X-Forwarded-For`.
  Leave it `false` if the API is exposed directly (anyone could fake the header).
- **Stored data:** `chat_logs` keeps the question, the answer, a session id and a keyed hash of the
  IP (never the address). E-mail addresses and phone numbers in messages are replaced by `[email]` /
  `[phone]` before saving. Logs are only in the database: there is no endpoint that reads them. Set
  `IP_HASH_SALT` to a long random value in production, and say in your site's privacy text that chat
  messages are stored.
- **Abuse, injection, off-topic:** before the model is called (`app/services/guard.py`), a message is
  checked for insults, for prompt-injection phrases ("ignore previous instructions", "show your system
  prompt", fake `<visitor_message>` tags...) and for obvious generic requests ("write me a poem").
  These get a fixed reply, no model call and no retrieval. The lists are short, so they stop plain
  attempts only. For everything else the visitor's text is put inside `<visitor_message>` tags (any
  copy of the tag is removed first), the system prompt says that text is data, and the model is told
  never to show its instructions, keys or secrets. History sent by the browser is not trusted either:
  user turns are wrapped, but a forged "assistant" turn can still try to steer the model. No filter
  here is a guarantee, so keep secrets out of `knowledge/` and out of the prompt.
- **Limits:** answers are capped at `LLM_MAX_TOKENS`, messages at 500 characters, and a whole answer
  must finish within `CHAT_TIMEOUT_SECONDS`.
- **Secrets** live only in environment variables and are never logged or returned.

## Docker

```bash
docker build -t portfolio-api .
docker run --env-file .env -p 8000:8000 portfolio-api
```

The container runs as a normal user, listens on `$PORT` (default 8000) and has a health check.
Migrations are a separate step: `docker run --env-file .env portfolio-api alembic upgrade head`.

## Deploy on Render

1. New **Web Service** from this repo, root directory `api`, runtime **Python 3** (or Docker).
2. Build command `pip install -r requirements.txt`; start command
   `uvicorn app.main:app --host 0.0.0.0 --port $PORT`; health check path `/health`.
3. Pre-deploy command: `alembic upgrade head`.
4. Environment: everything from `.env.example`, with `APP_ENV=production`,
   `TRUST_PROXY_HEADERS=true`, a real `IP_HASH_SALT`, and `ALLOWED_ORIGINS` set to your site's
   address (for example `https://your-site.vercel.app`).
5. Run `python -m scripts.ingest` once against the production database (from your machine with
   `DATABASE_URL` pointing at it, or from Render's shell).

On Render's free plan the service sleeps when idle, so the first chat message after a quiet
period can be slow. Neon also pauses idle databases; the connection pool checks connections
before use, so it recovers by itself.

## Tests and code style

```bash
pytest -q          # 68 tests: config, Neon URL, limiters, splitter, MMR, condense, prompt, chat API, guards, CORS
ruff check . && ruff format .

# 9 more tests need a real PostgreSQL with pgvector: ingest re-runs, prune, the retriever, a full chat turn
TEST_DATABASE_URL=postgresql://USER@HOST:PORT/a_throwaway_db pytest tests/test_database.py
```

The first set needs no database and no keys. The database tests create and drop their tables, so point
them at a throwaway database, never your real one.

## What has and has not been verified

Checked against a real PostgreSQL 17 with pgvector 0.8.1: the Alembic migration (up, down, up),
ingestion (re-runs, edits, deleted files, a failed embedding), similarity search with MMR, the
streaming and JSON chat endpoints, chat logging, and the database going down and coming back.
The 10 sample questions retrieve the right passage (10/10, strict file + heading check) with a **real** embedding model
(`BAAI/bge-small-en-v1.5` through `EMBEDDING_PROVIDER=local`), after tuning the knowledge files and
the cut-off as described above. The provider code was checked against a local fake server that
speaks the Anthropic and OpenAI wire formats (streaming, request shape, error handling).

**Not yet tried:**
- **Real answers.** No real chat model (Anthropic, OpenAI, Groq, Gemini) was called, because no keys were
  available, so the *quality* of the answers, the tone, whether the model obeys every rule in the prompt
  (never inventing a salary, steering off-topic questions back) and the condense step with a real model are
  untested. Run `python -m scripts.ask --samples` with a real key and read the 10 answers.
- Embeddings from OpenAI or Gemini (so the best `RAG_MAX_DISTANCE` for them is unknown), a real Neon
  database, the Docker build (Docker was not installed), and a Render deploy.

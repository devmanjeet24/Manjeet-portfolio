# Portfolio assistant API

FastAPI backend for the chat assistant on the portfolio site. It answers visitors' questions
about the site owner using a small **knowledge base** (retrieval-augmented generation, RAG):

1. the question is turned into an embedding,
2. the closest passages are found in PostgreSQL with **pgvector**,
3. a language model writes a short answer from those passages only, and
4. the answer streams back to the browser (Server-Sent Events).

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
    core/security.py        client IP, IP hashing, per-IP rate limit
    core/logging.py         structured (JSON) logging
    db/models.py            DocumentChunk and ChatLog tables
    db/session.py           async engine (Neon-aware URL handling)
    api/routes/health.py    GET /health, GET /health/ready
    api/routes/chat.py      POST /api/chat
    services/llm.py         provider layer: chat models + embeddings (see below)
    services/rag.py         retrieval, prompt, streaming orchestration
    services/ingest.py      load -> split -> embed -> store
  scripts/ingest.py         command-line ingestion
  alembic/                  migrations (0001 also runs CREATE EXTENSION vector)
  knowledge/                the files the assistant learns from (.md, .txt, .pdf)
  tests/                    31 quick tests, no database or API key needed
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
| `hash` | offline development stand-in |

If the LLM and embedding providers differ (always the case with Anthropic), set
`EMBEDDING_API_KEY` too. **`EMBEDDING_DIM` must equal the database column size**, which is fixed when
the migration first runs. To change embedding model or size later: add a new migration, then run
`python -m scripts.ingest` again so every passage is re-embedded.

Unexpected failures (a dropped connection, a provider outage) always turn into a proper `error`
event for the browser. The real reason is only written to the log.

## The knowledge base

Everything the assistant knows comes from the files in `knowledge/` (`.md`, `.txt`, `.pdf`).
The file there now is a **placeholder**: replace it with real information about yourself.
HTML comments (`<!-- like this -->`) are ignored, so you can leave notes to yourself.

```bash
python -m scripts.ingest                       # everything in ./knowledge
python -m scripts.ingest --path docs/cv.pdf    # one file
python -m scripts.ingest --dry-run             # show the passages, store nothing
python -m scripts.ingest --keep                # add without replacing a file's old passages
```

Re-running replaces a file's old passages, so it is safe to run after every edit. Passages are
about 800 characters with a 120 character overlap (`--chunk-size`, `--chunk-overlap`).

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
data: {"sources": ["about.md"]}

event: token
data: {"text": "Manjeet works "}

event: token
data: {"text": "with React."}

event: done
data: {"sources": ["about.md"], "grounded": true}
```

On failure there is an `event: error` with `{"code": "...", "message": "..."}` instead of `done`.
With `"stream": false` you get one JSON object: `{"answer", "sources", "grounded"}`.

Other statuses: `422` bad input, `413` message longer than `CHAT_MAX_MESSAGE_CHARS`, `429` too many
messages from one IP (with `Retry-After`), `503` (non-streaming) when the assistant is unavailable.

If nothing in the knowledge base is close enough to the question (`RAG_MAX_DISTANCE`), the API
answers "I could not find that" **without calling the model** (cheaper, and it cannot invent facts).

Reading the stream in the browser (this is what the chat widget will do):

```ts
const res = await fetch(`${API_URL}/api/chat`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
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

- **CORS:** only sites listed in `ALLOWED_ORIGINS` may call the API from a browser. CORS does not stop
  other programs from calling it, which is why there is also rate limiting.
- **Rate limit:** `CHAT_RATE_LIMIT_PER_MINUTE` per IP, kept **in memory per process**. With several
  instances (or after a restart) each counts on its own, so treat it as a speed bump. For a strict
  limit, replace `SlidingWindowLimiter` in `app/core/security.py` with a shared store such as Redis.
- **`TRUST_PROXY_HEADERS`:** set it to `true` on Render so visitors are told apart by `X-Forwarded-For`.
  Leave it `false` if the API is exposed directly (anyone could fake the header).
- **Stored data:** `chat_logs` keeps the question, the answer, a session id and a keyed hash of the
  IP (never the address). Set `IP_HASH_SALT` to a long random value in production. Say in your
  site's privacy text that chat messages are stored.
- **Prompt injection:** the model is told that the retrieved text is reference material, not
  instructions. That helps but is not a guarantee, so keep secrets out of `knowledge/`.
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
pytest -q          # 31 tests: config, Neon URL handling, rate limiter, splitter, RAG helpers, API, CORS
ruff check . && ruff format .
```

The tests need no database and no API keys.

## What has and has not been verified

Checked against a real PostgreSQL 17 with pgvector 0.8.1: the Alembic migration (up, down, up),
ingestion, similarity search, the streaming and JSON chat endpoints, chat logging, and the
database going down and coming back. The provider code was checked against a local fake server
that speaks the Anthropic and OpenAI wire formats (streaming, request shape, error handling).

**Not yet tried:** real Anthropic, OpenAI, Groq or Gemini calls (no keys were available), a real
Neon database, the Docker build (Docker was not installed), and a Render deploy. Run through
those once with real keys before relying on them.

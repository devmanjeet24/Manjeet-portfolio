# Pending work: structure, real content, launch

Last updated: 2026-11-21 (FastAPI backend for the chatbot added).

This file is the memory for everything that is still open. Work through it top to bottom
whenever you come back. Tick a box when it is done.

**Rules for the site's copy:** neutral, plain, human tone. No "hire me" or "available for
freelance". No "building with AI" style taglines. Nothing that reads like generated marketing
copy. Any new dummy content that gets added must be logged in the register in Part B.

---

## Part A: Structure that is still to be built

The site is built section by section. Everything below is **not built yet**.

### A1. Floating AI chatbot widget (the last big piece in `web/`)
The backend now exists (see A2); the widget does not.
- [ ] Chat widget UI: a floating button (bottom right) that opens a chat panel. Should work on
      phones, respect reduced motion, be keyboard accessible, and use the same design tokens
      (dark/light) as the rest of the site
- [ ] Talk to the API: `POST {NEXT_PUBLIC_API_URL}/api/chat` and read the Server-Sent Events
      stream. The exact request, the event format and a ready-to-adapt reading loop are in
      `api/README.md` (section "API"). Keep a random `session_id` in `sessionStorage` and send the
      last few turns as `history`
- [ ] Add `NEXT_PUBLIC_API_URL` to `web/.env.example` (and to Vercel). It is public by design;
      the API's `ALLOWED_ORIGINS` must contain the site's address
- [ ] **Hook-up already in place:** `src/lib/chat-events.ts` has `openChat()` and `onOpenChat(handler)`.
      The widget must call `onOpenChat(() => setOpen(true))` once mounted. The AI Projects
      section's line "Try the AI assistant on this site" already calls `openChat()`; until the
      widget exists it only shows "The assistant is not available yet"
- [ ] Mount the widget once in `src/app/layout.tsx` (next to `Navbar` and `Footer`)
- [ ] Show the three error cases sensibly: `rate_limited` (too many messages), `unavailable`
      (the assistant is down), and a dropped connection. Show `sources` if you want
- [ ] Say in the site's privacy text that chat messages are stored (the API logs question + answer)

### A2. `api/` backend (FastAPI): built, needs real keys and a deploy
Built and tested (see `api/README.md`): FastAPI + pgvector RAG, Alembic migration, provider-agnostic
LLM layer (Anthropic / OpenAI / Groq / Gemini via `.env`), ingestion script, health checks, CORS,
rate limit, structured logging, Dockerfile, 31 tests.
- [ ] Create a Neon database and put its connection string in `api/.env` (`DATABASE_URL`)
- [ ] Choose the chat model and embedding provider and add the keys (`LLM_PROVIDER`, `LLM_API_KEY`,
      `EMBEDDING_PROVIDER`, `EMBEDDING_API_KEY`). Anthropic has no embeddings, so pair it with openai
      or gemini for embeddings. Decide the embedding size before the first migration (`EMBEDDING_DIM`)
- [ ] Run `alembic upgrade head`, then `python -m scripts.ingest`, then try a few real questions.
      **No real provider call has been tried yet** (no keys were available): test each one you plan to use
- [ ] Write the real knowledge base in `api/knowledge/` (the current `about.md` is a placeholder; see Part B)
- [ ] Deploy on Render: steps are in `api/README.md`. Set `APP_ENV=production`,
      `TRUST_PROXY_HEADERS=true`, a real `IP_HASH_SALT` and `ALLOWED_ORIGINS`
- [ ] The Docker image has not been built (Docker was not installed here). Build it once to be sure
- [ ] The rate limit is in memory per process: fine for one small instance, not a hard cap
- [ ] `langchain-community` was left out on purpose: LangChain has announced it is being sunset.
      File loading uses `pypdf` and plain Python instead. Add it back only if you need its other loaders
- [ ] Decide the model for production. `claude-opus-5-5` is the default but a smaller model is cheaper and
      plenty for short answers (`LLM_MODEL`)

### A3. Site-wide SEO and polish files (none exist yet)
- [ ] Favicon and app icons (replace `src/app/favicon.ico`; add `icon.png` / `apple-icon.png` if wanted)
- [ ] Social share image (Open Graph / Twitter card) for the home page. Project pages only
      get one if the project has an `image`
- [ ] `src/app/robots.ts` and `src/app/sitemap.ts` (not created yet)
- [ ] Final site title and description in `src/app/layout.tsx` (currently "Manjeet Singh" and
      "Portfolio of Manjeet Singh, full-stack developer.")
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the real address. Without it canonical and share URLs
      point to `http://localhost:3000`

### A4. Analytics (optional)
- [ ] `trackEvent("resume_download" | "resume_view")` in `src/lib/analytics.ts` does nothing yet.
      When you pick a tool (Plausible, GA4, PostHog...), connect it there, or call
      `setAnalyticsHandler(...)` once at startup

### A5. Small things that exist in code but are unused
- [ ] `level` (1 to 5) on each skill is not shown anywhere. Show it or delete it
- [ ] `featured` on each project is not used (all projects are shown)
- [ ] The Twitter link shows in the footer. Remove it from `socials` if you do not use it

---

## Part B: Real content to fill in (all placeholders)

Everything lives in `web/src/data/`. Each file starts with a `REPLACE WITH REAL DATA` comment.

### Placeholder register (everything that is still dummy)

| Where | What is dummy |
|---|---|
| `profile.ts` | `name` ("Manjeet Singh", confirm the spelling), `location` ("City, India"), `email` (hello@example.com), social URLs (`your-username`), `role`, `tagline`, `shortBio`, `longBio`, `availability` |
| `profile.ts` (About) | `stats` (`yearsOfExperience`, `projectsShipped`), `currently` (`building`, `learning`). The "Technologies" number is counted from `skills.ts`, so it is dummy until skills are real |
| `profile.ts` (Contact) | `email`, LinkedIn and GitHub in `socials`, `responseTime` ("Usually replies within one or two working days.": keep it true) |
| `profile.ts` (Resume) | `resumeHighlights` (4 bullets next to the resume preview) |
| `profile.ts` (hero) | `heroRoleLine`, `focusAreas`, `heroCaption`, `heroDescription`, `marquee` |
| `skills.ts` | the skill list (names, categories), `level` values, `iconKey`s. AI/ML is the highlighted category |
| `projects.ts` | all 5 projects: titles, text, years, links, and every detail-page field (`role`, `problem`, `approach`, `features`, `challenges`). `kinds` (filter chips) and `mern` (badge) are guesses. Project #5 "Docs Search" is made up so the AI filter has something |
| `aiProjects.ts` | all 3 projects (RAG Q&A, Chatbot, Lead Scraper): pitch, `status`, texts, pipeline steps, tech, links (demo, GitHub, API docs) and the FastAPI code snippets (illustrations, not real code) |
| `experience.ts` | all 4 entries (a job, freelance work, an internship, self-directed projects) are made-up examples |
| `education.ts` | institution, degree, certification |
| Images | `public/images/portrait.png` (placeholder photo, low resolution; also used in the About frame). No project or AI-project screenshots (the site draws generated mock screenshots) |
| Files | `web/public/resume.pdf` is a generated one-page placeholder that says so. Replace it with the real resume, same file name |
| `app/layout.tsx` | site `title` and `description` |
| `api/knowledge/about.md` | The assistant's whole knowledge base is one made-up placeholder file (about the same dummy person as the site). Replace it with real material, then run `python -m scripts.ingest` |
| Placeholder behaviour | The AI section's "Try the AI assistant" line (see A1) |

### `profile.ts`
- [ ] Real name (`name`)
- [ ] Final role and tagline
- [ ] Short bio and long bio (your own words, 2 to 3 short paragraphs for `longBio`)
- [ ] Location (the hero label reads "Based in <location>": use e.g. "Delhi, India")
- [ ] Real email (`hello@example.com` is a placeholder)
- [ ] GitHub, LinkedIn and Twitter URLs
- [ ] Availability line (keep it neutral)
- [ ] Hero texts, all plain: `heroRoleLine` (top left), `focusAreas` (3 items, left list),
      `heroCaption` (line above the name), `heroDescription` (1 to 2 lines under the name),
      `marquee` (bottom strip of short phrases)

### About (`components/sections/about.tsx`)
- [ ] Real `stats.yearsOfExperience` and `stats.projectsShipped`
- [ ] Real `currently.building` and `currently.learning` (update now and then)
- [ ] A better photo for the frame (see "Portrait photo" below); it crops `portrait.png`
- [ ] The heading "A bit about me" is fixed in the component

### Resume (`components/sections/resume.tsx`)
- [ ] Replace `web/public/resume.pdf` (keep the name, or change `resumeUrl` in `profile.ts`)
- [ ] Write 3 to 4 real `resumeHighlights`
- [ ] The mini preview card is drawn from your data (name, role, email, location, first two
      experience entries, skills, first degree), so it updates itself. It is not a screenshot

### Skills (`skills.ts`, `components/sections/skills.tsx`)
- [ ] Confirm the skill names; add or remove (the About "Technologies" count follows)
- [ ] Brand logos live in `src/data/skill-icons.ts` (from simple-icons). A new skill with a
      brand logo needs an entry there, with the same key as its `iconKey`. Skills without a
      logo (like RAG) get a line icon from `components/ui/skill-icon.tsx`. No entry = generic icon
- [ ] Chip labels use `label` in `skills.ts` ("AI/ML", "Tools"); `HIGHLIGHT_ID` in `skills.tsx`
      chooses the highlighted category
- [ ] The heading "Tools I work with" and its intro line are fixed in `skills.tsx`

### Projects (`projects.ts`, `components/sections/projects.tsx`)
- [ ] Real names, `slug`, descriptions, year, category
- [ ] `githubUrl` and `liveUrl` (both optional; the button is hidden if missing)
- [ ] Screenshots: save in `web/public/images/projects/` and set `image`. Until then each card
      shows a generated mock screenshot (`project-mock.tsx`)
- [ ] `mern: true` only for projects built with MongoDB, Express, React and Node.js
- [ ] `kinds` per project (`"full-stack"`, `"frontend"`, `"ai"`) drive the filter chips
- [ ] Tech lists and highlights
- [ ] Replace the made-up "Docs Search" with a real project, or drop the AI chip
- [ ] **Detail pages** (`/projects/<slug>`, built): rewrite `longDescription` (Overview), `role`,
      `problem`, `approach`, `features` and `challenges` for each real project, in plain words
- [ ] Optional `gallery: ["/images/projects/x-1.jpg", ...]`; until set, three generated mocks show
- [ ] A new project's slug works automatically (`generateStaticParams` and `proxy.ts` both read
      `projects.ts`); any other `/projects/<slug>` returns a real 404

### AI Projects (`aiProjects.ts`, `components/sections/ai-projects.tsx`)
- [ ] Real titles, one-line `summary` (the pitch), `status` ("Live", "In progress" or "Prototype")
- [ ] `problem` and `solution` text
- [ ] `steps`: the pipeline boxes must match how each project is really built (title, one
      sentence, `icon`; the icon names are listed at the top of `aiProjects.ts`)
- [ ] `tech` chips, and `githubUrl`, `demoUrl`, `apiDocsUrl` (each optional)
- [ ] `code`: paste a real, short FastAPI endpoint per project (Python is highlighted)
- [ ] The heading "Under the hood" and its intro line are fixed in `ai-projects.tsx`

### Experience (`experience.ts`, `components/sections/experience.tsx`)
- [ ] Replace the 4 sample entries with your own, newest first. Fewer is fine (1 to 2 look good)
- [ ] Pick the right `kind`: "Full-time", "Contract", "Internship", "Freelance", "Self-directed"
      or "Open source". Internships, freelance work and self-directed or open-source projects are
      legitimate entries: use an honest `company` ("Independent", "Open source")
- [ ] `current: true` on anything still going on
- [ ] 2 to 3 concrete achievements per entry (only the first three show), plus tech
- [ ] The heading "The path so far" and its intro are fixed in `experience.tsx`

### Education (`education.ts`, the row under the timeline)
- [ ] Real institution, degree, field, period (one card per entry)
- [ ] Certifications (one shared card), or empty the list to hide it

### Contact (`components/sections/contact.tsx`, `app/api/contact/route.ts`)
- [ ] **Make the form work.** Create a free account at resend.com and make an API key. Copy
      `web/.env.example` to `web/.env.local`, fill in `RESEND_API_KEY` and `CONTACT_TO_EMAIL`
      (where messages should arrive), then restart the dev server. On Vercel add the same names
      under Settings > Environment Variables. Without them the form says it is "not switched on
      yet" and shows your email
- [ ] Until you verify your own domain in Resend, mail is only delivered to the email you signed
      up with, and comes from `onboarding@resend.dev`. For your own sender, verify the domain
      and set `CONTACT_FROM_EMAIL`
- [ ] The heading "Let's build something together." and its intro are fixed in `contact.tsx`
- [ ] The rate limit (5 requests per 10 minutes per IP) is kept in memory per server instance.
      On Vercel each instance counts on its own, so it is a speed bump, not a hard cap. For a
      strict limit use a shared store (e.g. Upstash Redis) in `src/lib/rate-limit.ts`
- [ ] After setting the keys, send yourself a real message and check the inbox and spam folder.
      (Everything else about the form was tested against a mock mail server, not the real one)

### Portrait photo (pending upload)
The particle portrait works (scatters on scroll, rebuilds on scroll back), but the current photo
is a placeholder: 610px, seated full body, head about 110px wide. A better photo is what makes it
truly sharp.
- [ ] Get a new photo: face forward, head and shoulders, **1500px or larger**, good light.
      Any background is fine (it gets removed)
- [ ] Put it in `web/scripts/source/` (e.g. `portrait-new.jpg`) and ask Claude to process it, or run:
      `python3.13 -m venv .venv && .venv/bin/pip install "rembg[cpu]" pillow`
      `.venv/bin/python web/scripts/prepare-portrait.py web/scripts/source/portrait-new.jpg web/public/images/portrait.png`
      (use Python 3.13: 3.15 cannot build a dependency. The `--crop`, `--fade-bottom` and
      `--fade-left` defaults fit the OLD photo; re-tune them in source-photo pixels)
- [ ] Update `aspect` (width / height of the new image) and, if needed, `faceX` and
      `PORTRAIT_FADE_BOTTOM` in `web/src/lib/portrait-config.ts`. The hero and About frame read it
- [ ] Check the hero on desktop and phone afterwards; size and position may need a small tweak

---

## Part C: Before launch

### Remove temporary things
- [ ] Delete the `/design-test` page (`web/src/app/design-test/`)
- [ ] Delete the `/portrait-test` page (`web/src/app/portrait-test/` and
      `web/src/components/hero/portrait-test-view.tsx`)
- [ ] The dev-only switches `/?debug=1`, `&minfps=500` and `?webgl=off` are already ignored in
      production builds (checked). Remove the code only if you want it gone
- [ ] Remove the original photo in `web/scripts/source/portrait-original.png` if you do not want
      it in a public repo (it is committed)

### Deploy
- [ ] Web on Vercel, API on Render. Set the env vars from `web/.env.example`
      on Vercel, plus `NEXT_PUBLIC_SITE_URL`
- [ ] Connect the real domain; then set `NEXT_PUBLIC_SITE_URL` and verify the domain in Resend

### Git
- [ ] All work so far is committed on the local `dev` branch. Check what is not on GitHub yet
      (`git status`, `git log origin/dev..dev`) and push when you are ready
- [ ] An early commit was amended to remove a Claude co-author line, so `origin/dev` may hold an
      older version of that first commit. If a plain `git push` is rejected, use
      `git push --force-with-lease` (only on your own branch, working alone)
- [ ] No commit should carry a Claude signature (the commits so far do not)
- [ ] Merge `dev` into `main` when the site is ready to go live

### Checks that were not done (be honest about these)
All testing so far was done in headless Chromium on one Mac, with software rendering.
- [ ] The chat API end to end with a real provider key, a real Neon database and a real browser (the widget is not built yet)
- [ ] Real GPU performance of the particle portrait (target 60 fps). Open `/?debug=1` and
      watch "frame ms" on a real machine, a laptop on battery and a mid-range phone
- [ ] Real phones and tablets (touch, Safari on iPhone, Chrome on Android), not just a narrow window
- [ ] Safari and Firefox (WebGL, `backdrop-filter`, `mask-image`, the PDF viewer modal)
- [ ] A Lighthouse run (performance, accessibility, SEO) on the production build
- [ ] A screen-reader pass (VoiceOver) over the navbar, forms, the project lightbox and the resume modal
- [ ] Manual checklist for the portrait is in `docs/portrait-qa.md`

---

## Notes and known quirks
- If `npx tsc` suddenly fails with "Duplicate identifier" inside `.next/types`, there are stray
  copies named like `routes.d 2.ts`. They are build output: delete the files with " 2" in the
  name, then run `npx next typegen`
- `npm run dev` rewrites `web/AGENTS.md` by itself (a Next.js feature). It is committed; ignore it
- Dummy placeholder values live only in `web/src/data/` and `web/public/`, so replacing content
  never needs a code change, except the few fixed headings and intro lines noted per section
- The site uses Next.js 16 with Cache Components. Dynamic routes need `generateStaticParams`
  (already there for projects), and unknown project URLs get a real 404 from `src/proxy.ts`

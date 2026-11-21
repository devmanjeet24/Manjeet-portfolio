# Pending work: structure, real content, launch

Last updated: 2026-11-21.

This file is the memory for everything that is still open. Work through it top to bottom
whenever you come back. Tick a box when it is done.

**Rules for the site's copy:** neutral, plain, human tone. No "hire me" or "available for
freelance". No "building with AI" style taglines. Nothing that reads like generated marketing
copy. Any new dummy content that gets added must be logged in the register in Part B.

---

## Part A: Structure that is still to be built

The site is built section by section. Everything below is **not built yet**.

### A1. Floating AI chatbot (the last big piece)
- [ ] Chat widget UI: a floating button (bottom right) that opens a chat panel. Should work on
      phones, respect reduced motion, be keyboard accessible, and use the same design tokens
      (dark/light) as the rest of the site
- [ ] **Hook-up already in place:** `src/lib/chat-events.ts` has `openChat()` and `onOpenChat(handler)`.
      The widget must call `onOpenChat(() => setOpen(true))` once mounted. The AI Projects
      section's line "Try the AI assistant on this site" already calls `openChat()`; until the
      widget exists it only shows "The assistant is not available yet"
- [ ] Mount the widget once in `src/app/layout.tsx` (next to `Navbar` and `Footer`)
- [ ] Decide what it answers (about you, your projects, your skills) and write the knowledge
      base content (a short document about you works well to start)
- [ ] Backend for it: see A2. Without a backend the widget has nothing to talk to
- [ ] Add a guard against abuse (rate limit, max message length) like the contact route has
- [ ] API keys (Claude / OpenAI) go in env files only, never in the repo or the browser

### A2. `api/` backend (FastAPI)
- [ ] `api/` is an empty folder with a README. Planned stack: FastAPI, LangChain, PostgreSQL
      (with pgvector if you do retrieval), deploy on Render
- [ ] Only the chatbot needs it. The **contact form does not**: it is a Next.js route handler
      (`web/src/app/api/contact/route.ts`) and already works once the env keys are set (see C-Contact)
- [ ] When it exists: CORS for the site's domain, a streaming chat endpoint, `/docs` enabled,
      and a health check endpoint for Render
- [ ] The three "AI Projects" cards show *illustrative* FastAPI snippets. Replace them with real
      endpoints when you have them (see Part B, AI Projects)

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
- [ ] Web on Vercel, API on Render (when the API exists). Set the env vars from `web/.env.example`
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

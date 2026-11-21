# Content TODO — replace placeholders later

All portfolio content lives in `web/src/data/`. Every file starts with a
`REPLACE WITH REAL DATA` comment. Nothing below is final. Tick a box when the real
data is in.

**Rule:** any dummy / placeholder content added to the site is logged here, in the
register below and in its section. Copy rules for the site: neutral, plain, human tone;
no "hire me / available for freelance", no "building with AI" style taglines, nothing
that reads like generated marketing copy.

## Placeholder register (everything that is still dummy)
Updated: 2026-11-21 (About, Skills, Projects, project detail pages and AI Projects added)

| Where | What is dummy |
|---|---|
| `profile.ts` | `name` ("Manjeet Singh", confirm), `location` ("City, India"), `email` (hello@example.com), social URLs (`your-username`), `resumeUrl` (no `resume.pdf` yet), `role`, `tagline`, `shortBio`, `longBio`, `availability` |
| `profile.ts` (About) | `stats` (`yearsOfExperience`, `projectsShipped`), `currently` (`building`, `learning`); `longBio` is the About text; the "Technologies" number is counted from `skills.ts` (so it is dummy until skills are real) |
| `profile.ts` (hero) | `heroRoleLine`, `focusAreas`, `heroCaption`, `heroDescription`, `marquee` |
| `skills.ts` | skill list (names, categories), `level` values (not shown on the site yet), `iconKey`s; the AI/ML category is the highlighted one |
| `projects.ts` | all 5 projects (titles, text, years, links) and all their detail-page text (`role`, `problem`, `approach`, `features`, `challenges`); no screenshots (the site draws generated mock screenshots); `kinds` (filter chips) and `mern` (badge) are guesses; project #5 "Docs Search" is a made-up non-MERN project so the AI filter has something |
| `aiProjects.ts` | all 3 projects (RAG Q&A, Chatbot, Lead Scraper): pitch, `status`, problem/approach text, pipeline steps, tech, links (demo, GitHub, API docs), and the FastAPI code snippets (written as illustrations, not copied from real code) |
| `experience.ts` | all companies, roles, dates, achievements |
| `education.ts` | institution, degree, certification |
| Placeholder behaviour | The AI section's "Try the AI assistant on this site" line calls `openChat()` (`src/lib/chat-events.ts`); no chat widget exists yet, so it only shows "not available yet" |
| Images | `public/images/portrait.png` (placeholder photo, low-res; also used in the About frame); no project / AI project images |
| Links | "Download resume" points to `/resume.pdf` (file missing, so it 404s); "GitHub" button uses the dummy GitHub URL |
| `app/layout.tsx` | site `title` and `description` |
| Temporary pages | `/design-test`, `/portrait-test`, and the `?debug=1` slider (dev only) |
| Nothing yet | favicon, social share image, contact form backend, chatbot backend and keys |

## `profile.ts`
- [ ] Real name (`name`)
- [ ] Final role and tagline
- [ ] Short bio and long bio paragraphs (in your own words)
- [ ] Location
- [ ] Real email (`hello@example.com` is a placeholder)
- [ ] GitHub, LinkedIn and Twitter URLs (remove Twitter if unused)
- [ ] Resume PDF: add the file at `web/public/resume.pdf` (or change `resumeUrl`)
- [ ] Availability line (keep neutral, no "hire me" wording)
- [ ] Hero texts (all in `profile.ts`, shown on the Home hero; keep them plain):
      `heroRoleLine` (top-left), `focusAreas` (3 items, vertical list on the left),
      `heroCaption` (small line above the name), `heroDescription` (1-2 lines under the name),
      `marquee` (bottom strip of short phrases). The top-right label is
      "Based in <location>": set `location` to e.g. "Delhi, India".

## About section (`components/sections/about.tsx`)
- [ ] Replace `longBio` in `profile.ts` (2-3 short paragraphs, your own words, plain tone)
- [ ] Real `stats.yearsOfExperience` and `stats.projectsShipped`
- [ ] Real `currently.building` and `currently.learning` (update now and then)
- [ ] Add `web/public/resume.pdf` so "Download resume" works
- [ ] Real GitHub URL (in `socials`)
- [ ] Better photo for the image frame (see "NEW PORTRAIT PHOTO" below); the frame crops
      `portrait.png`, so a head-and-shoulders photo works best
- [ ] The heading text "A bit about me" is fixed in the component; change it there if wanted

## `skills.ts` and the Skills section (`components/sections/skills.tsx`)
- [ ] Confirm skill names and remove/add the ones that apply (the About "Technologies" number counts them)
- [ ] `level` (1-5) is optional and not displayed yet; delete or keep
- [ ] Icons: brand logos live in `src/data/skill-icons.ts` (from simple-icons). A new skill with
      a brand logo needs an entry there (same key as its `iconKey`); skills without a logo
      (like RAG) get a line icon from `components/ui/skill-icon.tsx`. No entry = generic icon
- [ ] Filter chips use `label` in `skills.ts` ("AI/ML", "Tools"); change `HIGHLIGHT_ID` in
      `skills.tsx` if a different category should be highlighted
- [ ] Heading text "Tools I work with" and the one-line intro are fixed in `skills.tsx`

## `projects.ts` and the Projects section (`components/sections/projects.tsx`)
- [ ] Real project names, `slug`, descriptions, year, category
- [ ] `githubUrl` and `liveUrl` for each (both optional; the button is hidden if missing)
- [ ] Screenshots: save in `web/public/images/projects/` and set `image` in `projects.ts`.
      Until then each card shows a generated mock screenshot (`project-mock.tsx`)
- [ ] `mern: true` only for projects built with MongoDB, Express, React and Node.js (shows the MERN badge)
- [ ] `kinds` per project: `"full-stack"`, `"frontend"` and/or `"ai"` (these drive the filter chips)
- [ ] Tech lists and highlights
- [ ] Replace the made-up "Docs Search" project (non-MERN, AI filter) with a real one, or drop the AI chip
- [ ] Detail pages (`/projects/<slug>`, built): rewrite `role`, `problem`, `approach`, `features`, `challenges` and
      `longDescription` (the "Overview") for each real project, in your own plain words
- [ ] Optional `gallery: ["/images/projects/x-1.jpg", ...]` per project; until set, three generated mock screens show
- [ ] A new project's slug works automatically (`generateStaticParams` and `proxy.ts` both read `projects.ts`);
      any other `/projects/<slug>` returns a real 404
- [ ] `featured` is not used yet (all projects are shown)

## `aiProjects.ts` and the AI Projects section (`components/sections/ai-projects.tsx`)
- [ ] Real titles, one-line `summary` (the pitch), `status` ("Live", "In progress" or "Prototype")
- [ ] `problem` and `solution` text for each project
- [ ] `steps`: the pipeline boxes must match how each one is really built (title, one sentence,
      and an `icon`; the icon names are listed at the top of `aiProjects.ts`)
- [ ] `tech` chips, and `githubUrl`, `demoUrl`, `apiDocsUrl` (each optional; the button is hidden if missing)
- [ ] `code`: paste a real, short FastAPI endpoint from each project (filename + snippet; Python
      is highlighted). The current snippets are made-up illustrations
- [ ] Section heading "Under the hood" and its one-line intro are fixed in `ai-projects.tsx`
- [ ] When the chat widget is built it must call `onOpenChat(...)` from `src/lib/chat-events.ts`
      so the "Try the AI assistant" line opens it

## `experience.ts`
- [ ] Real companies, roles, periods, locations
- [ ] Descriptions and achievements (add numbers where true)
- [ ] Tech per role

## `education.ts`
- [ ] Real institution, degree, field, period
- [ ] Certifications (or remove the list)

## NEW PORTRAIT PHOTO TO UPLOAD (pending)
The particle portrait works (scatter on scroll, reassemble on scroll back), but the
current photo is only a placeholder: 610px, seated full-body, head ~110px wide. A
better photo is what makes it truly sharp.

- [ ] Get a new photo: face-forward, head-and-shoulders, **1500px or larger**, good light.
      Any background is fine (it gets removed).
- [ ] Put it in `web/scripts/source/` (e.g. `portrait-new.jpg`) and tell Claude, or run:
      `python3.13 -m venv .venv && .venv/bin/pip install "rembg[cpu]" pillow`
      `.venv/bin/python web/scripts/prepare-portrait.py web/scripts/source/portrait-new.jpg web/public/images/portrait.png`
      (the `--crop`, `--fade-bottom`, `--fade-left` defaults fit the OLD photo; re-tune them
      for the new one, values are in source-photo pixels)
- [ ] After replacing `portrait.png`, update `aspect` (width / height of the new image) in
      `web/src/lib/portrait-config.ts`. The Home hero and `/portrait-test` both read it.
      Then check the hero on desktop + phone; size/position may need a small tweak.
- [x] Portrait is already in the Home hero (`web/src/components/hero/hero.tsx`) with the
      current placeholder photo: scatters on scroll, rebuilds on scroll back.
- [ ] Delete the temporary `/portrait-test` page (`web/src/app/portrait-test/`,
      `web/src/components/hero/portrait-test-view.tsx`)
- [ ] Hero text is still placeholder: edit `name`, `role`, `tagline` in `web/src/data/profile.ts`

## Other assets and later work
- [ ] Set `NEXT_PUBLIC_SITE_URL` (e.g. in Vercel) to the real site address, so canonical and share-card
      URLs are correct (they fall back to `http://localhost:3000`)
- [ ] Favicon and OG/social share image
- [ ] Site title and meta description in `src/app/layout.tsx`
- [ ] Delete the temporary `/design-test` page before launch
- [ ] Contact form: backend endpoint and recipient email (needs the `api/` service)
- [ ] Chatbot: knowledge base content and API keys (kept in env files, never committed)

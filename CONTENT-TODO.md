# Content TODO — replace placeholders later

All portfolio content lives in `web/src/data/`. Every file starts with a
`REPLACE WITH REAL DATA` comment. Nothing below is final. Tick a box when the real
data is in.

**Rule:** any dummy / placeholder content added to the site is logged here, in the
register below and in its section. Copy rules for the site: neutral, plain, human tone;
no "hire me / available for freelance", no "building with AI" style taglines, nothing
that reads like generated marketing copy.

## Placeholder register (everything that is still dummy)
Updated: 2026-11-21 (About section added)

| Where | What is dummy |
|---|---|
| `profile.ts` | `name` ("Manjeet Singh", confirm), `location` ("City, India"), `email` (hello@example.com), social URLs (`your-username`), `resumeUrl` (no `resume.pdf` yet), `role`, `tagline`, `shortBio`, `longBio`, `availability` |
| `profile.ts` (About) | `stats` (`yearsOfExperience`, `projectsShipped`), `currently` (`building`, `learning`); `longBio` is the About text; the "Technologies" number is counted from `skills.ts` (so it is dummy until skills are real) |
| `profile.ts` (hero) | `heroRoleLine`, `focusAreas`, `heroCaption`, `heroDescription`, `marquee` |
| `skills.ts` | skill list, levels, icon keys |
| `projects.ts` | all 5 projects (titles, text, links, images do not exist) |
| `aiProjects.ts` | all 3 projects (RAG Q&A, Chatbot, Lead Scraper): text, steps, links, images |
| `experience.ts` | all companies, roles, dates, achievements |
| `education.ts` | institution, degree, certification |
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

## `skills.ts`
- [ ] Confirm skill names and remove/add the ones that apply
- [ ] Adjust optional `level` values (1-5) or delete them
- [ ] Icons: every `iconKey` needs a matching icon in the UI (decide icon set)

## `projects.ts` (5 placeholders)
- [ ] Real project names, `slug`, descriptions, year, category
- [ ] `githubUrl` and `liveUrl` for each (both optional)
- [ ] Screenshots in `web/public/images/projects/` (paths currently point to missing files)
- [ ] Tech lists and highlights
- [ ] Decide which projects are `featured`

## `aiProjects.ts` (3 placeholders: RAG Q&A, Chatbot, Lead Scraper)
- [ ] Real titles, problem and solution text
- [ ] Architecture steps matching how each one is actually built
- [ ] `githubUrl` and `demoUrl`
- [ ] Images in `web/public/images/ai/`
- [ ] Tech lists

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
- [ ] Favicon and OG/social share image
- [ ] Site title and meta description in `src/app/layout.tsx`
- [ ] Delete the temporary `/design-test` page before launch
- [ ] Contact form: backend endpoint and recipient email (needs the `api/` service)
- [ ] Chatbot: knowledge base content and API keys (kept in env files, never committed)

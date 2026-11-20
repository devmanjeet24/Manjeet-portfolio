# Content TODO — replace placeholders later

All portfolio content lives in `web/src/data/`. Every file starts with a
`REPLACE WITH REAL DATA` comment. Nothing below is final; update this list as
items get done. Tick a box when the real data is in.

## `profile.ts`
- [ ] Real name (`name`)
- [ ] Final role and tagline
- [ ] Short bio and long bio paragraphs (in your own words)
- [ ] Location
- [ ] Real email (`hello@example.com` is a placeholder)
- [ ] GitHub, LinkedIn and Twitter URLs (remove Twitter if unused)
- [ ] Resume PDF: add the file at `web/public/resume.pdf` (or change `resumeUrl`)
- [ ] Availability line (keep neutral, no "hire me" wording)

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
- [ ] After replacing `portrait.png`, update the image aspect ratio (`aspect-[960/825]`) in
      `web/src/components/hero/portrait-test-view.tsx` (and in the hero, once added)
- [ ] Put the portrait in the Home hero (`PortraitParticlesLazy` with a scroll-linked
      `progress`), then delete the temporary `/portrait-test` page
      (`web/src/app/portrait-test/`, `web/src/components/hero/portrait-test-view.tsx`)

## Other assets and later work
- [ ] Favicon and OG/social share image
- [ ] Site title and meta description in `src/app/layout.tsx`
- [ ] Delete the temporary `/design-test` page before launch
- [ ] Contact form: backend endpoint and recipient email (needs the `api/` service)
- [ ] Chatbot: knowledge base content and API keys (kept in env files, never committed)

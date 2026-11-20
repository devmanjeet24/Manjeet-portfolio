# CLAUDE.md

## Project goal
A premium, cinematic developer portfolio for an AI + Full-Stack Developer (MERN, Python/FastAPI, RAG/LangChain). Audience is general: recruiters, clients, collaborators. Tone is neutral and professional — never write explicit "hire me" / "available for freelance" copy. Use CTAs like "Let's talk" or "Start a conversation".

## Monorepo
- `web/` — Next.js (App Router), `src/` directory
- `api/` — Python FastAPI backend (placeholder for now)

## Tech stack
- Frontend: Next.js 14+ (App Router), TypeScript (strict), Tailwind CSS
- Motion/3D: framer-motion, GSAP + ScrollTrigger, Lenis, three
- Forms/validation: react-hook-form, zod; theming: next-themes
- Backend: FastAPI (Python), PostgreSQL, LangChain
- Deploy: Vercel (web) + Render (api)

## Design direction
Dark, minimal, premium, cinematic. Typography: serif (display) + mono (UI/body). Generous spacing, restrained palette, purposeful motion.

## Code rules
- Strict TypeScript; no `any`
- Reusable components; keep data in `src/data`, helpers in `src/lib`, hooks in `src/hooks`
- Accessibility: semantic HTML, keyboard support, visible focus, alt text, contrast
- Performance first: server components by default, `"use client"` only when needed, lazy-load heavy (three/GSAP) code, optimize images
- Respect `prefers-reduced-motion` in every animation
- Format with Prettier, lint with ESLint before committing

## Sections
Home, About, Skills, Projects, AI Projects, Experience, Resume, Contact, plus a floating AI chatbot.

## Structure (`web/src`)
`app/`, `components/{ui,layout,sections,hero,chat}`, `lib/`, `data/`, `hooks/`, `styles/`; static assets in `web/public/images`.

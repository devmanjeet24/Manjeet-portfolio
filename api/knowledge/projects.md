<!-- PLACEHOLDER: made-up example content. Replace it with real information, then run: python -m scripts.ingest
     The assistant answers ONLY from these files. Anything missing here it will say it does not know.
     Tips: write facts as full sentences that include the name; keep one topic per section; use "##" and "###" headings, because they are used to find the right passage. HTML comments are ignored. -->

# Projects by Manjeet Singh

## Overview

Manjeet Singh has built several full-stack projects. Four of them use the MERN stack (MongoDB, Express, React, Node.js). The AI projects are described separately in the AI projects document. Each project below lists its purpose, the technologies, and what stands out about it.

## Commerce Platform (2025)

Commerce Platform is an online shop with a cart, card payments and an admin panel. Manjeet built it as a full-stack developer with React, Node.js, Express, MongoDB and Stripe. It is a MERN project.

What stands out:
- Orders are created from Stripe webhooks, and the code is safe against the same webhook arriving twice.
- The admin panel shows inventory and sales.
- Staff accounts have different permissions.
- Stock is reduced in one atomic step, so the last item is never sold twice.

## Team Workspace (2025)

Team Workspace is a real-time project and task management tool for small teams, with boards, comments and live presence. Manjeet built it with Next.js, TypeScript, Node.js, Express, Socket.IO and MongoDB. It is a MERN project.

What stands out:
- Changes sync instantly across users over WebSockets.
- Cards can be dragged between columns.
- Each change carries a version number so two people editing at once never overwrite each other.
- The client reconnects by itself and asks for what it missed.

## Analytics Dashboard (2024)

Analytics Dashboard turns raw event data into clear charts. Manjeet built it mostly on the frontend side with React, Node.js, Express, MongoDB and Recharts. It is a MERN project.

What stands out:
- MongoDB aggregation pipelines keep queries fast.
- Filters and views can be saved and shared as a link.
- Data can be exported as CSV or PDF.

## Community Hub (2024)

Community Hub is a social platform with profiles, posts and threaded discussions. Manjeet built it with React, Node.js, Express, MongoDB and Redis. It is a MERN project.

What stands out:
- The feed uses cursor-based pagination, so infinite scroll never repeats or skips posts.
- Redis caches the busiest queries.
- It has notifications and basic moderation tools.

## Booking System (2023)

Booking System is a scheduling app where providers set their availability and customers book time slots. Manjeet built it with Next.js, Node.js, MongoDB and Nodemailer for reminders.

What stands out:
- The availability logic handles time zones.
- It sends automatic email reminders.
- Double bookings are prevented with atomic updates.

## Links

Live demos and source code links for each project are on the Projects section of this website.

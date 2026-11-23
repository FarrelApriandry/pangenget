# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Solo developers, technical professionals, and knowledge workers who juggle multiple tasks across their workday and need a fast, low-friction, keyboard-friendly daily organizer accessible across desktop and mobile web.

## Product Purpose

Pangenget (Sundanese: pengingat / memorandum) is a snappy, focused personal task and to-do management application designed to eliminate cognitive overhead. It exists to provide instant capture, clear organization, and effortless completion of daily tasks without bloated project management mechanics. Success means the user can capture, prioritize, or complete an action in seconds with zero latency and full confidence in database persistence.

## Positioning

Unlike bloated enterprise issue trackers or heavy note suites that turn simple daily to-do tracking into ritualized paperwork, Pangenget prioritizes instantaneous keyboard-driven task execution and lightweight persistence via serverless PostgreSQL. It delivers the speed and directness of a plain-text scratchpad combined with structured task properties (status, priority, due date, pinning, tags, sub-tasks) and cloud-synced durability.

## Operating Context

- Browser environments: Desktop browsers (Chrome, Firefox, Safari) and mobile viewports.
- Workflows: Rapid capture during coding/working sessions, morning planning / daily prioritization, keyboard navigation, voice dictation, and periodic status triage.
- Runtime & Infrastructure: Astro SSR hosted on Node/serverless runtime, communicating over HTTP with Neon Serverless Postgres via Drizzle ORM.

## Capabilities and Constraints

- Confirmed Capabilities:
  - **Natural Language Parsing (NLP Quick Capture):** Detects priorities (`!urgent`, `!tinggi`, `!sedang`, `!rendah`), category tags (`#kerja`, `#proyek`), and due dates (`besok`, `lusa`, `senin`, `jam 17:00`) directly while typing with live badge previews.
  - **Sub-tasks / Micro-Checklist:** Multi-step checklist inside tasks with live completion counters and auto-complete hints.
  - **Daily Standup / WhatsApp Export:** 1-click formatted daily summary copy to clipboard.
  - **Daily Streak Counter:** Visual streak tracker (`🔥 X Hari`) celebrating consecutive productive days.
  - **Micro-Confetti Celebrations:** Celebratory particles upon reaching 100% completed tasks.
  - **Voice Dictation (Web Speech API):** Hands-free speech recognition in Indonesian (`id-ID`) transcribing straight into the NLP capture bar.
  - **Task Management Core:** Creation, inline editing, status toggling, pinning/starring, and 5-second Undo on deletion.
  - **Audio Feedback:** Synthetic Web Audio API completion ping (with mute toggle).
  - **Keyboard Navigation:** Full keyboard operability (`N`, `/`, `1-4`, `Esc`, `?`).
  - **Theme Support:** Polished light and dark modes with persistent system sync.
- Technical Constraints:
  - Neon Postgres Serverless connection over HTTP (`@neondatabase/serverless`) with Drizzle ORM.
  - Tailwind CSS v4 utility styling.
  - SSR runtime managed via `@astrojs/node`.

## Brand Commitments

- Working name: `Pangenget` (Pengingat / Memorandum).
- Tagline: "Fokus, Kerjakan, Bereskan."
- Tone & Voice: Clear, pragmatic, concise, and focused; zero conversational bloat or artificial cheerfulness.

## Evidence on Hand

- Source code in `src/` featuring Astro SSR layout, React 19 islands (`TaskManager`, `TaskItem`, `TaskFilter`, `TaskStats`, `Navbar`, `ThemeToggle`), API endpoints (`/api/tasks`, `/api/tasks/[id]`), and Drizzle schema (`src/db/schema.ts`).
- Working dark mode toggling implementation in `src/components/ThemeToggle.tsx` and `src/layouts/BaseLayout.astro`.
- Verified live Neon serverless PostgreSQL connection with JSONB subtask support.

## Product Principles

1. **Speed is the Core Feature:** Every core action (creating, completing, or pinning a task) must happen instantaneously with minimal clicks or keystrokes.
2. **Clarity Over Decoration:** The interface must surface task hierarchy, urgency, and completion state immediately without visual noise.
3. **Rock-Solid Persistence:** Tasks are durable assets. Network errors or serverless cold starts must be handled gracefully with clear, honest system state and optimistic rollbacks.
4. **Keyboard & Mobile Parity:** The primary flows must feel natural whether navigating with rapid keyboard shortcuts on desktop or single-thumb taps on mobile.

## Accessibility & Inclusion

- Semantic interactive elements with clear focus rings (`focus:ring-2`, `focus:outline-none`).
- High-contrast text supporting both dark and light modes.
- Full keyboard operability for task creation, status toggling, pinning, and deletion.

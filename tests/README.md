# Brainstorm AI MVP

A polished, local-first implementation of the complete MVP session flow described in `BrainstormAI_English.pdf`.

## Run

Requires Node.js 22 or newer.

```powershell
npm start
```

Open `http://localhost:4173`.

## Verify

```powershell
npm run check
npm test
```

The final end-to-end browser walkthrough is kept in `tests/e2e.mjs`; it exercises the entire user journey and responsive mobile layout.

## Included

- Tablet-first responsive session library
- Live session timer with graceful microphone support
- Free drawing canvas with pen, line, rectangle, eraser, and colors
- Quick notes and editable session title
- Persisted local sessions and async processing flow
- Executive summary, prioritized ideas, diagram, generated code, and project brief
- Team and settings surfaces prepared for production integrations

The local MVP intentionally keeps audio in memory and generates deterministic AI output without external credentials. The backend exposes clear adapter boundaries for replacing local processing with Whisper, Claude, S3, PostgreSQL, BullMQ, Clerk, and Liveblocks.

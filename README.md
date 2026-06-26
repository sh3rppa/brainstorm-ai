# Brainstorm AI

A polished, local-first brainstorming MVP migrated into a production-oriented Next.js app structure.

## Run

Requires Node.js 22 or newer.

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

The legacy local MVP server is still available:

```powershell
npm run legacy:start
```

Open `http://localhost:4173`.

## Build

```powershell
npm run build
npm start
```

`npm start` serves the built Next.js app.

## Verify

```powershell
npm run check
npm test
```

`npm test` starts the Next.js app and verifies the API route flow: create, update, finalize, poll results, and delete.

## Included

- Next.js App Router pages for Home, Sessions, Capture, Processing, Results, Team, and Settings
- Next.js API route handlers for health and session CRUD/finalize behavior
- Strict TypeScript domain types for sessions, ideas, and mock AI output
- Isolated local/mock persistence in `apps/web/lib/sessions.ts`
- Tablet-first responsive session library
- Live session timer with graceful microphone support
- Free drawing canvas with pen, line, rectangle, eraser, and colors
- Quick notes and editable session title
- Persisted local sessions and async processing flow
- Executive summary, prioritized ideas, diagram, generated code, and project brief
- Team and settings surfaces prepared for production integrations

The app intentionally keeps audio in memory and generates deterministic mock AI output without external credentials. The service layer is the future adapter boundary for a real database and processing pipeline.

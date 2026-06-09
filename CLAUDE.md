# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Turbopack) at http://localhost:3000
npm run build    # Production build
npm run start    # Start production server (requires build first)
npm run lint     # Run ESLint
```

No test suite is configured.

## Architecture

Single-page Next.js 16 app (App Router) with no backend — all state lives in the browser.

**Key files:**
- `app/page.tsx` — the entire application. Client component (`'use client'`) containing all state, logic, and UI.
- `app/layout.tsx` — root layout with Geist font variables; no changes needed for feature work.
- `app/globals.css` — imports Tailwind v4 via `@import "tailwindcss"`.

**State & persistence:**
- `useState` holds the `Todo[]` array (`{ id: string, text: string, done: boolean }`).
- Two `useEffect`s handle localStorage sync: one loads on mount, one saves on every change.
- `crypto.randomUUID()` generates IDs.

**Styling:**
- Tailwind CSS v4 (PostCSS plugin — no `tailwind.config` file needed).
- Pastel pink/yellow palette is defined as a plain `const P = { ... }` object inline in the component, making all color tokens easy to update in one place.
- Component uses inline `style` props for palette colors alongside Tailwind utility classes for layout/spacing.
- Font stack overrides Geist with `-apple-system, BlinkMacSystemFont, ...` for an Apple HIG feel.

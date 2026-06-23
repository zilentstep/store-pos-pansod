# Code Standards

## General

- Keep functions small and single-purpose
- Fix root causes, do not layer workarounds
- Do not mix unrelated concerns in one function or route
- Prefer readability over cleverness

## JavaScript

- `const` / `let` — never `var`
- Use arrow functions for callbacks
- Avoid `any` — use meaningful variable names instead
- Validate unknown external input at system boundaries (API request bodies)
- Use `===` not `==`
- Use template literals over string concatenation

## Cloudflare Workers / Pages Functions

- Each function file exports a single `onRequest` handler
- Parse and validate request JSON before any logic runs
- Enforce PIN auth on every request (check `x-pin` header)
- Return consistent response shape: `{ success: boolean, data?: any, error?: string }`
- Use parameterized D1 queries (binding syntax `?`) — never concatenate user input into SQL

## Styling

- Use CSS custom properties for all colors — no hardcoded hex values (except in `:root` definition)
- Follow the existing design tokens from `style.css`
- Keep the existing visual style: dark navy header, red accent, light background

## Data and Storage

- All metadata belongs in D1 tables
- Item names are snapshotted into order_items at time of order (not joined to menu)
- Do not store large content in the database (not applicable — no large content)
- Date filtering uses ISO date strings derived from the order timestamp

## File Organization

- `functions/api/` — Each API route is a file: `auth.js`, `menu-list.js`, `menu-save.js`, `orders-list.js`, `orders-create.js`, `orders-update-status.js`, `orders-delete.js`, `grab-list.js`, `grab-create.js`, `grab-delete.js`, `report-daily.js`, `change-pin.js`
- `/` (root) — Frontend files: `index.html`, `script.js`, `style.css`
- `context/` — Project specification files
- `schema.sql` — D1 database schema
- `wrangler.toml` — Cloudflare configuration

## Migration from Demo

- The existing HTML structure and CSS can be largely preserved
- The vanilla JS needs to be refactored: replace `localStorage` calls with fetch to API, remove `var`, add PIN screen, and restructure into maintainable code
- The promo logic, cart logic, and UI rendering patterns should be kept as-is since they work well

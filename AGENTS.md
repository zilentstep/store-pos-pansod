# AGENTS.md — PANSOD Store POS App

## Overview

This file instructs the AI agent on how to build the PANSOD Store POS application. The app is specified in the `context/` directory. Read ALL context files before starting. Each phase must be presented to the user for approval before proceeding.

## Before You Start

1. Read ALL 6 files in `context/` — they contain the full specification
2. Read the demo files: `index.html`, `style.css`, `script.js` — you will port this to production
3. Do NOT modify files in `context/` unless updating specs
4. Never skip a phase approval step

## Build Phases

### Phase 1: Project Scaffolding & Infrastructure

**What to build:**
- Initialize project with `npm create cloudflare@latest` or equivalent (Cloudflare Pages project)
- Set up `wrangler.toml` with D1 binding configuration
- Create `schema.sql` with all D1 tables (menu_items, categories, orders, order_items, grab_orders, grab_order_items, settings)
- Write a seed SQL script with default menu items and default PIN (1234)
- Create the `/functions/` directory structure with one file per API route
- Set up a basic `_middleware.js` that validates PIN on all routes (except `/api/auth`)
- Add static asset placeholders (copy existing demo files for now)

**What to check (non-tech):**
- All project files have been created (you'll see files like `wrangler.toml`, `schema.sql`, `functions/`, `package.json`)
- The folder structure is organized and ready
- You can start the dev server with `npm run dev`

**Technical verification:**
- `npx wrangler whoami` works (logged in)
- Project can be served locally
- D1 database can be created

**User approval required before proceeding.**

---

### Phase 2: Database Schema & Seed Data

**What to build:**
- Execute `schema.sql` against D1
- Initialize the settings table with default PIN `1234`
- Seed default menu items (12 items from demo: 6 Onigiri, 3 Sides, 3 Drinks)
- Seed default categories (Onigiri, Sides, Drinks)

**What to check (non-tech):**
- The database now exists in your Cloudflare account
- The default menu (12 items you designed) is loaded
- The default PIN `1234` is active

**Technical verification:**
- Query the D1 database and verify all 7 tables exist
- Confirm seed data matches demo (categories + 12 menu items)
- Start dev server and verify it compiles without errors

**User approval required before proceeding.**

---

### Phase 3: API — Auth

**What to build:**
- `functions/api/auth.js` — POST handler, accepts `{ pin: string }`, returns `{ success: boolean }`
- `functions/api/change-pin.js` — POST handler, accepts `{ newPin: string }`, validates old PIN first, updates settings table
- Auth middleware in `functions/_middleware.js` — checks `x-pin` header on all routes except `/api/auth`

**What to check (non-tech):**
- You can log in with PIN `1234` — app should unlock
- Wrong PIN (e.g., `0000`) should show error, not unlock
- You can change the PIN to a new one
- After changing PIN, old PIN no longer works

**Technical verification:**
- API returns `{ success: true }` for `{ pin: "1234" }`
- API returns `{ success: false }` for wrong PIN
- Other API routes return 401 without PIN header
- Change PIN endpoint works

**User approval required before proceeding.**

---

### Phase 4: API — Menu CRUD

**What to build:**
- `functions/api/menu-list.js` — returns all menu items ordered by sort_order
- `functions/api/menu-save.js` — accepts full menu array, replaces all items (transaction)
- Both routes require valid PIN

**What to check (non-tech):**
- Can fetch menu items (should see all 12 items: 6 Onigiri, 3 Sides, 3 Drinks)
- Can save updated menu (add/edit/delete/reorder)

**Technical verification:**
- API returns all menu items sorted by sort_order
- Save replaces all items in a single transaction
- Changes persist after re-fetch

**User approval required before proceeding.**

---

### Phase 5: API — Orders

**What to build:**
- `functions/api/orders-create.js` — accepts order object with items, inserts into orders + order_items tables
- `functions/api/orders-list.js` — accepts `{ date: "YYYY-MM-DD" }`, returns orders with items for that date
- `functions/api/orders-update-status.js` — accepts `{ id, status }`, updates order status
- `functions/api/orders-delete.js` — accepts `{ id }`, deletes order and its items

**What to check (non-tech):**
- Can create an order and see it in list
- Can update status (pending -> preparing -> completed/cancelled)
- Can delete an order

**Technical verification:**
- API returns orders with items for a given date
- Status updates persist correctly
- Deletion removes order and all its items

**User approval required before proceeding.**

---

### Phase 6: API — Grab Orders

**What to build:**
- `functions/api/grab-create.js` — accepts grab order with items, inserts into grab_orders + grab_order_items
- `functions/api/grab-list.js` — accepts `{ date: "YYYY-MM-DD" }`, returns grab orders with items
- `functions/api/grab-delete.js` — accepts `{ id }`, deletes grab order and its items

**What to check (non-tech):**
- Can create a grab order with order number
- Can list today's grab orders
- Can delete a grab order

**Technical verification:**
- Grab orders persist in D1 with correct items
- Fetching by date returns correct results
- Deletion removes grab order and its items

**User approval required before proceeding.**

---

### Phase 7: API — Daily Report

**What to build:**
- `functions/api/report-daily.js` — accepts `{ date: "YYYY-MM-DD" }`, returns:
  - Summary stats (total revenue, orders count, items sold, AOV, total discount, cash/qr split)
  - Grab stats (grab orders count, grab items count)
  - Top selling products (aggregated across in-store + grab)
  - Category breakdown (revenue by Onigiri/Drinks/Other)
  - Hourly sales (orders and revenue by hour)
  - Grab insights (total items, avg onigiri per order)
  - All computation done in SQL or Worker logic

**What to check (non-tech):**
- Report shows the correct total revenue, order count, and items sold
- Top products list matches what was actually sold
- Category breakdown (Onigiri vs Drinks vs Other) looks correct
- Hourly sales show which hours had orders

**Technical verification:**
- Report returns correct data after creating test orders
- All computed fields match expected values

**User approval required before proceeding.**

---

### Phase 8: Frontend — PIN Screen & Refactoring

**What to build:**
- Rewrite `index.html` to include a PIN entry screen (shown before main app)
- Refactor `script.js`:
  - Replace all `var` with `const`/`let`
  - Replace all `localStorage` calls with `fetch()` to API routes
  - Add session-based PIN storage
  - Add loading states and error handling for API calls
  - Restructure into logical sections (order, grab, sales, report, menu)
- Update `style.css` to add PIN screen styles
- Preserve all existing UI rendering logic (rCatBar, rMenu, rCart, etc.) but with API data

**What to check (non-tech):**
- App shows PIN screen on load
- Entering correct PIN reveals the POS interface
- Wrong PIN shows error
- All operations use API (no localStorage)
- App is responsive and functional

**Technical verification:**
- PIN screen appears before main app
- Successful PIN request stores token in sessionStorage
- All fetch() calls include x-pin header
- Loading states display during API calls
- Error handling shows user-friendly messages

**User approval required before proceeding.**

---

### Phase 9: Frontend — Take Order Flow

**What to build:**
- Wire up menu display to fetch from `/api/menu/list`
- Wire up cart to create orders via `/api/orders/create`
- Wire up checkout flow (order type modal -> payment modal -> save)
- Wire up promo logic (preserve exact promo calculation from demo)
- Wire up order status management buttons

**What to check (non-tech):**
- Can browse menu by category
- Can add/remove items from cart
- Promo discount calculates correctly
- Checkout flow creates order in D1
- Order appears in Daily Sales

**Technical verification:**
- Menu loads from API on tab switch
- Cart operations work correctly
- Promo calculation matches demo (3=฿10, 5=฿20, 10=฿50)
- Order shows in /api/orders/list after checkout
- Status changes persist to API

**User approval required before proceeding.**

---

### Phase 10: Frontend — Sales & Daily Report

**What to build:**
- Wire up Daily Sales tab to fetch from `/api/orders/list`
- Wire up Daily Report tab to fetch from `/api/report/daily`
- Render report with all sections (summary cards, top products, category breakdown, hourly, insights, grab insights)
- Preserve exact rendering from demo (same HTML structure, classes, styling)

**What to check (non-tech):**
- Sales tab shows orders for selected date
- Can update status from the sales list
- Report tab shows all data correctly

**Technical verification:**
- Sales list renders orders from API
- Status update buttons send API requests
- Report sections match demo layout
- Date picker filters correctly

**User approval required before proceeding.**

---

### Phase 11: Frontend — Grab Orders

**What to build:**
- Wire up Grab Order tab to fetch/create/delete via API
- Display today's grab history

**What to check (non-tech):**
- Can record a grab order with order number
- Grab orders show in history
- Grab data appears in Daily Report

**Technical verification:**
- Grab create API is called on submit
- History loads from /api/grab/list
- Delete removes grab order from UI and DB
- Grab data contributes to Daily Report totals

**User approval required before proceeding.**

---

### Phase 12: Frontend — Menu Editor

**What to build:**
- Wire up menu editor to fetch from `/api/menu/list` and save via `/api/menu/save`
- Add/edit/delete/reorder items
- Preserve drag-to-reorder functionality

**What to check (non-tech):**
- Can add new menu items
- Can edit existing items
- Can delete items
- Can drag to reorder
- Changes reflect on Take Order tab

**Technical verification:**
- Menu list loads from API
- Save sends full menu array to /api/menu/save
- Drag reorder updates sort_order
- Changes persist across page refresh

**User approval required before proceeding.**

---

### Phase 13: i18n, Final Polish & Deploy

**What to build:**
- Ensure all UI strings use the i18n system (as in demo)
- Verify EN/TH toggle works everywhere
- Add any missing translations
- Run final end-to-end test on local dev server
- Deploy to Cloudflare Pages (`wrangler pages deploy`)
- Bind D1 database to production

**What to check (non-tech):**
- EN/TH toggle works on every tab
- App works end-to-end locally
- Deployment succeeds
- Production URL is accessible

**Technical verification:**
- All data-i18n attributes are populated
- Language toggle updates all UI text
- wrangler pages deploy succeeds
- Production URL loads and works with live D1

**User approval required before proceeding.**

---

## How to Work

0. NEVER publish/deploy changes live until they are tested on localhost first. Always verify locally (dev server, API calls) before committing, pushing, or deploying. Only push/deploy after the user confirms.
1. At the start of each phase, read the relevant context files again
2. Present the phase to the user with what will be built and ask for approval
3. After approval, implement the phase
4. Verify it works (test locally)
5. Update `context/progress-tracker.md` with what was completed
6. Re-ask the user to check before proceeding to the next phase

## Important Notes

- The demo HTML (`index.html`) provides the exact UI structure to replicate
- The demo `style.css` provides the exact styling to preserve
- The demo `script.js` provides the exact business logic (promo calc, cart, report rendering) to preserve
- Do NOT change the visual design or behavior of the app — preserve it exactly
- The only change is the data layer: localStorage -> Cloudflare D1 API
- PIN auth is the only new feature not in the demo

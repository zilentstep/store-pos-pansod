# Architecture Context

## Stack

| Layer      | Technology                  | Role                               |
| ---------- | --------------------------- | ---------------------------------- |
| Hosting    | Cloudflare Pages            | Serves static frontend assets      |
| API        | Cloudflare Pages Functions  | Serverless API endpoints (Worker)  |
| Database   | Cloudflare D1               | Relational SQL database (SQLite)   |
| Frontend   | Vanilla JS + CSS            | SPA — no framework                 |
| Auth       | Simple PIN (D1 + Worker)    | PIN stored in DB, verified via API |

## System Boundaries

- `/` — Frontend static assets: `index.html`, `script.js`, `style.css`
- `/functions/` — Cloudflare Pages Functions: all API routes
- `context/` — Project specification and progress tracking
- Schema: D1 database schema (managed via wrangler)

## Storage Model (D1)

### Tables

- **menu_items** — id, cat, en_name, th_name, price, sort_order
- **categories** — id, en_name, th_name, sort_order
- **orders** — id (timestamp), created_at, order_type (dinein/takeaway), payment_method (cash/qr), promo_applied (boolean), discount (integer), final_total (integer), status (pending/preparing/completed/cancelled)
- **order_items** — id, order_id, item_name (snapshot), qty, price (snapshot)
- **grab_orders** — id (timestamp), created_at, order_nr
- **grab_order_items** — id, grab_order_id, item_name, qty
- **settings** — key (text primary key), value (text)

## API Routes

All routes are `POST /api/{resource}` with JSON body and JSON response.

| Method | Route                  | Description                    |
| ------ | ---------------------- | ------------------------------ |
| POST   | /api/auth              | Verify PIN                     |
| POST   | /api/change-pin        | Change PIN                     |
| POST   | /api/menu/list         | Get all menu items             |
| POST   | /api/menu/save         | Save full menu array           |
| POST   | /api/orders/list       | Get orders by date             |
| POST   | /api/orders/create     | Create a new order             |
| POST   | /api/orders/update-status | Update order status         |
| POST   | /api/orders/delete     | Delete an order                |
| POST   | /api/grab/list         | Get grab orders by date        |
| POST   | /api/grab/create       | Create a grab order            |
| POST   | /api/grab/delete       | Delete a grab order            |
| POST   | /api/report/daily      | Get daily report data          |

## Auth and Access Model

- A single PIN is stored in the `settings` table (key: `pin`, default: `1234`)
- Every page visit shows a PIN entry screen
- PIN is verified via `/api/auth` and stored in `sessionStorage` for the browser session
- API routes check for a valid PIN header on every request

## Invariants

1. All API responses return `{ success: boolean, data?: any, error?: string }`
2. All dates are stored as ISO date strings (YYYY-MM-DD) for D1 queries
3. Order IDs are millisecond timestamps (numeric)
4. Prices are stored as integers (satang/baht — whole numbers only)
5. The frontend never talks directly to D1 — all data goes through API routes
6. API routes validate PIN on every request except `/api/auth`

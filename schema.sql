-- PANSOD Store D1 Database Schema

-- Menu categories
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  en_name TEXT NOT NULL,
  th_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Menu items
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  cat TEXT NOT NULL,
  en_name TEXT NOT NULL,
  th_name TEXT,
  price INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- In-store orders
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  order_type TEXT NOT NULL DEFAULT 'dinein',
  payment_method TEXT NOT NULL DEFAULT 'cash',
  promo_applied INTEGER NOT NULL DEFAULT 0,
  discount INTEGER NOT NULL DEFAULT 0,
  final_total INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
);

-- Order line items (snapshot of item at time of order)
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  item_name TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  price INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Grab orders (delivery platform orders)
CREATE TABLE IF NOT EXISTS grab_orders (
  id INTEGER PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  order_nr TEXT DEFAULT '',
  customer_type TEXT DEFAULT ''
);

-- Grab order line items
CREATE TABLE IF NOT EXISTS grab_order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  grab_order_id INTEGER NOT NULL,
  item_name TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  cat TEXT DEFAULT '',
  FOREIGN KEY (grab_order_id) REFERENCES grab_orders(id) ON DELETE CASCADE
);

-- App settings (PIN, etc.)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

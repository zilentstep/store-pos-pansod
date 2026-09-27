-- Indexing for performance optimization
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_grab_orders_created_at ON grab_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_grab_order_items_grab_order_id ON grab_order_items(grab_order_id);
CREATE INDEX IF NOT EXISTS idx_customer_points_ledger_customer_id ON customer_points_ledger(customer_id);

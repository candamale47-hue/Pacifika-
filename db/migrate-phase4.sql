-- Phase 4: Delivery & Fulfillment Migration

-- Add delivery method to orders
ALTER TABLE orders ADD COLUMN delivery_method TEXT DEFAULT 'standard_shipping';
ALTER TABLE orders ADD COLUMN delivery_instructions TEXT;
ALTER TABLE orders ADD COLUMN ready_for_pickup_at INTEGER;
ALTER TABLE orders ADD COLUMN preferred_pickup_time TEXT;

-- Add stock quantity to products
ALTER TABLE products ADD COLUMN stock_quantity INTEGER DEFAULT 100;
ALTER TABLE products ADD COLUMN low_stock_threshold INTEGER DEFAULT 5;

-- Add pickup address setting
CREATE TABLE IF NOT EXISTS store_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at INTEGER
);
INSERT OR REPLACE INTO store_settings (key, value, updated_at) 
VALUES ('pickup_address', '22 Craven Street, Redlynch, QLD 4870', strftime('%s', 'now'));

-- Index for delivery method queries
CREATE INDEX IF NOT EXISTS idx_orders_delivery_method ON orders(delivery_method);

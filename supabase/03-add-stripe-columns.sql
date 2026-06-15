-- Add Stripe product/price tracking columns to hikes and equipment tables.
-- These store the Stripe product and price IDs so we can update/archive
-- the corresponding Stripe products when an item is edited or deleted.

ALTER TABLE hikes
  ADD COLUMN IF NOT EXISTS stripe_product_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

ALTER TABLE equipment
  ADD COLUMN IF NOT EXISTS stripe_product_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

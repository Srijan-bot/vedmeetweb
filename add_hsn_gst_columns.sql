-- Add hsn_code and gst_rate to products table if they don't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_code TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(5, 2) DEFAULT 0;

-- Optionally add them to product_variants if they vary by variant, but usually they are product level.
-- User said "inward stock page", which might mean they want to set it during inwarding.
-- If they want to set it per batch, that would be in inventory_logs or similar?
-- But usually HSN/GST are properties of the product.
-- Let's stick to adding them to products for now.

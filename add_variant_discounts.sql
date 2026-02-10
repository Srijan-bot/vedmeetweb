-- Add discount columns to product_variants
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS discount_percentage numeric DEFAULT 0;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS disc_price numeric;

-- Ensure logic for disc_price calculation handles new columns if needed (triggers)
-- For now, frontend/backend logic will handle calculation.

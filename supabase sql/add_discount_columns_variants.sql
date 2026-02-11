-- Add discount fields to product_variants
ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS disc_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_percentage integer DEFAULT 0;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

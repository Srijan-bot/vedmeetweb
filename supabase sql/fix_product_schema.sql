-- Ensure all columns expected by ProductForm exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS specifications text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_keywords text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS usage text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS benefits text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredients text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS features text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS images text[]; -- Array of strings

-- Ensure constraints if needed
-- ALTER TABLE products ALTER COLUMN price TYPE numeric;
-- ALTER TABLE products ALTER COLUMN disc_price TYPE numeric;

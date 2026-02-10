-- Add hsn_code, gst_rate, and cost_price to product_variants table
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS hsn_code TEXT;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(5, 2) DEFAULT 0;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2) DEFAULT 0;

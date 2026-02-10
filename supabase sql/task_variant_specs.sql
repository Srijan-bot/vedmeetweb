-- Add physical specification columns to product_variants table
ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS weight text,
ADD COLUMN IF NOT EXISTS dimensions text,
ADD COLUMN IF NOT EXISTS volume text,
ADD COLUMN IF NOT EXISTS pieces integer;

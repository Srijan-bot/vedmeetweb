-- Add physical specification columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS weight text,
ADD COLUMN IF NOT EXISTS dimensions text,
ADD COLUMN IF NOT EXISTS volume text,
ADD COLUMN IF NOT EXISTS pieces integer;

-- Add specifications column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS specifications text;

-- Optional: Set a default value if needed, though for text it usually defaults to null
-- ALTER TABLE products ALTER COLUMN specifications SET DEFAULT '';

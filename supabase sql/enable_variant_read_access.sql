-- Enable Read Access for Product Variants
-- This fixes the issue where variant details (Name, SKU) do not show up in the Admin Panel due to permission restrictions.

-- 1. Ensure RLS is enabled (good practice, though likely already on)
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- 2. Create Policy for Reading Variants (Allow All Authenticated/Public access)
-- We use "IF NOT EXISTS" logic by dropping first to avoid errors.
DROP POLICY IF EXISTS "Public Read Access" ON product_variants;
DROP POLICY IF EXISTS "Authenticated Read Access" ON product_variants;

-- Allow everyone to read variants (needed for shop, admin, etc.)
CREATE POLICY "Public Read Access" ON product_variants 
FOR SELECT 
USING (true);

-- Also ensure warehouses table is readable if we use it later
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Access" ON warehouses;
CREATE POLICY "Public Read Access" ON warehouses FOR SELECT USING (true);

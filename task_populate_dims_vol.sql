-- Populate missing Dimensions and Volume for products to avoid empty '-' in Admin UI
-- This assigns reasonable default values based on the product type.

BEGIN;

-- 1. Set default dimensions for all products (e.g., standard box size)
UPDATE products 
SET dimensions = '10x10x10 cm' 
WHERE dimensions IS NULL;

UPDATE product_variants 
SET dimensions = '10x10x10 cm' 
WHERE dimensions IS NULL;


-- 2. Populate Volume for liquids that might have been missed or have only weight set
-- Ensure items like Oils, Juices, Face Wash have volume if not set
UPDATE products SET volume = '100 ml' WHERE name ILIKE '%Oil%' AND volume IS NULL;
UPDATE products SET volume = '200 ml' WHERE name ILIKE '%Shampoo%' AND volume IS NULL;
UPDATE products SET volume = '500 ml' WHERE name ILIKE '%Juice%' AND volume IS NULL;
UPDATE products SET volume = '100 ml' WHERE name ILIKE '%Wash%' AND volume IS NULL;
UPDATE products SET volume = '100 ml' WHERE name ILIKE '%Water%' AND volume IS NULL;
UPDATE products SET volume = '10 ml'  WHERE name ILIKE '%Drops%' AND volume IS NULL;

-- 3. Populate Weight for solids that might have been missed
UPDATE products SET weight = '100 g' WHERE name ILIKE '%Powder%' AND weight IS NULL;
UPDATE products SET weight = '100 g' WHERE name ILIKE '%Churna%' AND weight IS NULL;
UPDATE products SET weight = '50 g'  WHERE name ILIKE '%Cream%' AND weight IS NULL;
UPDATE products SET weight = '75 g'  WHERE name ILIKE '%Soap%' AND weight IS NULL;
UPDATE products SET weight = '100 g' WHERE name ILIKE '%Pack%' AND weight IS NULL; -- Face Pack

-- 4. Sync Variants again (in case any new specific ones missed)
-- Ensure variants inherit from parent if they are still NULL
UPDATE product_variants v
SET 
    weight = COALESCE(v.weight, p.weight),
    dimensions = COALESCE(v.dimensions, p.dimensions),
    volume = COALESCE(v.volume, p.volume),
    pieces = COALESCE(v.pieces, p.pieces)
FROM products p
WHERE v.product_id = p.id
AND (v.weight IS NULL AND v.volume IS NULL AND v.dimensions IS NULL AND v.pieces IS NULL);

COMMIT;

-- Verify
SELECT name, weight, dimensions, volume, pieces FROM products WHERE name IN ('Ashwagandha Root Powder', 'Pure Rose Water');

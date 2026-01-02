-- Debug Script: Check for Products Missing from Inventory
-- Run this in your Supabase/Neon SQL Editor

SELECT 
    count(*) as total_products 
FROM products;

SELECT 
    count(*) as total_variants 
FROM product_variants;

-- List Products that do NOT have a corresponding Variant
SELECT 
    p.id, 
    p.name, 
    p.created_at
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
WHERE pv.id IS NULL;

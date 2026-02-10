-- Fix "Standard" variants having missing specifications.
-- This script copies the parent Product's specs to any variant named 'Standard'.

UPDATE product_variants v
SET 
    weight = COALESCE(v.weight, p.weight),
    dimensions = COALESCE(v.dimensions, p.dimensions),
    volume = COALESCE(v.volume, p.volume),
    pieces = COALESCE(v.pieces, p.pieces)
FROM products p
WHERE v.product_id = p.id
AND v.name = 'Standard';

SELECT 
    p.name as "Product",
    v.name as "Variant",
    v.weight, v.volume, v.dimensions, v.pieces
FROM product_variants v
JOIN products p ON v.product_id = p.id
WHERE v.name = 'Standard';

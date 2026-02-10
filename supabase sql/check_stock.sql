-- Check stock for the failing variant
SELECT 
    v.id as variant_id,
    p.name as product_name,
    v.stock_quantity,
    v.reserved_quantity,
    (v.stock_quantity - v.reserved_quantity) as available_stock
FROM product_variants v
JOIN products p ON p.id = v.product_id
WHERE v.id = '9c7eb08e-5d74-4c10-b5aa-08c59ae7eb8c';

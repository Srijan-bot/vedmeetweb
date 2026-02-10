-- Check consistency
WITH variant_sums AS (
    SELECT product_id, SUM(stock_quantity) as total_stock
    FROM product_variants
    GROUP BY product_id
)
SELECT 
    p.id, 
    p.name, 
    p.stock_quantity as product_table_stock, 
    COALESCE(vs.total_stock, 0) as variant_table_stock
FROM products p
LEFT JOIN variant_sums vs ON p.id = vs.product_id
WHERE p.stock_quantity IS DISTINCT FROM COALESCE(vs.total_stock, 0)
LIMIT 10;

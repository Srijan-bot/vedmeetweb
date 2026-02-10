-- Check Stock Quantity for items in the latest order
SELECT 
  oi.order_id,
  oi.id as item_id,
  oi.variant_id,
  pv.sku,
  pv.name as variant_name,
  pv.stock_quantity
FROM order_items oi
JOIN product_variants pv ON oi.variant_id = pv.id
ORDER BY oi.created_at DESC
LIMIT 5;

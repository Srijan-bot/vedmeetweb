-- Check Order Items and Variant Linkage
-- Run this to see if items have variant_ids and if they resolve to actual variants.

SELECT 
  oi.id as item_id,
  oi.order_id,
  oi.product_id,
  p.name as product_name,
  oi.variant_id,
  pv.sku,
  pv.name as variant_name
FROM order_items oi
LEFT JOIN products p ON oi.product_id = p.id
LEFT JOIN product_variants pv ON oi.variant_id = pv.id
WHERE oi.order_id = '25eb0653-3fd1-4428-901d-7c49804258c8'; -- Replace with your order ID if different

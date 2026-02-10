-- Fix missing variant_ids in order_items by picking the latest variant for the product
UPDATE order_items
SET variant_id = (
    SELECT id
    FROM product_variants
    WHERE product_variants.product_id = order_items.product_id
    LIMIT 1
)
WHERE variant_id IS NULL;


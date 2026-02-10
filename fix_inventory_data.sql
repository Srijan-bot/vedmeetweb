-- Re-calculate and update reserved_quantity for all variants
-- This is based on SUM of quantities of all 'Pending' order items.

UPDATE product_variants
SET reserved_quantity = COALESCE(
    (
        SELECT SUM(oi.quantity)
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'Pending'
        AND oi.variant_id = product_variants.id
    ), 
    0
);


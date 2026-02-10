-- Force Clean up redundant "Standard" variants
-- This script handles foreign key constraints by removing references from child tables first.

BEGIN;

-- 1. Inventory Transactions
DELETE FROM inventory_transactions
WHERE variant_id IN (SELECT id FROM product_variants WHERE name = 'Standard');

-- 2. Warehouse Stock
DELETE FROM warehouse_stock
WHERE variant_id IN (SELECT id FROM product_variants WHERE name = 'Standard');

-- 3. Warehouse Batch Stock
DELETE FROM warehouse_batch_stock
WHERE variant_id IN (SELECT id FROM product_variants WHERE name = 'Standard');

-- 4. Product Batches
-- Note: Batch stock must be deleted first (handled above)
DELETE FROM product_batches
WHERE variant_id IN (SELECT id FROM product_variants WHERE name = 'Standard');

-- 5. Order Items
-- WARNING: This removes items from orders. usage assumes these are test orders or user approved deletion.
DELETE FROM order_items
WHERE variant_id IN (SELECT id FROM product_variants WHERE name = 'Standard');

-- 6. Finally, delete the variants
DELETE FROM product_variants
WHERE name = 'Standard';

COMMIT;

-- Verify deletion (Should return 0 rows)
SELECT count(*) as standard_variants_remaining FROM product_variants WHERE name = 'Standard';

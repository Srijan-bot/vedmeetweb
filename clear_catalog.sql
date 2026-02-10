-- =================================================================
-- CLEANSING SCRIPT: DELETE ALL PRODUCTS & VARIANTS
-- =================================================================
-- This script removes all product data and related inventory/sales history.
-- Use with caution.

BEGIN;

-- 1. Clear Inventory & Stock Movements (Dependent on Variants/Batches)
DELETE FROM warehouse_batch_stock;
DELETE FROM warehouse_stock;
DELETE FROM inventory_transactions;
DELETE FROM inventory_ledger;
DELETE FROM product_batches;

-- 2. Clear Order Items (Dependent on Products & Variants)
-- Note: This leaves "Orders" but empty of items. If you want to delete orders too, uncomment:
-- DELETE FROM orders; 
DELETE FROM order_items;

-- 3. Clear Other Dependencies
DELETE FROM product_reviews;
DELETE FROM prescription_items; -- Prescriptions remain but empty
DELETE FROM offer_product_link; -- If exists (check schema)

-- 4. Clear Catalog
DELETE FROM product_variants;
DELETE FROM products;

COMMIT;

-- Verification
SELECT 
  (SELECT count(*) FROM products) as products_remaining,
  (SELECT count(*) FROM product_variants) as variants_remaining;

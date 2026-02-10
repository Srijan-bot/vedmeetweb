-- =================================================================
-- DANGER: THIS SCRIPT WIPES ALL DATA (ORDERS, PRODUCTS, INVENTORY)
-- =================================================================

BEGIN;

-- 1. Clear Order Related Data
DELETE FROM order_items;
DELETE FROM order_status_history;
DELETE FROM invoices;

-- 2. Clear Inventory & Stock Data
DELETE FROM inventory_ledger;
DELETE FROM inventory_transactions;
DELETE FROM warehouse_stock;

-- 3. Clear Ledger
DELETE FROM accounting_ledger;

-- 4. Clear Main Entities (Orders & Products)
-- Note: We delete orders first because order_items (deleted above) referred to them.
-- If there are other FKs, handle them.
DELETE FROM orders;

-- 5. Clear Product Data
-- Variants depend on Products, so we delete variants first (or let cascade handle it, but explicit is cleaner)
-- Also clear prescription items which link to products
DELETE FROM prescription_items;
DELETE FROM product_variants;
DELETE FROM products;

-- 6. Optional: Clear Categories/Brands if desired? 
-- Leaving them for now as user asked for "order and product too", usually categories stay.

COMMIT;

-- Verification
SELECT 
  (SELECT count(*) FROM orders) as orders_count,
  (SELECT count(*) FROM products) as products_count,
  (SELECT count(*) FROM product_variants) as variants_count,
  (SELECT count(*) FROM inventory_transactions) as inventory_tx_count;

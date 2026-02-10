-- =================================================================
-- DANGER: CONSTRUCTIVE DESTRUCTION SCRIPT
-- This will delete ALL Products, Orders, Inventory, and Accounting Data.
-- Use with extreme caution.
-- =================================================================

BEGIN;

-- 1. CLEAR ORDER & LOGISTICS HISTORY
DELETE FROM order_items; -- Child of orders
DELETE FROM order_status_history; -- Child of orders
DELETE FROM invoices; -- Child of orders
DELETE FROM shipments; -- Child of orders
DELETE FROM accounting_ledger WHERE reference_type IN ('order_revenue', 'order'); -- Child of orders
-- Also clear prescription related if needed, but keeping separate for now unless requested.
-- DELETE FROM prescription_queries;
-- DELETE FROM prescription_items;
-- DELETE FROM prescriptions;
DELETE FROM orders; -- Parent

-- 2. CLEAR INVENTORY & STOCK
DELETE FROM inventory_transactions;
DELETE FROM inventory_ledger; -- Also tracking inventory
DELETE FROM warehouse_batch_stock; -- Batched stock
DELETE FROM warehouse_stock; -- Aggregated stock
DELETE FROM product_batches; -- Batches

-- 3. CLEAR PRODUCT CATALOG (Dependents first)
DELETE FROM product_reviews; -- Verified table name
DELETE FROM product_variants; -- Variants
DELETE FROM products; -- Parent Products

-- 4. OPTIONAL: Reset ID sequences if needed (for integer IDs, but we use UUIDs mostly)
-- RESTART IDENTITY is for TRUNCATE, but DELETE doesn't reset sequences automatically.

COMMIT;

-- Verification
SELECT 
  (SELECT count(*) FROM products) as products,
  (SELECT count(*) FROM orders) as orders,
  (SELECT count(*) FROM inventory_transactions) as transactions;

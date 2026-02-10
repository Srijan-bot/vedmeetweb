-- =================================================================
-- DANGER: THIS SCRIPT DELETES ALL ORDERS FROM THE DATABASE
-- =================================================================

BEGIN;

-- 1. Delete Order Items (Child of orders)
DELETE FROM order_items;

-- 2. Delete Order Status History (Child of orders)
DELETE FROM order_status_history;

-- 3. Delete Invoices (Child of orders)
DELETE FROM invoices;

-- 4. Delete Inventory Transactions linked to orders (Optional, but recommended to keep clean)
-- Assuming reference_id points to order_id for 'order_out' or similar types
-- If you want to keep inventory history, remove this line.
DELETE FROM inventory_transactions WHERE transaction_type = 'order_out' OR transaction_type = 'order';

-- 5. Delete Accounting Ledger entries linked to orders
DELETE FROM accounting_ledger WHERE reference_type = 'order_revenue' OR reference_type = 'order';

-- 6. Finally, Delete Orders
DELETE FROM orders;

COMMIT;

-- Verification
SELECT count(*) as orders_remaining FROM orders;

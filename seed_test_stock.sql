-- Seed Stock for Testing
-- This ensures all product variants have sufficient stock for testing checkout.

-- 1. Update all variants to have at least 100 units
UPDATE product_variants
SET stock_quantity = 100
WHERE stock_quantity < 100;

-- 2. Reset reserved quantity to 0 (optional, to clear stuck reservations from failed tests)
-- Only run this if you are sure no real orders are pending processing
UPDATE product_variants
SET reserved_quantity = 0;

-- 3. Verify the specific variant we were having trouble with
SELECT id, name, stock_quantity FROM product_variants 
WHERE id = '9c7eb08e-5d74-4c10-b5aa-08c59ae7eb8c';

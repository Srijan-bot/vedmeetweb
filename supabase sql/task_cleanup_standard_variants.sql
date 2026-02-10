-- Clean up redundant "Standard" variants
-- The user confirmed that "Standard" variants are not needed as the base product holds the default specs.
-- This script deletes any variant explicitly named "Standard" to remove clutter from the UI.

DELETE FROM product_variants
WHERE name = 'Standard';

-- Verify deletion (Should return 0 rows)
SELECT * FROM product_variants WHERE name = 'Standard';

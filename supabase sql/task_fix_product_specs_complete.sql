-- COMPLETE FIX SCRIPT FOR PRODUCT SPECIFICATIONS
-- 1. Adds missing columns to products and product_variants tables
-- 2. Updates specification data for all seeded products
-- 3. Returns a status report

BEGIN;

-- 1. Schema Updates
-- Add columns to products table if they don't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS dimensions text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS volume text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS pieces integer;

-- Add columns to product_variants table if they don't exist
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS weight text;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS dimensions text;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS volume text;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS pieces integer;


-- 2. Helper Update Function
CREATE OR REPLACE FUNCTION update_variant_spec_safe(
    p_name TEXT, 
    v_name TEXT, 
    p_weight TEXT DEFAULT NULL, 
    p_dims TEXT DEFAULT NULL, 
    p_vol TEXT DEFAULT NULL, 
    p_pieces INT DEFAULT NULL
) RETURNS void AS $$
BEGIN
    UPDATE product_variants v
    SET 
        weight = p_weight, 
        dimensions = p_dims, 
        volume = p_vol, 
        pieces = p_pieces
    FROM products p
    WHERE v.product_id = p.id 
    AND p.name ILIKE p_name 
    AND v.name ILIKE v_name;
END;
$$ LANGUAGE plpgsql;


-- 3. Data Updates

-- 1. Ashwagandha
UPDATE products SET weight = '100 g' WHERE name ILIKE 'Ashwagandha Root Powder';
SELECT update_variant_spec_safe('Ashwagandha Root Powder', '%100g%', '100 g');
SELECT update_variant_spec_safe('Ashwagandha Root Powder', '%250g%', '250 g');

-- 2. Triphala
UPDATE products SET weight = '100 g' WHERE name ILIKE 'Triphala Churna';
SELECT update_variant_spec_safe('Triphala Churna', '%100g%', '100 g');
SELECT update_variant_spec_safe('Triphala Churna', '%200g%', '200 g');

-- 3. Neem Face Wash
UPDATE products SET volume = '100 ml' WHERE name ILIKE 'Purifying Neem Face Wash';
SELECT update_variant_spec_safe('Purifying Neem Face Wash', '%100ml%', NULL, NULL, '100 ml');
SELECT update_variant_spec_safe('Purifying Neem Face Wash', '%200ml%', NULL, NULL, '200 ml');

-- 4. Aloe Vera
UPDATE products SET weight = '100 g' WHERE name ILIKE 'Soothing Aloe Vera Gel';
SELECT update_variant_spec_safe('Soothing Aloe Vera Gel', '%100g%', '100 g');
SELECT update_variant_spec_safe('Soothing Aloe Vera Gel', '%300g%', '300 g');

-- 5. Tulsi Drops
UPDATE products SET volume = '20 ml' WHERE name ILIKE 'Panch Tulsi Drops';
SELECT update_variant_spec_safe('Panch Tulsi Drops', '%20ml%', NULL, NULL, '20 ml');
SELECT update_variant_spec_safe('Panch Tulsi Drops', '%50ml%', NULL, NULL, '50 ml');

-- 6. Chyawanprash
UPDATE products SET weight = '500 g' WHERE name ILIKE 'Organix Chyawanprash';
SELECT update_variant_spec_safe('Organix Chyawanprash', '%500g%', '500 g');
SELECT update_variant_spec_safe('Organix Chyawanprash', '%1kg%', '1000 g');

-- 7. Bhringraj Oil
UPDATE products SET volume = '100 ml' WHERE name ILIKE 'Intensive Bhringraj Hair Oil';
SELECT update_variant_spec_safe('Intensive Bhringraj Hair Oil', '%100ml%', NULL, NULL, '100 ml');
SELECT update_variant_spec_safe('Intensive Bhringraj Hair Oil', '%200ml%', NULL, NULL, '200 ml');

-- 8. Curcumin
UPDATE products SET pieces = 60 WHERE name ILIKE 'Turmeric Curcumin Gold';
SELECT update_variant_spec_safe('Turmeric Curcumin Gold', '%60 Caps%', NULL, NULL, NULL, 60);
SELECT update_variant_spec_safe('Turmeric Curcumin Gold', '%120 Caps%', NULL, NULL, NULL, 120);

-- 9. Shilajit
UPDATE products SET weight = '15 g' WHERE name ILIKE 'Himalayan Shilajit Resin';
SELECT update_variant_spec_safe('Himalayan Shilajit Resin', '%15g%', '15 g');
SELECT update_variant_spec_safe('Himalayan Shilajit Resin', '%30g%', '30 g');

-- 10. Saffron Cream
UPDATE products SET weight = '50 g' WHERE name ILIKE 'Kumkumadi Saffron Cream';
SELECT update_variant_spec_safe('Kumkumadi Saffron Cream', '%50g%', '50 g');
SELECT update_variant_spec_safe('Kumkumadi Saffron Cream', '%100g%', '100 g');

-- 11. Shampoo
UPDATE products SET volume = '200 ml' WHERE name ILIKE 'Herbal Shampoo';
SELECT update_variant_spec_safe('Herbal Shampoo', '%200ml%', NULL, NULL, '200 ml');
SELECT update_variant_spec_safe('Herbal Shampoo', '%500ml%', NULL, NULL, '500 ml');

-- 12. Brahmi
UPDATE products SET pieces = 60 WHERE name ILIKE 'Brahmi Memory Tablets';
SELECT update_variant_spec_safe('Brahmi Memory Tablets', '%60 Tabs%', NULL, NULL, NULL, 60);
SELECT update_variant_spec_safe('Brahmi Memory Tablets', '%120 Tabs%', NULL, NULL, NULL, 120);

-- 13. Pain Oil
UPDATE products SET volume = '100 ml' WHERE name ILIKE 'Mahanarayan Pain Relief Oil';
SELECT update_variant_spec_safe('Mahanarayan Pain Relief Oil', '%100ml%', NULL, NULL, '100 ml');
SELECT update_variant_spec_safe('Mahanarayan Pain Relief Oil', '%200ml%', NULL, NULL, '200 ml');

-- 14. Diabetic Juice
UPDATE products SET volume = '500 ml' WHERE name ILIKE 'Diabetic Care Juice';
SELECT update_variant_spec_safe('Diabetic Care Juice', '%500ml%', NULL, NULL, '500 ml');
SELECT update_variant_spec_safe('Diabetic Care Juice', '%1L%', NULL, NULL, '1000 ml');

-- 15. Amla Juice
UPDATE products SET volume = '500 ml' WHERE name ILIKE 'Organic Amla Juice';
SELECT update_variant_spec_safe('Organic Amla Juice', '%500ml%', NULL, NULL, '500 ml');
SELECT update_variant_spec_safe('Organic Amla Juice', '%1L%', NULL, NULL, '1000 ml');

-- 16. Rose Water
UPDATE products SET volume = '100 ml' WHERE name ILIKE 'Pure Rose Water';
SELECT update_variant_spec_safe('Pure Rose Water', '%100ml%', NULL, NULL, '100 ml');
SELECT update_variant_spec_safe('Pure Rose Water', '%200ml%', NULL, NULL, '200 ml');

-- 17. Sandal Soap
UPDATE products SET weight = '75 g' WHERE name ILIKE 'Mysore Sandalwood Soap';
SELECT update_variant_spec_safe('Mysore Sandalwood Soap', '%75g%', '75 g');
SELECT update_variant_spec_safe('Mysore Sandalwood Soap', '%125g%', '125 g');

-- 18. Kumkumadi Oil
UPDATE products SET volume = '10 ml' WHERE name ILIKE 'Kumkumadi Tailam';
SELECT update_variant_spec_safe('Kumkumadi Tailam', '%10ml%', NULL, NULL, '10 ml');
SELECT update_variant_spec_safe('Kumkumadi Tailam', '%30ml%', NULL, NULL, '30 ml');

-- Cleanup
DROP FUNCTION update_variant_spec_safe;

COMMIT;

-- 4. Verify
SELECT 
    p.name as product, 
    p.weight as p_weight, 
    count(v.id) as variants_count,
    string_agg(v.name || ': ' || COALESCE(v.weight, v.volume, v.dimensions, v.pieces::text, 'N/A'), ', ') as variant_specs
FROM products p
LEFT JOIN product_variants v ON p.id = v.product_id
WHERE p.name IN ('Ashwagandha Root Powder', 'Soothing Aloe Vera Gel', 'Pure Rose Water')
GROUP BY p.name, p.weight;

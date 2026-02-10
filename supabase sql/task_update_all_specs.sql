-- Update specifications for PRODUCTS and VARIANTS
-- This script assumes the product names and variant names match seed_products.sql

-- Helper function to update variant specs by product name and variant name
CREATE OR REPLACE FUNCTION update_variant_spec(
    p_name TEXT, 
    v_name TEXT, 
    p_weight TEXT DEFAULT NULL, 
    p_dims TEXT DEFAULT NULL, 
    p_vol TEXT DEFAULT NULL, 
    p_pieces INT DEFAULT 1
) RETURNS void AS $$
BEGIN
    UPDATE product_variants v
    SET weight = p_weight, dimensions = p_dims, volume = p_vol, pieces = p_pieces
    FROM products p
    WHERE v.product_id = p.id 
    AND p.name = p_name 
    AND v.name = v_name;
END;
$$ LANGUAGE plpgsql;

-- 1. Ashwagandha Root Powder
UPDATE products SET weight = '100 g' WHERE name = 'Ashwagandha Root Powder';
SELECT update_variant_spec('Ashwagandha Root Powder', '100g Pack', '100 g', NULL, NULL, 1);
SELECT update_variant_spec('Ashwagandha Root Powder', '250g Pack', '250 g', NULL, NULL, 1);

-- 2. Triphala Churna
UPDATE products SET weight = '100 g' WHERE name = 'Triphala Churna';
SELECT update_variant_spec('Triphala Churna', '100g Jar', '100 g', NULL, NULL, 1);
SELECT update_variant_spec('Triphala Churna', '200g Jar', '200 g', NULL, NULL, 1);

-- 3. Purifying Neem Face Wash
UPDATE products SET volume = '100 ml' WHERE name = 'Purifying Neem Face Wash';
SELECT update_variant_spec('Purifying Neem Face Wash', '100ml Tube', NULL, NULL, '100 ml', 1);
SELECT update_variant_spec('Purifying Neem Face Wash', '200ml Pump', NULL, NULL, '200 ml', 1);

-- 4. Soothing Aloe Vera Gel
UPDATE products SET weight = '100 g' WHERE name = 'Soothing Aloe Vera Gel';
SELECT update_variant_spec('Soothing Aloe Vera Gel', '100g Tub', '100 g', NULL, NULL, 1);
SELECT update_variant_spec('Soothing Aloe Vera Gel', '300g Value Pack', '300 g', NULL, NULL, 1);

-- 5. Panch Tulsi Drops
UPDATE products SET volume = '20 ml' WHERE name = 'Panch Tulsi Drops';
SELECT update_variant_spec('Panch Tulsi Drops', '20ml Bottle', NULL, NULL, '20 ml', 1);
SELECT update_variant_spec('Panch Tulsi Drops', '50ml Bottle', NULL, NULL, '50 ml', 1);

-- 6. Organix Chyawanprash
UPDATE products SET weight = '500 g' WHERE name = 'Organix Chyawanprash';
SELECT update_variant_spec('Organix Chyawanprash', '500g Jar', '500 g', NULL, NULL, 1);
SELECT update_variant_spec('Organix Chyawanprash', '1kg Jar', '1000 g', NULL, NULL, 1);

-- 7. Intensive Bhringraj Hair Oil
UPDATE products SET volume = '100 ml' WHERE name = 'Intensive Bhringraj Hair Oil';
SELECT update_variant_spec('Intensive Bhringraj Hair Oil', '100ml Bottle', NULL, NULL, '100 ml', 1);
SELECT update_variant_spec('Intensive Bhringraj Hair Oil', '200ml Bottle', NULL, NULL, '200 ml', 1);

-- 8. Turmeric Curcumin Gold
UPDATE products SET pieces = 60 WHERE name = 'Turmeric Curcumin Gold';
SELECT update_variant_spec('Turmeric Curcumin Gold', '60 Caps', NULL, NULL, NULL, 60);
SELECT update_variant_spec('Turmeric Curcumin Gold', '120 Caps', NULL, NULL, NULL, 120);

-- 9. Himalayan Shilajit Resin
UPDATE products SET weight = '15 g' WHERE name = 'Himalayan Shilajit Resin';
SELECT update_variant_spec('Himalayan Shilajit Resin', '15g Jar', '15 g', NULL, NULL, 1);
SELECT update_variant_spec('Himalayan Shilajit Resin', '30g Jar', '30 g', NULL, NULL, 1);

-- 10. Kumkumadi Saffron Cream
UPDATE products SET weight = '50 g' WHERE name = 'Kumkumadi Saffron Cream';
SELECT update_variant_spec('Kumkumadi Saffron Cream', '50g Jar', '50 g', NULL, NULL, 1);
SELECT update_variant_spec('Kumkumadi Saffron Cream', '100g Jar', '100 g', NULL, NULL, 1);

-- 11. Herbal Shampoo
UPDATE products SET volume = '200 ml' WHERE name = 'Herbal Shampoo';
SELECT update_variant_spec('Herbal Shampoo', '200ml Bottle', NULL, NULL, '200 ml', 1);
SELECT update_variant_spec('Herbal Shampoo', '500ml Pump', NULL, NULL, '500 ml', 1);

-- 12. Brahmi Memory Tablets
UPDATE products SET pieces = 60 WHERE name = 'Brahmi Memory Tablets';
SELECT update_variant_spec('Brahmi Memory Tablets', '60 Tabs', NULL, NULL, NULL, 60);
SELECT update_variant_spec('Brahmi Memory Tablets', '120 Tabs', NULL, NULL, NULL, 120);

-- 13. Mahanarayan Pain Relief Oil
UPDATE products SET volume = '100 ml' WHERE name = 'Mahanarayan Pain Relief Oil';
SELECT update_variant_spec('Mahanarayan Pain Relief Oil', '100ml Bottle', NULL, NULL, '100 ml', 1);
SELECT update_variant_spec('Mahanarayan Pain Relief Oil', '200ml Bottle', NULL, NULL, '200 ml', 1);

-- 14. Diabetic Care Juice
UPDATE products SET volume = '500 ml' WHERE name = 'Diabetic Care Juice';
SELECT update_variant_spec('Diabetic Care Juice', '500ml Bottle', NULL, NULL, '500 ml', 1);
SELECT update_variant_spec('Diabetic Care Juice', '1L Bottle', NULL, NULL, '1000 ml', 1);

-- 15. Organic Amla Juice
UPDATE products SET volume = '500 ml' WHERE name = 'Organic Amla Juice';
SELECT update_variant_spec('Organic Amla Juice', '500ml', NULL, NULL, '500 ml', 1);
SELECT update_variant_spec('Organic Amla Juice', '1L', NULL, NULL, '1000 ml', 1);

-- 16. Pure Rose Water
UPDATE products SET volume = '100 ml' WHERE name = 'Pure Rose Water';
SELECT update_variant_spec('Pure Rose Water', '100ml Spray', NULL, NULL, '100 ml', 1);
SELECT update_variant_spec('Pure Rose Water', '200ml Refill', NULL, NULL, '200 ml', 1);

-- 17. Mysore Sandalwood Soap
UPDATE products SET weight = '75 g' WHERE name = 'Mysore Sandalwood Soap';
SELECT update_variant_spec('Mysore Sandalwood Soap', '75g Bar', '75 g', NULL, NULL, 1);
SELECT update_variant_spec('Mysore Sandalwood Soap', '125g Bar', '125 g', NULL, NULL, 1);

-- 18. Kumkumadi Tailam
UPDATE products SET volume = '10 ml' WHERE name = 'Kumkumadi Tailam';
SELECT update_variant_spec('Kumkumadi Tailam', '10ml Dropper', NULL, NULL, '10 ml', 1);
SELECT update_variant_spec('Kumkumadi Tailam', '30ml Dropper', NULL, NULL, '30 ml', 1);

-- 19. Multani Mitti Face Pack
UPDATE products SET weight = '100 g' WHERE name = 'Multani Mitti Face Pack';
SELECT update_variant_spec('Multani Mitti Face Pack', '100g Box', '100 g', NULL, NULL, 1);
SELECT update_variant_spec('Multani Mitti Face Pack', '500g Bag', '500 g', NULL, NULL, 1);

-- 20. Slimming Green Tea
UPDATE products SET pieces = 25 WHERE name = 'Slimming Green Tea';
SELECT update_variant_spec('Slimming Green Tea', '25 Tea Bags', NULL, NULL, NULL, 25);
SELECT update_variant_spec('Slimming Green Tea', '50 Tea Bags', NULL, NULL, NULL, 50);

-- Clean up function
DROP FUNCTION update_variant_spec;

SELECT 'Updated specifications for all products and variants.' as status;

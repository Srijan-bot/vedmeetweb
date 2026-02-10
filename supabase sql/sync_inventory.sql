-- 1. SYNC INVENTORY SCRIPT
-- Run this in Supabase SQL Editor
-- It populates the inventory tables with your existing products.

DO $$
DECLARE
    r RECORD;
    v_variant_id UUID;
    v_warehouse_id UUID;
    v_count INTEGER;
BEGIN
    -- 1. Ensure a Default Warehouse exists
    INSERT INTO warehouses (name, location, is_active)
    VALUES ('Main Warehouse', 'Default Location', true)
    ON CONFLICT DO NOTHING;
    
    SELECT id INTO v_warehouse_id FROM warehouses ORDER BY created_at LIMIT 1;

    -- 2. Loop through all existing products
    FOR r IN SELECT * FROM products LOOP
        
        -- Check if variant exists (product_id is BigInt, matches r.id)
        SELECT id INTO v_variant_id 
        FROM product_variants 
        WHERE product_id = r.id 
        LIMIT 1;
        
        IF v_variant_id IS NULL THEN
            -- Insert "Standard" variant
            INSERT INTO product_variants (
                product_id, name, sku, price, stock_quantity, mrp, gst_rate, is_active
            ) VALUES (
                r.id,
                'Standard', 
                'SKU-' || r.id::text, -- Simple SKU using the BigInt ID
                r.price,
                coalesce(r.stock_quantity, 0), 
                r.price, 
                18, 
                true
            ) RETURNING id INTO v_variant_id;
            
            RAISE NOTICE 'Scoped variant for product: %', r.name;
        END IF;

        -- 3. Sync Opening Stock (if needed)
        IF coalesce(r.stock_quantity, 0) > 0 THEN
             SELECT count(*) INTO v_count 
             FROM inventory_transactions 
             WHERE variant_id = v_variant_id AND transaction_type = 'opening_stock';

             IF v_count = 0 THEN
                 INSERT INTO inventory_transactions (
                    warehouse_id, variant_id, quantity_change, transaction_type, reason
                 ) VALUES (
                    v_warehouse_id, v_variant_id, r.stock_quantity, 'opening_stock', 'Migration'
                 );
             END IF;
        END IF;
        
    END LOOP;
END $$;

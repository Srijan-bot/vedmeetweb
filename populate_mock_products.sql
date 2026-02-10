-- 1. Clean up existing data to avoid duplicates
TRUNCATE TABLE products, product_variants, inventory_transactions CASCADE;

-- 2. Temporarily disable the auto-sync trigger to avoid duplicate variants
ALTER TABLE products DISABLE TRIGGER on_product_created;

-- 2. Run the Data Generation
DO $$
DECLARE
    v_warehouse_id uuid;
    v_product_id bigint; -- FIXED: Changed from uuid to bigint
    v_variant_id uuid;
    v_i integer;
    v_j integer;
    v_price numeric;
BEGIN
    -- Get a warehouse
    SELECT id INTO v_warehouse_id FROM warehouses LIMIT 1;
    IF v_warehouse_id IS NULL THEN
        INSERT INTO warehouses (name, location) VALUES ('Main Warehouse', 'Default Location') RETURNING id INTO v_warehouse_id;
    END IF;

    -- Ensure Brand Exists for Filter Dropdown
    INSERT INTO brands (name, description)
    VALUES ('Organic India', 'Global leader in organic products')
    ON CONFLICT DO NOTHING;

    -- Generate 10 Simple Products (1 Variant)
    FOR v_i IN 1..10 LOOP
        v_price := (random() * 100 + 10)::numeric(10,2);
        
        INSERT INTO products (name, description, price, category, stock_status, stock_quantity, features, benefits, usage, brand)
        VALUES (
            'Simple Product ' || v_i, 
            'Description for Simple Product ' || v_i || '. High quality and durable.', 
            v_price, 
            ARRAY['General'], 
            'In Stock', 
            60, -- Varied: In Stock (>50)
            'Feature A, Feature B',
            'Benefit X, Benefit Y',
            'Daily usage recommended',
            'Organic India'
        ) RETURNING id INTO v_product_id;

        -- Create Default Variant
        INSERT INTO product_variants (product_id, sku, name, price, cost_price, mrp, stock_quantity)
        VALUES (
            v_product_id, 
            'SP-' || v_i || '-DEF', 
            'Default', 
            v_price, 
            v_price * 0.8, 
            v_price * 1.2, 
            0 -- Will be updated
        ) RETURNING id INTO v_variant_id;

        -- Add Inventory (60 units)
        INSERT INTO inventory_transactions (warehouse_id, variant_id, quantity_change, transaction_type, reason, reference_id)
        VALUES (v_warehouse_id, v_variant_id, 60, 'opening_stock', 'Initial Mock Data', 'INIT-SP-' || v_i);
    END LOOP;

    -- Generate 5 Products with 2 Varieties (Low Stock)
    FOR v_i IN 11..15 LOOP
        v_price := (random() * 200 + 50)::numeric(10,2);
        
        INSERT INTO products (name, description, price, category, stock_status, stock_quantity, features, benefits, usage, brand)
        VALUES (
            'Dual Var Product ' || v_i, 
            'Description for Dual Var Product ' || v_i || '. Comes in two amazing varieties.', 
            v_price, 
            ARRAY['Premium'], 
            'In Stock', 
            30, -- 15 each -> Low
            'Premium Quality, Dual Option',
            'Versatile, Stylish',
            'Handle with care',
            'Organic India'
        ) RETURNING id INTO v_product_id;

        -- Create 2 Variants
        FOR v_j IN 1..2 LOOP
            INSERT INTO product_variants (product_id, sku, name, price, cost_price, mrp, stock_quantity)
            VALUES (
                v_product_id, 
                'DP-' || v_i || '-V' || v_j, 
                CASE v_j WHEN 1 THEN 'Standard' ELSE 'Pro' END, 
                v_price + (v_j - 1) * 10, 
                (v_price + (v_j - 1) * 10) * 0.8, 
                (v_price + (v_j - 1) * 10) * 1.2, 
                0
            ) RETURNING id INTO v_variant_id;

            -- Add Inventory (15 each -> >10 but <=50 = Low)
            INSERT INTO inventory_transactions (warehouse_id, variant_id, quantity_change, transaction_type, reason, reference_id)
            VALUES (v_warehouse_id, v_variant_id, 15, 'opening_stock', 'Initial Mock Data', 'INIT-DP-' || v_i || '-' || v_j);
        END LOOP;
    END LOOP;

    -- Generate 5 Products with 3 Varieties (Critical Stock)
    FOR v_i IN 16..20 LOOP
        v_price := (random() * 300 + 100)::numeric(10,2);
        
        INSERT INTO products (name, description, price, category, stock_status, stock_quantity, features, benefits, usage, brand)
        VALUES (
            'Tri Var Product ' || v_i, 
            'Description for Tri Var Product ' || v_i || '. Available in three distinct options.', 
            v_price, 
            ARRAY['Luxury'], 
            'In Stock', 
            15, -- 5 each -> Critical
            'Luxury Material, 3 Options',
            'Exclusive, Elegant',
            'Professional use only',
            'Organic India'
        ) RETURNING id INTO v_product_id;

        -- Create 3 Variants
        FOR v_j IN 1..3 LOOP
            INSERT INTO product_variants (product_id, sku, name, price, cost_price, mrp, stock_quantity)
            VALUES (
                v_product_id, 
                'TP-' || v_i || '-V' || v_j, 
                CASE v_j WHEN 1 THEN 'Red' WHEN 2 THEN 'Green' ELSE 'Blue' END, 
                v_price + (v_j - 1) * 15, 
                (v_price + (v_j - 1) * 15) * 0.8, 
                (v_price + (v_j - 1) * 15) * 1.2, 
                0
            ) RETURNING id INTO v_variant_id;

            -- Add Inventory (5 each -> <=10 = Critical)
            INSERT INTO inventory_transactions (warehouse_id, variant_id, quantity_change, transaction_type, reason, reference_id)
            VALUES (v_warehouse_id, v_variant_id, 5, 'opening_stock', 'Initial Mock Data', 'INIT-TP-' || v_i || '-' || v_j);
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Successfully generated 20 mock products with inventory.';
END $$;

-- 3. Re-enable the trigger
ALTER TABLE products ENABLE TRIGGER on_product_created;

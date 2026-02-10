-- Replenish stock for the failing variant
-- We do this by inserting an inventory transaction, which should trigger an update to the variant's stock_quantity

-- 1. Get a Default Warehouse ID
DO $$
DECLARE
    v_warehouse_id uuid;
    v_variant_id uuid := '9c7eb08e-5d74-4c10-b5aa-08c59ae7eb8c';
    v_quantity_to_add integer := 100; -- Add 100 items
BEGIN
    SELECT id INTO v_warehouse_id FROM warehouses LIMIT 1;
    
    IF v_warehouse_id IS NULL THEN
        RAISE EXCEPTION 'No warehouse found! Please create a warehouse first.';
    END IF;

    -- 2. Insert Transaction (Purchase/Adjustment)
    INSERT INTO inventory_transactions (
        warehouse_id,
        variant_id,
        quantity_change,
        transaction_type,
        reason,
        reference_id
    ) VALUES (
        v_warehouse_id,
        v_variant_id,
        v_quantity_to_add,
        'purchase', -- or 'adjustment'
        'Manual Stock Replenishment for Testing',
        gen_random_uuid()::text
    );
    
    -- NOTE: If you don't have a trigger updating product_variants (trg_update_stock), you might need to update manually:
    -- UPDATE product_variants SET stock_quantity = stock_quantity + v_quantity_to_add WHERE id = v_variant_id;
    
    RAISE NOTICE 'Added % stock to variant %', v_quantity_to_add, v_variant_id;
END $$;

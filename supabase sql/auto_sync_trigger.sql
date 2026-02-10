-- 2. AUTO-SYNC TRIGGER SCRIPT
-- Run this in Supabase SQL Editor
-- It ensures ANY future product you add gets a variant automatically.

CREATE OR REPLACE FUNCTION handle_new_product_inventory()
RETURNS TRIGGER AS $$
DECLARE
    v_variant_id UUID;
    v_warehouse_id UUID;
BEGIN
    -- 1. Create Default "Standard" Variant
    INSERT INTO product_variants (
        product_id, name, sku, price, stock_quantity, mrp, gst_rate, is_active
    ) VALUES (
        NEW.id, -- matches BigInt
        'Standard',
        'SKU-' || NEW.id::text,
        NEW.price,
        coalesce(NEW.stock_quantity, 0),
        NEW.price,
        18,
        true
    ) RETURNING id INTO v_variant_id;

    -- 2. Create Opening Stock Transaction if stock > 0
    IF coalesce(NEW.stock_quantity, 0) > 0 THEN
        SELECT id INTO v_warehouse_id FROM warehouses ORDER BY created_at LIMIT 1;
        
        IF v_warehouse_id IS NOT NULL THEN
            INSERT INTO inventory_transactions (
                warehouse_id, variant_id, quantity_change, transaction_type, reason
            ) VALUES (
                v_warehouse_id, v_variant_id, NEW.stock_quantity, 'opening_stock', 'Auto-sync'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-attach trigger
DROP TRIGGER IF EXISTS on_product_created ON products;
CREATE TRIGGER on_product_created
    AFTER INSERT ON products
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_product_inventory();

-- CLEAN RE-INSTALL SCRIPT
-- This will DROP existing inventory tables and start fresh.
-- Use this to clear any "UUID vs BigInt" conflicts or missing permissions.

-- 1. DROP EXISTING TABLES (Clean Slate)
DROP TABLE IF EXISTS public.inventory_transactions CASCADE;
DROP TABLE IF EXISTS public.warehouse_stock CASCADE;
DROP TABLE IF EXISTS public.product_variants CASCADE;
DROP TABLE IF EXISTS public.warehouses CASCADE;

-- 2. CREATE TABLES (Correct Schema)
CREATE TABLE public.warehouses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    location text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.product_variants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id bigint REFERENCES products(id) ON DELETE CASCADE NOT NULL, -- FIXED: BigInt
    sku text UNIQUE,
    name text NOT NULL,
    price numeric DEFAULT 0,
    cost_price numeric DEFAULT 0,
    mrp numeric DEFAULT 0,
    stock_quantity integer DEFAULT 0,
    gst_rate numeric DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.inventory_transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    warehouse_id uuid REFERENCES warehouses(id) ON DELETE RESTRICT NOT NULL,
    variant_id uuid REFERENCES product_variants(id) ON DELETE RESTRICT NOT NULL,
    quantity_change integer NOT NULL,
    transaction_type text NOT NULL,
    reason text,
    performed_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.warehouse_stock (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    warehouse_id uuid REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
    variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE NOT NULL,
    quantity integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(warehouse_id, variant_id)
);

-- 3. PERMISSIONS (Grant Everyone)
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access" ON public.warehouses FOR ALL USING (true);
CREATE POLICY "Public Access" ON public.product_variants FOR ALL USING (true);
CREATE POLICY "Public Access" ON public.inventory_transactions FOR ALL USING (true);
CREATE POLICY "Public Access" ON public.warehouse_stock FOR ALL USING (true);

GRANT ALL ON TABLE public.warehouses TO anon, authenticated;
GRANT ALL ON TABLE public.product_variants TO anon, authenticated;
GRANT ALL ON TABLE public.inventory_transactions TO anon, authenticated;
GRANT ALL ON TABLE public.warehouse_stock TO anon, authenticated;


-- 4. TRIGGERS

-- Stock Update Trigger
CREATE OR REPLACE FUNCTION update_warehouse_stock_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO warehouse_stock (warehouse_id, variant_id, quantity)
  VALUES (NEW.warehouse_id, NEW.variant_id, NEW.quantity_change)
  ON CONFLICT (warehouse_id, variant_id)
  DO UPDATE SET 
    quantity = warehouse_stock.quantity + NEW.quantity_change,
    updated_at = now();
    
  UPDATE product_variants
  SET stock_quantity = (
    SELECT coalesce(sum(quantity), 0)
    FROM warehouse_stock
    WHERE variant_id = NEW.variant_id
  )
  WHERE id = NEW.variant_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_stock
AFTER INSERT ON inventory_transactions
FOR EACH ROW
EXECUTE FUNCTION update_warehouse_stock_trigger();

-- Auto-Sync Trigger
CREATE OR REPLACE FUNCTION handle_new_product_inventory()
RETURNS TRIGGER AS $$
DECLARE
    v_variant_id UUID;
    v_warehouse_id UUID;
BEGIN
    INSERT INTO product_variants (
        product_id, name, sku, price, stock_quantity, mrp, gst_rate, is_active
    ) VALUES (
        NEW.id, 'Standard', 'SKU-' || NEW.id::text, NEW.price, coalesce(NEW.stock_quantity,0), NEW.price, 18, true
    ) RETURNING id INTO v_variant_id;

    IF coalesce(NEW.stock_quantity, 0) > 0 THEN
        SELECT id INTO v_warehouse_id FROM warehouses LIMIT 1;
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

DROP TRIGGER IF EXISTS on_product_created ON products;
CREATE TRIGGER on_product_created
    AFTER INSERT ON products
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_product_inventory();


-- 5. INITIAL DATA SEED (Sync)
INSERT INTO warehouses (name, location) VALUES ('Main Warehouse', 'Default Location');

DO $$
DECLARE
    r RECORD;
    v_variant_id UUID;
    v_warehouse_id UUID;
BEGIN
    SELECT id INTO v_warehouse_id FROM warehouses LIMIT 1;

    FOR r IN SELECT * FROM products LOOP
        INSERT INTO product_variants (
            product_id, name, sku, price, stock_quantity, mrp, gst_rate
        ) VALUES (
            r.id, 'Standard', 'SKU-' || r.id::text, r.price, coalesce(r.stock_quantity, 0), r.price, 18
        ) RETURNING id INTO v_variant_id;
        
        IF coalesce(r.stock_quantity, 0) > 0 THEN
             INSERT INTO inventory_transactions (
                warehouse_id, variant_id, quantity_change, transaction_type, reason
             ) VALUES (
                v_warehouse_id, v_variant_id, r.stock_quantity, 'opening_stock', 'Migration'
             );
        END IF;
    END LOOP;
END $$;

-- 6. REFRESH
NOTIFY pgrst, 'reload schema';

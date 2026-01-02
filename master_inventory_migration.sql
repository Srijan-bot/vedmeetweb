-- MASTER INVENTORY MIGRATION SCRIPT
-- RUN THIS SCRIPT ONCE TO SET UP EVERYTHING

-- ==========================================
-- PART 1: SCHEMA SETUP (Create Tables)
-- ==========================================

-- 1. Warehouses Table
CREATE TABLE IF NOT EXISTS warehouses (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  location text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Seed default warehouse
INSERT INTO warehouses (name, location) VALUES ('Main Warehouse', 'Default Location')
ON CONFLICT DO NOTHING;

-- 2. Product Variants Table
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  sku text UNIQUE,
  name text NOT NULL, -- e.g. "Standard", "Small", "Red"
  
  -- Pricing & Accounting
  price numeric NOT NULL DEFAULT 0, -- Selling Price
  cost_price numeric DEFAULT 0, -- COGS tracking
  mrp numeric DEFAULT 0, -- Maximum Retail Price
  
  -- GST Fields
  hsn_code text,
  gst_rate numeric DEFAULT 0, -- 0, 5, 12, 18, 28
  
  stock_quantity integer DEFAULT 0, -- Read-only, updated via triggers
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 3. Inventory Transactions (The Ledger)
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  warehouse_id uuid REFERENCES warehouses(id) ON DELETE RESTRICT NOT NULL,
  variant_id uuid REFERENCES product_variants(id) ON DELETE RESTRICT NOT NULL,
  
  quantity_change integer NOT NULL, -- Positive for add, Negative for remove
  transaction_type text NOT NULL CHECK (transaction_type IN ('purchase', 'sale', 'transfer_in', 'transfer_out', 'adjustment', 'return', 'import', 'opening_stock')),
  
  reason text,
  reference_id text, -- Order ID, Transfer ID, etc.
  performed_by uuid REFERENCES auth.users(id), -- Admin user ID
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 4. Warehouse Stock Summary (Materialized / Cached View)
CREATE TABLE IF NOT EXISTS warehouse_stock (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  warehouse_id uuid REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
  variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE NOT NULL,
  quantity integer DEFAULT 0,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(warehouse_id, variant_id)
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_variant ON inventory_transactions(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_warehouse ON inventory_transactions(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_lookup ON warehouse_stock(warehouse_id, variant_id);

-- 6. RLS Policies (Enable RLS but allow authenticated access for now)
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_stock ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all access to authenticated users' AND tablename = 'warehouses') THEN
        CREATE POLICY "Allow all access to authenticated users" ON warehouses FOR ALL USING (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all access to authenticated users' AND tablename = 'product_variants') THEN
        CREATE POLICY "Allow all access to authenticated users" ON product_variants FOR ALL USING (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all access to authenticated users' AND tablename = 'inventory_transactions') THEN
        CREATE POLICY "Allow all access to authenticated users" ON inventory_transactions FOR ALL USING (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all access to authenticated users' AND tablename = 'warehouse_stock') THEN
        CREATE POLICY "Allow all access to authenticated users" ON warehouse_stock FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;


-- ==========================================
-- PART 2: TRIGGERS (Auto-Sync & Stock Updates)
-- ==========================================

-- Trigger to Update Warehouse Stock Summary from Transactions
CREATE OR REPLACE FUNCTION update_warehouse_stock_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Upsert into warehouse_stock
  INSERT INTO warehouse_stock (warehouse_id, variant_id, quantity)
  VALUES (NEW.warehouse_id, NEW.variant_id, NEW.quantity_change)
  ON CONFLICT (warehouse_id, variant_id)
  DO UPDATE SET 
    quantity = warehouse_stock.quantity + NEW.quantity_change,
    updated_at = now();
    
  -- Update total stock in product_variants (Aggregation for convenience)
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

-- Drop trigger if exists to avoid error on recreation
DROP TRIGGER IF EXISTS trg_update_stock ON inventory_transactions;
CREATE TRIGGER trg_update_stock
AFTER INSERT ON inventory_transactions
FOR EACH ROW
EXECUTE FUNCTION update_warehouse_stock_trigger();


-- Trigger to Auto-Create Variant for New Products
CREATE OR REPLACE FUNCTION handle_new_product_inventory()
RETURNS TRIGGER AS $$
DECLARE
    v_variant_id UUID;
    v_warehouse_id UUID;
BEGIN
    -- 1. Create Default "Standard" Variant
    INSERT INTO product_variants (
        product_id, name, sku, price, stock_quantity, cost_price, mrp, gst_rate, is_active
    ) VALUES (
        NEW.id,
        'Standard',
        'SKU-' || substring(NEW.id::text from 1 for 8),
        NEW.price,
        coalesce(NEW.stock_quantity, 0),
        0,
        NEW.price,
        18,
        true
    ) RETURNING id INTO v_variant_id;

    -- 2. Create Opening Stock Transaction if stock > 0
    IF coalesce(NEW.stock_quantity, 0) > 0 THEN
        SELECT id INTO v_warehouse_id FROM warehouses ORDER BY created_at LIMIT 1;
        
        IF v_warehouse_id IS NOT NULL THEN
            INSERT INTO inventory_transactions (
                warehouse_id, variant_id, quantity_change, transaction_type, reason, performed_by
            ) VALUES (
                v_warehouse_id,
                v_variant_id,
                NEW.stock_quantity,
                'opening_stock',
                'Auto-sync: New Product Created',
                null
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


-- ==========================================
-- PART 3: SYNC DATA (Backfill Existing Products)
-- ==========================================

DO $$
DECLARE
    r RECORD;
    v_variant_id UUID;
    v_warehouse_id UUID;
    v_count INTEGER;
BEGIN
    -- Get Main Warehouse
    SELECT id INTO v_warehouse_id FROM warehouses ORDER BY created_at LIMIT 1;
    
    -- Loop through products and sync
    FOR r IN SELECT * FROM products LOOP
        
        -- Check if variant exists
        SELECT id INTO v_variant_id FROM product_variants WHERE product_id = r.id LIMIT 1;
        
        IF v_variant_id IS NULL THEN
            
            -- Create Variant
            INSERT INTO product_variants (
                product_id, name, sku, price, stock_quantity, cost_price, mrp, gst_rate, is_active
            ) VALUES (
                r.id,
                'Standard', 
                'SKU-' || substring(r.id::text from 1 for 8), 
                r.price,
                coalesce(r.stock_quantity, 0), 
                0, 
                r.price, 
                18, 
                true
            ) RETURNING id INTO v_variant_id;
            
            RAISE NOTICE 'Synced variant for: %', r.name;
            
            -- Sync Opening Stock
            IF coalesce(r.stock_quantity, 0) > 0 AND v_warehouse_id IS NOT NULL THEN
                 INSERT INTO inventory_transactions (
                    warehouse_id, variant_id, quantity_change, transaction_type, reason, performed_by
                 ) VALUES (
                    v_warehouse_id,
                    v_variant_id,
                    r.stock_quantity,
                    'opening_stock',
                    'Migration: Sync Existing',
                    null
                 );
            END IF;
            
        END IF;
    END LOOP;
END $$;

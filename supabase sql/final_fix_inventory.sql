-- FINAL FIX INVENTORY SCRIPT
-- Run this to resolve "Empty Inventory" issues.

-- 1. Enable UUID Extension (Critical for ID generation)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Tables (if they don't exist)
CREATE TABLE IF NOT EXISTS warehouses (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  location text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS product_variants (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  sku text UNIQUE,
  name text NOT NULL, 
  price numeric NOT NULL DEFAULT 0,
  cost_price numeric DEFAULT 0,
  mrp numeric DEFAULT 0, 
  hsn_code text,
  gst_rate numeric DEFAULT 0,
  stock_quantity integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  warehouse_id uuid REFERENCES warehouses(id) ON DELETE RESTRICT NOT NULL,
  variant_id uuid REFERENCES product_variants(id) ON DELETE RESTRICT NOT NULL,
  quantity_change integer NOT NULL, 
  transaction_type text NOT NULL,
  reason text,
  reference_id text,
  performed_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS warehouse_stock (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  warehouse_id uuid REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
  variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE NOT NULL,
  quantity integer DEFAULT 0,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(warehouse_id, variant_id)
);

-- 3. Fix RLS Policies (Drop existing to ensure clean state, then re-create)
-- We enable RLS but add a temporary "Public Access" policy to ensure you can see data.
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_stock ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Access" ON warehouses;
CREATE POLICY "Public Access" ON warehouses FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Access" ON product_variants;
CREATE POLICY "Public Access" ON product_variants FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Access" ON inventory_transactions;
CREATE POLICY "Public Access" ON inventory_transactions FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Access" ON warehouse_stock;
CREATE POLICY "Public Access" ON warehouse_stock FOR ALL USING (true);


-- 4. Seed Data (Warehouses & Variants)
INSERT INTO warehouses (name, location) VALUES ('Main Warehouse', 'Default Location')
ON CONFLICT DO NOTHING;

DO $$
DECLARE
    r RECORD;
    v_variant_id UUID;
    v_warehouse_id UUID;
BEGIN
    SELECT id INTO v_warehouse_id FROM warehouses LIMIT 1;

    FOR r IN SELECT * FROM products LOOP
        -- Check/Create Variant
        SELECT id INTO v_variant_id FROM product_variants WHERE product_id = r.id LIMIT 1;
        
        IF v_variant_id IS NULL THEN
            INSERT INTO product_variants (
                product_id, name, sku, price, stock_quantity, mrp, gst_rate
            ) VALUES (
                r.id, 'Standard', 'SKU-' || substring(r.id::text from 1 for 8), r.price, coalesce(r.stock_quantity,0), r.price, 18
            ) RETURNING id INTO v_variant_id;
            
            -- Add Opening Stock
            IF coalesce(r.stock_quantity, 0) > 0 THEN
                 INSERT INTO inventory_transactions (
                    warehouse_id, variant_id, quantity_change, transaction_type, reason
                 ) VALUES (
                    v_warehouse_id, v_variant_id, r.stock_quantity, 'opening_stock', 'Migration'
                 );
            END IF;
        END IF;
    END LOOP;
END $$;

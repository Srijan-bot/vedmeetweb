-- INVENTORY SETUP V2 (Fixed for BigInt Product IDs)
-- The error indicated your 'products' table uses BIGINT for IDs, not UUID.
-- This script adapts the foreign keys to match.

-- 1. Create Warehouses
CREATE TABLE IF NOT EXISTS warehouses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    location text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

INSERT INTO warehouses (name, location) VALUES ('Main Warehouse', 'Default Location') 
ON CONFLICT DO NOTHING;

-- 2. Create Product Variants
-- CHANGE: product_id is now BIGINT to match your products table
CREATE TABLE IF NOT EXISTS product_variants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id bigint REFERENCES products(id) ON DELETE CASCADE NOT NULL,
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

-- 3. Create Transactions
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    warehouse_id uuid REFERENCES warehouses(id) ON DELETE RESTRICT NOT NULL,
    variant_id uuid REFERENCES product_variants(id) ON DELETE RESTRICT NOT NULL,
    quantity_change integer NOT NULL,
    transaction_type text NOT NULL,
    reason text,
    performed_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 4. Enable Public Access & Fix Permissions
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access All" ON warehouses FOR ALL USING (true);
CREATE POLICY "Public Access All" ON product_variants FOR ALL USING (true);
CREATE POLICY "Public Access All" ON inventory_transactions FOR ALL USING (true);

GRANT ALL ON TABLE public.warehouses TO anon, authenticated;
GRANT ALL ON TABLE public.product_variants TO anon, authenticated;
GRANT ALL ON TABLE public.inventory_transactions TO anon, authenticated;

-- 5. Force Refresh
NOTIFY pgrst, 'reload schema';

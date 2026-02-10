-- SIMPLE SETUP (No Extensions Required)
-- Using gen_random_uuid() which is built-in to modern Postgres/Supabase.

-- 1. Create Warehouses
CREATE TABLE IF NOT EXISTS warehouses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    location text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Seed Warehouse
INSERT INTO warehouses (name, location) VALUES ('Main Warehouse', 'Default Location') 
ON CONFLICT DO NOTHING;

-- 2. Create Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
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

-- 4. Enable Public Access (Fix Permissions)
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access All" ON warehouses FOR ALL USING (true);
CREATE POLICY "Public Access All" ON product_variants FOR ALL USING (true);
CREATE POLICY "Public Access All" ON inventory_transactions FOR ALL USING (true);

-- 5. Force Schema Refresh
NOTIFY pgrst, 'reload schema';

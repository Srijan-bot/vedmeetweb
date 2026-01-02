-- Fix Schema: Allow 'Text' or 'Integer' IDs for Legacy Data Compatibility
-- This script Drops and Recreates the Inventory tables to use TEXT for IDs instead of strict UUID.
-- This solves the "invalid input syntax for type uuid: '11'" error.

-- 1. Drop existing new tables (Data will be reset)
DROP TRIGGER IF EXISTS trg_update_aggregate_stock ON warehouse_batch_stock;
DROP FUNCTION IF EXISTS fn_update_aggregate_stock;
DROP TABLE IF EXISTS accounting_ledger;
DROP TABLE IF EXISTS inventory_ledger;
DROP TABLE IF EXISTS warehouse_batch_stock;
DROP TABLE IF EXISTS product_batches;
DROP TABLE IF EXISTS warehouse_stock; -- Valid to drop as we will recreate it compatible

-- 2. Recreate Tables with TEXT IDs (Compatible with "11", "uuid", etc.)

-- Warehouse Stock (Aggregate)
CREATE TABLE warehouse_stock (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    warehouse_id text NOT NULL, -- Flexible Type
    variant_id text NOT NULL,   -- Flexible Type
    quantity integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(warehouse_id, variant_id)
);

-- Batches
CREATE TABLE product_batches (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    variant_id text NOT NULL, -- Flexible Type
    batch_number text NOT NULL,
    mfg_date date,
    expiry_date date,
    cost_price numeric DEFAULT 0,
    initial_quantity integer NOT NULL,
    current_quantity integer NOT NULL DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(variant_id, batch_number)
);

-- Batch Stock
CREATE TABLE warehouse_batch_stock (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    warehouse_id text NOT NULL, 
    variant_id text NOT NULL,
    batch_id uuid REFERENCES product_batches(id) ON DELETE CASCADE NOT NULL,
    quantity integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(warehouse_id, variant_id, batch_id)
);

-- Inventory Ledger
CREATE TABLE inventory_ledger (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_date timestamp with time zone DEFAULT timezone('utc'::text, now()),
    warehouse_id text NOT NULL,
    variant_id text NOT NULL,
    batch_id uuid,
    transaction_type text NOT NULL,
    quantity_change integer NOT NULL,
    running_balance integer,
    unit_cost numeric,
    total_value numeric,
    reason text,
    performed_by uuid, -- Keep loose reference
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Accounting Ledger
CREATE TABLE accounting_ledger (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_date timestamp with time zone DEFAULT timezone('utc'::text, now()),
    ledger_type text NOT NULL,
    account_name text NOT NULL,
    debit_amount numeric DEFAULT 0,
    credit_amount numeric DEFAULT 0,
    reference_id text,
    reference_type text,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 3. Restore RLS
ALTER TABLE warehouse_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_batch_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access" ON warehouse_stock FOR ALL USING (true);
CREATE POLICY "Public Access" ON product_batches FOR ALL USING (true);
CREATE POLICY "Public Access" ON warehouse_batch_stock FOR ALL USING (true);
CREATE POLICY "Public Access" ON inventory_ledger FOR ALL USING (true);
CREATE POLICY "Public Access" ON accounting_ledger FOR ALL USING (true);

-- 4. Restore Aggregate Trigger
CREATE OR REPLACE FUNCTION fn_update_aggregate_stock() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO warehouse_stock (warehouse_id, variant_id, quantity)
    SELECT warehouse_id, variant_id, SUM(quantity)
    FROM warehouse_batch_stock
    WHERE warehouse_id = NEW.warehouse_id AND variant_id = NEW.variant_id
    GROUP BY warehouse_id, variant_id
    ON CONFLICT (warehouse_id, variant_id) 
    DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_aggregate_stock
AFTER INSERT OR UPDATE OR DELETE ON warehouse_batch_stock
FOR EACH ROW EXECUTE FUNCTION fn_update_aggregate_stock();

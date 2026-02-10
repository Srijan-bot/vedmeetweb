-- INVENTORY UPGRADE V2 - BATCHES, LEDGER, ACCOUNTING
-- Run this in Supabase SQL Editor

-- 1. Create Batches Table
CREATE TABLE IF NOT EXISTS product_batches (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE NOT NULL,
    batch_number text NOT NULL,
    mfg_date date,
    expiry_date date,
    cost_price numeric DEFAULT 0, -- Purchase Cost per unit for this batch
    initial_quantity integer NOT NULL, -- Initial quantity when batch was created/received
    current_quantity integer NOT NULL DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(variant_id, batch_number)
);

-- 2. Update Warehouse Stock to include Batches
-- Note: We are altering the existing table or creating a new one if it doesn't fit. 
-- Existing `warehouse_stock` is (warehouse_id, variant_id) -> quantity.
-- We need (warehouse_id, variant_id, batch_id) -> quantity.
-- To avoid breaking existing code immediately, we will create a new table `warehouse_batch_stock`
-- and eventually migrate `warehouse_stock` to just be a sum of `warehouse_batch_stock`.

CREATE TABLE IF NOT EXISTS warehouse_batch_stock (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    warehouse_id uuid REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
    variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE NOT NULL,
    batch_id uuid REFERENCES product_batches(id) ON DELETE CASCADE NOT NULL,
    quantity integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(warehouse_id, variant_id, batch_id)
);

-- 3. Enhanced Inventory Ledger (Audit Trail)
-- Replaces/Extends the simple `inventory_transactions`
CREATE TABLE IF NOT EXISTS inventory_ledger (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_date timestamp with time zone DEFAULT timezone('utc'::text, now()),
    warehouse_id uuid REFERENCES warehouses(id) NOT NULL,
    variant_id uuid REFERENCES product_variants(id) NOT NULL,
    batch_id uuid REFERENCES product_batches(id), -- Optional, as some legacy stock might not have batch
    transaction_type text NOT NULL, -- 'PURCHASE', 'SALE', 'TRANSFER', 'ADJUSTMENT', 'RETURN'
    reference_document text, -- PO Number, Invoice ID, etc.
    quantity_change integer NOT NULL, -- Positive or Negative
    running_balance integer, -- Auto-calculated by trigger (optional but good for speed)
    unit_cost numeric, -- Cost at the time of transaction
    total_value numeric, -- quantity * unit_cost
    reason text,
    performed_by uuid REFERENCES auth.users(id)
);

-- 4. Accounting Ledger (Financials)
CREATE TABLE IF NOT EXISTS accounting_ledger (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_date timestamp with time zone DEFAULT timezone('utc'::text, now()),
    ledger_type text NOT NULL, -- 'ASSET', 'COGS', 'REVENUE', 'EXPENSE', 'LIABILITY'
    account_name text NOT NULL, -- 'Inventory Asset', 'Cost of Goods Sold', 'Sales', 'Accounts Payable'
    debit_amount numeric DEFAULT 0,
    credit_amount numeric DEFAULT 0,
    reference_id uuid, -- Link to inventory_ledger id or invoice id
    reference_type text, -- 'INVENTORY_TXN', 'INVOICE'
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 5. Add GST/Reorder Fields to Product Variants (if not exists)
ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS hsn_code text,
ADD COLUMN IF NOT EXISTS gst_rate numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_stock_level integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS reorder_quantity integer DEFAULT 50;


-- 6. Enable RLS
ALTER TABLE product_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_batch_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_ledger ENABLE ROW LEVEL SECURITY;

-- Policies (Open for now, lock down later)
CREATE POLICY "Public Access" ON product_batches FOR ALL USING (true);
CREATE POLICY "Public Access" ON warehouse_batch_stock FOR ALL USING (true);
CREATE POLICY "Public Access" ON inventory_ledger FOR ALL USING (true);
CREATE POLICY "Public Access" ON accounting_ledger FOR ALL USING (true);

-- 7. Trigger to Auto-Update `warehouse_stock` (Legacy Support)
-- When `warehouse_batch_stock` changes, update the aggregate `warehouse_stock`
CREATE OR REPLACE FUNCTION fn_update_aggregate_stock() RETURNS TRIGGER AS $$
BEGIN
    -- Upsert into warehouse_stock
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

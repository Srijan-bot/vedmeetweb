-- MISSING TABLE: warehouse_stock
-- This table tracks the total quantity per warehouse/variant.

-- 1. Create Table
CREATE TABLE IF NOT EXISTS warehouse_stock (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  warehouse_id uuid REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
  variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE NOT NULL,
  quantity integer DEFAULT 0,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(warehouse_id, variant_id)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_lookup ON warehouse_stock(warehouse_id, variant_id);

-- 3. Trigger Function to Update Stock automatically on Transaction
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
    
  -- Update total stock in product_variants (Aggregation)
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

-- 4. Attach Trigger
DROP TRIGGER IF EXISTS trg_update_stock ON inventory_transactions;
CREATE TRIGGER trg_update_stock
AFTER INSERT ON inventory_transactions
FOR EACH ROW
EXECUTE FUNCTION update_warehouse_stock_trigger();

-- 5. Permission
ALTER TABLE warehouse_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access All" ON warehouse_stock FOR ALL USING (true);
GRANT ALL ON TABLE public.warehouse_stock TO anon, authenticated;

-- 6. Refresh
NOTIFY pgrst, 'reload schema';

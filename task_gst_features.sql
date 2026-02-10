
-- 1. Update Products Table
ALTER TABLE products ADD COLUMN IF NOT EXISTS gst_rate NUMERIC DEFAULT NULL; 
ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_code TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'Cosmetic'; -- Default to Cosmetic as safest? Or Generic.

-- 2. Update Inventory Transactions Check Constraint to include new types
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'inventory_transactions_transaction_type_check'
    ) THEN
        ALTER TABLE inventory_transactions DROP CONSTRAINT inventory_transactions_transaction_type_check;
    END IF;
END $$;

ALTER TABLE inventory_transactions ADD CONSTRAINT inventory_transactions_transaction_type_check 
  CHECK (transaction_type IN (
      'purchase', 
      'sale', 
      'transfer_in', 
      'transfer_out', 
      'adjustment', 
      'return', 
      'import', 
      'opening_stock', 
      'expired', 
      'damaged', 
      'audit'
  ));

-- 3. Ensure product_variants has GST/HSN/Type?
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS gst_rate NUMERIC DEFAULT NULL;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS hsn_code TEXT;
-- Variants usually inherit type from product, so no need to duplicate `product_type` unless variants can differ in type (unlikely).

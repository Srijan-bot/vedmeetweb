-- Add variant_id and quantity to prescription_items
ALTER TABLE prescription_items ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES product_variants(id);
ALTER TABLE prescription_items ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 1;

-- Ensure constraints if needed
-- ALTER TABLE prescription_items VALIDATE CONSTRAINT ...;

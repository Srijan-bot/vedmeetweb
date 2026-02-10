-- Add address column to warehouses table
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS address text;

-- Add coordinates column to warehouses to store location
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS coordinates point;

-- Add logistics columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS scheduled_pickup TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS scheduled_delivery TIMESTAMPTZ;

-- Ensure RLS allows updates to these columns (generally covered by existing policies, but good to verify if specific column policies exist, though usually they are row-based)
-- For now, we assume the existing admin update policy covers this.

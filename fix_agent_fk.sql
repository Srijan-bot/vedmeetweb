-- Drop the existing foreign key constraint if it exists (name might vary, but usually it's orders_agent_id_fkey or similar)
-- We'll try to drop by name if standard, or just altering.
-- Safest way is to identify it, but for a quick fix in this env:

DO $$ 
BEGIN
  -- Try to drop constraint if it points to auth.users
  IF EXISTS (
      SELECT 1 
      FROM information_schema.table_constraints 
      WHERE constraint_name = 'orders_agent_id_fkey' 
      AND table_name = 'orders'
  ) THEN
      ALTER TABLE orders DROP CONSTRAINT orders_agent_id_fkey;
  END IF;
END $$;

-- Add the correct foreign key pointing to public.profiles
ALTER TABLE orders 
ADD CONSTRAINT orders_agent_id_fkey 
FOREIGN KEY (agent_id) 
REFERENCES public.profiles(id);

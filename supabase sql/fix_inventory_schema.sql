-- Fix: Add missing reference_id column to inventory_transactions
-- Required for place_order RPC to work

do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'inventory_transactions' and column_name = 'reference_id') then
    alter table inventory_transactions add column reference_id text;
  end if;
  
  -- Also ensure 'reason' exists just in case
  if not exists (select 1 from information_schema.columns where table_name = 'inventory_transactions' and column_name = 'reason') then
    alter table inventory_transactions add column reason text;
  end if;
end $$;

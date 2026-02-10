-- Debug Script: Check Column Types and Function Source
-- Run this in Supabase SQL Editor

do $$
declare
  v_inv_type text;
  v_acc_type text;
begin
  -- 1. Check inventory_transactions.reference_id type
  select data_type into v_inv_type
  from information_schema.columns 
  where table_name = 'inventory_transactions' and column_name = 'reference_id';

  raise notice 'inventory_transactions.reference_id type: %', v_inv_type;

  -- 2. Check accounting_ledger.reference_id type
  select data_type into v_acc_type
  from information_schema.columns 
  where table_name = 'accounting_ledger' and column_name = 'reference_id';

  raise notice 'accounting_ledger.reference_id type: %', v_acc_type;
  
end $$;

-- 3. Show Function Source (optional, but checking existence)
select routine_name, routine_definition 
from information_schema.routines 
where routine_name = 'confirm_order';

-- Inspect orders table for delivery_code column and default
select column_name, column_default, data_type 
from information_schema.columns 
where table_name = 'orders' and column_name = 'delivery_code';

-- Check triggers on orders table
select tgname, pg_get_triggerdef(oid)
from pg_trigger
where tgrelid = 'orders'::regclass;

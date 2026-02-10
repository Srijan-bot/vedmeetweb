-- CHECK SCHEMA
select column_name, data_type 
from information_schema.columns 
where table_name = 'orders' and column_name = 'delivery_code';

select column_name, data_type 
from information_schema.columns 
where table_name = 'products' and column_name = 'id';

-- Check RPC existence and arguments (pg_proc is hard to read raw, but useful)
select proname, proargnames, proargtypes 
from pg_proc 
where proname = 'place_order';

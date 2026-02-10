-- Check orders table columns
select column_name, data_type 
from information_schema.columns 
where table_name = 'orders';

-- Check place_order function definition (this might check parameters)
select pg_get_function_arguments('place_order'::regproc);

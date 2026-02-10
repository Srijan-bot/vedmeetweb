-- Inspect confirm_order function
select prosrc 
from pg_proc 
where proname = 'confirm_order';

-- Inspect recent order items
select id, order_id, product_id, variant_id, quantity 
from order_items 
order by created_at desc 
limit 5;

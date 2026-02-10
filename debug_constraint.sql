-- Get confirm_order definition
select pg_get_functiondef('confirm_order'::regproc);

-- Check for triggers on order_items
select tgname, pg_get_triggerdef(oid)
from pg_trigger
where tgrelid = 'order_items'::regclass;

-- Check check constraints on product_variants
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'product_variants'::regclass;

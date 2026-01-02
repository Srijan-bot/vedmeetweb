-- Inventory Extension: Reserved Stock
-- Created: 2026-01-01

-- 1. Add reserved_quantity to product_variants
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'product_variants' and column_name = 'reserved_quantity') then
    alter table product_variants add column reserved_quantity integer default 0 check (reserved_quantity >= 0);
  end if;
end $$;

-- 2. View for Available Stock
-- Replaces usage of raw stock_quantity in frontend to prevent overselling
create or replace view view_product_variant_stock as
select 
  id,
  product_id,
  sku,
  name,
  price,
  stock_quantity as physical_stock,
  reserved_quantity,
  (stock_quantity - reserved_quantity) as available_stock,
  is_active
from product_variants;

-- 3. Helper to Check Stock Availability
create or replace function check_stock_availability(p_variant_id uuid, p_requested_qty integer)
returns boolean as $$
declare
  v_available integer;
begin
  select (stock_quantity - reserved_quantity) into v_available
  from product_variants
  where id = p_variant_id;
  
  if v_available >= p_requested_qty then
    return true;
  else
    return false;
  end if;
end;
$$ language plpgsql;

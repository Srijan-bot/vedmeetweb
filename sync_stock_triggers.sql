-- Sync Stock Trigger
-- Ensures products.stock_quantity always matches the sum of product_variants.stock_quantity

-- 1. Create Function
create or replace function sync_product_grand_total()
returns trigger as $$
begin
  -- Update the parent product's stock_quantity
  -- We sum up all variants for this product
  update products
  set stock_quantity = (
    select coalesce(sum(stock_quantity), 0)
    from product_variants
    where product_id = NEW.product_id
  )
  where id = NEW.product_id;
  
  return NEW;
end;
$$ language plpgsql security definer;

-- 2. Create Trigger
drop trigger if exists trg_sync_product_grand_total on product_variants;

create trigger trg_sync_product_grand_total
after insert or update of stock_quantity on product_variants
for each row
execute function sync_product_grand_total();

-- 3. Run Immediate Sync (Fix existing discrepancies)
update products p
set stock_quantity = (
    select coalesce(sum(pv.stock_quantity), 0)
    from product_variants pv
    where pv.product_id = p.id
);

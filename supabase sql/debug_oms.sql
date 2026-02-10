-- Debug Script: Check Latest Order and Stock State
-- Run this in Supabase SQL Editor

do $$
declare
  v_order_id uuid;
  v_item record;
  v_variant record;
  v_ledger_count integer;
begin
  -- 1. Get Latest Order
  select id into v_order_id from orders order by created_at desc limit 1;
  
  if v_order_id is null then
    raise notice 'No orders found';
    return;
  end if;

  raise notice 'Latest Order ID: %', v_order_id;
  
  -- 2. Check Order Status
  for v_item in select * from orders where id = v_order_id loop
    raise notice 'Order Status: %, Total: %', v_item.status, v_item.total_amount;
  end loop;

  -- 3. Check Order Items & Stock
  for v_item in select * from order_items where order_id = v_order_id loop
    raise notice 'Item: ProductId %, VariantId %, Qty %', v_item.product_id, v_item.variant_id, v_item.quantity;
    
    -- Check Variant Stock
    select * into v_variant from product_variants where id = v_item.variant_id;
    raise notice '  -> Variant Stock: Physical=%, Reserved=%, Available=%', 
      v_variant.stock_quantity, v_variant.reserved_quantity, (v_variant.stock_quantity - v_variant.reserved_quantity);
  end loop;

  -- 4. Check Accounting Ledger
  select count(*) into v_ledger_count from accounting_ledger where reference_id = v_order_id::text;
  raise notice 'Accounting Ledger Entries for Order: %', v_ledger_count;

end $$;

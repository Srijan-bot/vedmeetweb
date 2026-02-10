-- Fix for place_order function
-- 1. Adds user_id binding from auth.uid()
-- 2. Correctly extracts city and zip from the shipping_address JSON
-- 3. Inserts into the correct columns in the orders table

create or replace function place_order(
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_address text, -- Billing/Main Address
  p_shipping_address jsonb,
  p_total_amount numeric,
  p_payment_method text,
  p_items jsonb
) returns uuid as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_product_id bigint;
  v_variant_id uuid;
  v_quantity integer;
  v_price numeric;
  v_user_id uuid;
  v_city text;
  v_zip text;
begin
  -- 0. Get User ID (if authenticated)
  v_user_id := auth.uid();

  -- Extract city and zip from shipping address json
  -- Frontend sends: { address, city, zip }
  v_city := p_shipping_address->>'city';
  v_zip := p_shipping_address->>'zip';

  -- 1. Insert Order (Status: Pending)
  insert into orders (
    user_id, first_name, last_name, email, phone, address, city, zip, total_amount, payment_method, status
  ) values (
    v_user_id, p_first_name, p_last_name, p_email, p_phone, p_address, v_city, v_zip, p_total_amount, p_payment_method, 'Pending'
  ) returning id into v_order_id;

  -- 2. Process Items & Reserve Stock
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::bigint;
    v_quantity := (v_item->>'quantity')::integer;
    v_price := (v_item->>'price')::numeric;
    
    -- Resolve Variant
    if (v_item->>'variant_id') is not null then
       v_variant_id := (v_item->>'variant_id')::uuid;
    else
       select id into v_variant_id from product_variants where product_id = v_product_id limit 1;
    end if;

    if v_variant_id is null then
        raise exception 'Product variant not found for product %', v_product_id;
    end if;

    -- Check Availability (Physical - Reserved)
    -- Assumes check_stock_availability exists
    if not check_stock_availability(v_variant_id, v_quantity) then
        raise exception 'Insufficient stock for variant %', v_variant_id;
    end if;

    -- Update Reservation
    update product_variants 
    set reserved_quantity = reserved_quantity + v_quantity 
    where id = v_variant_id;

    -- Insert Order Item
    insert into order_items (
        order_id, product_id, variant_id, quantity, price
    ) values (
        v_order_id, v_product_id, v_variant_id, v_quantity, v_price
    );
    
  end loop;

  -- Log Status
  insert into order_status_history (order_id, old_status, new_status) 
  values (v_order_id, null, 'Pending');

  return v_order_id;
end;
$$ language plpgsql security definer;

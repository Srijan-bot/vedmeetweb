-- Order Management Schema & Logic
-- Created at: 2026-01-01
-- Update: Fixed product_id to bigint

-- 1. Orders Table
create table if not exists orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id), -- Can be null for guest checkout if needed
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  address text,
  city text,
  zip text,
  total_amount numeric not null,
  status text default 'Pending', -- Pending, Processing, Shipped, Delivered, Cancelled
  payment_method text,
  payment_status text default 'Paid', -- Since it's a fake checkout
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Order Items Table
create table if not exists order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) on delete cascade not null,
  product_id bigint references products(id) not null, -- FIXED: Changed to bigint
  variant_id uuid references product_variants(id), -- Assuming variants use UUID
  quantity integer not null,
  price numeric not null, -- Price at time of purchase
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Sequence for Order Numbers (Optional, for human readable IDs)
create sequence if not exists order_number_seq start 1001;

-- 4. RPC: Place Order (Atomic Transaction)
-- This function creates the order, items, and deducts stock via inventory_transactions
create or replace function place_order(
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_address text,
  p_total_amount numeric,
  p_payment_method text,
  p_items jsonb
) returns uuid as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_product_id bigint; -- FIXED: Changed to bigint
  v_variant_id uuid;
  v_quantity integer;
  v_price numeric;
  v_default_warehouse_id uuid;
begin
  -- Get default warehouse (Create one if missing or pick the first one)
  select id into v_default_warehouse_id from warehouses limit 1;
  
  if v_default_warehouse_id is null then
    raise exception 'No warehouse found for stock deduction';
  end if;

  -- 1. Create Order
  insert into orders (
    first_name, last_name, email, phone, address, total_amount, payment_method
  ) values (
    p_first_name, p_last_name, p_email, p_phone, p_address, p_total_amount, p_payment_method
  ) returning id into v_order_id;

  -- 2. Process Items
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::bigint; -- FIXED: Cast to bigint
    v_quantity := (v_item->>'quantity')::integer;
    v_price := (v_item->>'price')::numeric;
    
    -- Handle Variant ID (If null/undefined in JSON, try to find default variant for product)
    if (v_item->>'variant_id') is not null then
       v_variant_id := (v_item->>'variant_id')::uuid;
    else
       -- Fallback: Find any variant for this product (e.g., the main SKU)
       select id into v_variant_id from product_variants where product_id = v_product_id limit 1;
    end if;

    if v_variant_id is null then
        -- Optional: If no variant exists, maybe create a dummy one or fail?
        -- For now, we fail if inventory is strictly required. 
        -- If products match directly to inventory without variants, logic would differ.
        -- Assuming variant structure exists:
        raise exception 'Product variant not found for product %', v_product_id;
    end if;

    -- Insert Order Item
    insert into order_items (
        order_id, product_id, variant_id, quantity, price
    ) values (
        v_order_id, v_product_id, v_variant_id, v_quantity, v_price
    );

    -- 3. Deduct Stock (Create Inventory Transaction)
    -- This relies on the 'trg_update_stock' trigger on inventory_transactions to update actual stock_quantity
    insert into inventory_transactions (
        warehouse_id,
        variant_id,
        quantity_change,
        transaction_type,
        reason,
        reference_id
    ) values (
        v_default_warehouse_id,
        v_variant_id,
        -v_quantity, -- Negative for sales
        'sale',
        'Order #' || v_order_id,
        v_order_id::text
    );
    
  end loop;

  return v_order_id;
end;
$$ language plpgsql security definer;

-- 5. RLS Policies
alter table orders enable row level security;
alter table order_items enable row level security;

-- (Re)create policies to be safe against errors if they essentially already exist
drop policy if exists "Users can view their own orders" on orders;
create policy "Users can view their own orders" on orders
  for select using (auth.uid() = user_id or user_id is null);

drop policy if exists "Users can insert orders" on orders;
create policy "Users can insert orders" on orders
  for insert with check (true);

drop policy if exists "Users can view their own order items" on order_items;
create policy "Users can view their own order items" on order_items
  for select using (
    exists (select 1 from orders where orders.id = order_items.order_id and (orders.user_id = auth.uid() or orders.user_id is null))
  );

drop policy if exists "Users can insert order items" on order_items;
create policy "Users can insert order items" on order_items
  for insert with check (true);

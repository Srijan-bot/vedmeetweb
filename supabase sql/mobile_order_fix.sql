-- FIX: Mobile Order Placement & Schema
-- 1. Updates 'orders' table to have necessary columns (coordinates, delivery_code, shipping_address)
-- 2. Redefines 'place_order' function to remove schema errors (duplicate payment_method) and correctly map data.

-- A. Ensure Columns Exist
alter table public.orders 
add column if not exists coordinates point;

alter table public.orders 
add column if not exists delivery_code text;

alter table public.orders 
add column if not exists shipping_address jsonb;

-- B. Recreate place_order function
create or replace function public.place_order(
    p_first_name text,
    p_last_name text,
    p_email text,
    p_phone text,
    p_address text,
    p_shipping_address jsonb,
    p_total_amount numeric,
    p_payment_method text,
    p_items jsonb,
    p_coordinates point default null
) returns uuid as $$
declare
    v_user_id uuid;
    v_order_id uuid;
    v_item jsonb;
    v_product_id bigint;
    v_variant_id uuid;
    v_delivery_code text;
    v_city text;
    v_zip text;
begin
    -- 1. Get User ID (nullable)
    v_user_id := auth.uid();

    -- 2. Generate Delivery Code (6-digit)
    v_delivery_code := floor(random() * 900000 + 100000)::text;

    -- 3. Extract City/Zip for legacy columns if needed
    v_city := p_shipping_address->>'city';
    v_zip := p_shipping_address->>'zip';

    -- 4. Insert Order
    insert into public.orders (
        user_id,
        first_name,
        last_name,
        email,
        phone,
        address,
        shipping_address, -- JSONB full object
        city,             -- Legacy/Schema support
        zip,              -- Legacy/Schema support
        total_amount,
        payment_method,
        status,
        coordinates,
        delivery_code
    ) values (
        v_user_id,
        p_first_name,
        p_last_name,
        p_email,
        p_phone,
        p_address,
        p_shipping_address,
        v_city,
        v_zip,
        p_total_amount,
        p_payment_method,
        'Pending',
        p_coordinates,
        v_delivery_code
    ) returning id into v_order_id;

    -- 5. Process Items
    for v_item in select * from jsonb_array_elements(p_items)
    loop
        v_product_id := (v_item->>'product_id')::bigint;
        v_variant_id := (v_item->>'variant_id')::uuid;

        -- Fallback: Resolve Variant if missing
        if v_variant_id is null then
            select id into v_variant_id from public.product_variants 
            where product_id = v_product_id limit 1;
        end if;

        if v_variant_id is null then
            raise exception 'No variant found for product %', v_product_id;
        end if;

        -- Insert Order Item
        insert into public.order_items (
            order_id,
            product_id,
            variant_id,
            quantity,
            price
        ) values (
            v_order_id,
            v_product_id,
            v_variant_id,
            (v_item->>'quantity')::int,
            (v_item->>'price')::numeric
        );

        -- Update Reserved Quantity
        update public.product_variants 
        set reserved_quantity = reserved_quantity + (v_item->>'quantity')::int
        where id = v_variant_id;

    end loop;

    -- 6. Log Status
    -- Optional: if you have order_status_history table
    -- insert into order_status_history (order_id, old_status, new_status) values (v_order_id, null, 'Pending');

    return v_order_id;
end;
$$ language plpgsql security definer;

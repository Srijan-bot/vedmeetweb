-- Add coordinates column to orders table if it doesn't exist
alter table orders 
add column if not exists coordinates point;

-- Drop the existing function to recreate it with the new parameter
drop function if exists place_order;

-- Recreate place_order with p_coordinates
create or replace function place_order(
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
    v_variant_id uuid;
    v_stock_available boolean;
    v_delivery_code text;
begin
    -- Get user id if logged in
    v_user_id := auth.uid();

    -- Generate Delivery Code
    v_delivery_code := floor(random() * 900000 + 100000)::text;

    -- Insert into orders
    insert into orders (
        user_id,
        first_name,
        last_name,
        email,
        phone,
        address,
        shipping_address,
        total_amount,
        payment_method,
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
        p_total_amount,
        p_payment_method,
        'Pending',
        p_coordinates,
        v_delivery_code
    ) returning id into v_order_id;

    -- Insert order items
    for v_item in select * from jsonb_array_elements(p_items)
    loop
        insert into order_items (
            order_id,
            product_id,
            variant_id,
            quantity,
            price
        ) values (
            v_order_id,
            (v_item->>'product_id')::bigint,
            (v_item->>'variant_id')::uuid,
            (v_item->>'product_id')::bigint,
            (v_item->>'variant_id')::uuid,
            (v_item->>'quantity')::int,
            (v_item->>'price')::numeric
        );

        -- Resolve/Verify Variant ID for inventory update
        v_variant_id := (v_item->>'variant_id')::uuid;
        if v_variant_id is null then
            select id into v_variant_id from product_variants where product_id = (v_item->>'product_id')::bigint limit 1;
             -- Update the item we just inserted if we had to guess? 
             -- Actually, better to do this BEFORE insert or update it after.
             -- Let's update the inserted row to be safe if frontend failed.
             UPDATE order_items SET variant_id = v_variant_id 
             WHERE order_id = v_order_id AND product_id = (v_item->>'product_id')::bigint AND variant_id IS NULL;
        end if;

        -- Update Reserved Quantity
        IF v_variant_id IS NOT NULL THEN
            UPDATE product_variants 
            SET reserved_quantity = reserved_quantity + (v_item->>'quantity')::int
            WHERE id = v_variant_id;
        END IF;
    end loop;

    return v_order_id;
end;
$$ language plpgsql security definer;

UPDATE orders SET status = 'Pending' WHERE status = 'pending';

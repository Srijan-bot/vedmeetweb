-- FIX: Update place_order to accept shipping_amount and ensure columns exist

-- 1. Ensure columns exist in the orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipping_amount numeric DEFAULT 0;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS coordinates point;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_code text;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipping_address jsonb;

-- 2. Drop the function to avoid ambiguous overload issues if signature changed drastically (optional but safer)
DROP FUNCTION IF EXISTS public.place_order(text, text, text, text, text, jsonb, numeric, text, jsonb, point);
DROP FUNCTION IF EXISTS public.place_order(text, text, text, text, text, jsonb, numeric, text, jsonb, point, numeric);

-- 3. Create or Replace the function
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
    p_coordinates point default null,
    p_shipping_amount numeric default 0
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
    -- Get User ID (nullable)
    v_user_id := auth.uid();

    -- Generate Delivery Code (6-digit)
    v_delivery_code := floor(random() * 900000 + 100000)::text;

    -- Extract City/Zip for legacy columns if needed
    v_city := p_shipping_address->>'city';
    v_zip := p_shipping_address->>'zip';

    -- Insert Order
    insert into public.orders (
        user_id,
        first_name,
        last_name,
        email,
        phone,
        address,
        shipping_address,
        city,
        zip,
        total_amount,
        payment_method,
        status,
        coordinates,
        delivery_code,
        shipping_amount
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
        v_delivery_code,
        p_shipping_amount
    ) returning id into v_order_id;

    -- Process Items
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

    return v_order_id;
end;
$$ language plpgsql security definer;

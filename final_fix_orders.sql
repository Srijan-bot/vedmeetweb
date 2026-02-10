-- ==========================================
-- FINAL FIX FOR ORDER PLACEMENT (400 ERROR)
-- ==========================================

-- 1. Drop the old function signature if it exists (to avoid ambiguity)
-- The old version had 8 arguments (missing p_shipping_address)
DROP FUNCTION IF EXISTS place_order(text, text, text, text, text, numeric, text, jsonb);

-- 2. Create the new function with the correct signature (9 arguments)
CREATE OR REPLACE FUNCTION place_order(
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_address text, -- Billing/Main Address
  p_shipping_address jsonb, -- NEW PARAMETER {address, city, zip}
  p_total_amount numeric,
  p_payment_method text,
  p_items jsonb
) RETURNS uuid AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_product_id bigint;
  v_variant_id uuid;
  v_quantity integer;
  v_price numeric;
  v_user_id uuid;
  v_city text;
  v_zip text;
BEGIN
  -- 0. Get User ID (if authenticated)
  v_user_id := auth.uid();

  -- Extract city and zip from shipping address json
  v_city := p_shipping_address->>'city';
  v_zip := p_shipping_address->>'zip';

  -- 1. Insert Order (Status: Pending)
  INSERT INTO orders (
    user_id, first_name, last_name, email, phone, address, city, zip, total_amount, payment_method, status
  ) VALUES (
    v_user_id, p_first_name, p_last_name, p_email, p_phone, p_address, v_city, v_zip, p_total_amount, p_payment_method, 'Pending'
  ) RETURNING id INTO v_order_id;

  -- 2. Process Items & Reserve Stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::bigint;
    v_quantity := (v_item->>'quantity')::integer;
    v_price := (v_item->>'price')::numeric;
    
    -- Resolve Variant
    IF (v_item->>'variant_id') IS NOT NULL THEN
       v_variant_id := (v_item->>'variant_id')::uuid;
    ELSE
       SELECT id INTO v_variant_id FROM product_variants WHERE product_id = v_product_id LIMIT 1;
    END IF;

    IF v_variant_id IS NULL THEN
        RAISE EXCEPTION 'Product variant not found for product %', v_product_id;
    END IF;

    -- Check Availability (Physical - Reserved)
    -- Assumes check_stock_availability exists. If not, we can skip or inline it.
    -- For safety, let's assume it might not exist and do a direct check if needed, 
    -- but usually it should exist from previous setups.
    -- IF NOT check_stock_availability(v_variant_id, v_quantity) THEN ...
    
    -- Simple check:
    IF (SELECT stock_quantity - reserved_quantity FROM product_variants WHERE id = v_variant_id) < v_quantity THEN
         RAISE EXCEPTION 'Insufficient stock for variant %', v_variant_id;
    END IF;

    -- Update Reservation
    UPDATE product_variants 
    SET reserved_quantity = reserved_quantity + v_quantity 
    WHERE id = v_variant_id;

    -- Insert Order Item
    INSERT INTO order_items (
        order_id, product_id, variant_id, quantity, price
    ) VALUES (
        v_order_id, v_product_id, v_variant_id, v_quantity, v_price
    );
    
  END LOOP;

  -- Log Status
  INSERT INTO order_status_history (order_id, old_status, new_status) 
  VALUES (v_order_id, NULL, 'Pending');

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

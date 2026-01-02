-- FIX 1: Update Product Image URLs (Remove localhost)
-- Replaces 'http://localhost:5173' with an empty string or correct base URL if known.
-- Using 'image' column based on create_products_neon.sql

UPDATE products
SET image = REPLACE(image, 'http://localhost:5173', 'https://vedalife-ayurveda.vercel.app')
WHERE image LIKE 'http://localhost:5173%';

-- FIX 2: Re-create place_order to guarantee signature matches frontend
DROP FUNCTION IF EXISTS place_order(text, text, text, text, text, jsonb, numeric, text, jsonb);
DROP FUNCTION IF EXISTS place_order(text, text, text, text, text, numeric, text, jsonb);

CREATE OR REPLACE FUNCTION place_order(
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_address text,
  p_shipping_address jsonb, -- Added this field
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
BEGIN
  -- 1. Insert Order
  INSERT INTO orders (
    first_name, last_name, email, phone, address, shipping_address, total_amount, payment_method, status
  ) VALUES (
    p_first_name, p_last_name, p_email, p_phone, p_address, p_shipping_address, p_total_amount, p_payment_method, 'Pending'
  ) RETURNING id INTO v_order_id;

  -- 2. Process Items
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

    -- Check Availability
    IF NOT check_stock_availability(v_variant_id, v_quantity) THEN
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
  VALUES (v_order_id, null, 'Pending');

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

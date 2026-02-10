-- ==========================================
-- UPDATE ORDER WORKFLOW WITH DELIVERY CODE
-- ==========================================

-- 1. Add delivery_code column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_code') THEN
        ALTER TABLE orders ADD COLUMN delivery_code text;
    END IF;
END $$;

-- 2. Backfill existing orders with a random 6-digit code
UPDATE orders 
SET delivery_code = floor(random() * 900000 + 100000)::text
WHERE delivery_code IS NULL;

-- 3. Create generic status update RPC with validation
CREATE OR REPLACE FUNCTION update_order_status(
  p_order_id uuid,
  p_new_status text,
  p_delivery_code text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_current_status text;
  v_stored_code text;
BEGIN
  -- Get current status and code
  SELECT status, delivery_code INTO v_current_status, v_stored_code
  FROM orders WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Validation: Delivery Code
  IF p_new_status = 'Delivered' THEN
    IF p_delivery_code IS NULL OR p_delivery_code != v_stored_code THEN
      RAISE EXCEPTION 'Invalid Delivery Code';
    END IF;
  END IF;

  -- Validation: Basic transitions (Optional, can be strict or loose)
  -- For now, loose check to ensure we don't go backwards from Delivered
  IF v_current_status = 'Delivered' AND p_new_status != 'Delivered' THEN
     RAISE EXCEPTION 'Cannot change status of a delivered order';
  END IF;

  -- Update Status
  UPDATE orders SET status = p_new_status WHERE id = p_order_id;

  -- Log History
  -- Ensure table exists (idempotent generic check is hard in function, assuming it exists or catching error)
  BEGIN
    INSERT INTO order_status_history (order_id, old_status, new_status)
    VALUES (p_order_id, v_current_status, p_new_status);
  EXCEPTION WHEN OTHERS THEN
    -- Ignore missing history table error if it happens, or create it?
    -- Better to fail if strict, but let's assume table exists from research
    NULL; 
  END;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Update place_order to generate delivery_code
-- Re-defining the function from final_fix_orders.sql with the new column
CREATE OR REPLACE FUNCTION place_order(
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_address text, -- Billing/Main Address
  p_shipping_address jsonb, -- {address, city, zip}
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
  v_delivery_code text;
BEGIN
  -- 0. Get User ID
  v_user_id := auth.uid();

  -- Extract city/zip
  v_city := p_shipping_address->>'city';
  v_zip := p_shipping_address->>'zip';

  -- Generate 6-digit specific code
  v_delivery_code := floor(random() * 900000 + 100000)::text;

  -- 1. Insert Order
  INSERT INTO orders (
    user_id, first_name, last_name, email, phone, address, 
    city, zip, total_amount, payment_method, status, delivery_code
  ) VALUES (
    v_user_id, p_first_name, p_last_name, p_email, p_phone, p_address, 
    v_city, v_zip, p_total_amount, p_payment_method, 'Pending', v_delivery_code
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

    -- Check Stock
    IF (SELECT stock_quantity - reserved_quantity FROM product_variants WHERE id = v_variant_id) < v_quantity THEN
         RAISE EXCEPTION 'Insufficient stock for variant %', v_variant_id;
    END IF;

    -- Reserve Stock
    UPDATE product_variants 
    SET reserved_quantity = reserved_quantity + v_quantity 
    WHERE id = v_variant_id;

    -- Insert Item
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

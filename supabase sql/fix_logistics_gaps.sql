-- Fix Logistics Gaps: Ensure Pickup Time is recorded if Delivery happens
-- This prevents "Pending" showing for Actual Pickup if the user skipped the Shipped status or it didn't capture.

CREATE OR REPLACE FUNCTION update_order_status(
  p_order_id uuid,
  p_new_status text,
  p_delivery_code text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_current_status text;
  v_stored_code text;
  v_user_id uuid;
  v_user_role text;
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

  -- Capture Agent ID if attempting to Deliver/Ship and not assigned
  v_user_id := auth.uid();
  IF v_user_id IS NOT NULL THEN
     SELECT role INTO v_user_role FROM profiles WHERE id = v_user_id;
     
     -- Only auto-assign if user is an agent
     IF v_user_role = 'agent' THEN
         UPDATE orders 
         SET agent_id = v_user_id
         WHERE id = p_order_id AND agent_id IS NULL; 
     END IF;
  END IF;

  -- CAPTURE ACTUAL TIMESTAMPS (Reality)
  -- 1. Shipped -> Set Pickup
  IF p_new_status = 'Shipped' THEN
      UPDATE orders 
      SET actual_pickup = NOW() 
      WHERE id = p_order_id;
  END IF;

  -- 2. Delivered -> Set Delivery AND Pickup if missing (FAILSAFE)
  IF p_new_status = 'Delivered' THEN
      UPDATE orders 
      SET actual_delivery = NOW(),
          actual_pickup = COALESCE(actual_pickup, NOW()) -- If pickup missing, assume picked up now (just before delivery)
      WHERE id = p_order_id;
  END IF;

  -- Update Status
  UPDATE orders SET status = p_new_status WHERE id = p_order_id;

  -- Log History
  BEGIN
    INSERT INTO order_status_history (order_id, old_status, new_status)
    VALUES (p_order_id, v_current_status, p_new_status);
  EXCEPTION WHEN OTHERS THEN
    NULL; 
  END;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update verify_delivery (App usage) - Same Logic
CREATE OR REPLACE FUNCTION verify_delivery(p_order_id UUID, p_otp TEXT)
RETURNS JSONB AS $$
DECLARE
  v_correct_otp TEXT;
  v_current_status TEXT;
  v_user_id UUID;
  v_user_role TEXT;
BEGIN
  SELECT delivery_code, status 
  INTO v_correct_otp, v_current_status 
  FROM orders 
  WHERE id = p_order_id;
  
  -- Allow verify if Shipped OR Pending (if they skipped Shipped status in UI)
  -- But strictly, usually it's Shipped. Let's keep it loose if current status is not Delivered.
  IF v_current_status = 'Delivered' THEN
     RETURN jsonb_build_object('success', false, 'message', 'Order is already delivered.');
  END IF;

  IF v_correct_otp = p_otp OR v_correct_otp IS NULL THEN 
     -- Auto-assign Agent
     v_user_id := auth.uid();
     IF v_user_id IS NOT NULL THEN
         SELECT role INTO v_user_role FROM profiles WHERE id = v_user_id;
         IF v_user_role = 'agent' THEN
             UPDATE orders SET agent_id = v_user_id WHERE id = p_order_id AND agent_id IS NULL;
         END IF;
     END IF;

     -- Update Order Status AND Actual Delivery Time AND Pickup if missing
     UPDATE orders 
     SET status = 'Delivered',
         payment_status = 'Paid',
         actual_delivery = NOW(),
         actual_pickup = COALESCE(actual_pickup, NOW()) -- Backfill pickup if empty
     WHERE id = p_order_id;
     
     RETURN jsonb_build_object('success', true);
  ELSE
     RETURN jsonb_build_object('success', false, 'message', 'Invalid OTP.');
  END IF; 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION verify_delivery(p_order_id UUID, p_otp TEXT, p_payment_method TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_correct_otp TEXT;
  v_current_status TEXT;
  v_order_amount NUMERIC;
  v_agent_id UUID;
  v_order_payment_method TEXT;
BEGIN
  -- Get current state
  SELECT delivery_code, status, total_amount, agent_id, payment_method
  INTO v_correct_otp, v_current_status, v_order_amount, v_agent_id, v_order_payment_method
  FROM orders 
  WHERE id = p_order_id;
  
  -- Validation
  IF v_current_status != 'Shipped' THEN
     RETURN jsonb_build_object('success', false, 'message', 'Order is not in Shipped state.');
  END IF;

  -- Check OTP
  IF v_correct_otp IS NOT NULL AND v_correct_otp != p_otp THEN
     RETURN jsonb_build_object('success', false, 'message', 'Invalid OTP.');
  END IF;

  -- Logic for Cash Collection
  IF p_payment_method = 'Cash' AND v_order_payment_method = 'COD' THEN
     -- Update Agent's Cash in Hand
     UPDATE profiles
     SET cash_in_hand = COALESCE(cash_in_hand, 0) + v_order_amount
     WHERE id = v_agent_id;
  END IF;

  -- Update Order
  UPDATE orders 
  SET status = 'Delivered',
      payment_status = 'Paid',
      actual_delivery = NOW()
  WHERE id = p_order_id;
     
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

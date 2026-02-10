-- Emergency Fix V4 for confirm_order
-- Run this entire script in Supabase SQL Editor

DROP FUNCTION IF EXISTS confirm_order(uuid);

CREATE OR REPLACE FUNCTION confirm_order(p_order_id uuid) RETURNS jsonb AS $$
DECLARE
  v_order record;
  v_item record;
  v_total_cogs numeric := 0;
  v_cost numeric;
  v_sales_acct uuid;
  v_ar_acct uuid;
  v_bank_acct uuid;
  v_cogs_acct uuid;
  v_inventory_acct uuid;
  v_ledger_id uuid;
  v_invoice_num text;
  v_warehouse_id uuid;
BEGIN
  -- Get Order
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  
  IF v_order.status = 'Confirmed' OR v_order.status = 'Shipped' THEN
    RAISE EXCEPTION 'Order is already confirmed';
  END IF;

  IF v_order.status = 'Cancelled' THEN
    RAISE EXCEPTION 'Cannot confirm a cancelled order';
  END IF;

  -- Get Default Warehouse
  SELECT id INTO v_warehouse_id FROM warehouses LIMIT 1;

  -- Get Account IDs
  SELECT id INTO v_sales_acct FROM accounting_accounts WHERE code = '4010';
  SELECT id INTO v_ar_acct FROM accounting_accounts WHERE code = '1020';
  SELECT id INTO v_bank_acct FROM accounting_accounts WHERE code = '1030';
  SELECT id INTO v_cogs_acct FROM accounting_accounts WHERE code = '5010';
  SELECT id INTO v_inventory_acct FROM accounting_accounts WHERE code = '1010';

  -- PROCESS ITEMS
  FOR v_item IN SELECT * FROM order_items WHERE order_id = p_order_id
  LOOP
    -- 1. Deduct Reserved (Release reservation, reduce actual stock)
    UPDATE product_variants
    SET reserved_quantity = reserved_quantity - v_item.quantity
    WHERE id = v_item.variant_id;
    
    -- 2. Create Inventory Transaction
    INSERT INTO inventory_transactions (
      warehouse_id, variant_id, quantity_change, transaction_type, reason, reference_id
    ) VALUES (
      v_warehouse_id, v_item.variant_id, -v_item.quantity, 'sale', 'Order Confirmed', p_order_id
    );

    -- 3. Calculate COGS
    SELECT cost_price INTO v_cost FROM product_variants WHERE id = v_item.variant_id;
    IF v_cost IS NULL THEN v_cost := 0; END IF;
    v_total_cogs := v_total_cogs + (v_cost * v_item.quantity);
  END LOOP;

  -- ACCOUNTING ENTRIES
  -- Fix: Added 'account_name' -> 'Order Entry' and 'ledger_type' -> 'Sales' to satisfy constraints
  INSERT INTO accounting_ledger (description, reference_id, reference_type, ledger_type, account_name)
  VALUES ('Order Confirmation #' || p_order_id, p_order_id, 'order', 'Sales', 'Order Entry')
  RETURNING id INTO v_ledger_id;

  -- 1. Revenue
  INSERT INTO accounting_journal_lines (ledger_id, account_id, credit)
  VALUES (v_ledger_id, v_sales_acct, v_order.total_amount);

  -- 2. AR / Cash
  IF v_order.payment_status = 'Paid' THEN
      INSERT INTO accounting_journal_lines (ledger_id, account_id, debit)
      VALUES (v_ledger_id, v_bank_acct, v_order.total_amount);
  ELSE
      INSERT INTO accounting_journal_lines (ledger_id, account_id, debit)
      VALUES (v_ledger_id, v_ar_acct, v_order.total_amount);
  END IF;

  -- 3. COGS / Inventory
  IF v_total_cogs > 0 THEN
      INSERT INTO accounting_journal_lines (ledger_id, account_id, debit)
      VALUES (v_ledger_id, v_cogs_acct, v_total_cogs);
      
      INSERT INTO accounting_journal_lines (ledger_id, account_id, credit)
      VALUES (v_ledger_id, v_inventory_acct, v_total_cogs);
  END IF;

  -- GENERATE INVOICE
  v_invoice_num := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(cast(floor(random() * 10000) as text), 4, '0');
  
  INSERT INTO invoices (order_id, invoice_number, total_amount, tax_amount)
  VALUES (p_order_id, v_invoice_num, v_order.total_amount, v_order.tax_amount);

  -- UPDATE ORDER
  UPDATE orders SET status = 'Confirmed' WHERE id = p_order_id;

  -- Log
  INSERT INTO order_status_history (order_id, old_status, new_status) 
  VALUES (p_order_id, v_order.status, 'Confirmed');

  RETURN jsonb_build_object('success', true, 'invoice_number', v_invoice_num);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/* 
  OMS Business Logic Functions
  Created: 2026-01-01
  Update: Fixed UUID casting for inventory_transactions
*/

-- 1. Helper: Generate Invoice Number
create or replace function generate_invoice_number() returns text as $$
declare
  val text;
begin
  -- Simple format: INV-YYYYMMDD-XXXX
  val := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(cast(floor(random() * 10000) as text), 4, '0');
  return val;
end;
$$ language plpgsql;

-- 2. RESET/DROP old place_order if exists (to avoid signature conflicts)
drop function if exists place_order(text, text, text, text, text, numeric, text, jsonb);

-- 3. NEW Place Order (Reserves Stock)
create or replace function place_order(
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_address text, -- Billing/Main Address
  p_shipping_address jsonb,
  p_total_amount numeric,
  p_payment_method text,
  p_items jsonb
) returns uuid as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_product_id bigint;
  v_variant_id uuid;
  v_quantity integer;
  v_price numeric;
  v_stock_available boolean;
begin
  -- 1. Insert Order (Status: Pending)
  insert into orders (
    first_name, last_name, email, phone, address, shipping_address, total_amount, payment_method, status
  ) values (
    p_first_name, p_last_name, p_email, p_phone, p_address, p_shipping_address, p_total_amount, p_payment_method, 'Pending'
  ) returning id into v_order_id;

  -- 2. Process Items & Reserve Stock
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::bigint;
    v_quantity := (v_item->>'quantity')::integer;
    v_price := (v_item->>'price')::numeric;
    
    -- Resolve Variant
    if (v_item->>'variant_id') is not null then
       v_variant_id := (v_item->>'variant_id')::uuid;
    else
       select id into v_variant_id from product_variants where product_id = v_product_id limit 1;
    end if;

    if v_variant_id is null then
        raise exception 'Product variant not found for product %', v_product_id;
    end if;

    -- Check Availability (Physical - Reserved)
    if not check_stock_availability(v_variant_id, v_quantity) then
        raise exception 'Insufficient stock for variant %', v_variant_id;
    end if;

    -- Update Reservation
    update product_variants 
    set reserved_quantity = reserved_quantity + v_quantity 
    where id = v_variant_id;

    -- Insert Order Item
    insert into order_items (
        order_id, product_id, variant_id, quantity, price
    ) values (
        v_order_id, v_product_id, v_variant_id, v_quantity, v_price
    );
    
  end loop;

  -- Log Status
  insert into order_status_history (order_id, old_status, new_status) 
  values (v_order_id, null, 'Pending');

  return v_order_id;
end;
$$ language plpgsql security definer;


-- 4. CONFIRM ORDER (Deducts Stock, Creates Invoice, journal entries)
create or replace function confirm_order(p_order_id uuid) returns jsonb as $$
declare
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
begin
  -- Get Order
  select * into v_order from orders where id = p_order_id;
  
  if v_order.status = 'Confirmed' or v_order.status = 'Shipped' then
    raise exception 'Order is already confirmed';
  end if;

  if v_order.status = 'Cancelled' then
    raise exception 'Cannot confirm a cancelled order';
  end if;

  -- Get Default Warehouse
  select id into v_warehouse_id from warehouses limit 1;

  -- Get Account IDs
  select id into v_sales_acct from accounting_accounts where code = '4010'; -- Sales Rev
  select id into v_ar_acct from accounting_accounts where code = '1020'; -- AR
  select id into v_bank_acct from accounting_accounts where code = '1030'; -- Cash
  select id into v_cogs_acct from accounting_accounts where code = '5010'; -- COGS
  select id into v_inventory_acct from accounting_accounts where code = '1010'; -- Inv Asset

  -- PROCESS ITEMS
  for v_item in select * from order_items where order_id = p_order_id
  loop
    -- 1. Deduct Reserved (Release reservation, reduce actual stock)
    -- We reduce reserved_quantity AND stock_quantity
    update product_variants
    set reserved_quantity = reserved_quantity - v_item.quantity
    where id = v_item.variant_id;
    
    -- 2. Create Inventory Transaction (Trigger will reduce stock_quantity)
    -- FIXED: reference_id is passed as UUID (p_order_id)
    insert into inventory_transactions (
      warehouse_id, variant_id, quantity_change, transaction_type, reason, reference_id
    ) values (
      v_warehouse_id, v_item.variant_id, -v_item.quantity, 'sale', 'Order Confirmed', p_order_id
    );

    -- 3. Calculate COGS
    select cost_price into v_cost from product_variants where id = v_item.variant_id;
    if v_cost is null then v_cost := 0; end if;
    v_total_cogs := v_total_cogs + (v_cost * v_item.quantity);
  end loop;

  -- ACCOUNTING ENTRIES
  -- Create Ledger Entry
  -- Note: accounting_ledger.reference_id is TEXT, so we cast here.
  insert into accounting_ledger (description, reference_id, reference_type)
  values ('Order Confirmation #' || p_order_id, p_order_id::text, 'order')
  returning id into v_ledger_id;

  -- 1. Revenue (Credit Sales)
  insert into accounting_journal_lines (ledger_id, account_id, credit)
  values (v_ledger_id, v_sales_acct, v_order.total_amount);

  -- 2. AR / Cash (Debit)
  if v_order.payment_status = 'Paid' then
      insert into accounting_journal_lines (ledger_id, account_id, debit)
      values (v_ledger_id, v_bank_acct, v_order.total_amount);
  else
      insert into accounting_journal_lines (ledger_id, account_id, debit)
      values (v_ledger_id, v_ar_acct, v_order.total_amount);
  end if;

  -- 3. COGS / Inventory (If we have cost data)
  if v_total_cogs > 0 then
      -- Debit COGS
      insert into accounting_journal_lines (ledger_id, account_id, debit)
      values (v_ledger_id, v_cogs_acct, v_total_cogs);
      
      -- Credit Inventory
      insert into accounting_journal_lines (ledger_id, account_id, credit)
      values (v_ledger_id, v_inventory_acct, v_total_cogs);
  end if;

  -- GENERATE INVOICE
  v_invoice_num := generate_invoice_number();
  insert into invoices (order_id, invoice_number, total_amount, tax_amount)
  values (p_order_id, v_invoice_num, v_order.total_amount, v_order.tax_amount);

  -- UPDATE ORDER
  update orders set status = 'Confirmed' where id = p_order_id;

  -- Log
  insert into order_status_history (order_id, old_status, new_status) 
  values (p_order_id, v_order.status, 'Confirmed');

  return jsonb_build_object('success', true, 'invoice_number', v_invoice_num);
end;
$$ language plpgsql security definer;

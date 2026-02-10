-- =============================================================================
-- FIX: Stock Decrement and Auto-Confirmation Logic
-- =============================================================================
-- This script fixes two issues:
-- 1. Stock is not decreasing when orders are placed
-- 2. Adds auto-confirmation logic for orders with sufficient stock
-- =============================================================================

-- Drop existing function signatures to avoid conflicts
DROP FUNCTION IF EXISTS public.place_order(text, text, text, text, text, jsonb, numeric, text, jsonb, point, numeric, numeric);

-- Recreate place_order function with stock decrement and auto-confirmation
CREATE OR REPLACE FUNCTION public.place_order(
    p_first_name text,
    p_last_name text,
    p_email text,
    p_phone text,
    p_address text,
    p_shipping_address jsonb,
    p_total_amount numeric,
    p_payment_method text,
    p_items jsonb,
    p_coordinates point DEFAULT NULL,
    p_shipping_amount numeric DEFAULT 0,
    p_tax_amount numeric DEFAULT 0
) RETURNS uuid AS $$
DECLARE
    v_user_id uuid;
    v_order_id uuid;
    v_item jsonb;
    v_product_id bigint;
    v_variant_id uuid;
    v_delivery_code text;
    v_city text;
    v_zip text;
    v_quantity integer;
    v_available_stock integer;
    v_auto_confirm boolean := true; -- Flag to check if all items have sufficient stock
BEGIN
    -- Get User ID (nullable)
    v_user_id := auth.uid();

    -- Generate Delivery Code (6-digit)
    v_delivery_code := floor(random() * 900000 + 100000)::text;

    -- Extract City/Zip for legacy columns if needed
    v_city := p_shipping_address->>'city';
    v_zip := p_shipping_address->>'zip';

    -- First pass: Check stock availability for all items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::bigint;
        v_quantity := (v_item->>'quantity')::int;
        
        -- Resolve Variant
        IF (v_item->>'variant_id') IS NOT NULL THEN
            v_variant_id := (v_item->>'variant_id')::uuid;
        ELSE
            SELECT id INTO v_variant_id FROM public.product_variants 
            WHERE product_id = v_product_id LIMIT 1;
        END IF;

        IF v_variant_id IS NULL THEN
            RAISE EXCEPTION 'No variant found for product %', v_product_id;
        END IF;

        -- Check available stock (stock_quantity - reserved_quantity)
        SELECT stock_quantity - reserved_quantity INTO v_available_stock
        FROM public.product_variants 
        WHERE id = v_variant_id;

        -- If any item doesn't have sufficient stock, don't auto-confirm
        IF v_available_stock < v_quantity THEN
            v_auto_confirm := false;
        END IF;
    END LOOP;

    -- Insert Order with appropriate status
    INSERT INTO public.orders (
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
        shipping_amount,
        tax_amount
    ) VALUES (
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
        CASE WHEN v_auto_confirm THEN 'Confirmed' ELSE 'Pending' END, -- Auto-confirm if stock available
        p_coordinates,
        v_delivery_code,
        p_shipping_amount,
        p_tax_amount
    ) RETURNING id INTO v_order_id;

    -- Second pass: Process Items and update stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::bigint;
        v_quantity := (v_item->>'quantity')::int;

        -- Resolve Variant (again, as we're in a new loop)
        IF (v_item->>'variant_id') IS NOT NULL THEN
            v_variant_id := (v_item->>'variant_id')::uuid;
        ELSE
            SELECT id INTO v_variant_id FROM public.product_variants 
            WHERE product_id = v_product_id LIMIT 1;
        END IF;

        -- Insert Order Item
        INSERT INTO public.order_items (
            order_id,
            product_id,
            variant_id,
            quantity,
            price
        ) VALUES (
            v_order_id,
            v_product_id,
            v_variant_id,
            v_quantity,
            (v_item->>'price')::numeric
        );

        -- Update Stock: Reserve quantity for pending orders, decrement for confirmed orders
        IF v_auto_confirm THEN
            -- Auto-confirmed: Decrement actual stock
            UPDATE public.product_variants 
            SET stock_quantity = stock_quantity - v_quantity
            WHERE id = v_variant_id;
        ELSE
            -- Pending: Only reserve the stock
            UPDATE public.product_variants 
            SET reserved_quantity = reserved_quantity + v_quantity
            WHERE id = v_variant_id;
        END IF;

    END LOOP;

    -- Log to order status history
    INSERT INTO public.order_status_history (order_id, old_status, new_status)
    VALUES (v_order_id, NULL, CASE WHEN v_auto_confirm THEN 'Confirmed' ELSE 'Pending' END);

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Update order status function to handle stock decrement on manual confirmation
-- =============================================================================

CREATE OR REPLACE FUNCTION update_order_status(
    p_order_id uuid,
    p_new_status text,
    p_delivery_code text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
    v_current_status text;
    v_stored_code text;
    v_item RECORD;
BEGIN
    -- Get current status and code
    SELECT status, delivery_code INTO v_current_status, v_stored_code
    FROM orders WHERE id = p_order_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    -- Validation: Delivery Code for 'Delivered' status
    IF p_new_status = 'Delivered' THEN
        IF p_delivery_code IS NULL OR p_delivery_code != v_stored_code THEN
            RAISE EXCEPTION 'Invalid Delivery Code';
        END IF;
    END IF;

    -- Validation: Cannot change status of a delivered order
    IF v_current_status = 'Delivered' AND p_new_status != 'Delivered' THEN
        RAISE EXCEPTION 'Cannot change status of a delivered order';
    END IF;

    -- Stock Management: When confirming a pending order, decrement stock and remove reservation
    IF v_current_status = 'Pending' AND p_new_status IN ('Confirmed', 'Processing', 'Shipped') THEN
        -- Loop through order items and update stock
        FOR v_item IN 
            SELECT variant_id, quantity 
            FROM order_items 
            WHERE order_id = p_order_id
        LOOP
            -- Decrement stock and remove from reserved
            UPDATE product_variants
            SET stock_quantity = stock_quantity - v_item.quantity,
                reserved_quantity = GREATEST(0, reserved_quantity - v_item.quantity)
            WHERE id = v_item.variant_id;
        END LOOP;
    END IF;

    -- Stock Management: When cancelling an order, return reserved stock
    IF p_new_status IN ('Cancelled', 'Returned') AND v_current_status NOT IN ('Delivered', 'Cancelled', 'Returned') THEN
        FOR v_item IN 
            SELECT variant_id, quantity 
            FROM order_items 
            WHERE order_id = p_order_id
        LOOP
            -- If order was confirmed/shipped (stock already decremented), return to stock
            IF v_current_status IN ('Confirmed', 'Processing', 'Shipped', 'Out for Delivery') THEN
                UPDATE product_variants
                SET stock_quantity = stock_quantity + v_item.quantity
                WHERE id = v_item.variant_id;
            ELSE
                -- If order was pending (only reserved), remove reservation
                UPDATE product_variants
                SET reserved_quantity = GREATEST(0, reserved_quantity - v_item.quantity)
                WHERE id = v_item.variant_id;
            END IF;
        END LOOP;
    END IF;

    -- Update Status
    UPDATE orders SET status = p_new_status WHERE id = p_order_id;

    -- Log History
    INSERT INTO order_status_history (order_id, old_status, new_status)
    VALUES (p_order_id, v_current_status, p_new_status);

    RETURN jsonb_build_object('success', true, 'new_status', p_new_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Add comment for documentation
-- =============================================================================
COMMENT ON FUNCTION place_order IS 'Places an order and auto-confirms if sufficient stock is available. Auto-confirmed orders have stock immediately decremented. Pending orders have stock reserved until confirmation.';
COMMENT ON FUNCTION update_order_status IS 'Updates order status with proper stock management. Decrements stock on confirmation, returns stock on cancellation.';

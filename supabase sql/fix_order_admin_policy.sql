-- ==========================================
-- FIX ADMIN VISIBILITY FOR ORDERS
-- ==========================================

-- 1. Orders Table Policy
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;

CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
    OR 
    (auth.uid() = user_id) -- Keep user visibility
  );

-- 2. Order Items Table Policy
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;

CREATE POLICY "Admins can view all order items" ON order_items
  FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
    OR
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_items.order_id 
        AND (orders.user_id = auth.uid())
    )
  );

-- 3. Update Trigger for Orders (Optional but good for status updates)
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;

CREATE POLICY "Admins can update all orders" ON orders
  FOR UPDATE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
  );

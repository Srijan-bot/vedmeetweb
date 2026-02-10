-- ==========================================
-- AGENT ORDER PERMISSIONS
-- ==========================================

-- 1. Allow Agents to VIEW all orders (or filtered by location if needed later)
-- For now, agents see all orders to pick them up.
DROP POLICY IF EXISTS "Agents can view all orders" ON orders;

CREATE POLICY "Agents can view all orders" ON orders
  FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'agent'
    OR 
    (auth.uid() = user_id) -- Keep user visibility
    OR
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
  );

-- 2. Allow Agents to UPDATE orders (to set status to 'Shipped')
DROP POLICY IF EXISTS "Agents can update orders" ON orders;

CREATE POLICY "Agents can update orders" ON orders
  FOR UPDATE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'agent'
    OR
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('agent', 'admin', 'superadmin')
  );

-- 3. Allow Agents to VIEW order items (needed for details)
DROP POLICY IF EXISTS "Agents can view order items" ON order_items;

CREATE POLICY "Agents can view order items" ON order_items
  FOR SELECT
  USING (
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_items.order_id 
        AND (
            (SELECT role FROM profiles WHERE id = auth.uid()) IN ('agent', 'admin', 'superadmin')
            OR orders.user_id = auth.uid()
        )
    )
  );

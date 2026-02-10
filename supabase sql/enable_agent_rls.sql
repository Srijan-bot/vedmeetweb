-- Allow Agents to view all orders
CREATE POLICY "Agents can view all orders"
ON orders
FOR SELECT
TO public
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'agent'
);

-- Add agent_id column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES auth.users(id);

-- Update RLS to allow agents to update their own orders (already covered by "Agents can update orders" generally, 
-- but good to be explicit if we lock it down later). 
-- For now, the previous policy "Agents can update orders" allows updating all columns if role is agent.

-- We might want to ensure they can only assign it to themselves, but for now simplicity:
-- Trust the app to send the right ID.

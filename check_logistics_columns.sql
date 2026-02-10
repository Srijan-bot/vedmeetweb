SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('scheduled_pickup', 'scheduled_delivery', 'agent_id', 'status');

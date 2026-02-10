SELECT id, status, agent_id, scheduled_pickup, scheduled_delivery 
FROM orders 
WHERE id::text LIKE '25eb0653%';

-- Also check if that agent_id exists in profiles if it is not null
SELECT * FROM profiles WHERE id IN (SELECT agent_id FROM orders WHERE id::text LIKE '25eb0653%');

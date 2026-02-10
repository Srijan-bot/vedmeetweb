SELECT id, status, coordinates, shipping_address 
FROM orders 
ORDER BY created_at DESC 
LIMIT 5;

INSERT INTO products (id, name, price, stock_quantity, created_at) 
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Ashwagandha Root Tablets', 299, 4, '2025-12-12T02:44:57.130315+00:00') 
ON CONFLICT (id) DO NOTHING;

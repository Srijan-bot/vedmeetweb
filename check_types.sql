-- Check Data Types for ID columns
-- Run this in Supabase SQL Editor and check the Results "Table" or Output.

SELECT 
    table_name, 
    column_name, 
    data_type, 
    udt_name 
FROM information_schema.columns 
WHERE table_name IN ('product_variants', 'warehouses', 'products') 
AND column_name = 'id';

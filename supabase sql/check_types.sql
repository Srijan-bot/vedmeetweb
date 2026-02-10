SELECT 
    table_name, 
    column_name, 
    data_type 
FROM 
    information_schema.columns 
WHERE 
    table_name IN ('products', 'product_variants') 
    AND column_name IN ('id', 'product_id');

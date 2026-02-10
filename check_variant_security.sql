-- Check Policies
SELECT * FROM pg_policies WHERE tablename = 'product_variants';

-- Check Column Privileges (Authentication Role vs Columns)
-- Note: 'authenticated' or 'anon' roles
SELECT grantee, table_name, column_name, privilege_type 
FROM information_schema.column_privileges 
WHERE table_name = 'product_variants' 
AND column_name = 'stock_quantity';
